import api from '@/lib/axios';
import type { User } from '@/types';

export interface RegisterData {
  email: string;
  password: string;
  full_name: string;
  role: 'candidate' | 'recruiter';
}

export interface LoginData {
  email: string;
  password: string;
  remember_me?: boolean;
  mfa_code?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface MessageResponse {
  message: string;
}

export interface MfaSetupResponse {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

/**
 * Auth API Client
 */
export const authApi = {
  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<{ user: Partial<User>; message: string }> {
    const response = await api.post('/api/v1/auth/register', data);
    return response.data;
  },

  /**
   * Login with email and password
   */
  async login(data: LoginData): Promise<AuthResponse> {
    const response = await api.post('/api/v1/auth/login', data);

    // Store access token
    if (response.data.accessToken) {
      localStorage.setItem('accessToken', response.data.accessToken);
    }

    return response.data;
  },

  /**
   * Logout
   */
  async logout(): Promise<void> {
    await api.post('/api/v1/auth/logout');
    localStorage.removeItem('accessToken');
  },

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<{ accessToken: string }> {
    const response = await api.post('/api/v1/auth/refresh');

    if (response.data.accessToken) {
      localStorage.setItem('accessToken', response.data.accessToken);
    }

    return response.data;
  },

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<MessageResponse> {
    const response = await api.get(`/api/v1/auth/verify-email?token=${token}`);
    return response.data;
  },

  /**
   * Resend verification email
   */
  async resendVerification(email: string): Promise<MessageResponse> {
    const response = await api.post('/api/v1/auth/resend-verification', { email });
    return response.data;
  },

  /**
   * Request password reset
   */
  async forgotPassword(email: string): Promise<MessageResponse> {
    const response = await api.post('/api/v1/auth/forgot-password', { email });
    return response.data;
  },

  /**
   * Reset password with token
   */
  async resetPassword(data: {
    token: string;
    password: string;
    confirm_password: string;
  }): Promise<MessageResponse> {
    const response = await api.post('/api/v1/auth/reset-password', data);
    return response.data;
  },

  /**
   * Change password (authenticated)
   */
  async changePassword(data: {
    current_password: string;
    new_password: string;
    confirm_password: string;
  }): Promise<MessageResponse> {
    const response = await api.post('/api/v1/auth/change-password', data);
    return response.data;
  },

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<User> {
    const response = await api.get('/api/v1/auth/me');
    return response.data;
  },

  /**
   * Setup MFA
   */
  async setupMfa(): Promise<MfaSetupResponse> {
    const response = await api.post('/api/v1/auth/mfa/setup');
    return response.data;
  },

  /**
   * Verify and enable MFA
   */
  async verifyMfa(code: string): Promise<MessageResponse> {
    const response = await api.post('/api/v1/auth/mfa/verify', { code });
    return response.data;
  },

  /**
   * Disable MFA
   */
  async disableMfa(password: string, code: string): Promise<MessageResponse> {
    const response = await api.post('/api/v1/auth/mfa/disable', { password, code });
    return response.data;
  },

  /**
   * OAuth login URL generators
   */
  getGoogleOAuthUrl(): string {
    return `/api/v1/auth/oauth/google`;
  },

  getGithubOAuthUrl(): string {
    return `/api/v1/auth/oauth/github`;
  },
};
