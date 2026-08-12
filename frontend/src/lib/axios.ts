import axios from 'axios';
import { AUTH_MODE, getUserManager, syncAccessToken } from '@/lib/oidc';

const API_URL = import.meta.env.VITE_API_URL || '';

// Create axios instance
export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  withCredentials: true, // Important for cookies (refresh token)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add access token
api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (AUTH_MODE === 'oidc') {
        try {
          // Keycloak: silently renew via the refresh token.
          const renewed = await getUserManager().signinSilent();
          if (!renewed?.access_token) throw new Error('silent renew failed');
          syncAccessToken(renewed);
          originalRequest.headers.Authorization = `Bearer ${renewed.access_token}`;
          return api(originalRequest);
        } catch (renewError) {
          syncAccessToken(null);
          window.location.href = '/login';
          return Promise.reject(renewError);
        }
      }

      try {
        // Try to refresh token
        const response = await axios.post(
          '/api/v1/auth/refresh',
          {},
          { withCredentials: true }
        );

        const { accessToken } = response.data;

        // Store new access token
        localStorage.setItem('accessToken', accessToken);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
