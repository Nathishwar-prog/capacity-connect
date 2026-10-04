import { z } from 'zod';

export const createAnnouncementSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .min(3, 'Title must be at least 3 characters long')
    .max(150, 'Title must not exceed 150 characters')
    .trim(),
  content: z
    .string({ required_error: 'Content / Message is required' })
    .min(5, 'Content must be at least 5 characters long')
    .max(5000, 'Content must not exceed 5000 characters')
    .trim(),
  audience: z.enum(['ALL', 'TRAINEES', 'TRAINERS'], {
    required_error: 'Target audience is required',
  }),
  type: z.enum(['GENERAL', 'COURSE', 'ACHIEVEMENT', 'LEARNING_CONTENT', 'SYSTEM']).optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
});

export type CreateAnnouncementDto = z.infer<typeof createAnnouncementSchema>;
