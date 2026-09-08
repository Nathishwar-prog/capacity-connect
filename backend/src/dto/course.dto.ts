import { CourseDifficulty, CourseStatus } from '@prisma/client';

export interface CreateCourseDto {
    organizationId: string;
    trainerId: string;
    title: string;
    slug: string;
    description: string;
    thumbnailUrl?: string;
    category: string;
    difficulty?: CourseDifficulty;
    durationMinutes?: number;
    prerequisites?: string[];
}

export interface UpdateCourseDto {
    title?: string;
    description?: string;
    thumbnailUrl?: string;
    category?: string;
    difficulty?: CourseDifficulty;
    durationMinutes?: number;
    prerequisites?: string[];
}

export interface CourseListParamsDto {
    skip?: number;
    take?: number;
    organizationId?: string;
    trainerId?: string;
    category?: string;
    difficulty?: CourseDifficulty;
    status?: CourseStatus | CourseStatus[];
    search?: string;
}
