import { api } from '@/lib/axios';
import type { UserStats } from '@/api/submission.api';

export interface ExperienceItem {
  company: string;
  role: string;
  from?: string;
  to?: string;
  description?: string;
}

export interface UserProfile {
  userId: string;
  displayName: string | null;
  headline: string | null;
  bio: string | null;
  college: string | null;
  location: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  websiteUrl: string | null;
  experience: ExperienceItem[];
  updatedAt: string;
}

export interface ProfileResponse {
  profile: UserProfile;
  stats: UserStats;
  email?: string;
  isOwner: boolean;
}

export type UpdateProfileData = Partial<
  Pick<
    UserProfile,
    'headline' | 'bio' | 'college' | 'location' | 'githubUrl' | 'linkedinUrl' | 'websiteUrl' | 'experience'
  >
>;

export const profileApi = {
  getMine: async (): Promise<ProfileResponse> => {
    const res = await api.get('/api/v1/profile/me');
    return res.data;
  },
  updateMine: async (data: UpdateProfileData): Promise<{ profile: UserProfile }> => {
    const res = await api.put('/api/v1/profile/me', data);
    return res.data;
  },
  getPublic: async (userId: string): Promise<ProfileResponse> => {
    const res = await api.get(`/api/v1/profile/${userId}`);
    return res.data;
  },
};
