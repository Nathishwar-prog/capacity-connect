import { CourseDifficulty, CourseStatus, EnrollmentStatus } from '@prisma/client';

export interface TrainerSummaryDto {
  id: string;
  name: string;
  designation: string | null;
  organizationName: string | null;
  avatarUrl: string | null;
}

export interface CourseSummaryDto {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnailUrl: string | null;
  category: string;
  difficulty: CourseDifficulty;
  durationMinutes: number;
  status: CourseStatus;
  trainer: TrainerSummaryDto;
  modulesCount: number;
  lessonsCount: number;
  enrollmentStatus?: EnrollmentStatus | null;
}

export interface LessonSummaryDto {
  id: string;
  title: string;
  description: string | null;
  durationMinutes: number | null;
  orderIndex: number;
  isPreview: boolean;
}

export interface CourseModuleDetailsDto {
  id: string;
  title: string;
  description: string | null;
  orderIndex: number;
  lessons: LessonSummaryDto[];
}

export interface CoursePrerequisiteDetailsDto {
  id: string;
  title: string;
  slug: string;
  category: string;
  difficulty: CourseDifficulty;
}

export interface CourseCompetencyOutcomeDto {
  id: string;
  name: string;
  code: string;
  category: string | null;
  targetLevel: number;
}

export interface CourseDetailsDto {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnailUrl: string | null;
  category: string;
  difficulty: CourseDifficulty;
  durationMinutes: number;
  status: CourseStatus;
  publishedAt: string | null;
  trainer: TrainerSummaryDto;
  modules: CourseModuleDetailsDto[];
  prerequisites: CoursePrerequisiteDetailsDto[];
  competencies: CourseCompetencyOutcomeDto[];
  isEnrolled: boolean;
  enrollmentStatus: EnrollmentStatus | null;
}

export interface CourseFiltersMetadataDto {
  categories: string[];
  difficulties: CourseDifficulty[];
  trainers: TrainerSummaryDto[];
}

export interface CourseListResponseDto {
  courses: CourseSummaryDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  filters: CourseFiltersMetadataDto;
}
