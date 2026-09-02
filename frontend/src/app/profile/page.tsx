'use client';

import React from 'react';
import AppShell from '@/components/layout/AppShell';
import UserProfilePage from '@/features/user/pages/UserProfilePage';

export default function ProfilePage() {
  return (
    <AppShell>
      <UserProfilePage />
    </AppShell>
  );
}
