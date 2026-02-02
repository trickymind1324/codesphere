import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DockerExecutor } from '../utils/docker-executor.util';
import {
  ExecuteCodeDto,
  ExecuteTestCasesDto,
  TestProblemDto,
  SubmitSolutionDto,
  ExecuteProjectDto,
  ProgrammingLanguage,
  ValidationType,
} from '../dto/execute-code.dto';
import {
  ExecutionResult,
  ExecutionStatus,
  TestCaseResult,
  TestCasesExecutionResult,
  SubmissionResult,
} from '../dto/execution-result.dto';
import axios from 'axios';

@Injectable()
export class ExecutionService {
  private readonly logger = new Logger(ExecutionService.name);
  private readonly maxConcurrentExecutions: number;
  private currentExecutions = 0;

  constructor(
    private readonly dockerExecutor: DockerExecutor,
    private readonly configService: ConfigService,
  ) {
    this.maxConcurrentExecutions = this.configService.get<number>(
      'MAX_CONCURRENT_EXECUTIONS',
      10,
    );
  }

  /**
   * Execute code with optional stdin
   */
  async executeCode(dto: ExecuteCodeDto): Promise<ExecutionResult> {
    this.checkConcurrentExecutions();

    try {
      this.currentExecutions++;

      const timeLimitMs =
        dto.timeLimitMs || this.configService.get<number>('MAX_EXECUTION_TIME_MS', 5000);
      const memoryLimitMb =
        dto.memoryLimitMb || this.configService.get<number>('MAX_MEMORY_MB', 256);

      const result = await this.dockerExecutor.execute(
        dto.code,
        dto.language,
        dto.stdin || '',
        timeLimitMs,
        memoryLimitMb,
      );

      // Check output size
      const maxOutputSize = this.configService.get<number>('MAX_OUTPUT_SIZE_BYTES', 1048576);
      if (result.stdout && result.stdout.length > maxOutputSize) {
        return {
          status: ExecutionStatus.OUTPUT_LIMIT_EXCEEDED,
          error: 'Output size limit exceeded',
        };
      }

      return result;
    } finally {
      this.currentExecutions--;
    }
  }

  /**
   * Execute code against multiple test cases
   */
  async executeTestCases(dto: ExecuteTestCasesDto): Promise<TestCasesExecutionResult> {
    this.checkConcurrentExecutions();

    const results: TestCaseResult[] = [];
    let passedCount = 0;
    let failedCount = 0;

    const timeLimitMs =
      dto.timeLimitMs || this.configService.get<number>('MAX_EXECUTION_TIME_MS', 5000);
    const memoryLimitMb =
      dto.memoryLimitMb || this.configService.get<number>('MAX_MEMORY_MB', 256);

    try {
      this.currentExecutions++;

      for (const testCase of dto.testCases) {
        const executionResult = await this.dockerExecutor.execute(
          dto.code,
          dto.language,
          testCase.input,
          timeLimitMs,
          memoryLimitMb,
        );

        const testCaseResult: TestCaseResult = {
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: executionResult.stdout,
          status: executionResult.status,
          executionTimeMs: executionResult.executionTimeMs,
          memoryUsageKb: executionResult.memoryUsageKb,
          error: executionResult.stderr || executionResult.error,
        };

        // Check if test case passed using appropriate validation type
        if (executionResult.status === ExecutionStatus.SUCCESS && testCase.expectedOutput) {
          const validationType = testCase.validationType || ValidationType.EXACT;
          const passed = this.validateOutput(
            executionResult.stdout || '',
            testCase.expectedOutput,
            validationType,
            executionResult.exitCode,
          );
          testCaseResult.passed = passed;

          if (passed) {
            passedCount++;
          } else {
            failedCount++;
          }
        } else {
          testCaseResult.passed = false;
          failedCount++;
        }

        results.push(testCaseResult);

        // Stop execution if any test case fails (optional optimization)
        // if (!testCaseResult.passed) break;
      }

      // Determine overall status
      let overallStatus: TestCasesExecutionResult['overallStatus'];
      if (passedCount === dto.testCases.length) {
        overallStatus = 'accepted';
      } else if (results.some((r) => r.status === ExecutionStatus.TIME_LIMIT_EXCEEDED)) {
        overallStatus = 'time_limit_exceeded';
      } else if (results.some((r) => r.status === ExecutionStatus.MEMORY_LIMIT_EXCEEDED)) {
        overallStatus = 'memory_limit_exceeded';
      } else if (results.some((r) => r.status === ExecutionStatus.RUNTIME_ERROR)) {
        overallStatus = 'runtime_error';
      } else {
        overallStatus = 'wrong_answer';
      }

      return {
        totalTestCases: dto.testCases.length,
        passedTestCases: passedCount,
        failedTestCases: failedCount,
        results,
        overallStatus,
      };
    } finally {
      this.currentExecutions--;
    }
  }

