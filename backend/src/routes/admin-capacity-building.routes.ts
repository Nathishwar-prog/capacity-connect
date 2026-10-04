import { Router } from 'express';
import { Role } from '@prisma/client';
import { AdminCapacityBuildingController } from '../controllers/admin-capacity-building.controller';
import { authenticate, requireRole } from '../auth/auth.middleware';
import { asyncHandler } from '../errors/async.handler';

const router = Router();
const controller = new AdminCapacityBuildingController();

// Strictly enforce RBAC: Admin & Super Admin only
router.use(authenticate);
router.use(requireRole([Role.ADMIN, Role.SUPER_ADMIN]));

/**
 * GET /api/v1/admin/capacity-building/overview
 * Real aggregated cross-module program metrics
 */
router.get('/overview', asyncHandler(controller.getOverview));

/**
 * GET /api/v1/admin/capacity-building/trainees
 * Filterable, paginated trainees cohort with progress and competencies
 */
router.get('/trainees', asyncHandler(controller.getTrainees));

/**
 * GET /api/v1/admin/capacity-building/trainees/:id
 * Individual trainee learning timeline, competency radar, and enrollments
 */
router.get('/trainees/:id', asyncHandler(controller.getTraineeById));

/**
 * GET /api/v1/admin/capacity-building/trainers
 * Filterable, paginated faculty roster with workload & course stats
 */
router.get('/trainers', asyncHandler(controller.getTrainers));

/**
 * GET /api/v1/admin/capacity-building/trainers/:id
 * Individual trainer portfolio, learner roster, ratings & workload
 */
router.get('/trainers/:id', asyncHandler(controller.getTrainerById));

/**
 * GET /api/v1/admin/capacity-building/resources
 * Filterable learning resources catalog with usage counts
 */
router.get('/resources', asyncHandler(controller.getResources));

/**
 * GET /api/v1/admin/capacity-building/resources/:id
 * Single learning resource details with module/lesson attachments
 */
router.get('/resources/:id', asyncHandler(controller.getResourceById));

export { router as adminCapacityBuildingRouter };
