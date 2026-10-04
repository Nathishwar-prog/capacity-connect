import { Router } from 'express';
import { AdminAnalyticsController } from '../controllers/admin-analytics.controller';
import { asyncHandler } from '../errors/async.handler';

const router = Router();
const controller = new AdminAnalyticsController();

/**
 * GET /admin/analytics/dashboard
 * Aggregated analytics overview & drilldowns
 */
router.get('/dashboard', asyncHandler(controller.getDashboard));

/**
 * POST /admin/analytics/ai/query
 * AI-assisted analytical queries and dynamic chart generator
 */
router.post('/ai/query', asyncHandler(controller.queryAi));

/**
 * GET /admin/analytics/export
 * Export platform analytics as CSV
 */
router.get('/export', asyncHandler(controller.exportCsv));

export default router;
export { router as adminAnalyticsRouter };
