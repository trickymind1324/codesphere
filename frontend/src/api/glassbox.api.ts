import { api } from '@/lib/axios';

export interface GlassBoxSummary {
  invitationId: string;
  totalEvents: number;
  countsByType: Record<string, number>;
  longestTabBlurMs: number | null;
  pasteCount: number;
  pasteTotalChars: number;
}

export interface GlassBoxEvent {
  id: string;
  eventType: string;
  offsetMs: number;
  problemId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export const glassBoxApi = {
  getSummary: async (invitationId: string): Promise<GlassBoxSummary> => {
    const response = await api.get(`/api/v1/glass-box/invitations/${invitationId}/summary`);
    return response.data;
  },

  getEvents: async (invitationId: string): Promise<GlassBoxEvent[]> => {
    const response = await api.get(`/api/v1/glass-box/invitations/${invitationId}/events`);
    return response.data.events;
  },
};
