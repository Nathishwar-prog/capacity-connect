'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { CourseLearningPage } from '@/features/learning-experience';

export default function LessonLearningPageRoute() {
  const params = useParams();
  const courseId = (params?.courseId as string) || 'course-1';
  const lessonId = (params?.lessonId as string) || undefined;

  return <CourseLearningPage courseId={courseId} initialLessonId={lessonId} />;
}
