export type LessonContentType = 'VIDEO' | 'PDF' | 'ARTICLE' | 'DOCUMENT' | 'QUIZ';

export type LessonProgressStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

export interface LessonSummary {
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

export interface ModuleSummary {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  orderIndex: number;
  totalLessons: number;
  completedLessons: number;
  progressPercentage: number;
  lessons: LessonSummary[];
}

export interface TrainerInfo {
  id: string;
  name: string;
  designation: string | null;
  organizationName: string | null;
  avatarUrl: string | null;
}

export interface EnrollmentInfo {
  id: string;
  status: 'ENROLLED' | 'IN_PROGRESS' | 'COMPLETED' | 'DROPPED';
  progressPercentage: number;
  enrolledAt: string;
  lastAccessedAt: string | null;
}

export interface CourseLearningOverview {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  difficulty: string;
  durationMinutes: number;
  trainer: TrainerInfo;
  enrollment: EnrollmentInfo;
  totalModules: number;
  totalLessons: number;
  completedLessons: number;
  currentLessonId: string | null;
  currentModuleId: string | null;
  modules: ModuleSummary[];
}

export interface LessonDetail {
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
  // Enhanced resources for interactive view
  transcript?: string | null;
  keyTakeaways?: string[];
  operationalChecklist?: string[];
}

export interface CompleteLessonResponse {
  success: boolean;
  message: string;
  lessonId: string;
  completed: boolean;
  courseProgressPercentage: number;
  courseStatus: 'ENROLLED' | 'IN_PROGRESS' | 'COMPLETED' | 'DROPPED';
  nextLessonId: string | null;
}

export interface CourseProgressSummary {
  courseId: string;
  totalLessons: number;
  completedLessons: number;
  progressPercentage: number;
  status: 'ENROLLED' | 'IN_PROGRESS' | 'COMPLETED' | 'DROPPED';
  lastAccessedAt: string | null;
}
