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

export const executionApi = {
  // Run code with custom input
  runCode: async (request: ExecuteCodeRequest): Promise<ExecuteCodeResponse> => {
    const response = await api.post('/api/v1/execute/run', request);
    return response.data;
  },

  // Test code against problem test cases
  testCode: async (request: TestCodeRequest): Promise<TestCodeResponse> => {
    const response = await api.post('/api/v1/execute/test', request);
    return response.data;
  },

  // Submit code for final evaluation
  submitCode: async (request: SubmitCodeRequest): Promise<SubmitCodeResponse> => {
    const response = await api.post('/api/v1/execute/submit', request);
    return response.data;
  },
};
