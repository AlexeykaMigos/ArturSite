import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';
import api, { setAccessToken, getAccessToken } from '@/api/client';

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
        const response = await api.post('/auth/login', { email, password });
        const { access_token, user } = response.data;

        setAccessToken(access_token);
        set({ user, isAuthenticated: true, isLoading: false });
      },

      register: async (email: string, password: string, name: string) => {
        await api.post('/auth/register', { email, password, name });
      },

      logout: async () => {
        try {
          await api.post('/auth/logout', {}, { withCredentials: true });
        } finally {
          setAccessToken(null);
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },

      checkAuth: async () => {
        const existingToken = getAccessToken();
        
        if (existingToken) {
          try {
            const meResponse = await api.get('/auth/me');
            set({ user: meResponse.data, isAuthenticated: true, isLoading: false });
          } catch {
            setAccessToken(null);
            set({ user: null, isAuthenticated: false, isLoading: false });
          }
        } else {
          set({ isLoading: false });
        }
      },

      updateUser: (user: User) => {
        set({ user });
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