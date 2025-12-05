// Common types used across the application

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'candidate' | 'recruiter' | 'company_admin' | 'platform_admin';
  tier: 'free' | 'pro';
  avatarUrl?: string;
  createdAt: string;
  emailVerified: boolean;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface Problem {
  id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  isPremium: boolean;
  acceptanceRate: number;
  totalSubmissions: number;
  totalAccepted: number;
  companies: string[];
  hints: string[];
  examples: ProblemExample[];
  constraints: string[];
}

export interface ProblemExample {
  input: string;
  output: string;
  explanation?: string;
}

export interface Submission {
  id: string;
  problemId: string;
  userId: string;
  code: string;
  language: string;
  status: 'pending' | 'running' | 'accepted' | 'wrong_answer' | 'time_limit_exceeded' | 'memory_limit_exceeded' | 'runtime_error' | 'compilation_error';
  runtime?: number;
  memory?: number;
  testCasesPassed?: number;
  totalTestCases?: number;
  createdAt: string;
}

export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  actualOutput?: string;
  passed?: boolean;
  runtime?: number;
  error?: string;
}

export interface CodeExecutionResult {
  status: 'success' | 'error' | 'timeout';
  stdout?: string;
  stderr?: string;
  runtime?: number;
  memory?: number;
  exitCode?: number;
}

export interface Assessment {
  id: string;
  title: string;
  description: string;
  companyId: string;
  createdBy: string;
  duration: number; // in minutes
  problems: string[]; // problem IDs
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentSession {
  id: string;
  assessmentId: string;
  candidateId: string;
  status: 'invited' | 'in_progress' | 'submitted' | 'expired';
  startedAt?: string;
  submittedAt?: string;
  expiresAt: string;
  score?: number;
}

export type Language = 'python' | 'javascript' | 'typescript' | 'java' | 'cpp' | 'go' | 'rust' | 'sql';

export interface StarterCode {
  language: Language;
  code: string;
}

export interface ApiError {
  message: string;
  code: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
