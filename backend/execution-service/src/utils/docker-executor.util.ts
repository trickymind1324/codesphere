import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Docker from 'dockerode';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ExecutionResult, ExecutionStatus } from '../dto/execution-result.dto';
import { ProgrammingLanguage } from '../dto/execute-code.dto';
import { CodeWrapper } from './code-wrapper.util';
import { parseBoolEnv } from './env.util';

export interface StreamingHandle {
  resultPromise: Promise<ExecutionResult>;
  kill: () => Promise<void>;
  containerId: string;
}

interface LanguageConfig {
  image: string;
  filename: string;
  buildRequired: boolean;
  buildCmd?: string[];
  runCmd: string[];
}

@Injectable()
export class DockerExecutor {
  private readonly logger = new Logger(DockerExecutor.name);
  private readonly docker: Docker;
  private readonly tempDir: string;
  private readonly sandboxNetworkMode: 'bridge' | 'none';
  private readonly cleanupTempFiles: boolean;
  private readonly maxOutputBytes: number;

  private readonly languageConfig: Record<string, LanguageConfig> = {
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

    this.sandboxNetworkMode = parseBoolEnv(
      this.configService.get<string>('SANDBOX_NETWORK_ENABLED'),
      false,
    )
      ? 'bridge'
      : 'none';
    this.cleanupTempFiles = parseBoolEnv(
      this.configService.get<string>('CLEANUP_TEMP_FILES'),
      true,
    );
    this.maxOutputBytes = this.configService.get<number>('MAX_OUTPUT_SIZE_BYTES', 1048576);
    this.logger.log(`Sandbox network mode: ${this.sandboxNetworkMode}`);
  }

  /**
   * Build a locked-down HostConfig for a sandbox container. Every container
   * drops all Linux capabilities, forbids privilege escalation, runs on the
   * isolated network, and is capped on memory/CPU/pids plus file-size and
   * open-file ulimits so user code cannot exhaust host disk or descriptors.
   *
   * `readonlyRootfs` is relaxed only for the compile step, which needs to
   * write toolchain scratch outside the /app bind mount. A small writable
   * /tmp tmpfs is always provided.
   */
  private buildHostConfig(
    workDir: string,
    memoryLimitMb: number,
    pidsLimit: number,
    readonlyRootfs: boolean,
  ): Docker.ContainerCreateOptions['HostConfig'] {
    const memoryBytes = memoryLimitMb * 1024 * 1024;
    return {
      Memory: memoryBytes,
      MemorySwap: memoryBytes,
      NanoCpus: 1000000000, // 1 CPU
      NetworkMode: this.sandboxNetworkMode,
      PidsLimit: pidsLimit,
      Binds: [`${workDir}:/app`],
      ReadonlyRootfs: readonlyRootfs,
      Tmpfs: { '/tmp': `rw,nosuid,size=${Math.max(memoryLimitMb, 64)}m` },
      CapDrop: ['ALL'],
      SecurityOpt: ['no-new-privileges:true'],
      Ulimits: [
        { Name: 'fsize', Soft: 64 * 1024 * 1024, Hard: 64 * 1024 * 1024 },
        { Name: 'nofile', Soft: 256, Hard: 256 },
      ],
      AutoRemove: false, // Manual cleanup to avoid race conditions
    };
  }

  /**
   * Append a chunk to an output buffer without letting it grow past the
   * configured cap. Returns the possibly-extended buffer and whether the cap
   * was hit, so the caller can stop a runaway (e.g. `while true: print(...)`)
   * process before it exhausts the service's heap.
   */
  private appendCapped(buffer: string, data: string): { buffer: string; overflow: boolean } {
    if (buffer.length >= this.maxOutputBytes) {
      return { buffer, overflow: true };
    }
    const remaining = this.maxOutputBytes - buffer.length;
    if (data.length > remaining) {
      return { buffer: buffer + data.slice(0, remaining), overflow: true };
    }
    return { buffer: buffer + data, overflow: false };
  }

