'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ShieldAlert, ArrowLeft, Loader2 } from 'lucide-react';
import useAuthStore from '@/store/auth';
import { UserRole } from '@/features/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requiredPermissions?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requiredPermissions,
}) => {
  const { user, isAuthenticated, isInitializing } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      const returnUrl = encodeURIComponent(pathname || '/');
      router.push(`/login?returnUrl=${returnUrl}`);
    }
  }, [isAuthenticated, isInitializing, router, pathname]);

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        <div className="flex items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
          <span className="text-sm">Checking authorization...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  // Role validation
  if (allowedRoles && user) {
    const userRole = user.role as UserRole;
    const isRoleAllowed = userRole === 'SUPER_ADMIN' || allowedRoles.includes(userRole);

    if (!isRoleAllowed) {
      return (
        <div className="min-h-[70vh] flex items-center justify-center p-4">
          <div className="max-w-md w-full p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-100">Access Restricted</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your account role (<span className="text-indigo-400 font-semibold">{userRole}</span>)
              does not have permission to view this section. Allowed roles:{' '}
              <span className="text-slate-300 font-medium">{allowedRoles.join(', ')}</span>.
            </p>
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Dashboard</span>
            </button>
          </div>
        </div>
      );
    }
  }

  // Permission validation
  if (requiredPermissions && user) {
    const userPermissions = user.permissions || [];
    const isPermAllowed =
      user.role === 'SUPER_ADMIN' ||
      userPermissions.includes('*') ||
      requiredPermissions.every((p) => userPermissions.includes(p));

    if (!isPermAllowed) {
      return (
        <div className="min-h-[70vh] flex items-center justify-center p-4">
          <div className="max-w-md w-full p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-100">Permission Required</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              You are missing required permissions ({requiredPermissions.join(', ')}) to access this
              feature.
            </p>
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Dashboard</span>
            </button>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
