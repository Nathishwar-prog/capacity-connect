/**
 * Zod Schema for Structured LLM Guidance Output
 */

import { z } from 'zod';

export const AIGuidanceSchema = z.object({
  executiveSummary: z.string().min(20),
  readinessAssessment: z.object({
    status: z.enum(['NOT_READY', 'CONDITIONAL', 'GENERALLY_READY', 'FULLY_READY']),
    readinessScore: z.number().min(0).max(100),
    explanation: z.string().min(20),
  }),
  keyFindings: z.object({
    criticalGaps: z.array(z.string()),
    rootCauses: z.array(z.string()),
    strengths: z.array(z.string()),
  }),
  actionableLearningPath: z.array(
    z.object({
      stepNumber: z.number().int().positive(),
      competencyName: z.string(),
      action: z.string(),
      estimatedHours: z.number().positive(),
      rationale: z.string(),
    })
  ),
  mentorshipAndReviewAdvice: z.string(),
  disclaimer: z.string(),
});

export type AIGuidanceOutputZod = z.infer<typeof AIGuidanceSchema>;
