import { z } from 'zod';
import { LessonContentType } from '@prisma/client';

export const createModuleSchema = z.object({
    title: z.string({ required_error: 'Module title is required' })
        .trim()
        .min(1, 'Title cannot be empty')
        .max(255, 'Title is too long'),
    description: z.string().optional(),
    orderIndex: z.number().int().min(0, 'orderIndex must be a non-negative integer').optional(),
});

export const updateModuleSchema = z.object({
    title: z.string()
        .trim()
        .min(1, 'Title cannot be empty')
        .max(255, 'Title is too long')
        .optional(),
    description: z.string().optional(),
    orderIndex: z.number().int().min(0, 'orderIndex must be a non-negative integer').optional(),
});

export const reorderModulesSchema = z.object({
    moduleOrders: z.array(
        z.object({
            id: z.string().uuid('Invalid module ID format'),
            orderIndex: z.number().int().min(0, 'orderIndex must be a non-negative integer'),
        })
    ).min(1, 'moduleOrders array cannot be empty'),
});

export const createLessonSchema = z.object({
    title: z.string({ required_error: 'Lesson title is required' })
        .trim()
        .min(1, 'Title cannot be empty')
        .max(255, 'Title is too long'),
    description: z.string().optional(),
    contentType: z.nativeEnum(LessonContentType).optional(),
    content: z.string().optional(),
    resourceUrl: z.string().url('Invalid URL format').or(z.literal('')).optional(),
    durationMinutes: z.number().int().min(0, 'durationMinutes must be a non-negative integer').optional(),
    orderIndex: z.number().int().min(0, 'orderIndex must be a non-negative integer').optional(),
    isPreview: z.boolean().optional(),
});

export const updateLessonSchema = z.object({
    title: z.string()
        .trim()
        .min(1, 'Title cannot be empty')
        .max(255, 'Title is too long')
        .optional(),
    description: z.string().optional(),
    contentType: z.nativeEnum(LessonContentType).optional(),
    content: z.string().optional(),
    resourceUrl: z.string().url('Invalid URL format').or(z.literal('')).optional(),
    durationMinutes: z.number().int().min(0, 'durationMinutes must be a non-negative integer').optional(),
    orderIndex: z.number().int().min(0, 'orderIndex must be a non-negative integer').optional(),
    isPreview: z.boolean().optional(),
});

export const reorderLessonsSchema = z.object({
    lessonOrders: z.array(
        z.object({
            id: z.string().uuid('Invalid lesson ID format'),
            orderIndex: z.number().int().min(0, 'orderIndex must be a non-negative integer'),
        })
    ).min(1, 'lessonOrders array cannot be empty'),
});

export const attachLessonResourceSchema = z.object({
    resourceId: z.string({ required_error: 'resourceId is required' }).uuid('Invalid resource ID format'),
});
