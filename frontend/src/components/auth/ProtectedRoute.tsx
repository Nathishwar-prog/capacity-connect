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
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600">
        <div className="flex items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
          <span className="text-xs font-semibold">Checking authorization...</span>
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
          <div className="max-w-md w-full p-8 rounded-3xl bg-white border border-slate-200 shadow-xl shadow-slate-200/50 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">Access Restricted</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Your account role (<span className="text-indigo-600 font-bold">{userRole}</span>) does
              not have authorization to view this section. Allowed roles:{' '}
              <span className="text-slate-800 font-bold">{allowedRoles.join(', ')}</span>.
            </p>
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs"
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
          <div className="max-w-md w-full p-8 rounded-3xl bg-white border border-slate-200 shadow-xl shadow-slate-200/50 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">Permission Required</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              You are missing required permissions ({requiredPermissions.join(', ')}) to access this
              feature.
            </p>
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs"
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
