'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LegacyAdminTrainersPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/capacity-building/trainers');
  }, [router]);

  return null;
}
