import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';
import { authApi, type LoginData, type RegisterData } from '@/api/auth.api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (data: LoginData) => {
        try {
          set({ isLoading: true, error: null });

          const response = await authApi.login(data);

          set({
            user: response.user as User,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          const errorMessage =
            error.response?.data?.message || 'Login failed. Please try again.';

          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });

          throw error;
        }
      },

      register: async (data: RegisterData) => {
        try {
          set({ isLoading: true, error: null });

          await authApi.register(data);

          set({
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          const errorMessage =
            error.response?.data?.message || 'Registration failed. Please try again.';

          set({
            isLoading: false,
            error: errorMessage,
          });

          throw error;
        }
      },

      logout: async () => {
        try {
          await authApi.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({
            user: null,
            isAuthenticated: false,
            error: null,
          });
        }
      },

      setUser: (user: User | null) => {
        set({
          user,
          isAuthenticated: !!user,
        });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      clearError: () => {
        set({ error: null });
      },

      checkAuth: async () => {
        const accessToken = localStorage.getItem('accessToken');

        if (!accessToken) {
          set({ user: null, isAuthenticated: false, isLoading: false });
          return;
        }

        try {
          set({ isLoading: true });

          const user = await authApi.getCurrentUser();

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          console.error('Auth check failed:', error);
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });

          // Clear invalid token
          localStorage.removeItem('accessToken');
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