  /**
   * Resolve a user-supplied relative path strictly inside workDir.
   * Rejects absolute paths and anything that escapes the sandbox directory.
   */
  private resolveInWorkDir(workDir: string, filePath: string): string {
    if (path.isAbsolute(filePath) || filePath.includes('\0')) {
      throw new Error(`Invalid file path: ${filePath}`);
    }
    const fullPath = path.resolve(workDir, filePath);
    if (fullPath !== workDir && !fullPath.startsWith(workDir + path.sep)) {
      throw new Error(`Invalid file path: ${filePath}`);
    }
    return fullPath;
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

      // Build/compile code if required (for C, C++, Java, Go)
      if (langConfig.buildRequired && langConfig.buildCmd) {
        this.logger.debug(`Building ${language} code with: ${langConfig.buildCmd.join(' ')}`);
        // Compilers need far more memory/processes than the compiled program:
        // the Go toolchain alone gets OOM-killed at typical problem limits
        // (256MB / 50 pids). The compiler never runs user code, so relaxed
        // limits here don't weaken the sandbox.
        const buildResult = await this.runInContainer(
          { ...langConfig, runCmd: langConfig.buildCmd },
          workDir,
          undefined,
          30000, // 30s build timeout
          Math.max(memoryLimitMb, 1024),
          256,
          false, // compilers need a writable rootfs for toolchain scratch
        );

        if (buildResult.status !== ExecutionStatus.SUCCESS) {
          this.logger.error(`Build failed: ${buildResult.stderr || buildResult.error}`);
          return {
            status: ExecutionStatus.COMPILE_ERROR,
            error: buildResult.stderr || buildResult.error || 'Compilation failed',
            stderr: buildResult.stderr,
          };
        }
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
      if (this.cleanupTempFiles) {
        await this.cleanupWorkDir(workDir);
      }
    }
  }

  /**
   * Execute a multi-file project (for debugging problems)
   * Unlike execute(), this method:
   * - Writes multiple files to the work directory
   * - Does NOT wrap code with CodeWrapper
   * - Executes the entry command directly
   */
  async executeProject(
    files: { filePath: string; content: string }[],
    language: ProgrammingLanguage,
    entryCommand: string,
    stdin: string = '',
    timeLimitMs: number = 5000,
    memoryLimitMb: number = 256,
  ): Promise<ExecutionResult> {
    const executionId = uuidv4();
    const workDir = path.join(this.tempDir, executionId);

    try {
      // Create temporary directory
      await fs.mkdir(workDir, { recursive: true });

      // Get language configuration for the Docker image
      const langConfig = this.languageConfig[language];
      if (!langConfig) {
        throw new Error(`Unsupported language: ${language}`);
      }

      // Write all files to the work directory with proper directory structure
      for (const file of files) {
        const fullPath = this.resolveInWorkDir(workDir, file.filePath);
        const dirPath = path.dirname(fullPath);

        // Create directory if it doesn't exist
        await fs.mkdir(dirPath, { recursive: true });

        // Write file content (no wrapping - raw code)
        await fs.writeFile(fullPath, file.content);
        this.logger.debug(`Wrote file: ${file.filePath}`);
      }

      // Write stdin to input.txt if provided
      if (stdin) {
        await fs.writeFile(path.join(workDir, 'input.txt'), stdin);
      }

      // Parse entry command into array
      const cmdParts = entryCommand.split(' ').filter(part => part.trim());

      // Execute the project directly (no build step for now - entry command handles everything)
      const result = await this.runInContainer(
        { ...langConfig, runCmd: cmdParts },
        workDir,
        stdin ? path.join(workDir, 'input.txt') : undefined,
        timeLimitMs,
        memoryLimitMb,
      );

      return result;
    } catch (error) {
      this.logger.error(`Project execution error: ${error.message}`, error.stack);
      return {
        status: ExecutionStatus.INTERNAL_ERROR,
        error: error.message,
      };
    } finally {
      // Cleanup temporary files
      if (this.cleanupTempFiles) {
        await this.cleanupWorkDir(workDir);
      }
    }
  }

