import { Router } from 'express';
import { Role } from '@prisma/client';
import { DashboardController } from '../controllers/dashboard.controller';
import { DashboardService } from '../services/dashboard.service';
import { authenticate, requireRole } from '../auth/auth.middleware';
import { asyncHandler } from '../errors/async.handler';

const router = Router();
const dashboardService = new DashboardService();
const dashboardController = new DashboardController(dashboardService);

router.use(authenticate);
router.use(requireRole([Role.TRAINEE, Role.ADMIN, Role.SUPER_ADMIN]));

router.get('/dashboard', asyncHandler(dashboardController.getTraineeDashboard));

export default router;
export { router as traineeRouter };
