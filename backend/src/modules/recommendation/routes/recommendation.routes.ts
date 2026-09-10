/**
 * Recommendation Routes
 * 
 * Express Router mounting all recommendation engine endpoints.
 */

import { Router } from 'express';
import { RecommendationController } from '../controllers/recommendation.controller';
import { authenticate, requireRole } from '../../../auth/auth.middleware';
import { Role } from '@prisma/client';
import { asyncHandler } from '../../../errors/async.handler';

const router = Router();
const controller = new RecommendationController();

// All recommendation endpoints require authentication
router.use(authenticate);

// Generate / retrieve personalized recommendations
router.get('/', asyncHandler(controller.getRecommendations));

// Retrieve latest recommendation batch
router.get('/latest', asyncHandler(controller.getLatestBatch));

// Track granular recommendation events
router.post('/events', asyncHandler(controller.trackEvent));

// Batch track impressions
router.post('/events/impressions', asyncHandler(controller.trackBatchImpressions));

// Submit explicit feedback
router.post('/feedback', asyncHandler(controller.submitFeedback));

// Aggregate outcome metrics (admin/trainer)
router.get('/metrics', asyncHandler(controller.getMetrics));

// Admin ML Model Management Routes
router.get(
  '/admin/models',
  requireRole([Role.ADMIN, Role.SUPER_ADMIN]),
  asyncHandler(controller.listModels)
);

router.get(
  '/admin/models/:version',
  requireRole([Role.ADMIN, Role.SUPER_ADMIN]),
  asyncHandler(controller.getModelDetails)
);

router.post(
  '/admin/models/:version/activate',
  requireRole([Role.ADMIN, Role.SUPER_ADMIN]),
  asyncHandler(controller.activateModel)
);

router.post(
  '/admin/models/:version/retire',
  requireRole([Role.ADMIN, Role.SUPER_ADMIN]),
  asyncHandler(controller.retireModel)
);

export default router;
