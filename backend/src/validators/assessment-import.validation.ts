import { z } from 'zod';
import { AssessmentType } from '@prisma/client';

// ==============================================================================
// 1. QUESTION OPTION SCHEMA
// ==============================================================================

export const ImportOptionSchema = z.object({
  id: z.string().min(1, 'Option identifier (e.g. "A", "B") cannot be empty').trim(),
  text: z.string().min(1, 'Option text cannot be empty').trim(),
});

export type ImportOption = z.infer<typeof ImportOptionSchema>;

// ==============================================================================
// 2. EXPLANATION VALIDATOR
// ==============================================================================

const PLACEHOLDER_EXPLANATION_REGEX = /^(n\/?a|todo|tbd|none|null|nil|undefined|fixme|pending|placeholder|test|na|\s*)$/i;

export const ExplanationSchema = z
  .string({
    required_error: 'Explanation is required for every question',
    invalid_type_error: 'Explanation must be a text string',
  })
  .min(5, 'Explanation must be at least 5 characters long and provide context')
  .max(3000, 'Explanation cannot exceed 3000 characters')
  .refine(
    (val) => !PLACEHOLDER_EXPLANATION_REGEX.test(val.trim()),
    {
      message: 'Explanation cannot be empty or contain placeholder text (e.g., TODO, N/A, TBD)',
    },
  );

// ==============================================================================
// 3. QUESTION SCHEMAS (DISCRIMINATED UNION)
// ==============================================================================

export const SingleChoiceQuestionSchema = z.object({
  externalId: z.string().optional(),
  questionType: z.literal('SINGLE_CHOICE'),
  question: z.string().min(3, 'Question prompt must be at least 3 characters').trim(),
  options: z.array(ImportOptionSchema).min(2, 'Single choice question must contain at least 2 options'),
  correctAnswer: z.object({
    type: z.literal('OPTION'),
    value: z.string().min(1, 'Correct answer must reference an option ID'),
  }),
  explanation: ExplanationSchema,
  points: z.number().min(0.5, 'Points must be at least 0.5').max(100, 'Points cannot exceed 100').default(1.0),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD', 'EXPERT']).optional().default('MEDIUM'),
  tags: z.array(z.string()).optional().default([]),
  competencies: z.array(z.string()).optional().default([]),
});

export const MultipleChoiceQuestionSchema = z.object({
  externalId: z.string().optional(),
  questionType: z.literal('MULTIPLE_CHOICE'),
  question: z.string().min(3, 'Question prompt must be at least 3 characters').trim(),
  options: z.array(ImportOptionSchema).min(2, 'Multiple choice question must contain at least 2 options'),
  correctAnswer: z.object({
    type: z.literal('OPTIONS'),
    value: z.array(z.string().min(1)).min(1, 'Multiple choice question must have at least 1 correct option'),
  }),
  explanation: ExplanationSchema,
  points: z.number().min(0.5, 'Points must be at least 0.5').max(100, 'Points cannot exceed 100').default(1.0),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD', 'EXPERT']).optional().default('MEDIUM'),
  tags: z.array(z.string()).optional().default([]),
  competencies: z.array(z.string()).optional().default([]),
});

export const TrueFalseQuestionSchema = z.object({
  externalId: z.string().optional(),
  questionType: z.literal('TRUE_FALSE'),
  question: z.string().min(3, 'Question prompt must be at least 3 characters').trim(),
  options: z.array(ImportOptionSchema).optional(),
  correctAnswer: z.object({
    type: z.literal('BOOLEAN'),
    value: z.boolean({
      invalid_type_error: 'True/False correct answer must be boolean true or false',
    }),
  }),
  explanation: ExplanationSchema,
  points: z.number().min(0.5, 'Points must be at least 0.5').max(100, 'Points cannot exceed 100').default(1.0),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD', 'EXPERT']).optional().default('EASY'),
  tags: z.array(z.string()).optional().default([]),
  competencies: z.array(z.string()).optional().default([]),
});

export const GenericImportQuestionSchema = z.discriminatedUnion('questionType', [
  SingleChoiceQuestionSchema,
  MultipleChoiceQuestionSchema,
  TrueFalseQuestionSchema,
]);

export type ImportQuestionInput = z.infer<typeof GenericImportQuestionSchema>;

// ==============================================================================
// 4. COURSE / MODULE / LESSON HIERARCHY MAPPING SCHEMA
// ==============================================================================

export const HierarchyMappingCourseSchema = z.object({
  courseId: z.string().uuid('Course ID must be a valid UUID').optional(),
  courseTitle: z.string().optional(),
});

