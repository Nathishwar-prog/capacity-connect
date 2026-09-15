'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TrainerRootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/trainer/dashboard');
  }, [router]);

  return null;
}
