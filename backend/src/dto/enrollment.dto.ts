import { EnrollmentStatus } from '@prisma/client';

export interface EnrollCourseDTO {
    courseId: string;
}

export interface UpdateLessonProgressDTO {
    completed: boolean;
    progressPercentage?: number;
}

export interface EnrollmentFilterDTO {
    status?: EnrollmentStatus;
    skip?: number;
    take?: number;
}

export interface EnrollmentResponseDTO {
    id: string;
    userId: string;
    courseId: string;
    status: EnrollmentStatus;
    progressPercentage: number;
    enrolledAt: Date;
    startedAt?: Date | null;
    completedAt?: Date | null;
    lastAccessedAt?: Date | null;
    course?: {
        id: string;
        title: string;
        slug: string;
        thumbnailUrl?: string | null;
        category: string;
        difficulty: string;
        durationMinutes: number;
    };
    completedLessonsCount?: number;
    totalLessonsCount?: number;
}
