import { api } from '@/lib/axios';

export interface ExecuteCodeRequest {
  language: string;
  code: string;
  problemId?: string;
  testCaseId?: string;
  input?: string;
}

export interface ExecuteCodeResponse {
  status: 'success' | 'error' | 'timeout' | 'runtime_error';
  output?: string;
  error?: string;
  executionTime?: number;
  memoryUsage?: number;
}

export interface TestCodeRequest {
  language: string;
  code: string;
  problemId: string;
}

export interface TestResult {
  testCaseId: string;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  executionTime: number;
  error?: string;
}

export interface TestCodeResponse {
  status: 'success' | 'partial' | 'failed';
  totalTests: number;
  passedTests: number;
  failedTests: number;
  results: TestResult[];
}

export interface SubmitCodeRequest {
  language: string;
  code: string;
  problemId: string;
}

export interface SubmitCodeResponse {
  submissionId: string;
  status: 'accepted' | 'wrong_answer' | 'time_limit_exceeded' | 'runtime_error' | 'compilation_error';
  totalTests: number;
  passedTests: number;
  failedTests: number;
  executionTime: number;
  memoryUsage: number;
  results: TestResult[];
}

// Multi-file project execution for debugging problems
export interface ProjectFile {
  filePath: string;
  content: string;
}

export interface ExecuteProjectRequest {
  files: ProjectFile[];
  language: string;
  entryCommand: string;
  problemId?: string;
  stdin?: string;
  timeLimitMs?: number;
  memoryLimitMb?: number;
}

export interface ExecuteProjectResponse {
  status: 'success' | 'error' | 'timeout' | 'runtime_error' | 'compile_error';
  stdout?: string;
  stderr?: string;
  error?: string;
  executionTime?: number;
  memoryUsage?: number;
  exitCode?: number;
}

export const executionApi = {
  // Run code with custom input
  runCode: async (request: ExecuteCodeRequest): Promise<ExecuteCodeResponse> => {
    const response = await api.post('/api/v1/execute/run', request);
    const { result } = response.data;

    // Map backend field names to frontend interface
    return {
      status: result.status === 'success' ? 'success' :
              result.status === 'time_limit_exceeded' ? 'timeout' :
              result.status === 'runtime_error' ? 'runtime_error' : 'error',
      output: result.stdout,
      error: result.stderr || result.error,
      executionTime: result.executionTimeMs,
      memoryUsage: result.memoryUsageKb,
    };
  },

  // Test code against problem test cases
  testCode: async (request: TestCodeRequest): Promise<TestCodeResponse> => {
    const response = await api.post('/api/v1/execute/test', request);
    console.log('Raw API response:', response.data);

    const { result } = response.data;
    console.log('Extracted result:', result);

    // Map backend field names to frontend interface
    const mapped = {
      status: result.overallStatus === 'accepted' ? 'success' :
              result.overallStatus === 'wrong_answer' ? 'partial' : 'failed',
      totalTests: result.totalTestCases,
      passedTests: result.passedTestCases,
      failedTests: result.failedTestCases,
      results: result.results.map((r: any) => ({
        testCaseId: r.testCaseId || '',
        input: r.input,
        expectedOutput: r.expectedOutput,
        actualOutput: r.actualOutput,
        passed: r.passed,
        executionTime: r.executionTimeMs || 0,
        error: r.error,
      })),
    };

    console.log('Mapped response:', mapped);
    return mapped;
  },

  // Submit code for final evaluation
  submitCode: async (request: SubmitCodeRequest): Promise<SubmitCodeResponse> => {
    const response = await api.post('/api/v1/execute/submit', request);
    const { result } = response.data;

    // Map backend field names to frontend interface
    return {
      submissionId: result.submissionId,
      status: result.status,
      totalTests: result.totalTestCases,
      passedTests: result.passedTestCases,
      failedTests: result.totalTestCases - result.passedTestCases,
      executionTime: result.executionTimeMs || 0,
      memoryUsage: result.memoryUsageKb || 0,
      results: [], // Submission doesn't return individual results
    };
  },

  // Execute a multi-file project (for debugging problems)
  executeProject: async (request: ExecuteProjectRequest): Promise<ExecuteProjectResponse> => {
    const response = await api.post('/api/v1/execute/project', request);
    const { result } = response.data;

    // Map backend status to frontend status
    const statusMap: Record<string, ExecuteProjectResponse['status']> = {
      success: 'success',
      runtime_error: 'runtime_error',
      time_limit_exceeded: 'timeout',
      memory_limit_exceeded: 'error',
      compile_error: 'compile_error',
      internal_error: 'error',
    };

    return {
      status: statusMap[result.status] || 'error',
      stdout: result.stdout,
      stderr: result.stderr,
      error: result.error,
      executionTime: result.executionTimeMs,
      memoryUsage: result.memoryUsageKb,
      exitCode: result.exitCode,
    };
  },
};
