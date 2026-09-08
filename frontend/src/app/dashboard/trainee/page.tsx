'use client';

import React from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/features/trainee-app-shell';
import { TraineeDashboard } from '@/features/dashboard/trainee';

export default function TraineeDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['TRAINEE', 'ADMIN', 'SUPER_ADMIN']}>
      <AppShell>
        <TraineeDashboard />
      </AppShell>
    </ProtectedRoute>
  );
}
