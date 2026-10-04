import { Router } from 'express';
import { Role } from '@prisma/client';
import { AdminUserController } from '../controllers/admin-user.controller';
import { AdminUserService } from '../services/admin-user.service';
import { UserRepository } from '../repositories/user.repository';
import { validate } from '../validators/validate.middleware';
import { authenticate, requireRole, requirePermission, Permissions } from '../auth/auth.middleware';
import {
  adminUserQuerySchema,
  adminUserIdParamSchema,
  adminUserStatusUpdateSchema,
  adminUserRoleUpdateSchema,
} from '../validators/admin-user.validation';
import { asyncHandler } from '../errors/async.handler';

import { AnnouncementController } from '../controllers/announcement.controller';
import { createAnnouncementSchema } from '../validators/announcement.validation';

const router = Router();

const userRepository = new UserRepository();
const adminUserService = new AdminUserService(userRepository);
const adminUserController = new AdminUserController(adminUserService);
const announcementController = new AnnouncementController();

// All Admin User Management routes require authentication and administrative role
router.use(authenticate);
router.use(requireRole([Role.ADMIN, Role.SUPER_ADMIN]));

/**
 * GET /admin/users
 * Directory search, filter (role, status, department), and database-level pagination
 */
router.get(
  '/users',
  requirePermission(Permissions.USER_READ),
  validate({ query: adminUserQuerySchema }),
  asyncHandler(adminUserController.getUsers),
);

/**
 * GET /admin/users/pending
 * Retrieve pending users awaiting administrative verification and approval
 */
router.get(
  '/users/pending',
  requirePermission(Permissions.USER_READ),
  validate({ query: adminUserQuerySchema }),
  asyncHandler(adminUserController.getPendingUsers),
);

/**
 * GET /admin/users/:id
 * Retrieve safe administrative user details by ID
 */
router.get(
  '/users/:id',
  requirePermission(Permissions.USER_READ),
  validate({ params: adminUserIdParamSchema }),
  asyncHandler(adminUserController.getUserById),
);

/**
 * PATCH /admin/users/:id/approve
 * Approve pending user registration
 */
router.patch(
  '/users/:id/approve',
  requirePermission(Permissions.USER_APPROVE),
  validate({ params: adminUserIdParamSchema }),
  asyncHandler(adminUserController.approveUser),
);

/**
 * PATCH /admin/users/:id/reject
 * Reject user registration and invalidate active tokens
 */
router.patch(
  '/users/:id/reject',
  requirePermission(Permissions.USER_REJECT),
  validate({ params: adminUserIdParamSchema }),
  asyncHandler(adminUserController.rejectUser),
);

/**
 * PATCH /admin/users/:id/status
 * Update user status (PENDING, APPROVED, REJECTED, SUSPENDED, DEACTIVATED)
 */
router.patch(
  '/users/:id/status',
  requirePermission(Permissions.USER_APPROVE),
  validate({
    params: adminUserIdParamSchema,
    body: adminUserStatusUpdateSchema,
  }),
  asyncHandler(adminUserController.updateStatus),
);

/**
 * PATCH /admin/users/:id/role
 * Update user role (TRAINEE, TRAINER, ADMIN) and invalidate active tokens
 */
router.patch(
  '/users/:id/role',
  requirePermission(Permissions.USER_ROLE_UPDATE),
  validate({
    params: adminUserIdParamSchema,
    body: adminUserRoleUpdateSchema,
  }),
  asyncHandler(adminUserController.updateRole),
);

/**
 * POST /admin/announcements
 * Create and dispatch announcement to targeted audience (ALL, TRAINEES, TRAINERS)
 */
router.post(
  '/announcements',
  validate({ body: createAnnouncementSchema }),
  asyncHandler(announcementController.createAnnouncement),
);

/**
 * GET /admin/announcements
 * List historical announcements
 */
router.get('/announcements', asyncHandler(announcementController.getAnnouncements));

/**
 * GET /admin/announcements/:id
 * Retrieve announcement by ID
 */
router.get('/announcements/:id', asyncHandler(announcementController.getAnnouncementById));

/**
 * Administrative Audit Log Sub-Router
 * GET /admin/audit-logs
 * GET /admin/audit-logs/:id
 */
import { auditRouter } from './audit.routes';
router.use('/audit-logs', auditRouter);

/**
 * Capacity Building Sub-Router
 * /admin/capacity-building/overview
 * /admin/capacity-building/trainees
 * /admin/capacity-building/trainers
 * /admin/capacity-building/resources
 */
import { adminCapacityBuildingRouter } from './admin-capacity-building.routes';
router.use('/capacity-building', adminCapacityBuildingRouter);

/**
 * Platform Executive Analytics & AI Query Sub-Router
 * /admin/analytics/dashboard
 * /admin/analytics/ai/query
 * /admin/analytics/export
 */
import { adminAnalyticsRouter } from './admin-analytics.routes';
router.use('/analytics', adminAnalyticsRouter);

export default router;
export { router as adminRouter };
