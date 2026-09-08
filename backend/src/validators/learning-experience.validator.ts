import { z } from 'zod';

export const courseIdParamSchema = z.object({
  courseId: z.string().uuid({ message: 'courseId must be a valid UUID' }).or(z.string().min(1)),
});

export const lessonIdParamSchema = z.object({
  lessonId: z.string().uuid({ message: 'lessonId must be a valid UUID' }).or(z.string().min(1)),
});

export const completeLessonSchema = z.object({
  timeSpentSeconds: z.number().nonnegative().optional(),
});

export type CompleteLessonInput = z.infer<typeof completeLessonSchema>;
