'use client';

import React from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { TraineeDashboard } from '@/features/dashboard';

export default function TraineeDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['TRAINEE', 'ADMIN', 'SUPER_ADMIN']}>
      <AppShell>
        <TraineeDashboard />
      </AppShell>
    </ProtectedRoute>
  );
}
