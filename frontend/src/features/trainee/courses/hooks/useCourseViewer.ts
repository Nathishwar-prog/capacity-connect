import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { courseViewerApi } from '../api/courseViewerApi';
import { CourseOutlineData, LessonDetailData } from '../types/viewer.types';
import { useToast } from '@/components/ui/Toast';

export function useCourseOutline(courseId: string) {
  return useQuery({
    queryKey: ['course-outline', courseId],
    queryFn: () => courseViewerApi.getCourseOutline(courseId),
    enabled: Boolean(courseId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useLessonDetail(courseId: string, lessonId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['lesson-detail', courseId, lessonId],
    queryFn: () => courseViewerApi.getLessonDetail(courseId, lessonId),
    enabled: Boolean(courseId && lessonId),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Automated next-lesson prefetching for instant navigation
  useEffect(() => {
    if (query.data?.nextLessonId && courseId) {
      const nextId = query.data.nextLessonId;
      queryClient.prefetchQuery({
        queryKey: ['lesson-detail', courseId, nextId],
        queryFn: () => courseViewerApi.getLessonDetail(courseId, nextId),
        staleTime: 10 * 60 * 1000,
      });
    }
  }, [query.data?.nextLessonId, courseId, queryClient]);

  return query;
}

export function useCompleteLesson(courseId: string) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (lessonId: string) => courseViewerApi.completeLesson(courseId, lessonId),

    // ── Instantaneous Optimistic Update ──────────────────────────────────────
    onMutate: async (lessonId: string) => {
      // 1. Cancel in-flight queries so they don't overwrite optimistic state
      await queryClient.cancelQueries({ queryKey: ['course-outline', courseId] });
      await queryClient.cancelQueries({ queryKey: ['lesson-detail', courseId, lessonId] });

      // 2. Snapshot previous state for rollback
      const previousOutline = queryClient.getQueryData<CourseOutlineData>(['course-outline', courseId]);
      const previousLessonDetail = queryClient.getQueryData<LessonDetailData>(['lesson-detail', courseId, lessonId]);

      // 3. Optimistically update Course Outline
      if (previousOutline) {
        const alreadyCompleted = previousOutline.progress.completedLessonIds.includes(lessonId);

        if (!alreadyCompleted) {
          const newCompletedIds = [...previousOutline.progress.completedLessonIds, lessonId];
          const newCompletedCount = previousOutline.progress.completedLessonsCount + 1;
          const totalCount = Math.max(1, previousOutline.progress.totalLessonsCount);
          const newPercentage = Math.min(100, Math.round((newCompletedCount / totalCount) * 100));

          const updatedModules = previousOutline.modules.map((mod) => {
            const hasLesson = mod.lessons.some((l) => l.id === lessonId);
            if (!hasLesson) return mod;

            return {
              ...mod,
              completedCount: Math.min(mod.totalCount, mod.completedCount + 1),
              lessons: mod.lessons.map((l) =>
                l.id === lessonId ? { ...l, isCompleted: true } : l
              ),
            };
          });

          queryClient.setQueryData<CourseOutlineData>(['course-outline', courseId], {
            ...previousOutline,
            modules: updatedModules,
            progress: {
              ...previousOutline.progress,
              completedLessonIds: newCompletedIds,
              completedLessonsCount: newCompletedCount,
              progressPercentage: newPercentage,
              status: newPercentage === 100 ? 'COMPLETED' : 'IN_PROGRESS',
            },
          });
        }
      }

      // 4. Optimistically update Lesson Detail
      if (previousLessonDetail) {
        queryClient.setQueryData<LessonDetailData>(['lesson-detail', courseId, lessonId], {
          ...previousLessonDetail,
          isCompleted: true,
        });
      }

      return { previousOutline, previousLessonDetail, lessonId };
    },

    // ── Safe Rollback on Network Failure ─────────────────────────────────────
    onError: (err: any, lessonId, context) => {
      if (context?.previousOutline) {
        queryClient.setQueryData(['course-outline', courseId], context.previousOutline);
      }
      if (context?.previousLessonDetail) {
        queryClient.setQueryData(['lesson-detail', courseId, lessonId], context.previousLessonDetail);
      }

      showToast(
        err?.response?.data?.message ||
          'Could not save your progress. Your completion status has been restored. Please try again.',
        'error'
      );
    },

    // ── Targeted Invalidation ────────────────────────────────────────────────
    onSettled: (data, error, lessonId) => {
      queryClient.invalidateQueries({ queryKey: ['course-outline', courseId] });
      queryClient.invalidateQueries({ queryKey: ['lesson-detail', courseId, lessonId] });
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    },
  });
}
