import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DockerExecutor } from '../utils/docker-executor.util';
import {
  ExecuteCodeDto,
  ExecuteTestCasesDto,
  SubmitSolutionDto,
  ProgrammingLanguage,
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

        // Check if test case passed
        if (executionResult.status === ExecutionStatus.SUCCESS && testCase.expectedOutput) {
          const passed =
            this.normalizeOutput(executionResult.stdout) ===
            this.normalizeOutput(testCase.expectedOutput);
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
      );

      const problem = problemResponse.data;

      if (!problem) {
        throw new BadRequestException('Problem not found');
      }

      // Fetch test cases
      const testCasesResponse = await axios.get(
        `${problemServiceUrl}/api/v1/problems/${dto.problemId}/test-cases`,
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

      // Update problem statistics (call Problem Service)
      if (status === 'accepted') {
        await this.updateProblemStatistics(dto.problemId, true);
      } else {
        await this.updateProblemStatistics(dto.problemId, false);
      }

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
}
