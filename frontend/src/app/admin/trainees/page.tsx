'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LegacyAdminTraineesPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/capacity-building/trainees');
  }, [router]);

  return null;
}
