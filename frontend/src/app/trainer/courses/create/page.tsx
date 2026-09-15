'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TrainerCourseCreateRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/trainer/courses/new');
  }, [router]);

  return null;
}
