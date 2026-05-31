export enum ExecutionStatus {
  SUCCESS = 'success',
  RUNTIME_ERROR = 'runtime_error',
  COMPILE_ERROR = 'compile_error',
  TIME_LIMIT_EXCEEDED = 'time_limit_exceeded',
  MEMORY_LIMIT_EXCEEDED = 'memory_limit_exceeded',
  OUTPUT_LIMIT_EXCEEDED = 'output_limit_exceeded',
  INTERNAL_ERROR = 'internal_error',
}

export class ExecutionResult {
  status: ExecutionStatus;
  stdout?: string;
  stderr?: string;
  exitCode?: number;
  executionTimeMs?: number;
  memoryUsageKb?: number;
  error?: string;
}

export class TestCaseResult {
  input: string;
  expectedOutput?: string;
  actualOutput?: string;
  status: ExecutionStatus;
  passed?: boolean;
  executionTimeMs?: number;
  memoryUsageKb?: number;
  error?: string;
}

export class TestCasesExecutionResult {
  totalTestCases: number;
  passedTestCases: number;
  failedTestCases: number;
  results: TestCaseResult[];
  overallStatus: 'accepted' | 'wrong_answer' | 'runtime_error' | 'time_limit_exceeded' | 'memory_limit_exceeded';
}

export class SubmissionResult {
  submissionId: string;
  problemId: string;
  status: 'pending' | 'accepted' | 'wrong_answer' | 'runtime_error' | 'compile_error' | 'time_limit_exceeded' | 'memory_limit_exceeded';
  totalTestCases: number;
  passedTestCases: number;
  executionTimeMs?: number;
  memoryUsageKb?: number;
  message?: string;
}
