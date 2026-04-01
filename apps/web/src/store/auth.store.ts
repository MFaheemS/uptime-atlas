import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  accessToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setToken: (token: string) => void;
  clearToken: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  isAuthenticated: false,
  setToken: (token) => set({ accessToken: token, isAuthenticated: true }),
  clearToken: () => set({ accessToken: null, user: null, isAuthenticated: false }),
  setUser: (user) => set({ user }),
}));
