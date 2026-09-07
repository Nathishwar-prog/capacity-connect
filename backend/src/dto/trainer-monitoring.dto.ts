import { z } from 'zod';
import { EnrollmentStatus, AttemptStatus } from '@prisma/client';

/**
 * Query schema for listing trainees monitoring
 */
export const TraineeMonitoringQuerySchema = z.object({
    courseId: z.string().uuid().optional(),
    status: z.nativeEnum(EnrollmentStatus).optional(),
    completionStatus: z.enum(['completed', 'in_progress', 'not_started']).optional(),
    search: z.string().trim().max(100).optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    sortBy: z.enum(['enrolledAt', 'progressPercentage', 'firstName', 'lastName', 'completedAt']).default('enrolledAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type TraineeMonitoringQuery = z.infer<typeof TraineeMonitoringQuerySchema>;

/**
 * Route parameter validation for specific course / trainee monitoring
 */
export const CourseMonitoringParamSchema = z.object({
    courseId: z.string().uuid(),
});

export const TraineeCourseParamSchema = z.object({
    courseId: z.string().uuid(),
    traineeId: z.string().uuid(),
});

/**
 * Query schema for assessment monitoring
 */
export const AssessmentMonitoringQuerySchema = z.object({
    courseId: z.string().uuid().optional(),
    assessmentId: z.string().uuid().optional(),
    attemptStatus: z.nativeEnum(AttemptStatus).optional(),
    passed: z.coerce.boolean().optional(),
    search: z.string().trim().max(100).optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    sortBy: z.enum(['submittedAt', 'score', 'percentage', 'startedAt']).default('submittedAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type AssessmentMonitoringQuery = z.infer<typeof AssessmentMonitoringQuerySchema>;
