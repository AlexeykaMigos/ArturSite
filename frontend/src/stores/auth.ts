import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';
import api, { setAccessToken } from '@/api/client';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,

      login: async (email: string, password: string) => {
        // Credentials sent in request body, not query params
        const response = await api.post('/auth/login', { email, password });
        const { access_token, user } = response.data;

        // Store access token in memory only (not localStorage) to protect against XSS
        setAccessToken(access_token);
        set({ user, isAuthenticated: true });
      },

      register: async (email: string, password: string, name: string) => {
        await api.post('/auth/register', { email, password, name });
      },

      logout: async () => {
        try {
          await api.post('/auth/logout', {}, { withCredentials: true });
        } finally {
          setAccessToken(null);
          set({ user: null, isAuthenticated: false });
        }
      },

      checkAuth: async () => {
        // On page load: try to get a new access token via the httpOnly refresh cookie.
        // This replaces the old localStorage-based token check.
        try {
          const refreshResponse = await api.post(
            '/auth/refresh',
            {},
            { withCredentials: true }
          );
          setAccessToken(refreshResponse.data.access_token);

          const meResponse = await api.get('/auth/me');
          set({ user: meResponse.data, isAuthenticated: true, isLoading: false });
        } catch {
          setAccessToken(null);
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },

      updateUser: (user: User) => {
        set({ user });
      },
    }),
    {
      name: 'auth-storage',
      // Persist only non-sensitive user info; never persist the access token
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
