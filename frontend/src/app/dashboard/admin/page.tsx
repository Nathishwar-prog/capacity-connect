'use client';

import React from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { AdminDashboard } from '@/features/dashboard';

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
      <AppShell>
        <AdminDashboard />
      </AppShell>
    </ProtectedRoute>
  );
}
