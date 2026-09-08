import { Router } from 'express';
import { Role } from '@prisma/client';
import { AuditController } from '../controllers/audit.controller';
import { validate } from '../validators/validate.middleware';
import { authenticate, requireRole, requirePermission, Permissions } from '../auth/auth.middleware';
import { auditLogQuerySchema, auditLogIdParamSchema } from '../validators/audit.validation';
import { asyncHandler } from '../errors/async.handler';

const router = Router();
const auditController = new AuditController();

// Administrative security: All audit routes require authentication and Admin/SuperAdmin role
router.use(authenticate);
router.use(requireRole([Role.ADMIN, Role.SUPER_ADMIN]));

/**
 * GET /admin/audit-logs
 * List and filter platform audit logs with pagination and tenant isolation
 */
router.get(
  '/',
  requirePermission(Permissions.USER_READ),
  validate({ query: auditLogQuerySchema }),
  asyncHandler(auditController.getAuditLogs),
);

/**
 * GET /admin/audit-logs/:id
 * Retrieve a single audit log entry by ID
 */
router.get(
  '/:id',
  requirePermission(Permissions.USER_READ),
  validate({ params: auditLogIdParamSchema }),
  asyncHandler(auditController.getAuditLogById),
);

export default router;
export { router as auditRouter };
