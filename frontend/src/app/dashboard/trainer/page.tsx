'use client';

import React from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { TrainerDashboard } from '@/features/dashboard';

export default function TrainerDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['TRAINER', 'ADMIN', 'SUPER_ADMIN']}>
      <AppShell>
        <TrainerDashboard />
      </AppShell>
    </ProtectedRoute>
  );
}
