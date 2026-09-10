import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserState {
  id: string;
  organizationId?: string;
  organizationName?: string;
  departmentId?: string | null;
  departmentName?: string | null;
  email: string;
  firstName: string | null;
  lastName?: string | null;
  role: string;
  status?: string;
  permissions?: string[];
  traineeProfile?: {
    id: string;
    designation: string | null;
    bio: string | null;
    interests: string[];
    profileCompletion: number;
  } | null;
  trainerProfile?: {
    id: string;
    designation: string;
    organizationName: string | null;
    bio: string;
    yearsExperience: number;
  } | null;
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

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
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
        // Clear credentials
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isInitializing: false,
        });
      },
    }),
    {
      name: 'cc_auth_session',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

export default useAuthStore;
