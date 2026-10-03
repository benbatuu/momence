import { create } from 'zustand';
import type { UserItem } from '@/types/user.types';
import { api } from './api';

interface AuthState {
  user: UserItem | null;
  isLoading: boolean;
  setUser: (user: UserItem | null) => void;
  initializeAuth: () => Promise<void>;
  logout: () => Promise<void>;
  login: (credentials: { email: string; password: string }) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,

  setUser: (user) => set({ user }),

  initializeAuth: async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) {
      set({ user: null, isLoading: false });
      return;
    }

    try {
      const res = await api.get('/auth/me');
      const userData = res.data?.data?.user || res.data?.user || res.data?.data;
      set({ user: userData, isLoading: false });
    } catch {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      if (typeof document !== 'undefined') {
        document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      }
      set({ user: null, isLoading: false });
    }
  },

  login: async (credentials) => {
    const res = await api.post('/auth/login', credentials);
    const { accessToken, refreshToken, user } = res.data.data;

    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);

    document.cookie = `accessToken=${accessToken}; path=/; max-age=604800; SameSite=Lax`;

    set({ user, isLoading: false });
  },

  logout: async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken }).catch(() => null);
      }
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      if (typeof document !== 'undefined') {
        document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      }
      set({ user: null, isLoading: false });
    }
  },
}));