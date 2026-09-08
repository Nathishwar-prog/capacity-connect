import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { learningApi } from '../api/learningApi';
import { mockLearningCourses, mockLessonDetails } from '../utils/mockLearningData';
import {
  CourseLearningOverview,
  LessonDetail,
  LessonSummary,
} from '../types/learning-experience.types';

const LEARNING_QUERY_KEY = ['course-learning'];
const LESSON_QUERY_KEY = ['lesson-learning'];

export function useLearningCourse(courseId: string, initialLessonId?: string) {
  const queryClient = useQueryClient();

  // Local interactive state for local offline demo resilience
  const [localCourse, setLocalCourse] = useState<CourseLearningOverview | null>(() => {
    return mockLearningCourses[courseId] || mockLearningCourses['course-1'] || null;
  });

  const [activeLessonId, setActiveLessonId] = useState<string | null>(() => {
    if (initialLessonId) return initialLessonId;
    const initialCourse = mockLearningCourses[courseId] || mockLearningCourses['course-1'];
    return initialCourse?.currentLessonId || 'les-1-1';
  });

  const [isUsingMock, setIsUsingMock] = useState(false);
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(() => {
    const initialCourse = mockLearningCourses[courseId] || mockLearningCourses['course-1'];
    const initialCompleted = new Set<string>();
    initialCourse?.modules.forEach((m) => {
      m.lessons.forEach((l) => {
        if (l.completed) initialCompleted.add(l.id);
      });
    });
    return initialCompleted;
  });

  // Query: Fetch course overview from backend
  const courseQuery = useQuery({
    queryKey: [...LEARNING_QUERY_KEY, courseId],
    queryFn: async () => {
      try {
        const data = await learningApi.getCourseOverview(courseId);
        setIsUsingMock(false);
        return data;
      } catch (err: any) {
        // Fallback to local mock data when offline or backend unseeded
        setIsUsingMock(true);
        const fallback = mockLearningCourses[courseId] || mockLearningCourses['course-1'] || null;
        return fallback;
      }
    },
    staleTime: 1000 * 60 * 5,
  });

  const courseData: CourseLearningOverview | null =
    (courseQuery.data as CourseLearningOverview | null) || localCourse;

  // Flattened ordered list of all lessons in curriculum
  const allOrderedLessons: LessonSummary[] = useMemo(() => {
    if (!courseData?.modules) return [];
    return courseData.modules.flatMap((m) => m.lessons);
  }, [courseData]);

  // Query: Fetch active lesson details
  const lessonQuery = useQuery({
    queryKey: [...LESSON_QUERY_KEY, activeLessonId],
    queryFn: async () => {
      if (!activeLessonId) return null;
      try {
        const data = await learningApi.getLessonDetails(activeLessonId);
        return data;
      } catch {
        // Fallback to mock lesson details
        const mockDetail = mockLessonDetails[activeLessonId];
        if (mockDetail) {
          const isDone = completedLessonIds.has(activeLessonId);
          return {
            ...mockDetail,
            completed: isDone,
            progressPercentage: isDone ? 100 : 0,
          };
        }
        // Construct from summary if not in mock details
        const summary = allOrderedLessons.find((l) => l.id === activeLessonId);
        if (summary) {
          const isDone = completedLessonIds.has(activeLessonId);
          return {
            id: summary.id,
            moduleId: summary.moduleId,
            moduleTitle: 'Current Module',
            courseId: courseData?.id || courseId,
            courseTitle: courseData?.title || 'Operational Course',
            title: summary.title,
            description: summary.description,
            contentType: summary.contentType,
            content: null,
            resourceUrl:
              summary.contentType === 'VIDEO'
                ? 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
                : 'https://imdpune.gov.in/Training/Technical_Manual.pdf',
            durationMinutes: summary.durationMinutes,
            orderIndex: summary.orderIndex,
            completed: isDone,
            progressPercentage: isDone ? 100 : 0,
            previousLessonId: null,
            nextLessonId: null,
          } as LessonDetail;
        }
        return null;
      }
    },
    enabled: Boolean(activeLessonId),
  });

  // Calculate current and surrounding lessons
  const currentIndex = useMemo(() => {
    return allOrderedLessons.findIndex((l) => l.id === activeLessonId);
  }, [allOrderedLessons, activeLessonId]);

  const previousLesson = useMemo(() => {
    return currentIndex > 0 ? allOrderedLessons[currentIndex - 1] : null;
  }, [allOrderedLessons, currentIndex]);

  const nextLesson = useMemo(() => {
    return currentIndex >= 0 && currentIndex < allOrderedLessons.length - 1
      ? allOrderedLessons[currentIndex + 1]
      : null;
  }, [allOrderedLessons, currentIndex]);

  const isFinalLesson = useMemo(() => {
    return currentIndex >= 0 && currentIndex === allOrderedLessons.length - 1;
  }, [allOrderedLessons, currentIndex]);

  const completedCount = completedLessonIds.size;
  const totalCount = allOrderedLessons.length;
  const overallProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isCourseCompleted = totalCount > 0 && completedCount === totalCount;

  // Mutation: Mark Lesson Complete
  const completeMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      if (!isUsingMock) {
        try {
          return await learningApi.completeLesson(lessonId);
        } catch {
          // Fallback to local state update
        }
      }

      // Local state update
      setCompletedLessonIds((prev) => new Set([...Array.from(prev), lessonId]));

      setLocalCourse((prev) => {
        if (!prev) return null;
        const updatedModules = prev.modules.map((m) => {
          let modDone = 0;
          const updatedLessons = m.lessons.map((l) => {
            const isDone = l.id === lessonId || completedLessonIds.has(l.id);
            if (isDone) modDone++;
            return {
              ...l,
              completed: isDone,
              progressPercentage: isDone ? 100 : l.progressPercentage,
            };
          });

          return {
            ...m,
            completedLessons: modDone,
            progressPercentage:
              m.totalLessons > 0 ? Math.round((modDone / m.totalLessons) * 100) : 0,
            lessons: updatedLessons,
          };
        });

        const newDoneCount = completedLessonIds.has(lessonId)
          ? completedLessonIds.size
          : completedLessonIds.size + 1;
        const newPct =
          prev.totalLessons > 0
            ? Math.min(100, Math.round((newDoneCount / prev.totalLessons) * 100))
            : 100;

        return {
          ...prev,
          completedLessons: newDoneCount,
          enrollment: {
            ...prev.enrollment,
            progressPercentage: newPct,
            status: newPct === 100 ? 'COMPLETED' : 'IN_PROGRESS',
            lastAccessedAt: new Date().toISOString(),
          },
          modules: updatedModules,
        };
      });

      return {
        success: true,
        message: 'Lesson completed successfully',
        lessonId,
        completed: true,
        courseProgressPercentage: overallProgress,
        courseStatus: isCourseCompleted ? ('COMPLETED' as const) : ('IN_PROGRESS' as const),
        nextLessonId: nextLesson?.id || null,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LEARNING_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: LESSON_QUERY_KEY });
    },
  });

  const selectLesson = useCallback((lessonId: string) => {
    setActiveLessonId(lessonId);
  }, []);

  const goToNextLesson = useCallback(() => {
    if (nextLesson) {
      setActiveLessonId(nextLesson.id);
    }
  }, [nextLesson]);

  const goToPreviousLesson = useCallback(() => {
    if (previousLesson) {
      setActiveLessonId(previousLesson.id);
    }
  }, [previousLesson]);

  return {
    course: courseData,
    lesson: lessonQuery.data as LessonDetail | null,
    activeLessonId,
    selectLesson,
    isLoadingCourse: courseQuery.isLoading && !isUsingMock,
    isErrorCourse: courseQuery.isError && !isUsingMock,
    isLoadingLesson: lessonQuery.isLoading && !isUsingMock,
    isErrorLesson: lessonQuery.isError && !isUsingMock,
    // Navigation
    previousLesson,
    nextLesson,
    isFinalLesson,
    goToNextLesson,
    goToPreviousLesson,
    // Progress
    completedLessonIds,
    completedCount,
    totalCount,
    overallProgress,
    isCourseCompleted,
    // Completion Action
    markLessonComplete: completeMutation.mutateAsync,
    isCompleting: completeMutation.isPending,
  };
}
