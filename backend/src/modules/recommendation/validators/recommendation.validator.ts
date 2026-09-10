/**
 * Recommendation Input Validators
 */

import { z } from 'zod';

export const getRecommendationsQuerySchema = z.object({
  query: z.object({
    surface: z.enum([
      'HOME',
      'COURSE_DETAIL',
      'SKILL_GAP',
      'LEARNING_PATH',
      'SEARCH',
      'DASHBOARD',
      'POST_COMPLETION',
      'COURSE_PAGE',
      'ASSESSMENT_RESULT',
      'SKILL_PROFILE',
    ]).optional(),
    limit: z.coerce.number().min(1).max(50).optional(),
    activeCourseId: z.string().uuid().optional(),
    userId: z.string().uuid().optional(),
  }),
});

export const trackEventSchema = z.object({
  body: z.object({
    recommendationId: z.string().uuid().optional(),
    batchId: z.string().uuid().optional(),
    eventType: z.enum([
      'IMPRESSION',
      'VIEW',
      'CLICK',
      'SAVE',
      'DISMISS',
      'START',
      'ENROLL',
      'COMPLETE',
      'ABANDON',
      'SHARE',
    ]),
    metadata: z.record(z.any()).optional(),
  }),
});

export const trackBatchImpressionsSchema = z.object({
  body: z.object({
    batchId: z.string().uuid(),
    recommendationIds: z.array(z.string().uuid()).min(1),
  }),
});

export const submitFeedbackSchema = z.object({
  body: z.object({
    recommendationId: z.string().uuid(),
    feedbackType: z.enum([
      'NOT_RELEVANT',
      'ALREADY_KNOW_THIS',
      'TOO_DIFFICULT',
      'TOO_EASY',
      'NOT_NOW',
      'WRONG_TOPIC',
      'INTERESTING',
    ]),
    comment: z.string().max(500).optional(),
  }),
});

export const getAdminMetricsQuerySchema = z.object({
  query: z.object({
    department: z.string().optional(),
  }),
});
