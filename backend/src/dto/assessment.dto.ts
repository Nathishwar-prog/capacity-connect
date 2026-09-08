import { z } from 'zod';
import { AssessmentType, AssessmentStatus, QuestionType } from '@prisma/client';

// ==========================================
// Assessment Management DTOs
// ==========================================

export const CreateAssessmentSchema = z.object({
    courseId: z.string().uuid().optional().nullable(),
    title: z.string().min(3, 'Title must be at least 3 characters long').max(200, 'Title cannot exceed 200 characters'),
    description: z.string().max(2000, 'Description cannot exceed 2000 characters').optional().nullable(),
    subject: z.string().min(2, 'Subject must be at least 2 characters long').max(100, 'Subject cannot exceed 100 characters'),
    assessmentType: z.nativeEnum(AssessmentType).default(AssessmentType.MCQ),
    durationMinutes: z.number().int().min(1, 'Duration must be at least 1 minute').max(600, 'Duration cannot exceed 600 minutes').optional().nullable(),
    passingScore: z.number().min(0, 'Passing score must be at least 0').max(100, 'Passing score cannot exceed 100').default(60.0),
    startAt: z.string().datetime().optional().nullable(),
    deadline: z.string().datetime().optional().nullable(),
    status: z.nativeEnum(AssessmentStatus).default(AssessmentStatus.DRAFT),
});

export const UpdateAssessmentSchema = CreateAssessmentSchema.partial();

export const AssessmentQuerySchema = z.object({
    courseId: z.string().uuid().optional(),
    status: z.nativeEnum(AssessmentStatus).optional(),
    search: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
});

// ==========================================
// Question & Option DTOs
// ==========================================

export const QuestionOptionInputSchema = z.object({
    optionText: z.string().min(1, 'Option text cannot be empty').max(500, 'Option text cannot exceed 500 characters'),
    isCorrect: z.boolean().default(false),
    orderIndex: z.number().int().min(0).optional(),
});

export const CreateQuestionSchema = z.object({
    questionText: z.string().min(3, 'Question text must be at least 3 characters').max(2000, 'Question text cannot exceed 2000 characters'),
    questionType: z.nativeEnum(QuestionType).default(QuestionType.SINGLE_CHOICE),
    marks: z.number().min(0.5, 'Marks must be at least 0.5').max(100, 'Marks cannot exceed 100').default(1.0),
    orderIndex: z.number().int().min(0).optional(),
    explanation: z.string().max(2000).optional().nullable(),
    options: z.array(QuestionOptionInputSchema).min(2, 'At least 2 options are required for an MCQ question'),
}).refine((data) => {
    const correctCount = data.options.filter((o) => o.isCorrect).length;
    return correctCount >= 1;
}, {
    message: 'Question must have at least one correct option',
    path: ['options'],
});

export const UpdateQuestionSchema = z.object({
    questionText: z.string().min(3).max(2000).optional(),
    marks: z.number().min(0.5).max(100).optional(),
    orderIndex: z.number().int().min(0).optional(),
    explanation: z.string().max(2000).optional().nullable(),
    options: z.array(QuestionOptionInputSchema).min(2).optional(),
});

// ==========================================
// Trainee Attempt & Submission DTOs
// ==========================================

export const SingleAnswerSubmissionSchema = z.object({
    questionId: z.string().uuid(),
    selectedOptionId: z.string().uuid().nullable().optional(),
});

export const SubmitAnswersSchema = z.object({
    answers: z.array(SingleAnswerSubmissionSchema).min(1, 'At least one answer entry is required'),
});

// Exported TypeScript Types
export type CreateAssessmentInput = z.infer<typeof CreateAssessmentSchema>;
export type UpdateAssessmentInput = z.infer<typeof UpdateAssessmentSchema>;
export type AssessmentQueryInput = z.infer<typeof AssessmentQuerySchema>;
export type CreateQuestionInput = z.infer<typeof CreateQuestionSchema>;
export type UpdateQuestionInput = z.infer<typeof UpdateQuestionSchema>;
export type SubmitAnswersInput = z.infer<typeof SubmitAnswersSchema>;
