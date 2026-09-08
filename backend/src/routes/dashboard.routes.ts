import { Router } from 'express';
import { Role } from '@prisma/client';
import { DashboardController } from '../controllers/dashboard.controller';
import { DashboardService } from '../services/dashboard.service';
import { authenticate, requireRole, requirePermission, Permissions } from '../auth/auth.middleware';
import { asyncHandler } from '../errors/async.handler';

const router = Router();

const dashboardService = new DashboardService();
const dashboardController = new DashboardController(dashboardService);

// All dashboard endpoints require authentication
router.use(authenticate);

// Trainee Dashboard Overview
router.get(
  '/trainee',
  requireRole([Role.TRAINEE, Role.ADMIN, Role.SUPER_ADMIN]),
  asyncHandler(dashboardController.getTraineeDashboard),
);

// Trainer Dashboard Overview
router.get(
  '/trainer',
  requireRole([Role.TRAINER, Role.ADMIN, Role.SUPER_ADMIN]),
  asyncHandler(dashboardController.getTrainerDashboard),
);

// Admin Institutional Dashboard Overview
router.get(
  '/admin',
  requireRole([Role.ADMIN, Role.SUPER_ADMIN]),
  requirePermission(Permissions.ANALYTICS_VIEW),
  asyncHandler(dashboardController.getAdminDashboard),
);

export default router;
export { router as dashboardRouter };
