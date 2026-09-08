'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { CourseLearningPage } from '@/features/learning-experience';

export default function TraineeCourseLearningPageRoute() {
  const params = useParams();
  const courseId = (params?.courseId as string) || 'course-1';

  return <CourseLearningPage courseId={courseId} />;
}
