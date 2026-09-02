'use client';

import React from 'react';
import AppShell from '@/components/layout/AppShell';
import UsersListPage from '@/features/user/pages/UsersListPage';

export default function UsersPage() {
  return (
    <AppShell>
      <UsersListPage />
    </AppShell>
  );
}
