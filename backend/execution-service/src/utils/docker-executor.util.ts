import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Docker from 'dockerode';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ExecutionResult, ExecutionStatus } from '../dto/execution-result.dto';
import { ProgrammingLanguage } from '../dto/execute-code.dto';
import { CodeWrapper } from './code-wrapper.util';

@Injectable()
export class DockerExecutor {
  private readonly logger = new Logger(DockerExecutor.name);
  private readonly docker: Docker;
  private readonly tempDir: string;

  private readonly languageConfig = {
    python: {
      image: 'codesphere-python:latest',
      filename: 'solution.py',
      buildRequired: false,
      runCmd: ['python', 'solution.py'],
    },
    javascript: {
      image: 'codesphere-javascript:latest',
      filename: 'solution.js',
      buildRequired: false,
      runCmd: ['node', 'solution.js'],
    },
    typescript: {
      image: 'codesphere-javascript:latest',
      filename: 'solution.ts',
      buildRequired: true,
      buildCmd: ['npx', 'ts-node', 'solution.ts'],
      runCmd: ['npx', 'ts-node', 'solution.ts'],
    },
    java: {
      image: 'codesphere-java:latest',
      filename: 'Solution.java',
      buildRequired: true,
      buildCmd: ['javac', 'Solution.java'],
      runCmd: ['java', 'Solution'],
    },
    cpp: {
      image: 'codesphere-cpp:latest',
      filename: 'solution.cpp',
      buildRequired: true,
      buildCmd: ['g++', '-o', 'solution', 'solution.cpp'],
      runCmd: ['./solution'],
    },
    c: {
      image: 'codesphere-cpp:latest',
      filename: 'solution.c',
      buildRequired: true,
      buildCmd: ['gcc', '-o', 'solution', 'solution.c'],
      runCmd: ['./solution'],
    },
    go: {
      image: 'codesphere-go:latest',
      filename: 'solution.go',
      buildRequired: true,
      buildCmd: ['go', 'build', '-o', 'solution', 'solution.go'],
      runCmd: ['./solution'],
    },
  };

  constructor(private configService: ConfigService) {
    const dockerHost = this.configService.get<string>('DOCKER_HOST') || '/var/run/docker.sock';
    // Strip 'unix://' prefix if present
    const socketPath = dockerHost.replace('unix://', '');

    this.docker = new Docker({
      socketPath,
    });
    this.tempDir = this.configService.get<string>('SANDBOX_TEMP_DIR') || '/tmp/codesphere-sandbox';
  }

  async execute(
    code: string,
    language: ProgrammingLanguage,
    stdin: string = '',
    timeLimitMs: number = 5000,
    memoryLimitMb: number = 256,
  ): Promise<ExecutionResult> {
    const executionId = uuidv4();
    const workDir = path.join(this.tempDir, executionId);

    try {
      // Create temporary directory
      await fs.mkdir(workDir, { recursive: true });

      // Get language configuration
      const langConfig = this.languageConfig[language];
      if (!langConfig) {
        throw new Error(`Unsupported language: ${language}`);
      }

      // Wrap code with I/O handling if it's a function-based problem
      const wrappedCode = CodeWrapper.wrap(code, language);
      this.logger.debug(`Wrapped code for ${language}:\n${wrappedCode}`);

      // Write code to file
      const codeFilePath = path.join(workDir, langConfig.filename);
      await fs.writeFile(codeFilePath, wrappedCode);

      // Write stdin to file if provided
      let stdinFilePath: string | undefined;
      if (stdin) {
        stdinFilePath = path.join(workDir, 'input.txt');
        await fs.writeFile(stdinFilePath, stdin);
      }

      // Execute code in Docker container
      const result = await this.runInContainer(
        langConfig,
        workDir,
        stdinFilePath,
        timeLimitMs,
        memoryLimitMb,
      );

      return result;
    } catch (error) {
      this.logger.error(`Execution error: ${error.message}`, error.stack);
      return {
        status: ExecutionStatus.INTERNAL_ERROR,
        error: error.message,
      };
    } finally {
      // Cleanup temporary files
      if (this.configService.get<boolean>('CLEANUP_TEMP_FILES', true)) {
        await this.cleanupWorkDir(workDir);
      }
    }
  }

