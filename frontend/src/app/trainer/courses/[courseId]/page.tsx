'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function TrainerCourseRootPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;

  useEffect(() => {
    if (courseId) {
      router.replace(`/trainer/courses/${courseId}/builder`);
    }
  }, [courseId, router]);

  return null;
}
