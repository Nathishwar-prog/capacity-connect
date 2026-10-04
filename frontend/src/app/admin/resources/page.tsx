'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LegacyAdminResourcesPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/capacity-building/learning-resources');
  }, [router]);

  return null;
}
