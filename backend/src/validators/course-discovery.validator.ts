import { z } from 'zod';
import { CourseDifficulty } from '@prisma/client';

export const courseQuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  difficulty: z.nativeEnum(CourseDifficulty).optional(),
  trainerId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  sortBy: z.enum(['newest', 'title', 'duration']).default('newest'),
});

export const courseIdParamSchema = z.object({
  courseId: z.string().min(1, 'Course ID is required'),
});

export type CourseQueryInput = z.infer<typeof courseQuerySchema>;
