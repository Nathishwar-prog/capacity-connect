import { z } from 'zod';

export const updateTraineeProfileSchema = z.object({
  firstName: z.string().min(1, 'First name cannot be empty').optional(),
  lastName: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  avatarUrl: z.string().url('Invalid avatar URL').optional().nullable(),
  departmentId: z.string().uuid('Invalid department identifier').optional().nullable(),
  designation: z.string().min(2, 'Designation must be at least 2 characters').optional().nullable(),
  bio: z.string().optional().nullable(),
  interests: z.array(z.string().min(1)).optional(),
});

export const createQualificationSchema = z.object({
  degree: z.string().min(1, 'Degree title is required'),
  fieldOfStudy: z.string().min(1, 'Field of study is required'),
  institution: z.string().min(1, 'Institution name is required'),
  startDate: z
    .string()
    .datetime({ offset: true })
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'Invalid date format (YYYY-MM-DD)')),
  endDate: z
    .string()
    .datetime({ offset: true })
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'Invalid date format (YYYY-MM-DD)'))
    .optional()
    .nullable(),
  description: z.string().optional().nullable(),
});

export const updateQualificationSchema = createQualificationSchema.partial();

export const qualificationIdParamSchema = z.object({
  id: z.string().uuid('Invalid qualification identifier'),
});

export const createWorkExperienceSchema = z.object({
  companyName: z.string().min(1, 'Company or organization name is required'),
  jobTitle: z.string().min(1, 'Job title or role is required'),
  startDate: z
    .string()
    .datetime({ offset: true })
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'Invalid date format (YYYY-MM-DD)')),
  endDate: z
    .string()
    .datetime({ offset: true })
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'Invalid date format (YYYY-MM-DD)'))
    .optional()
    .nullable(),
  isCurrent: z.boolean().default(false).optional(),
  description: z.string().optional().nullable(),
});

export const updateWorkExperienceSchema = createWorkExperienceSchema.partial();

export const experienceIdParamSchema = z.object({
  id: z.string().uuid('Invalid experience identifier'),
});

export const addUserSkillSchema = z
  .object({
    skillId: z.string().uuid('Invalid skill identifier').optional(),
    skillName: z.string().min(2, 'Skill name must be at least 2 characters').optional(),
    proficiencyLevel: z.number().int().min(1).max(5).default(1),
    yearsExperience: z.number().int().min(0).max(60).optional().nullable(),
  })
  .refine((data) => data.skillId || data.skillName, {
    message: 'Either skillId or skillName must be provided',
    path: ['skillId'],
  });

export const skillIdParamSchema = z.object({
  skillId: z.string().uuid('Invalid skill identifier'),
});

export const createCertificateSchema = z.object({
  title: z.string().min(1, 'Certificate title is required'),
  issuingOrganization: z.string().min(1, 'Issuing organization is required'),
  credentialId: z.string().optional().nullable(),
  issueDate: z
    .string()
    .datetime({ offset: true })
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'Invalid date format (YYYY-MM-DD)')),
  expiryDate: z
    .string()
    .datetime({ offset: true })
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'Invalid date format (YYYY-MM-DD)'))
    .optional()
    .nullable(),
  certificateUrl: z.string().url('Invalid certificate URL').optional().nullable(),
});

export const certificateIdParamSchema = z.object({
  id: z.string().uuid('Invalid certificate identifier'),
});

export const availableSkillsQuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  skip: z.coerce.number().int().min(0).default(0).optional(),
  take: z.coerce.number().int().min(1).max(100).default(50).optional(),
});
