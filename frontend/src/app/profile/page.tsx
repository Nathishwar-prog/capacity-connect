'use client';

import React from 'react';
import AppShell from '@/components/layout/AppShell';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import UserProfilePage from '@/features/user/pages/UserProfilePage';

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <UserProfilePage />
      </AppShell>
    </ProtectedRoute>
  );
}
