'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useCourseOutline } from '@/features/trainee/courses/hooks/useCourseViewer';
import { CourseViewerSkeleton } from '@/features/trainee/courses/components';

export default function TraineeLearnRedirectPage() {
  return (
    <ProtectedRoute allowedRoles={['TRAINEE', 'TRAINER', 'ADMIN', 'SUPER_ADMIN']}>
      <LearnRedirectContent />
    </ProtectedRoute>
  );
}

function LearnRedirectContent() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  const { data: outline, isLoading, isError } = useCourseOutline(courseId);

  useEffect(() => {
    if (!outline || isLoading) return;

    // Find first lesson across all modules
    const allLessons = outline.modules.flatMap((m) => m.lessons || []);
    if (allLessons.length === 0) {
      router.replace(`/trainee/courses/${courseId}`);
      return;
    }

    // Prefer first incomplete lesson
    const firstIncomplete = allLessons.find((l) => !l.isCompleted);
    const targetLesson = firstIncomplete || allLessons[0];

    router.replace(`/trainee/courses/${courseId}/learn/${targetLesson.id}`);
  }, [outline, isLoading, courseId, router]);

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white p-4">
        <div className="text-center space-y-3 max-w-sm">
          <h2 className="text-sm font-bold text-slate-200">Unable to launch course player</h2>
          <p className="text-xs text-slate-400">
            Please make sure you are enrolled in this course or return to the course catalog.
          </p>
          <button
            onClick={() => router.push(`/trainee/courses/${courseId}`)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-semibold text-white"
          >
            Course Overview
          </button>
        </div>
      </div>
    );
  }

  return <CourseViewerSkeleton />;
}
