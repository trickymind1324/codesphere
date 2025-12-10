import { api } from '@/lib/axios';

export interface Problem {
  id: string;
  slug: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  status: 'draft' | 'published' | 'archived';
  isPremium: boolean;
  hints: string[];
  examples: {
    input: string;
    output: string;
    explanation?: string;
  }[];
  constraints: string[];
  companies: string[];
  totalSubmissions: number;
  totalAccepted: number;
  acceptanceRate: number;
  timeComplexity?: string;
  spaceComplexity?: string;
  timeLimitMs: number;
  memoryLimitMb: number;
  tags: Tag[];
  starterCodes: StarterCode[];
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: string;
  slug: string;
  name: string;
  description?: string;
  category?: string;
  problemCount: number;
}

export interface StarterCode {
  id: string;
  language: string;
  code: string;
  functionName?: string;
}

export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  explanation?: string;
  isExample: boolean;
  isHidden: boolean;
  order: number;
  weight: number;
}

export interface QueryProblemsParams {
  page?: number;
  pageSize?: number;
  difficulty?: string;
  tags?: string[];
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface ProblemsResponse {
  data: Problem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const problemApi = {
  // Get all problems with filters
  getProblems: async (params: QueryProblemsParams = {}): Promise<ProblemsResponse> => {
    // Remove empty string values
    const cleanParams = Object.entries(params).reduce((acc, [key, value]) => {
      if (value !== '' && value !== undefined && value !== null) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, any>);

    const response = await api.get('/api/v1/problems', { params: cleanParams });
    return response.data;
  },

  // Get single problem by slug
  getProblem: async (slug: string): Promise<Problem> => {
    const response = await api.get(`/api/v1/problems/${slug}`);
    return response.data;
  },

  // Get all tags
  getTags: async (): Promise<Tag[]> => {
    const response = await api.get('/api/v1/tags');
    return response.data;
  },

  // Get test cases for a problem (only visible ones)
  getTestCases: async (problemId: string): Promise<TestCase[]> => {
    const response = await api.get(`/api/v1/problems/${problemId}/test-cases`);
    return response.data;
  },
};
