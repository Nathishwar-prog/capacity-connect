import { z } from 'zod';

export const ingestEventSchema = z.object({
  topicId: z.string().min(1, 'topicId is required'),
  eventType: z.enum([
    'LESSON_VIEWED',
    'LESSON_COMPLETED',
    'QUIZ_ANSWERED',
    'PRACTICE_ATTEMPT',
    'ASSESSMENT_ANSWERED',
    'ASSESSMENT_COMPLETED',
    'REVISION_STARTED',
    'REVISION_COMPLETED',
    'RETRIEVAL_ATTEMPT',
    'DIAGNOSTIC_ATTEMPT',
  ]),
  score: z.number().min(0),
  maxScore: z.number().min(1),
  isCorrect: z.boolean(),
  timeSpentSeconds: z.number().min(0),
  expectedDurationSeconds: z.number().min(1).optional(),
  hintCount: z.number().int().min(0).optional(),
  helpRequested: z.boolean().optional(),
  confidenceSelfReport: z.number().min(0).max(5).optional(),
  errorCategory: z.string().optional(),
  courseId: z.string().optional(),
  lessonId: z.string().optional(),
  assessmentQuestionId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export const generatePlanSchema = z.object({
  targetDurationMinutes: z.number().int().min(15).max(90).optional(),
  maxTopics: z.number().int().min(2).max(6).optional(),
  focusGroupId: z.string().optional(),
  preferredMode: z
    .enum(['RECOVERY', 'REBUILD', 'STRENGTHEN', 'RETRIEVE', 'MAINTAIN_CHALLENGE'])
    .optional(),
});

export const recordOutcomeSchema = z.object({
  sessionId: z.string().min(1, 'sessionId is required'),
  topicId: z.string().min(1, 'topicId is required'),
  isCorrect: z.boolean(),
  score: z.number().min(0).max(100),
  timeSpentSeconds: z.number().min(0),
  hintCount: z.number().int().min(0).optional(),
  confidenceSelfReport: z.number().min(0).max(5).optional(),
});
