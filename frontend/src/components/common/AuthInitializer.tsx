'use client';

import React, { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, Loader2 } from 'lucide-react';
import useAuthStore from '@/store/auth';
import { authApi } from '@/features/auth';

interface AuthInitializerProps {
  children: React.ReactNode;
}

export const AuthInitializer: React.FC<AuthInitializerProps> = ({ children }) => {
  const { isInitializing, setToken, setUser, setInitializing, logout } = useAuthStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      try {
        // Step 1: Exchange HttpOnly refresh cookie for access token
        const refreshResponse = await authApi.refreshToken();
        if (!isMounted) return;

        const { accessToken } = refreshResponse;
        setToken(accessToken);

        // Step 2: Fetch authenticated user identity
        const user = await authApi.getMe();
        if (!isMounted) return;

        setUser({
          id: user.id,
          organizationId: user.organizationId,
          departmentId: user.departmentId,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          status: user.status,
          permissions: user.permissions,
        });

        // Seed TanStack query cache
        queryClient.setQueryData(['currentUser'], user);
      } catch (error) {
        // Unauthenticated or expired session
        if (isMounted) {
          logout();
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

  // Render smooth branded loading screen during initial session verification
  if (isInitializing) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 text-slate-100 p-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <ShieldCheck className="w-8 h-8 animate-pulse" />
            </div>
            <div className="absolute -bottom-1 -right-1 p-1 bg-slate-900 rounded-full border border-slate-800">
              <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-100">Capacity Connect</h3>
            <p className="text-xs text-slate-400">Verifying secure session...</p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthInitializer;
