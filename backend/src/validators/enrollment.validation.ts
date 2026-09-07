import { z } from 'zod';
import { EnrollmentStatus } from '@prisma/client';

export const enrollCourseSchema = z.object({
    courseId: z.string({ required_error: 'courseId is required' })
        .uuid('Invalid course ID format'),
});

export const updateLessonProgressSchema = z.object({
    completed: z.boolean({ required_error: 'completed field is required' }),
    progressPercentage: z.number().min(0).max(100, 'progressPercentage must be between 0 and 100').optional(),
});

export const enrollmentQuerySchema = z.object({
    status: z.nativeEnum(EnrollmentStatus).optional(),
    skip: z.preprocess((val) => (val ? parseInt(String(val), 10) : undefined), z.number().int().min(0).optional()),
    take: z.preprocess((val) => (val ? parseInt(String(val), 10) : undefined), z.number().int().min(1).max(100).optional()),
});