  /**
   * Streaming variant of executeProject - emits output chunks via callback
   * instead of buffering all output before returning.
   */
  async executeProjectStreaming(
    files: { filePath: string; content: string }[],
    language: ProgrammingLanguage,
    entryCommand: string,
    onOutput: (stream: 'stdout' | 'stderr', data: string) => void,
    stdin: string = '',
    timeLimitMs: number = 5000,
    memoryLimitMb: number = 256,
  ): Promise<StreamingHandle> {
    const executionId = uuidv4();
    const workDir = path.join(this.tempDir, executionId);
    const containerName = `codesphere-exec-${uuidv4()}`;

    const langConfig = this.languageConfig[language];
    if (!langConfig) {
      throw new Error(`Unsupported language: ${language}`);
    }

    // Prepare files on disk
    await fs.mkdir(workDir, { recursive: true });

    try {
      for (const file of files) {
        const fullPath = this.resolveInWorkDir(workDir, file.filePath);
        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.writeFile(fullPath, file.content);
      }

      if (stdin) {
        await fs.writeFile(path.join(workDir, 'input.txt'), stdin);
      }
    } catch (error) {
      await this.cleanupWorkDir(workDir);
      throw error;
    }

    const cmdParts = entryCommand.split(' ').filter(part => part.trim());

    // Create container
    const container = await this.docker.createContainer({
      name: containerName,
      Image: langConfig.image,
      Cmd: cmdParts,
      Tty: false,
      AttachStdin: false,
      AttachStdout: true,
      AttachStderr: true,
      OpenStdin: false,
      StdinOnce: false,
      HostConfig: this.buildHostConfig(workDir, memoryLimitMb, 50, true),
      WorkingDir: '/app',
    });

    const stream = await container.attach({
      stream: true,
      stdout: true,
      stderr: true,
      stdin: false,
    });

    const startTime = Date.now();
    await container.start();

    let stdout = '';
    let stderr = '';
    let timedOut = false;
    let killed = false;
    let outputOverflow = false;

    const killContainer = async () => {
      if (killed) return;
      killed = true;
      try {
        await container.kill();
      } catch (err) {
        this.logger.debug(`Failed to kill container: ${err.message}`);
      }
    };

    const resultPromise = new Promise<ExecutionResult>((resolve) => {
      const timeout = setTimeout(async () => {
        timedOut = true;
        await killContainer();
      }, timeLimitMs);

      stream.on('data', (chunk: Buffer) => {
        if (chunk[0] === 1) {
          const data = chunk.subarray(8).toString('utf-8');
          const r = this.appendCapped(stdout, data);
          stdout = r.buffer;
          onOutput('stdout', data);
          if (r.overflow && !outputOverflow) {
            outputOverflow = true;
            killContainer();
          }
        } else if (chunk[0] === 2) {
          const data = chunk.subarray(8).toString('utf-8');
          const r = this.appendCapped(stderr, data);
          stderr = r.buffer;
          onOutput('stderr', data);
          if (r.overflow && !outputOverflow) {
            outputOverflow = true;
            killContainer();
          }
        }
      });

      stream.on('end', () => {
        clearTimeout(timeout);
      });

      stream.on('error', () => {
        clearTimeout(timeout);
      });

      container.wait().then(async (exitInfo) => {
        clearTimeout(timeout);
        const executionTimeMs = Date.now() - startTime;

        let memoryUsageKb = 0;
        try {
          const stats = await container.stats({ stream: false });
          memoryUsageKb = Math.round(stats.memory_stats.usage / 1024);
        } catch (err) {
          this.logger.debug(`Failed to get container stats: ${err.message}`);
        }

        let status: ExecutionStatus;
        if (timedOut) {
          status = ExecutionStatus.TIME_LIMIT_EXCEEDED;
        } else if (outputOverflow) {
          status = ExecutionStatus.OUTPUT_LIMIT_EXCEEDED;
        } else if (killed) {
          status = ExecutionStatus.INTERNAL_ERROR;
        } else if (exitInfo.StatusCode === 0) {
          status = ExecutionStatus.SUCCESS;
        } else if (memoryUsageKb >= memoryLimitMb * 1024) {
          status = ExecutionStatus.MEMORY_LIMIT_EXCEEDED;
        } else if (stderr.length > 0) {
          status = ExecutionStatus.RUNTIME_ERROR;
        } else {
          status = ExecutionStatus.RUNTIME_ERROR;
        }

        // Cleanup
        try { await container.remove({ force: true }); } catch {}
        if (this.cleanupTempFiles) {
          await this.cleanupWorkDir(workDir);
        }

        resolve({
          status,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          exitCode: exitInfo.StatusCode,
          executionTimeMs,
          memoryUsageKb,
        });
      }).catch(async (error) => {
        const executionTimeMs = Date.now() - startTime;
        try { await container.remove({ force: true }); } catch {}
        if (this.cleanupTempFiles) {
          await this.cleanupWorkDir(workDir);
        }

        if (timedOut) {
          resolve({
            status: ExecutionStatus.TIME_LIMIT_EXCEEDED,
            executionTimeMs,
            error: 'Execution time limit exceeded',
          });
        } else {
          resolve({
            status: ExecutionStatus.INTERNAL_ERROR,
            error: error.message,
            executionTimeMs,
          });
        }
      });
    });

    return {
      resultPromise,
      kill: killContainer,
      containerId: containerName,
    };
  }