  private async runInContainer(
    langConfig: any,
    workDir: string,
    stdinFilePath: string | undefined,
    timeLimitMs: number,
    memoryLimitMb: number,
  ): Promise<ExecutionResult> {
    const containerName = `codesphere-exec-${uuidv4()}`;
    const startTime = Date.now();

    try {
      // Create container
      const container = await this.docker.createContainer({
        name: containerName,
        Image: langConfig.image,
        Cmd: langConfig.runCmd,
        Tty: false,
        AttachStdin: !!stdinFilePath,
        AttachStdout: true,
        AttachStderr: true,
        OpenStdin: !!stdinFilePath,
        StdinOnce: !!stdinFilePath,
        HostConfig: {
          Memory: memoryLimitMb * 1024 * 1024,
          MemorySwap: memoryLimitMb * 1024 * 1024,
          NanoCpus: 1000000000, // 1 CPU
          NetworkMode: this.configService.get<boolean>('SANDBOX_NETWORK_ENABLED', false)
            ? 'bridge'
            : 'none',
          PidsLimit: 50,
          Binds: [`${workDir}:/app:ro`],
          ReadonlyRootfs: false,
          AutoRemove: false, // Manual cleanup to avoid race conditions
        },
        WorkingDir: '/app',
      });

      // Attach to container BEFORE starting (to avoid race condition)
      const stream = await container.attach({
        stream: true,
        stdout: true,
        stderr: true,
        stdin: !!stdinFilePath,
      });

      // Write stdin if provided (before starting container)
      if (stdinFilePath) {
        const stdinContent = await fs.readFile(stdinFilePath, 'utf-8');
        // Ensure content ends with newline
        const contentToWrite = stdinContent.endsWith('\n') ? stdinContent : stdinContent + '\n';
        stream.write(contentToWrite);
        stream.end();
      }

      // Start container AFTER attaching stdin
      await container.start();

      // Collect output
      let stdout = '';
      let stderr = '';

      let timedOut = false;
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(async () => {
          timedOut = true;
          try {
            await container.kill();
          } catch (err) {
            // Container may have already exited, ignore
            this.logger.debug(`Failed to kill container (may have exited): ${err.message}`);
          }
          reject(new Error('Time limit exceeded'));
        }, timeLimitMs);

        stream.on('data', (chunk) => {
          const output = chunk.toString('utf-8');
          // Docker multiplexes stdout and stderr
          // First byte indicates stream type (1=stdout, 2=stderr)
          if (chunk[0] === 1) {
            stdout += output.slice(8);
          } else if (chunk[0] === 2) {
            stderr += output.slice(8);
          }
        });

        stream.on('end', () => {
          clearTimeout(timeout);
          resolve();
        });

        stream.on('error', (err) => {
          clearTimeout(timeout);
          reject(err);
        });
      });

      // Wait for container to finish
      const exitInfo = await container.wait();
      const executionTimeMs = Date.now() - startTime;

      // Get container stats for memory usage (best effort)
      let memoryUsageKb = 0;
      try {
        const stats = await container.stats({ stream: false });
        memoryUsageKb = Math.round(stats.memory_stats.usage / 1024);
      } catch (err) {
        this.logger.debug(`Failed to get container stats: ${err.message}`);
      }

      // Determine execution status
      let status: ExecutionStatus;
      if (timedOut) {
        status = ExecutionStatus.TIME_LIMIT_EXCEEDED;
      } else if (exitInfo.StatusCode === 0) {
        status = ExecutionStatus.SUCCESS;
      } else if (memoryUsageKb >= memoryLimitMb * 1024) {
        status = ExecutionStatus.MEMORY_LIMIT_EXCEEDED;
      } else if (stderr.length > 0) {
        status = ExecutionStatus.RUNTIME_ERROR;
      } else {
        status = ExecutionStatus.RUNTIME_ERROR;
      }

      return {
        status,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode: exitInfo.StatusCode,
        executionTimeMs,
        memoryUsageKb,
      };
    } catch (error) {
      const executionTimeMs = Date.now() - startTime;

      if (error.message === 'Time limit exceeded') {
        return {
          status: ExecutionStatus.TIME_LIMIT_EXCEEDED,
          executionTimeMs,
          error: 'Execution time limit exceeded',
        };
      }

      return {
        status: ExecutionStatus.INTERNAL_ERROR,
        error: error.message,
        executionTimeMs,
      };
    } finally {
      // Clean up container
      try {
        await container.remove({ force: true });
      } catch (err) {
        this.logger.debug(`Failed to remove container: ${err.message}`);
      }
    }
  }

  private async cleanupWorkDir(workDir: string): Promise<void> {
    try {
      await fs.rm(workDir, { recursive: true, force: true });
    } catch (error) {
      this.logger.warn(`Failed to cleanup work directory: ${error.message}`);
    }
  }

  async buildImages(): Promise<void> {
    this.logger.log('Building Docker images for code execution...');

    for (const [lang, config] of Object.entries(this.languageConfig)) {
      try {
        const dockerfilePath = path.join(
          __dirname,
          '../../docker/runtimes',
          `Dockerfile.${lang}`,
        );

        this.logger.log(`Building image: ${config.image}`);

        const stream = await this.docker.buildImage(
          {
            context: path.dirname(dockerfilePath),
            src: [path.basename(dockerfilePath)],
          },
          {
            t: config.image,
            dockerfile: path.basename(dockerfilePath),
          },
        );

        await new Promise((resolve, reject) => {
          this.docker.modem.followProgress(stream, (err, res) =>
            err ? reject(err) : resolve(res),
          );
        });

        this.logger.log(`Successfully built image: ${config.image}`);
      } catch (error) {
        this.logger.error(`Failed to build image for ${lang}: ${error.message}`);
      }
    }
  }
}
