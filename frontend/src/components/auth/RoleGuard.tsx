'use client';

import React from 'react';
import useAuthStore from '@/store/auth';
import { UserRole } from '@/features/auth';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requiredPermissions?: string[];
  fallback?: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  allowedRoles,
  requiredPermissions,
  fallback = null,
}) => {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <>{fallback}</>;
  }

  const userRole = user.role as UserRole;

  // Super Admin bypass
  if (userRole === 'SUPER_ADMIN') {
    return <>{children}</>;
  }

  // Check role
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <>{fallback}</>;
  }

  // Check permissions
  if (requiredPermissions) {
    const userPermissions = user.permissions || [];
    if (!userPermissions.includes('*')) {
      const hasAll = requiredPermissions.every((p) => userPermissions.includes(p));
      if (!hasAll) {
        return <>{fallback}</>;
      }
    }
  }

  return <>{children}</>;
};

export default RoleGuard;
