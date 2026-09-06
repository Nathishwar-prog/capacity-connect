import { z } from 'zod';
import { CourseDifficulty, LessonContentType, AssessmentType, QuestionType } from '@prisma/client';

export const updateTrainerProfileSchema = z.object({
  designation: z.string().min(2, 'Designation must be at least 2 characters long').optional(),
  organizationName: z.string().optional(),
  bio: z.string().min(10, 'Bio must be at least 10 characters long').optional(),
  yearsExperience: z.number().int().min(0).max(60).optional(),
});

export const addTrainerExpertiseSchema = z.object({
  skillId: z.string().uuid('Invalid skill identifier'),
  proficiencyLevel: z.number().int().min(1).max(5),
  yearsExperience: z.number().int().min(0).max(60).optional(),
});

export const createCourseSchema = z.object({
  title: z.string().min(3, 'Course title must be at least 3 characters long'),
  slug: z
    .string()
    .min(3)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens')
    .optional(),
  description: z.string().min(10, 'Course description must be at least 10 characters long'),
  category: z.string().min(2, 'Category is required'),
  difficulty: z.nativeEnum(CourseDifficulty).default(CourseDifficulty.BEGINNER),
  durationMinutes: z.number().int().min(1).default(60),
  thumbnailUrl: z.string().url('Invalid thumbnail URL').optional().nullable(),
});

export const updateCourseSchema = createCourseSchema.partial();

export const courseIdParamSchema = z.object({
  courseId: z.string().uuid('Invalid course identifier'),
});

export const createModuleSchema = z.object({
  title: z.string().min(2, 'Module title is required'),
  description: z.string().optional().nullable(),
  orderIndex: z.number().int().min(1).default(1),
});

export const updateModuleSchema = createModuleSchema.partial();

export const moduleIdParamSchema = z.object({
  courseId: z.string().uuid('Invalid course identifier'),
  moduleId: z.string().uuid('Invalid module identifier'),
});

export const createLessonSchema = z.object({
  title: z.string().min(2, 'Lesson title is required'),
  description: z.string().optional().nullable(),
  contentType: z.nativeEnum(LessonContentType).default(LessonContentType.ARTICLE),
  content: z.string().optional().nullable(),
  resourceUrl: z.string().url().optional().nullable(),
  durationMinutes: z.number().int().min(1).default(15),
  orderIndex: z.number().int().min(1).default(1),
  isPreview: z.boolean().default(false),
});

export const updateLessonSchema = createLessonSchema.partial();

export const lessonIdParamSchema = z.object({
  courseId: z.string().uuid('Invalid course identifier'),
  moduleId: z.string().uuid('Invalid module identifier'),
  lessonId: z.string().uuid('Invalid lesson identifier'),
});

export const reorderCourseSchema = z.object({
  modules: z.array(
    z.object({
      id: z.string().uuid(),
      orderIndex: z.number().int(),
      lessons: z
        .array(
          z.object({
            id: z.string().uuid(),
            orderIndex: z.number().int(),
          }),
        )
        .optional(),
    }),
  ),
});

export const mapCompetencySchema = z.object({
  competencyId: z.string().uuid('Invalid competency identifier'),
  targetLevel: z.number().int().min(1).max(5).default(1),
});

export const prerequisiteSchema = z.object({
  prerequisiteCourseId: z.string().uuid('Invalid prerequisite course identifier'),
});

export const traineeQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).default(10).optional(),
  search: z.string().optional(),
  courseId: z.string().uuid().optional(),
  status: z.string().optional(),
  progressMin: z.coerce.number().min(0).max(100).optional(),
  progressMax: z.coerce.number().min(0).max(100).optional(),
  sort: z.enum(['name', 'progress', 'enrolledAt', 'lastActivity']).default('enrolledAt').optional(),
  order: z.enum(['asc', 'desc']).default('desc').optional(),
});

export const traineeIdParamSchema = z.object({
  traineeId: z.string().uuid('Invalid trainee identifier'),
});

export const createAssessmentSchema = z.object({
  courseId: z.string().uuid('Invalid course identifier').optional().nullable(),
  title: z.string().min(3, 'Assessment title is required'),
  description: z.string().optional().nullable(),
  subject: z.string().min(2, 'Subject is required'),
  assessmentType: z.nativeEnum(AssessmentType).default(AssessmentType.MCQ),
  durationMinutes: z.number().int().min(5).max(300).default(45),
  passingScore: z.number().min(0).max(100).default(70.0),
  questions: z
    .array(
      z.object({
        questionText: z.string().min(5, 'Question text must be at least 5 characters'),
        questionType: z.nativeEnum(QuestionType).default(QuestionType.SINGLE_CHOICE),
        marks: z.number().min(0.5).default(1.0),
        orderIndex: z.number().int().default(1),
        explanation: z.string().optional().nullable(),
        options: z
          .array(
            z.object({
              optionText: z.string().min(1, 'Option text is required'),
              isCorrect: z.boolean().default(false),
              orderIndex: z.number().int().default(1),
            }),
          )
          .min(2, 'Each question must have at least 2 options'),
      }),
    )
    .min(1, 'Assessment must contain at least 1 question'),
});

export const assessmentIdParamSchema = z.object({
  assessmentId: z.string().uuid('Invalid assessment identifier'),
});
