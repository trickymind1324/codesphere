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
  avatarUrl: string | null;
  skills: string[];
  experience: ExperienceItem[];
  hasResume: boolean;
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
    'headline' | 'bio' | 'college' | 'location' | 'githubUrl' | 'linkedinUrl' | 'websiteUrl' | 'skills' | 'experience'
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
  setAvatar: async (dataUrl: string): Promise<void> => {
    await api.put('/api/v1/profile/me/avatar', { dataUrl });
  },
  setResume: async (dataUrl: string, fileName: string): Promise<void> => {
    await api.put('/api/v1/profile/me/resume', { dataUrl, fileName });
  },
  deleteResume: async (): Promise<void> => {
    await api.delete('/api/v1/profile/me/resume');
  },
  getResume: async (userId: string): Promise<{ fileName: string; dataUrl: string }> => {
    const res = await api.get(`/api/v1/profile/${userId}/resume`);
    return res.data;
  },
};
