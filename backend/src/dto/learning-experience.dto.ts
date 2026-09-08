import { LessonContentType, EnrollmentStatus } from '@prisma/client';

export interface LessonSummaryDto {
  id: string;
  moduleId: string;
  title: string;
  description: string | null;
  contentType: LessonContentType;
  durationMinutes: number | null;
  orderIndex: number;
  isPreview: boolean;
  completed: boolean;
  progressPercentage: number;
}

export interface ModuleSummaryDto {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  orderIndex: number;
  totalLessons: number;
  completedLessons: number;
  progressPercentage: number;
  lessons: LessonSummaryDto[];
}

export interface CourseLearningOverviewDto {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  difficulty: string;
  durationMinutes: number;
  trainer: {
    id: string;
    name: string;
    designation: string | null;
    organizationName: string | null;
    avatarUrl: string | null;
  };
  enrollment: {
    id: string;
    status: EnrollmentStatus;
    progressPercentage: number;
    enrolledAt: string;
    lastAccessedAt: string | null;
  };
  totalModules: number;
  totalLessons: number;
  completedLessons: number;
  currentLessonId: string | null;
  currentModuleId: string | null;
  modules: ModuleSummaryDto[];
}

export interface LessonDetailDto {
  id: string;
  moduleId: string;
  moduleTitle: string;
  courseId: string;
  courseTitle: string;
  title: string;
  description: string | null;
  contentType: LessonContentType;
  content: string | null;
  resourceUrl: string | null;
  durationMinutes: number | null;
  orderIndex: number;
  completed: boolean;
  progressPercentage: number;
  previousLessonId: string | null;
  nextLessonId: string | null;
}

export interface CompleteLessonResponseDto {
  success: boolean;
  message: string;
  lessonId: string;
  completed: boolean;
  courseProgressPercentage: number;
  courseStatus: EnrollmentStatus;
  nextLessonId: string | null;
}

export interface CourseProgressDto {
  courseId: string;
  totalLessons: number;
  completedLessons: number;
  progressPercentage: number;
  status: EnrollmentStatus;
  lastAccessedAt: string | null;
}
