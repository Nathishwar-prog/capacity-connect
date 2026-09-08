export type CourseDifficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'OPERATIONAL';
export type CourseStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type EnrollmentStatus = 'ENROLLED' | 'IN_PROGRESS' | 'COMPLETED' | 'DROPPED';

export interface TrainerSummary {
  id: string;
  name: string;
  designation: string | null;
  organizationName: string | null;
  avatarUrl: string | null;
}

export interface CourseSummary {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnailUrl: string | null;
  category: string;
  difficulty: CourseDifficulty;
  durationMinutes: number;
  status?: CourseStatus;
  trainer: TrainerSummary;
  modulesCount: number;
  lessonsCount: number;
  enrollmentStatus?: EnrollmentStatus | null;
  isEnrolled?: boolean;
}

export interface LessonSummary {
  id: string;
  title: string;
  description: string | null;
  durationMinutes: number | null;
  orderIndex: number;
  isPreview: boolean;
}

export interface CourseModuleDetails {
  id: string;
  title: string;
  description: string | null;
  orderIndex: number;
  lessons: LessonSummary[];
}

export interface CoursePrerequisiteDetails {
  id: string;
  title: string;
  slug: string;
  category: string;
  difficulty: CourseDifficulty;
}

export interface CourseCompetencyOutcome {
  id: string;
  name: string;
  code: string;
  category: string | null;
  targetLevel: number;
}

export interface CourseDetails extends CourseSummary {
  objectives: string[];
  modules: CourseModuleDetails[];
  prerequisites: CoursePrerequisiteDetails[];
  competencies: CourseCompetencyOutcome[];
  publishedAt: string | null;
}

export interface CourseFiltersMetadata {
  categories: string[];
  difficulties: CourseDifficulty[];
  trainers: TrainerSummary[];
}

export interface CourseQueryParams {
  search?: string;
  category?: string;
  difficulty?: CourseDifficulty;
  trainerId?: string;
  page?: number;
  limit?: number;
  sortBy?: 'newest' | 'title' | 'duration';
}

export interface CourseListResponse {
  courses: CourseSummary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  filters: CourseFiltersMetadata;
}