  private async runInContainer(
    langConfig: any,
    workDir: string,
    stdinFilePath: string | undefined,
    timeLimitMs: number,
    memoryLimitMb: number,
    pidsLimit: number = 50,
    readonlyRootfs: boolean = true,
  ): Promise<ExecutionResult> {
    const containerName = `codesphere-exec-${uuidv4()}`;
    const startTime = Date.now();
    let container: Docker.Container | null = null;

    try {
      // Create container
      // Note: We use file-based input (/app/input.txt) instead of stdin to avoid timing issues
      container = await this.docker.createContainer({
        name: containerName,
        Image: langConfig.image,
        Cmd: langConfig.runCmd,
        Tty: false,
        AttachStdin: false,
        AttachStdout: true,
        AttachStderr: true,
        OpenStdin: false,
        StdinOnce: false,
        HostConfig: this.buildHostConfig(workDir, memoryLimitMb, pidsLimit, readonlyRootfs),
        WorkingDir: '/app',
      });

      // Attach to get output streams
      const stream = await container.attach({
        stream: true,
        stdout: true,
        stderr: true,
        stdin: false,
      });

      // Start container (input.txt file is already mounted in workDir)
      await container.start();

      // Collect output
      let stdout = '';
      let stderr = '';

      let timedOut = false;
      let outputOverflow = false;
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(async () => {
          timedOut = true;
          try {
            if (container) {
              await container.kill();
            }
          } catch (err) {
            // Container may have already exited, ignore
            this.logger.debug(`Failed to kill container (may have exited): ${err.message}`);
          }
          reject(new Error('Time limit exceeded'));
        }, timeLimitMs);

        const killForOverflow = async () => {
          if (outputOverflow) return;
          outputOverflow = true;
          try {
            if (container) await container.kill();
          } catch (err) {
            this.logger.debug(`Failed to kill container on overflow: ${err.message}`);
          }
        };

        stream.on('data', (chunk) => {
          const output = chunk.toString('utf-8');
          // Docker multiplexes stdout and stderr
          // First byte indicates stream type (1=stdout, 2=stderr)
          if (chunk[0] === 1) {
            const r = this.appendCapped(stdout, output.slice(8));
            stdout = r.buffer;
            if (r.overflow) killForOverflow();
          } else if (chunk[0] === 2) {
            const r = this.appendCapped(stderr, output.slice(8));
            stderr = r.buffer;
            if (r.overflow) killForOverflow();
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
      } else if (outputOverflow) {
        status = ExecutionStatus.OUTPUT_LIMIT_EXCEEDED;
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
      if (container) {
        try {
          await container.remove({ force: true });
        } catch (err) {
          this.logger.debug(`Failed to remove container: ${err.message}`);
        }
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
    this.logger.log('Ensuring Docker images for code execution...');

    for (const [lang, config] of Object.entries(this.languageConfig)) {
      try {
        // Skip languages whose image already exists (prebuilt via
        // scripts/build-runtime-images.sh — the normal path in production).
        try {
          await this.docker.getImage(config.image).inspect();
          this.logger.log(`Image already present: ${config.image}`);
          continue;
        } catch {
          // not present — fall through to build
        }

        const dockerfilePath = path.join(
          __dirname,
          '../../docker/runtimes',
          `Dockerfile.${lang}`,
        );

        // tar-fs emits an uncatchable async error if the context is missing,
        // so verify the Dockerfile exists before handing it to dockerode.
        try {
          await fs.access(dockerfilePath);
        } catch {
          this.logger.warn(
            `Dockerfile for ${lang} not found at ${dockerfilePath}; ` +
              `build ${config.image} with scripts/build-runtime-images.sh`,
          );
          continue;
        }

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
