'use client';

import React from 'react';
import AppShell from '@/components/layout/AppShell';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import UsersListPage from '@/features/user/pages/UsersListPage';

export default function UsersPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
      <AppShell>
        <UsersListPage />
      </AppShell>
    </ProtectedRoute>
  );
}
