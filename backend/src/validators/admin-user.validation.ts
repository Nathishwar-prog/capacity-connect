import { z } from 'zod';
import { Role, UserStatus } from '@prisma/client';

export const adminUserQuerySchema = z.object({
  search: z.string().trim().optional(),
  role: z
    .nativeEnum(Role, {
      errorMap: () => ({
        message: 'Invalid role filter. Allowed values: TRAINEE, TRAINER, ADMIN, SUPER_ADMIN',
      }),
    })
    .optional(),
  status: z
    .nativeEnum(UserStatus, {
      errorMap: () => ({
        message:
          'Invalid status filter. Allowed values: PENDING, APPROVED, REJECTED, SUSPENDED, DEACTIVATED',
      }),
    })
    .optional(),
  department: z.string().trim().optional(),
  departmentId: z.string().uuid('Invalid department ID format').optional(),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().int().positive('Page must be a positive integer')),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .pipe(z.number().int().positive().max(100, 'Limit cannot exceed 100')),
});

export const adminUserIdParamSchema = z.object({
  id: z.string().uuid('Invalid user ID. Must be a valid UUID v4'),
});

export const adminUserStatusUpdateSchema = z.object({
  status: z.nativeEnum(UserStatus, {
    errorMap: () => ({
      message:
        'Invalid status. Allowed values: PENDING, APPROVED, REJECTED, SUSPENDED, DEACTIVATED',
    }),
  }),
});

export const adminUserRoleUpdateSchema = z.object({
  role: z.nativeEnum(Role, {
    errorMap: () => ({ message: 'Invalid role. Allowed values: TRAINEE, TRAINER, ADMIN' }),
  }),
});
