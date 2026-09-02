import { z } from 'zod';
import { Role, UserStatus } from '@prisma/client';

export const createUserSchema = z.object({
  organizationId: z.string().uuid('Invalid organization identifier'),
  departmentId: z.string().uuid('Invalid department identifier').optional(),
  email: z.string({ required_error: 'Email is required' }).email('Invalid email address format'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  firstName: z.string().min(1, 'First name cannot be empty'),
  lastName: z.string().min(1, 'Last name cannot be empty').optional(),
  phone: z.string().optional(),
  role: z.nativeEnum(Role).default(Role.TRAINEE).optional(),
  status: z.nativeEnum(UserStatus).default(UserStatus.PENDING).optional(),
});

export const updateUserSchema = z.object({
  departmentId: z.string().uuid('Invalid department identifier').optional(),
  email: z.string().email('Invalid email address format').optional(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
    .optional(),
  firstName: z.string().min(1, 'First name cannot be empty').optional(),
  lastName: z.string().min(1, 'Last name cannot be empty').optional(),
  phone: z.string().optional(),
  avatarUrl: z.string().url('Invalid avatar URL').optional(),
  role: z.nativeEnum(Role).optional(),
  status: z.nativeEnum(UserStatus).optional(),
  emailVerified: z.boolean().optional(),
});

export const userIdParamSchema = z.object({
  id: z.string().uuid('Invalid user identifier. Must be a valid UUID v4'),
});
