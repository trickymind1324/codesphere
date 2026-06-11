import { api } from '@/lib/axios';

export enum AssessmentStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export enum InvitationStatus {
  PENDING = 'pending',
  STARTED = 'started',
  COMPLETED = 'completed',
  EXPIRED = 'expired',
}

export interface AssessmentProblem {
  problemId: string;
  order: number;
  points: number;
  problem?: {
    id: string;
    slug: string;
    title: string;
    difficulty: 'easy' | 'medium' | 'hard';
  };
}

export interface Assessment {
  id: string;
  title: string;
  description?: string;
  durationMinutes: number;
  status: AssessmentStatus;
  createdBy: string;
  assessmentProblems: AssessmentProblem[];
  invitationsCount: number;
  completedCount: number;
  averageScore?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentInvitation {
  id: string;
  assessmentId: string;
  candidateEmail: string;
  candidateName: string;
  uniqueToken: string;
  customMessage?: string;
  status: InvitationStatus;
  expiresAt?: string;
  startedAt?: string;
  completedAt?: string;
  score?: number;
  percentage?: number;
  problemsSolved?: number;
  totalProblems?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAssessmentDto {
  title: string;
  description?: string;
  durationMinutes: number;
  problems?: {
    problemId: string;
    order: number;
    points?: number;
  }[];
}

export interface UpdateAssessmentDto {
  title?: string;
  description?: string;
  durationMinutes?: number;
}

export interface AddProblemsDto {
  problems: {
    problemId: string;
    order: number;
    points?: number;
  }[];
}

export interface CreateInvitationDto {
  candidates: {
    email: string;
    name: string;
  }[];
  customMessage?: string;
  expiryDays?: number;
}

export interface AssessmentStatistics {
  totalInvitations: number;
  completedCount: number;
  startedCount: number;
  pendingCount: number;
  averageScore: number;
  averageCompletionTime: number;
  completionRate: number;
}

export interface AssessmentResult {
  invitationId: string;
  candidateEmail: string;
  candidateName: string;
  status: InvitationStatus;
  score?: number;
  percentage?: number;
  problemsSolved?: number;
  totalProblems: number;
  startedAt?: string;
  completedAt?: string;
  timeSpentMinutes?: number;
}

export interface QueryAssessmentsParams {
  page?: number;
  pageSize?: number;
  status?: AssessmentStatus;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface AssessmentsResponse {
  data: Assessment[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const assessmentApi = {
  // Get all assessments (recruiter only)
  getAssessments: async (params: QueryAssessmentsParams = {}): Promise<AssessmentsResponse> => {
    const cleanParams = Object.entries(params).reduce((acc, [key, value]) => {
      if (value !== '' && value !== undefined && value !== null) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, any>);

    const response = await api.get('/api/v1/assessments', { params: cleanParams });
    return response.data;
  },

  // Get single assessment by ID
  getAssessment: async (id: string): Promise<Assessment> => {
    const response = await api.get(`/api/v1/assessments/${id}`);
    return response.data;
  },

  // Create new assessment
  createAssessment: async (data: CreateAssessmentDto): Promise<Assessment> => {
    const response = await api.post('/api/v1/assessments', data);
    return response.data;
  },

  // Update assessment
  updateAssessment: async (id: string, data: UpdateAssessmentDto): Promise<Assessment> => {
    const response = await api.put(`/api/v1/assessments/${id}`, data);
    return response.data;
  },

  // Delete assessment
  deleteAssessment: async (id: string): Promise<void> => {
    await api.delete(`/api/v1/assessments/${id}`);
  },

  // Add problems to assessment
  addProblems: async (assessmentId: string, data: AddProblemsDto): Promise<Assessment> => {
    const response = await api.post(`/api/v1/assessments/${assessmentId}/problems`, data);
    return response.data;
  },

  // Remove problem from assessment
  removeProblem: async (assessmentId: string, problemId: string): Promise<Assessment> => {
    const response = await api.delete(`/api/v1/assessments/${assessmentId}/problems/${problemId}`);
    return response.data;
  },

  // Update assessment status
  updateStatus: async (id: string, status: AssessmentStatus): Promise<Assessment> => {
    const response = await api.put(`/api/v1/assessments/${id}/status`, { status });
    return response.data;
  },

  // Get assessment statistics
  getStatistics: async (id: string): Promise<AssessmentStatistics> => {
    const response = await api.get(`/api/v1/assessments/${id}/statistics`);
    return response.data;
  },

  // Send invitations
  sendInvitations: async (assessmentId: string, data: CreateInvitationDto): Promise<AssessmentInvitation[]> => {
    const response = await api.post(`/api/v1/assessments/${assessmentId}/invite`, data);
    return response.data;
  },

  // Get invitations for assessment
  getInvitations: async (assessmentId: string): Promise<AssessmentInvitation[]> => {
    const response = await api.get(`/api/v1/assessments/${assessmentId}/invitations`);
    return response.data;
  },

  // Resend invitation
  resendInvitation: async (invitationId: string): Promise<void> => {
    await api.post(`/api/v1/assessments/invitations/${invitationId}/resend`);
  },

  // Get results for assessment
  getResults: async (assessmentId: string): Promise<AssessmentResult[]> => {
    const response = await api.get(`/api/v1/assessments/${assessmentId}/results`);
    return response.data;
  },

  // Public endpoints for candidates
  validateToken: async (token: string): Promise<{ valid: boolean; assessment?: Assessment; invitation?: AssessmentInvitation }> => {
    const response = await api.get(`/api/v1/invitations/${token}`);
    return response.data;
  },

  startAssessment: async (token: string): Promise<AssessmentInvitation> => {
    const response = await api.post(`/api/v1/invitations/${token}/start`);
    return response.data;
  },

  completeAssessment: async (token: string, data: { score: number; problemsSolved: number; totalPoints: number }): Promise<AssessmentInvitation> => {
    const response = await api.post(`/api/v1/invitations/${token}/complete`, data);
    return response.data;
  },
};