export const HierarchyMappingModuleSchema = z.object({
  moduleId: z.string().uuid('Module ID must be a valid UUID').optional(),
  moduleTitle: z.string().optional(),
});

export const HierarchyMappingLessonSchema = z.object({
  lessonId: z.string().uuid('Lesson ID must be a valid UUID').optional(),
  lessonTitle: z.string().optional(),
});

export const HierarchyMappingOverrideSchema = z.object({
  placementType: z.enum(['COURSE', 'MODULE', 'LESSON', 'STANDALONE']).optional(),
  courseId: z.string().uuid('Course ID must be a valid UUID').nullable().optional(),
  moduleId: z.string().uuid('Module ID must be a valid UUID').nullable().optional(),
  lessonId: z.string().uuid('Lesson ID must be a valid UUID').nullable().optional(),
});

export type HierarchyMappingOverride = z.infer<typeof HierarchyMappingOverrideSchema>;


// ==============================================================================
// 5. TOP-LEVEL ASSESSMENT METADATA SCHEMA
// ==============================================================================

export const AssessmentMetadataSchema = z.object({
  title: z
    .string({ required_error: 'Assessment title is required' })
    .min(3, 'Assessment title must be at least 3 characters')
    .max(200, 'Assessment title cannot exceed 200 characters')
    .trim(),
  description: z.string().max(2000, 'Description cannot exceed 2000 characters').optional().nullable(),
  instructions: z.string().max(2000, 'Instructions cannot exceed 2000 characters').optional().nullable(),
  durationMinutes: z
    .number()
    .int('Duration must be a whole number of minutes')
    .min(1, 'Duration must be at least 1 minute')
    .max(600, 'Duration cannot exceed 600 minutes (10 hours)')
    .optional()
    .nullable(),
  passingPercentage: z
    .number({ required_error: 'Passing percentage is required' })
    .min(0, 'Passing percentage must be at least 0%')
    .max(100, 'Passing percentage cannot exceed 100%')
    .default(70),
  attemptsAllowed: z.number().int().min(1, 'Attempts allowed must be at least 1').optional().default(1),
  shuffleQuestions: z.boolean().optional().default(false),
  shuffleOptions: z.boolean().optional().default(false),
  subject: z.string().max(100).optional().nullable(),
  assessmentType: z.nativeEnum(AssessmentType).optional().default(AssessmentType.MCQ),

  course: HierarchyMappingCourseSchema.optional().nullable(),
  module: HierarchyMappingModuleSchema.optional().nullable(),
  lesson: HierarchyMappingLessonSchema.optional().nullable(),

  questions: z.array(z.any()).min(1, 'Assessment must contain at least 1 question'),
});

// ==============================================================================
// 6. ROOT JSON PAYLOAD SCHEMA (VERSION 1.0)
// ==============================================================================

export const AssessmentImportPayloadSchema = z.object({
  schemaVersion: z.literal('1.0', {
    errorMap: () => ({ message: 'Unsupported schema version. Must be "1.0"' }),
  }),
  assessment: AssessmentMetadataSchema,
});

export type AssessmentImportPayload = z.infer<typeof AssessmentImportPayloadSchema>;

// ==============================================================================
// 7. STRUCTURED VALIDATION OUTPUT INTERFACES
// ==============================================================================

export interface AssessmentValidationIssue {
  questionIndex?: number;
  path: string;
  code: string;
  message: string;
  severity: 'ERROR' | 'WARNING';
}

export interface NormalizedImportQuestion {
  externalId?: string;
  questionType: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE';
  question: string;
  options: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
  }>;
  explanation: string;
  points: number;
  difficulty: string;
  tags: string[];
  competencies: string[];
}

export interface AssessmentValidationResult {
  valid: boolean;
  summary: {
    totalQuestions: number;
    validQuestions: number;
    invalidQuestions: number;
    warningsCount: number;
    errorsCount: number;
    questionTypes: Record<string, number>;
    totalPoints: number;
    durationMinutes: number | null;
    passingPercentage: number;
  };
  assessmentData: {
    title: string;
    description: string | null;
    instructions: string | null;
    durationMinutes: number | null;
    passingPercentage: number;
    subject: string;
    placementType?: 'COURSE' | 'MODULE' | 'LESSON' | 'STANDALONE';
    courseId: string | null;
    courseTitle: string | null;
    moduleId: string | null;
    moduleTitle: string | null;
    lessonId: string | null;
    lessonTitle: string | null;
    questions: NormalizedImportQuestion[];
  };
  errors: AssessmentValidationIssue[];
  warnings: AssessmentValidationIssue[];
}

