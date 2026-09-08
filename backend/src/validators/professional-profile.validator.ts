import { z } from 'zod';

export const updateBasicInfoSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().max(50).optional().nullable(),
  phone: z
    .string()
    .regex(/^[0-9+ -]{7,20}$/, 'Invalid phone number format')
    .optional()
    .nullable(),
  avatarUrl: z.string().url('Invalid avatar URL').optional().nullable(),
  designation: z.string().max(100).optional().nullable(),
  bio: z.string().max(1000).optional().nullable(),
  age: z.number().int().min(18).max(75).optional().nullable(),
  location: z.string().max(100).optional().nullable(),
  moesEmployeeId: z.string().max(50).optional().nullable(),
  imdEmployeeId: z.string().max(50).optional().nullable(),
});

export const qualificationSchema = z.object({
  degree: z.string().min(1, 'Degree or qualification is required').max(100),
  fieldOfStudy: z.string().min(1, 'Field of study or specialization is required').max(100),
  institution: z.string().min(1, 'Institution is required').max(150),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  description: z.string().max(500).optional().nullable(),
});

export const workExperienceSchema = z
  .object({
    companyName: z.string().min(1, 'Organization or company name is required').max(150),
    jobTitle: z.string().min(1, 'Designation or job title is required').max(100),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().optional().nullable(),
    isCurrent: z.boolean().default(false),
    description: z.string().max(1000).optional().nullable(),
  })
  .refine(
    (data) => {
      if (!data.isCurrent && !data.endDate) {
        return false;
      }
      return true;
    },
    {
      message: 'End date is required for completed positions',
      path: ['endDate'],
    },
  );

export const updateSkillsSchema = z.object({
  skills: z
    .array(z.string().min(1).max(50))
    .max(50, 'Cannot add more than 50 skills'),
});

export const updateInterestsSchema = z.object({
  interests: z
    .array(z.string().min(1).max(50))
    .max(30, 'Cannot add more than 30 interests'),
});
