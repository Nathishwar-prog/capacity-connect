import { Router } from 'express';
import { Role } from '@prisma/client';
import { LearningExperienceController } from '../controllers/learning-experience.controller';
import { authenticate, requireRole } from '../auth/auth.middleware';
import { validate } from '../validators/validate.middleware';
import {
  courseIdParamSchema,
  lessonIdParamSchema,
} from '../validators/learning-experience.validator';
import { asyncHandler } from '../errors/async.handler';

const router = Router();
const controller = new LearningExperienceController();

// Learning experience is restricted to authenticated trainees and administrators
router.use(authenticate);
router.use(requireRole([Role.TRAINEE, Role.ADMIN, Role.SUPER_ADMIN]));

// 1. Course overview with modules, lessons, and trainee progress
router.get(
  '/courses/:courseId',
  validate({ params: courseIdParamSchema }),
  asyncHandler(controller.getCourseLearningOverview),
);

// 2. Course progress summary
router.get(
  '/courses/:courseId/progress',
  validate({ params: courseIdParamSchema }),
  asyncHandler(controller.getCourseProgress),
);

// 3. Lesson details and learning resource
router.get(
  '/lessons/:lessonId',
  validate({ params: lessonIdParamSchema }),
  asyncHandler(controller.getLessonDetails),
);

// 4. Mark lesson as complete
router.post(
  '/lessons/:lessonId/complete',
  validate({ params: lessonIdParamSchema }),
  asyncHandler(controller.completeLesson),
);

export default router;
export { router as learningExperienceRouter };
