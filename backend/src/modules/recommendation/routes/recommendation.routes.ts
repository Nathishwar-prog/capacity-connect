/**
 * Recommendation Routes
 * 
 * Express Router mounting all recommendation engine endpoints.
 */

import { Router } from 'express';
import { RecommendationController } from '../controllers/recommendation.controller';
import { authenticate } from '../../../auth/auth.middleware';
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

export default router;
