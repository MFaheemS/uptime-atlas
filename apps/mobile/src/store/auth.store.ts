import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { api, setupApiInterceptors } from '../lib/api';

const REFRESH_TOKEN_KEY = 'refreshToken';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  accessToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  refresh: () => Promise<boolean>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set, get) => {
  const getAccessToken = () => get().accessToken;
  const refreshFn = () => get().refresh();
  const logoutFn = () => get().logout();

  setupApiInterceptors(getAccessToken, refreshFn, logoutFn);

  return {
    accessToken: null,
    user: null,
    isAuthenticated: false,
    isLoading: true,

    login: async (email, password) => {
      const res = await api.post('/auth/login', { email, password });
      const { accessToken, refreshToken, user } = res.data;
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
      set({ accessToken, user, isAuthenticated: true });
    },

    register: async (name, email, password) => {
      await api.post('/auth/register', { name, email, password });
      await get().login(email, password);
    },

    logout: async () => {
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      set({ accessToken: null, user: null, isAuthenticated: false });
    },

    restoreSession: async () => {
      try {
        const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
        if (!refreshToken) {
          set({ isLoading: false });
          return;
        }
        const res = await api.post('/auth/refresh', { refreshToken });
        const { accessToken, user } = res.data;
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, res.data.refreshToken ?? refreshToken);
        set({ accessToken, user, isAuthenticated: true, isLoading: false });
      } catch {
        await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
        set({ isLoading: false });
      }
    },

    refresh: async () => {
      try {
        const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
        if (!refreshToken) return false;
        const res = await api.post('/auth/refresh', { refreshToken });
        const { accessToken } = res.data;
        if (res.data.refreshToken) {
          await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, res.data.refreshToken);
        }
        set({ accessToken });
        return true;
      } catch {
        return false;
      }
    },

    setUser: (user) => set({ user }),
  };
});
