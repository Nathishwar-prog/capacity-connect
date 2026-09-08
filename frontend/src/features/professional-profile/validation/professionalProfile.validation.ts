import { z } from 'zod';

export const basicInfoFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().max(50).optional().nullable(),
  email: z.string().email('Invalid email address'),
  phone: z
    .string()
    .regex(/^[0-9+ -]{7,20}$/, 'Invalid phone number format')
    .optional()
    .nullable(),
  avatarUrl: z.string().url('Invalid avatar URL').optional().nullable(),
  age: z
    .number({ invalid_type_error: 'Age must be a number' })
    .int()
    .min(18, 'Age must be at least 18')
    .max(75, 'Age must be under 75')
    .optional()
    .nullable(),
  location: z.string().max(100).optional().nullable(),
  moesEmployeeId: z.string().max(50).optional().nullable(),
  imdEmployeeId: z.string().max(50).optional().nullable(),
  designation: z.string().max(100).optional().nullable(),
  departmentName: z.string().max(150).optional().nullable(),
  organizationName: z.string().max(150).optional().nullable(),
  bio: z.string().max(1000).optional().nullable(),
});

export type BasicInfoFormValues = z.infer<typeof basicInfoFormSchema>;

export const qualificationFormSchema = z.object({
  degree: z.string().min(1, 'Degree or qualification is required').max(100),
  fieldOfStudy: z.string().min(1, 'Field of study or specialization is required').max(100),
  institution: z.string().min(1, 'University or institution is required').max(150),
  startDate: z.string().optional().nullable(),
  endDate: z.string().min(1, 'Completion year or end date is required'),
  description: z.string().max(500).optional().nullable(),
});

export type QualificationFormValues = z.infer<typeof qualificationFormSchema>;

export const experienceFormSchema = z
  .object({
    companyName: z.string().min(1, 'Organization or center is required').max(150),
    jobTitle: z.string().min(1, 'Designation or role is required').max(100),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().optional().nullable(),
    isCurrent: z.boolean(),
    description: z.string().max(1000).optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (!data.isCurrent && !data.endDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'End date is required for past roles',
        path: ['endDate'],
      });
    }
  });

export type ExperienceFormValues = z.infer<typeof experienceFormSchema>;
