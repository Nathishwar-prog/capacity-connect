import { Router } from 'express';
import { Role } from '@prisma/client';
import { TrainerMonitoringController } from '../controllers/trainer-monitoring.controller';
import { authenticate, requireRole, requirePermission } from '../auth/auth.middleware';
import { Permissions } from '../permissions';
import { asyncHandler } from '../errors/async.handler';

const router = Router();
const controller = new TrainerMonitoringController();

// All monitoring endpoints require authentication
router.use(authenticate);

// Enforce role check: Only TRAINER, ADMIN, and SUPER_ADMIN
router.use(requireRole([Role.TRAINER, Role.ADMIN, Role.SUPER_ADMIN]));
router.use(requirePermission(Permissions.ANALYTICS_VIEW));

/**
 * @route   GET /api/v1/trainer/monitoring/overview
 * @desc    Trainer monitoring dashboard overview metrics & course list
 * @access  Private (Trainer/Admin)
 */
router.get('/overview', asyncHandler(controller.getOverview));

/**
 * @route   GET /api/v1/trainer/monitoring/trainees
 * @desc    Paginated list of trainees with enrollment, progress, and assessment participation summary
 * @access  Private (Trainer/Admin)
 */
router.get('/trainees', asyncHandler(controller.getTrainees));

/**
 * @route   GET /api/v1/trainer/monitoring/courses/:courseId
 * @desc    Detailed course monitoring metrics and enrolled trainees for a specific course
 * @access  Private (Trainer/Admin - IDOR enforced)
 */
router.get('/courses/:courseId', asyncHandler(controller.getCourseMonitoring));

/**
 * @route   GET /api/v1/trainer/monitoring/courses/:courseId/trainees/:traineeId
 * @desc    Detailed monitoring record for a specific trainee in an authorized course
 * @access  Private (Trainer/Admin - IDOR enforced)
 */
router.get('/courses/:courseId/trainees/:traineeId', asyncHandler(controller.getTraineeCourseDetails));

/**
 * @route   GET /api/v1/trainer/monitoring/assessments
 * @desc    Assessment attempts, scores, and pass/fail monitoring across authorized courses
 * @access  Private (Trainer/Admin)
 */
router.get('/assessments', asyncHandler(controller.getAssessmentsMonitoring));

export default router;
export { router as trainerMonitoringRouter };
