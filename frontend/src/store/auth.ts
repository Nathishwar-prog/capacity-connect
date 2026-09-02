import { create } from 'zustand';

export interface UserState {
  id: string;
  organizationId?: string;
  departmentId?: string | null;
  email: string;
  firstName: string | null;
  lastName?: string | null;
  role: string;
  status?: string;
  permissions?: string[];
}

interface AuthStore {
  user: UserState | null;
  token: string | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  setToken: (token: string | null) => void;
  setUser: (user: UserState | null) => void;
  setCredentials: (user: UserState, token: string) => void;
  setInitializing: (isInitializing: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isInitializing: true,

  setToken: (token) =>
    set((state) => ({
      token,
      isAuthenticated: !!token && !!state.user,
    })),

  setUser: (user) =>
    set((state) => ({
      user,
      isAuthenticated: !!state.token && !!user,
    })),

  setCredentials: (user, token) =>
    set({
      user,
      token,
      isAuthenticated: true,
      isInitializing: false,
    }),

  setInitializing: (isInitializing) =>
    set({
      isInitializing,
    }),

  logout: () => {
    // Clear in-memory credentials
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isInitializing: false,
    });
  },
}));

export default useAuthStore;
