/**
 * Recommendation AI Explanation Schema
 * 
 * Zod schema enforcing structured pedagogical narrative output.
 * LLM strictly provides qualitative guidance and explanation;
 * it NEVER produces scores, ranks, or overrides eligibility.
 */

import { z } from 'zod';

export const RecommendationItemExplanationSchema = z.object({
  courseId: z.string(),
  headline: z.string(),
  whyRecommended: z.string(),
  competencyOutcome: z.string(),
  pedagogicalAdvice: z.string(),
});

export const RecommendationBatchExplanationSchema = z.object({
  summaryRationale: z.string(),
  targetedMilestone: z.string(),
  learningPathSequence: z.array(z.string()),
  items: z.array(RecommendationItemExplanationSchema),
});

export type RecommendationBatchExplanation = z.infer<typeof RecommendationBatchExplanationSchema>;
export type RecommendationItemExplanation = z.infer<typeof RecommendationItemExplanationSchema>;
