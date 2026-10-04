import { z } from 'zod';
import { CourseDifficulty, CourseStatus } from '@prisma/client';

export const createCourseSchema = z.object({
    organizationId: z.string().uuid('Invalid organization identifier'),
    trainerId: z.string().uuid('Invalid trainer identifier'),
    title: z.string({ required_error: 'Course title is required' }).min(3, 'Title must be at least 3 characters'),
    slug: z.string({ required_error: 'Course slug is required' })
        .min(3, 'Slug must be at least 3 characters')
        .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
    description: z.string({ required_error: 'Course description is required' }).min(10, 'Description must be at least 10 characters'),
    thumbnailUrl: z.string().url('Invalid URL').optional(),
    category: z.string({ required_error: 'Category is required' }).min(2, 'Category is too short'),
    difficulty: z.nativeEnum(CourseDifficulty).optional(),
    durationMinutes: z.number().int().min(0).optional(),
    prerequisites: z.array(z.string().uuid()).optional(),
});

export const updateCourseSchema = z.object({
    title: z.string().min(3).optional(),
    description: z.string().min(10).optional(),
    thumbnailUrl: z.string().url('Invalid URL').optional(),
    category: z.string().min(2).optional(),
    difficulty: z.nativeEnum(CourseDifficulty).optional(),
    durationMinutes: z.number().int().min(0).optional(),
    prerequisites: z.array(z.string().uuid()).optional(),
});

export const listCoursesQuerySchema = z.object({
    skip: z.coerce.number().int().min(0).optional(),
    take: z.coerce.number().int().min(1).max(100).optional(),
    organizationId: z.string().uuid().optional(),
    trainerId: z.string().uuid().optional(),
    category: z.string().optional(),
    difficulty: z.nativeEnum(CourseDifficulty).optional(),
    status: z.union([
        z.nativeEnum(CourseStatus),
        z.array(z.nativeEnum(CourseStatus))
    ]).optional(),
    search: z.string().optional(),
});

export const rejectCourseSchema = z.object({
    reason: z.string().min(3, 'Rejection reason must be at least 3 characters').optional(),
    rejectionReason: z.string().min(3, 'Rejection reason must be at least 3 characters').optional(),
}).refine(data => Boolean(data.reason || data.rejectionReason), {
    message: 'A rejection reason is required',
});

