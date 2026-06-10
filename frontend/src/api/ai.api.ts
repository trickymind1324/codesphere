import { api } from '@/lib/axios';

export interface SocraticMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface SocraticRequest {
  problem_title: string;
  problem_description: string;
  user_code: string;
  user_language: string;
  user_message: string;
  history: SocraticMessage[];
}

export interface SocraticResponse {
  question: string;
}

export const aiApi = {
  /**
   * Ask the Socratic tutor. It never writes code — it answers with a
   * guiding question based on the problem and the user's current code.
   */
  askSocratic: async (request: SocraticRequest): Promise<SocraticResponse> => {
    const response = await api.post('/api/v1/ai/socratic', request);
    return response.data;
  },
};
