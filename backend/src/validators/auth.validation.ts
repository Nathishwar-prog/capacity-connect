import { z } from 'zod';
import { Role } from '@prisma/client';

export const registerSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email address format')
    .toLowerCase()
    .trim(),
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  firstName: z
    .string({ required_error: 'First name is required' })
    .min(1, 'First name cannot be empty')
    .trim(),
  lastName: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  organizationId: z.string().uuid('Invalid organization identifier').optional(),
  departmentId: z.string().uuid('Invalid department identifier').optional(),
  role: z
    .enum([Role.TRAINEE, Role.TRAINER], {
      errorMap: () => ({ message: 'Registration is only permitted for TRAINEE and TRAINER roles' }),
    })
    .default(Role.TRAINEE)
    .optional(),
});

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email address format')
    .toLowerCase()
    .trim(),
  password: z.string({ required_error: 'Password is required' }).min(1, 'Password cannot be empty'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().optional(),
});
