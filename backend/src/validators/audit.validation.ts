import { z } from 'zod';

export const auditLogQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  action: z.string().trim().min(1).optional(),
  entityType: z.string().trim().min(1).optional(),
  entityId: z.string().trim().min(1).optional(),
  userId: z.string().uuid('Invalid user UUID format').optional(),
  startDate: z
    .string()
    .datetime({ message: 'startDate must be a valid ISO 8601 datetime' })
    .optional(),
  endDate: z.string().datetime({ message: 'endDate must be a valid ISO 8601 datetime' }).optional(),
});

export const auditLogIdParamSchema = z.object({
  id: z.string().uuid('Invalid audit log ID format'),
});

export type AuditLogQueryInput = z.infer<typeof auditLogQuerySchema>;
export type AuditLogIdParamInput = z.infer<typeof auditLogIdParamSchema>;
