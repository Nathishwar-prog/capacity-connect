import { Router } from 'express';
import { AssessmentController } from '../controllers/assessment.controller';
import { authenticate, requireRole } from '../auth/auth.middleware';
import { asyncHandler } from '../errors/async.handler';
import { Role } from '@prisma/client';

const router = Router();
const controller = new AssessmentController();

// Protect all assessment routes with authentication
router.use(authenticate);

// Assessment Management (Trainer & Admin)
router.post(
    '/',
    requireRole([Role.SUPER_ADMIN, Role.ADMIN, Role.TRAINER]),
    asyncHandler(controller.createAssessment),
);

router.get(
    '/',
    asyncHandler(controller.listAssessments),
);

router.get(
    '/:id',
    asyncHandler(controller.getAssessmentById),
);

router.patch(
    '/:id',
    requireRole([Role.SUPER_ADMIN, Role.ADMIN, Role.TRAINER]),
    asyncHandler(controller.updateAssessment),
);

router.delete(
    '/:id',
    requireRole([Role.SUPER_ADMIN, Role.ADMIN, Role.TRAINER]),
    asyncHandler(controller.deleteAssessment),
);

// Question & Option Management (Trainer & Admin)
router.post(
    '/:assessmentId/questions',
    requireRole([Role.SUPER_ADMIN, Role.ADMIN, Role.TRAINER]),
    asyncHandler(controller.addQuestion),
);

router.patch(
    '/:assessmentId/questions/:questionId',
    requireRole([Role.SUPER_ADMIN, Role.ADMIN, Role.TRAINER]),
    asyncHandler(controller.updateQuestion),
);

router.delete(
    '/:assessmentId/questions/:questionId',
    requireRole([Role.SUPER_ADMIN, Role.ADMIN, Role.TRAINER]),
    asyncHandler(controller.deleteQuestion),
);

// Trainee Attempts & Submissions
router.post(
    '/:assessmentId/attempts',
    requireRole([Role.SUPER_ADMIN, Role.ADMIN, Role.TRAINEE]),
    asyncHandler(controller.startAttempt),
);

router.get(
    '/:assessmentId/attempts/:attemptId',
    requireRole([Role.SUPER_ADMIN, Role.ADMIN, Role.TRAINEE, Role.TRAINER]),
    asyncHandler(controller.getAttempt),
);

router.post(
    '/:assessmentId/attempts/:attemptId/submit',
    requireRole([Role.SUPER_ADMIN, Role.ADMIN, Role.TRAINEE]),
    asyncHandler(controller.submitAttempt),
);

router.get(
    '/:assessmentId/attempts/:attemptId/result',
    requireRole([Role.SUPER_ADMIN, Role.ADMIN, Role.TRAINEE, Role.TRAINER]),
    asyncHandler(controller.getResult),
);

export default router;
