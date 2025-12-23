import { api } from '@/lib/axios';

export interface Submission {
  id: string;
  userId: string;
  problemId: string;
  problem: {
    id: string;
    title: string;
    slug: string;
    difficulty: 'easy' | 'medium' | 'hard';
  };
  code: string;
  language: string;
  status: 'accepted' | 'wrong_answer' | 'time_limit_exceeded' | 'memory_limit_exceeded' | 'runtime_error' | 'compilation_error' | 'internal_error';
  totalTestCases: number;
  passedTestCases: number;
  failedTestCases: number;
  executionTimeMs?: number;
  memoryUsageKb?: number;
  testResults?: {
    testCaseId: string;
    input: string;
    expectedOutput: string;
    actualOutput: string;
    passed: boolean;
    executionTimeMs: number;
    error?: string;
  }[];
  error?: string;
  createdAt: string;
}

export interface QuerySubmissionsParams {
  page?: number;
  pageSize?: number;
  problemId?: string;
  status?: string;
  language?: string;
  sortBy?: 'createdAt' | 'executionTimeMs' | 'memoryUsageKb' | 'status';
  sortOrder?: 'ASC' | 'DESC';
}

export interface SubmissionsResponse {
  data: Submission[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface UserStats {
  totalSubmissions: number;
  acceptedSubmissions: number;
  problemsSolved: number;
  languagesUsed: string[];
  recentActivity: { date: string; count: number }[];
}

export const submissionApi = {
  // Get all submissions for current user
  getSubmissions: async (params: QuerySubmissionsParams = {}): Promise<SubmissionsResponse> => {
    const response = await api.get('/api/v1/submissions', { params });
    return response.data;
  },

  // Get single submission by ID
  getSubmission: async (id: string): Promise<Submission> => {
    const response = await api.get(`/api/v1/submissions/${id}`);
    return response.data;
  },

  // Get user statistics for a specific problem
  getUserProblemStats: async (problemId: string) => {
    const response = await api.get(`/api/v1/submissions/stats/problem/${problemId}`);
    return response.data;
  },

  // Get user overall statistics
  getUserStats: async (): Promise<UserStats> => {
    const response = await api.get('/api/v1/submissions/stats/user');
    return response.data;
  },
};
