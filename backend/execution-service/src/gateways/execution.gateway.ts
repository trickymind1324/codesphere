import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { readFileSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { DockerExecutor, StreamingHandle } from '../utils/docker-executor.util';
import { ExecutionService } from '../services/execution.service';
import { ProgrammingLanguage } from '../dto/execute-code.dto';
import {
  WsExecuteProjectPayload,
  WsExecuteCodePayload,
} from '../dto/ws-events.dto';

@WebSocketGateway({
  namespace: '/execution',
  cors: {
    origin: true,
    credentials: true,
  },
})
export class ExecutionGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ExecutionGateway.name);
  private publicKey: string;
  private readonly activeExecutions = new Map<string, StreamingHandle>();

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly dockerExecutor: DockerExecutor,
    private readonly executionService: ExecutionService,
    private readonly configService: ConfigService,
  ) {
    try {
      this.publicKey = readFileSync(
        join(__dirname, '../../../auth-service/keys/public.pem'),
        'utf8',
      );
    } catch {
      this.publicKey = this.configService.get<string>('JWT_PUBLIC_KEY') || '';
      if (!this.publicKey) {
        this.logger.error('JWT public key not found! WebSocket authentication will fail.');
      }
    }
  }

  handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`);
        client.disconnect(true);
        return;
      }

      const payload = jwt.verify(token, this.publicKey, {
        algorithms: ['RS256'],
        issuer: 'codesphere.com',
        audience: 'codesphere-api',
      });

      client.data.user = payload;
      this.logger.log(`Client ${client.id} authenticated`);
    } catch (error) {
      this.logger.warn(`Client ${client.id} auth failed: ${error.message}`);
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Client ${client.id} disconnected`);

    const handle = this.activeExecutions.get(client.id);
    if (handle) {
      this.logger.log(`Killing active execution for disconnected client ${client.id}`);
      await handle.kill();
      this.activeExecutions.delete(client.id);
      this.executionService.releaseExecution();
    }
  }

  @SubscribeMessage('execute:project')
  async handleExecuteProject(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: WsExecuteProjectPayload,
  ) {
    if (!payload.files || !payload.language || !payload.entryCommand) {
      client.emit('execution:error', {
        executionId: '',
        message: 'Missing required fields: files, language, entryCommand',
      });
      return;
    }

    // Check if this client already has an active execution
    if (this.activeExecutions.has(client.id)) {
      client.emit('execution:error', {
        executionId: '',
        message: 'An execution is already running. Kill it first.',
      });
      return;
    }

    const executionId = uuidv4();

    try {
      this.executionService.acquireExecution();
    } catch {
      client.emit('execution:error', {
        executionId,
        message: 'Maximum concurrent executions reached. Please try again later.',
      });
      return;
    }

    client.emit('execution:started', { executionId });

    try {
      const maxOutputSize = this.configService.get<number>('MAX_OUTPUT_SIZE_BYTES', 1048576);
      let totalOutputSize = 0;

      const handle = await this.dockerExecutor.executeProjectStreaming(
        payload.files,
        payload.language as ProgrammingLanguage,
        payload.entryCommand,
        (stream, data) => {
          totalOutputSize += data.length;
          if (totalOutputSize > maxOutputSize) {
            handle.kill();
            client.emit('execution:error', {
              executionId,
              message: 'Output size limit exceeded',
            });
            return;
          }
          client.emit('execution:output', { executionId, stream, data });
        },
        payload.stdin,
        payload.timeLimitMs || this.configService.get<number>('MAX_EXECUTION_TIME_MS', 5000),
        payload.memoryLimitMb || this.configService.get<number>('MAX_MEMORY_MB', 256),
      );

      this.activeExecutions.set(client.id, handle);

      const result = await handle.resultPromise;

      client.emit('execution:completed', {
        executionId,
        status: result.status,
        exitCode: result.exitCode,
        executionTimeMs: result.executionTimeMs,
        memoryUsageKb: result.memoryUsageKb,
        error: result.error,
      });
    } catch (error) {
      client.emit('execution:error', {
        executionId,
        message: error.message || 'Execution failed',
      });
    } finally {
      this.activeExecutions.delete(client.id);
      this.executionService.releaseExecution();
    }
  }

  @SubscribeMessage('execute:code')
  async handleExecuteCode(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: WsExecuteCodePayload,
  ) {
    if (!payload.code || !payload.language) {
      client.emit('execution:error', {
        executionId: '',
        message: 'Missing required fields: code, language',
      });
      return;
    }

    if (this.activeExecutions.has(client.id)) {
      client.emit('execution:error', {
        executionId: '',
        message: 'An execution is already running. Kill it first.',
      });
      return;
    }

    const executionId = uuidv4();

    try {
      this.executionService.acquireExecution();
    } catch {
      client.emit('execution:error', {
        executionId,
        message: 'Maximum concurrent executions reached. Please try again later.',
      });
      return;
    }

    client.emit('execution:started', { executionId });

    try {
      // For single-file, wrap in a project with one file
      const langFileMap: Record<string, string> = {
        python: 'solution.py',
        javascript: 'solution.js',
        typescript: 'solution.ts',
        java: 'Solution.java',
        cpp: 'solution.cpp',
        c: 'solution.c',
        go: 'solution.go',
      };

      const langCmdMap: Record<string, string> = {
        python: 'python solution.py',
        javascript: 'node solution.js',
        typescript: 'npx ts-node solution.ts',
        java: 'javac Solution.java && java Solution',
        cpp: 'g++ -o solution solution.cpp && ./solution',
        c: 'gcc -o solution solution.c && ./solution',
        go: 'go run solution.go',
      };

      const filename = langFileMap[payload.language] || 'solution.txt';
      const entryCommand = langCmdMap[payload.language] || `cat ${filename}`;

      const maxOutputSize = this.configService.get<number>('MAX_OUTPUT_SIZE_BYTES', 1048576);
      let totalOutputSize = 0;

      const handle = await this.dockerExecutor.executeProjectStreaming(
        [{ filePath: filename, content: payload.code }],
        payload.language as ProgrammingLanguage,
        entryCommand,
        (stream, data) => {
          totalOutputSize += data.length;
          if (totalOutputSize > maxOutputSize) {
            handle.kill();
            client.emit('execution:error', {
              executionId,
              message: 'Output size limit exceeded',
            });
            return;
          }
          client.emit('execution:output', { executionId, stream, data });
        },
        payload.stdin,
        payload.timeLimitMs || this.configService.get<number>('MAX_EXECUTION_TIME_MS', 5000),
        payload.memoryLimitMb || this.configService.get<number>('MAX_MEMORY_MB', 256),
      );

      this.activeExecutions.set(client.id, handle);

      const result = await handle.resultPromise;

      client.emit('execution:completed', {
        executionId,
        status: result.status,
        exitCode: result.exitCode,
        executionTimeMs: result.executionTimeMs,
        memoryUsageKb: result.memoryUsageKb,
        error: result.error,
      });
    } catch (error) {
      client.emit('execution:error', {
        executionId,
        message: error.message || 'Execution failed',
      });
    } finally {
      this.activeExecutions.delete(client.id);
      this.executionService.releaseExecution();
    }
  }

  @SubscribeMessage('execute:kill')
  async handleKill(@ConnectedSocket() client: Socket) {
    const handle = this.activeExecutions.get(client.id);
    if (handle) {
      this.logger.log(`Killing execution for client ${client.id}`);
      await handle.kill();
      // resultPromise will resolve and cleanup will happen in the handler's finally block
    } else {
      client.emit('execution:error', {
        executionId: '',
        message: 'No active execution to kill',
      });
    }
  }
}