  /**
   * Test code against problem's example test cases
   */
  async testProblem(dto: TestProblemDto): Promise<TestCasesExecutionResult> {
    this.checkConcurrentExecutions();

    try {
      this.currentExecutions++;

      // Fetch problem details from Problem Service
      const problemServiceUrl = this.configService.get<string>('PROBLEM_SERVICE_URL');
      const problemResponse = await axios.get(
        `${problemServiceUrl}/api/v1/problems/${dto.problemId}`,
        {
          headers: {
            'x-internal-service': 'true',
          },
        },
      );

      const problem = problemResponse.data;

      if (!problem) {
        throw new BadRequestException('Problem not found');
      }

      // Fetch test cases
      const testCasesResponse = await axios.get(
        `${problemServiceUrl}/api/v1/problems/${dto.problemId}/test-cases`,
        {
          headers: {
            'x-internal-service': 'true',
          },
        },
      );

      const allTestCases = testCasesResponse.data;

      if (!allTestCases || allTestCases.length === 0) {
        throw new BadRequestException('No test cases found for this problem');
      }

      // Filter only example test cases (isExample = true)
      const exampleTestCases = allTestCases.filter((tc: any) => tc.isExample === true);

      if (exampleTestCases.length === 0) {
        throw new BadRequestException('No example test cases found for this problem');
      }

      // Execute test cases
      const testCasesDto: ExecuteTestCasesDto = {
        code: dto.code,
        language: dto.language,
        testCases: exampleTestCases.map((tc: any) => ({
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          validationType: tc.validationType || ValidationType.EXACT,
        })),
        timeLimitMs: problem.timeLimitMs,
        memoryLimitMb: problem.memoryLimitMb,
      };

      const executionResult = await this.executeTestCases(testCasesDto);

      return executionResult;
    } finally {
      this.currentExecutions--;
    }
  }

  /**
   * Submit solution to a problem
   */
  async submitSolution(
    dto: SubmitSolutionDto,
    userId: string,
  ): Promise<SubmissionResult> {
    this.checkConcurrentExecutions();

    try {
      this.currentExecutions++;

      // Fetch problem details from Problem Service
      const problemServiceUrl = this.configService.get<string>('PROBLEM_SERVICE_URL');
      const problemResponse = await axios.get(
        `${problemServiceUrl}/api/v1/problems/${dto.problemId}`,
        {
          headers: {
            'x-internal-service': 'true',
          },
        },
      );

      const problem = problemResponse.data;

      if (!problem) {
        throw new BadRequestException('Problem not found');
      }

      // Fetch test cases
      const testCasesResponse = await axios.get(
        `${problemServiceUrl}/api/v1/problems/${dto.problemId}/test-cases`,
        {
          headers: {
            'x-internal-service': 'true',
          },
        },
      );

      const testCases = testCasesResponse.data;

      if (!testCases || testCases.length === 0) {
        throw new BadRequestException('No test cases found for this problem');
      }

      // Execute test cases
      const testCasesDto: ExecuteTestCasesDto = {
        code: dto.code,
        language: dto.language,
        testCases: testCases.map((tc: any) => ({
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          validationType: tc.validationType || ValidationType.EXACT,
        })),
        timeLimitMs: problem.timeLimitMs,
        memoryLimitMb: problem.memoryLimitMb,
      };

      const executionResult = await this.executeTestCases(testCasesDto);

      // Create submission result
      const submissionId = this.generateSubmissionId();

      let status: SubmissionResult['status'];
      if (executionResult.overallStatus === 'accepted') {
        status = 'accepted';
      } else if (executionResult.overallStatus === 'time_limit_exceeded') {
        status = 'time_limit_exceeded';
      } else if (executionResult.overallStatus === 'memory_limit_exceeded') {
        status = 'memory_limit_exceeded';
      } else if (executionResult.overallStatus === 'runtime_error') {
        status = 'runtime_error';
      } else {
        status = 'wrong_answer';
      }

      // Calculate average execution time
      const avgExecutionTime =
        executionResult.results.reduce((sum, r) => sum + (r.executionTimeMs || 0), 0) /
        executionResult.results.length;

      const avgMemoryUsage =
        executionResult.results.reduce((sum, r) => sum + (r.memoryUsageKb || 0), 0) /
        executionResult.results.length;

      // Save submission to Problem Service
      await this.saveSubmission({
        userId,
        problemId: dto.problemId,
        code: dto.code,
        language: dto.language,
        status,
        totalTestCases: executionResult.totalTestCases,
        passedTestCases: executionResult.passedTestCases,
        failedTestCases: executionResult.failedTestCases,
        executionTimeMs: Math.round(avgExecutionTime),
        memoryUsageKb: Math.round(avgMemoryUsage),
        testResults: executionResult.results.map((r) => ({
          testCaseId: '',
          input: r.input,
          expectedOutput: r.expectedOutput,
          actualOutput: r.actualOutput,
          passed: r.passed || false,
          executionTimeMs: r.executionTimeMs || 0,
          error: r.error,
        })),
      });

      return {
        submissionId,
        problemId: dto.problemId,
        status,
        totalTestCases: executionResult.totalTestCases,
        passedTestCases: executionResult.passedTestCases,
        executionTimeMs: Math.round(avgExecutionTime),
        memoryUsageKb: Math.round(avgMemoryUsage),
        message: this.getSubmissionMessage(status, executionResult),
      };
    } finally {
      this.currentExecutions--;
    }
  }

