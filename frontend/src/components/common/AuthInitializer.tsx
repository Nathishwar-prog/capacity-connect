'use client';

import React, { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import useAuthStore from '@/store/auth';
import { authApi } from '@/features/auth/api/authApi';

interface AuthInitializerProps {
  children: React.ReactNode;
}

export const AuthInitializer: React.FC<AuthInitializerProps> = ({ children }) => {
  const { setToken, setUser, setInitializing, logout } = useAuthStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      try {
        const existingToken = useAuthStore.getState().token;

        if (existingToken) {
          try {
            const user = await authApi.getMe();
            if (!isMounted) return;

            setUser({
              id: user.id,
              organizationId: user.organizationId,
              organizationName: user.organizationName,
              departmentId: user.departmentId,
              departmentName: user.departmentName,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              role: user.role,
              status: user.status,
              permissions: user.permissions,
              traineeProfile: user.traineeProfile,
              trainerProfile: user.trainerProfile,
            });

            queryClient.setQueryData(['currentUser'], user);
            return;
          } catch (err: any) {
            // Token might have expired; continue to try refresh token below
          }
        }

        // Exchange HttpOnly refresh cookie for access token
        const refreshResponse = await authApi.refreshToken();
        if (!isMounted) return;

        const { accessToken } = refreshResponse;
        setToken(accessToken);

        // Fetch authenticated user identity
        const user = await authApi.getMe();
        if (!isMounted) return;

        setUser({
          id: user.id,
          organizationId: user.organizationId,
          organizationName: user.organizationName,
          departmentId: user.departmentId,
          departmentName: user.departmentName,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          status: user.status,
          permissions: user.permissions,
          traineeProfile: user.traineeProfile,
          trainerProfile: user.trainerProfile,
        });

        // Seed TanStack query cache
        queryClient.setQueryData(['currentUser'], user);
      } catch (error: any) {
        // Only clear session if server explicitly rejects refresh token or unauthenticated
        const status = error?.response?.status;
        if (isMounted) {
          if (status === 401 || status === 403 || !useAuthStore.getState().token) {
            logout();
          }
        }
      } finally {
        if (isMounted) {
          setInitializing(false);
        }
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, [setToken, setUser, setInitializing, logout, queryClient]);

  return <>{children}</>;
};

export default AuthInitializer;
