import { z } from 'zod';

export const practiceQuestionSchema = z.object({
  questionId: z.string().default(() => `pq_${Math.random().toString(36).substring(2, 9)}`),
  questionText: z.string().min(10),
  options: z.array(z.string()).min(2).max(5).optional(),
  correctOptionIndex: z.number().int().min(0).max(4).optional(),
  explanation: z.string().min(10),
  hint: z.string().min(5),
  difficultyLevel: z.number().int().min(1).max(5).default(2),
});

export const retrievalCheckSchema = z.object({
  prompt: z.string().min(10),
  targetCriteria: z.array(z.string()).min(1),
  expectedAnswerSummary: z.string().min(10),
});

export const revisionEducationalContentSchema = z.object({
  conceptIntro: z.string().min(20),
  coreRuleRecap: z.string().min(20),
  commonTrapAvoided: z.string().min(20),
  meteorologicalExamples: z.array(z.string()).min(1),
  practiceQuestions: z.array(practiceQuestionSchema).min(1).max(4),
  retrievalCheck: retrievalCheckSchema,
  quickSummary: z.string().min(15),
});

export type RevisionEducationalContentValidated = z.infer<typeof revisionEducationalContentSchema>;