  /**
   * Execute a multi-file project (for debugging problems)
   */
  async executeProject(dto: ExecuteProjectDto): Promise<ExecutionResult> {
    this.checkConcurrentExecutions();

    try {
      this.currentExecutions++;

      const timeLimitMs =
        dto.timeLimitMs || this.configService.get<number>('MAX_EXECUTION_TIME_MS', 5000);
      const memoryLimitMb =
        dto.memoryLimitMb || this.configService.get<number>('MAX_MEMORY_MB', 256);

      const result = await this.dockerExecutor.executeProject(
        dto.files,
        dto.language,
        dto.entryCommand,
        dto.stdin || '',
        timeLimitMs,
        memoryLimitMb,
      );

      // Check output size
      const maxOutputSize = this.configService.get<number>('MAX_OUTPUT_SIZE_BYTES', 1048576);
      if (result.stdout && result.stdout.length > maxOutputSize) {
        return {
          status: ExecutionStatus.OUTPUT_LIMIT_EXCEEDED,
          error: 'Output size limit exceeded',
        };
      }

      return result;
    } finally {
      this.currentExecutions--;
    }
  }

  /**
   * Check if concurrent execution limit is reached
   */
  private checkConcurrentExecutions(): void {
    if (this.currentExecutions >= this.maxConcurrentExecutions) {
      throw new BadRequestException(
        'Maximum concurrent executions reached. Please try again later.',
      );
    }
  }

  /**
   * Normalize output for comparison
   */
  private normalizeOutput(output: string): string {
    return output.trim().replace(/\r\n/g, '\n');
  }

  /**
   * Validate output based on validation type
   */
  private validateOutput(
    actualOutput: string,
    expectedOutput: string,
    validationType: ValidationType,
    exitCode?: number,
  ): boolean {
    switch (validationType) {
      case ValidationType.EXACT:
        return this.normalizeOutput(actualOutput) === this.normalizeOutput(expectedOutput);

      case ValidationType.CONTAINS:
        return actualOutput.includes(expectedOutput);

      case ValidationType.REGEX:
        try {
          const regex = new RegExp(expectedOutput);
          return regex.test(actualOutput);
        } catch (error) {
          this.logger.error(`Invalid regex pattern: ${expectedOutput}`);
          return false;
        }

      case ValidationType.EXIT_CODE:
        const expectedExitCode = parseInt(expectedOutput, 10);
        return exitCode === expectedExitCode;

      default:
        return this.normalizeOutput(actualOutput) === this.normalizeOutput(expectedOutput);
    }
  }

  /**
   * Generate submission ID
   */
  private generateSubmissionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Get submission message based on status
   */
  private getSubmissionMessage(
    status: SubmissionResult['status'],
    executionResult: TestCasesExecutionResult,
  ): string {
    switch (status) {
      case 'accepted':
        return 'Congratulations! Your solution passed all test cases.';
      case 'wrong_answer':
        return `Wrong Answer. Passed ${executionResult.passedTestCases} out of ${executionResult.totalTestCases} test cases.`;
      case 'runtime_error':
        return 'Runtime Error. Your code encountered an error during execution.';
      case 'time_limit_exceeded':
        return 'Time Limit Exceeded. Your solution took too long to execute.';
      case 'memory_limit_exceeded':
        return 'Memory Limit Exceeded. Your solution used too much memory.';
      case 'compile_error':
        return 'Compilation Error. Your code failed to compile.';
      default:
        return 'Submission processed.';
    }
  }

  /**
   * Update problem statistics in Problem Service
   */
  private async updateProblemStatistics(problemId: string, accepted: boolean): Promise<void> {
    try {
      const problemServiceUrl = this.configService.get<string>('PROBLEM_SERVICE_URL');
      await axios.patch(`${problemServiceUrl}/api/v1/problems/${problemId}/statistics`, {
        accepted,
      });
    } catch (error) {
      this.logger.error(`Failed to update problem statistics: ${error.message}`);
    }
  }

  /**
   * Save submission to Problem Service
   */
  private async saveSubmission(submissionData: {
    userId: string;
    problemId: string;
    code: string;
    language: ProgrammingLanguage;
    status: string;
    totalTestCases: number;
    passedTestCases: number;
    failedTestCases: number;
    executionTimeMs: number;
    memoryUsageKb: number;
    testResults: any[];
  }): Promise<void> {
    try {
      const problemServiceUrl = this.configService.get<string>('PROBLEM_SERVICE_URL');
      await axios.post(
        `${problemServiceUrl}/api/v1/submissions`,
        submissionData,
        {
          headers: {
            'x-internal-service': 'true',
          },
        },
      );
      this.logger.log(`Submission saved successfully for user ${submissionData.userId}`);
    } catch (error) {
      this.logger.error(`Failed to save submission: ${error.message}`, error.stack);
      // Don't throw error - submission saving shouldn't fail the execution
    }
  }
}
