/**
 * Skill Gap Request Validators
 */

import { z } from 'zod';

export const analyzeSkillGapsSchema = z.object({
  body: z.object({
    userId: z.string().uuid().optional(),
    courseId: z.string().uuid().optional().nullable(),
    includeAiGuidance: z.boolean().optional().default(true),
  }),
});

export const getSkillGapsQuerySchema = z.object({
  query: z.object({
    userId: z.string().uuid().optional(),
    courseId: z.string().uuid().optional(),
  }),
});

export const getReadinessQuerySchema = z.object({
  query: z.object({
    userId: z.string().uuid().optional(),
    courseId: z.string().uuid().optional(),
  }),
});

export const getAnalysisHistoryQuerySchema = z.object({
  query: z.object({
    userId: z.string().uuid().optional(),
    courseId: z.string().uuid().optional(),
  }),
});

export const analysisIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const remediateGapSchema = z.object({
  body: z.object({
    userId: z.string().uuid().optional(),
    competencyId: z.string().uuid(),
    courseId: z.string().uuid().optional().nullable(),
    availableMinutes: z.number().int().min(10).max(180).optional().default(30),
  }),
});
