import { Router } from 'express';
import { Role } from '@prisma/client';
import { SettingsController } from '../controllers/settings.controller';
import { authenticate, requireRole } from '../auth/auth.middleware';
import { validate } from '../validators/validate.middleware';
import { asyncHandler } from '../errors/async.handler';
import {
  updatePortalSettingsSchema,
  updateLearningSettingsSchema,
  updateNotificationSettingsSchema,
  updateAiSettingsSchema,
  updateSecuritySettingsSchema,
  updateLocalizationSettingsSchema,
  testConnectionSchema,
} from '../validators/settings.validation';

const router = Router();
const controller = new SettingsController();

/**
 * Public Endpoint:
 * GET /api/v1/settings/public or /api/v1/admin/settings/public
 * Accessible by unauthenticated guests, trainees, and trainers
 */
router.get('/public', asyncHandler(controller.getPublicSettings));

// All administrative settings mutations require strict authentication and ADMIN or SUPER_ADMIN role
router.use(authenticate);
router.use(requireRole([Role.ADMIN, Role.SUPER_ADMIN]));

/**
 * GET /api/v1/admin/settings
 * Comprehensive settings payload
 */
router.get('/', asyncHandler(controller.getSettings));

/**
 * PATCH /api/v1/admin/settings/portal
 */
router.patch(
  '/portal',
  validate({ body: updatePortalSettingsSchema }),
  asyncHandler(controller.updatePortalSettings)
);

/**
 * PATCH /api/v1/admin/settings/learning
 */
router.patch(
  '/learning',
  validate({ body: updateLearningSettingsSchema }),
  asyncHandler(controller.updateLearningSettings)
);

/**
 * PATCH /api/v1/admin/settings/notifications
 */
router.patch(
  '/notifications',
  validate({ body: updateNotificationSettingsSchema }),
  asyncHandler(controller.updateNotificationSettings)
);

/**
 * PATCH /api/v1/admin/settings/ai
 */
router.patch(
  '/ai',
  validate({ body: updateAiSettingsSchema }),
  asyncHandler(controller.updateAiSettings)
);

/**
 * PATCH /api/v1/admin/settings/security
 */
router.patch(
  '/security',
  validate({ body: updateSecuritySettingsSchema }),
  asyncHandler(controller.updateSecuritySettings)
);

/**
 * PATCH /api/v1/admin/settings/localization
 */
router.patch(
  '/localization',
  validate({ body: updateLocalizationSettingsSchema }),
  asyncHandler(controller.updateLocalizationSettings)
);

/**
 * GET /api/v1/admin/settings/system/health
 */
router.get('/system/health', asyncHandler(controller.getHealthStatus));

/**
 * POST /api/v1/admin/settings/test-connection
 */
router.post(
  '/test-connection',
  validate({ body: testConnectionSchema }),
  asyncHandler(controller.testConnection)
);

/**
 * POST /api/v1/admin/settings/cache/clear
 */
router.post('/cache/clear', asyncHandler(controller.clearCache));

/**
 * GET /api/v1/admin/settings/audit-logs
 */
router.get('/audit-logs', asyncHandler(controller.getSettingsAuditLogs));

export default router;
export { router as settingsRouter };
