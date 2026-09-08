import { Router } from 'express';
import { Role } from '@prisma/client';
import { CourseDiscoveryController } from '../controllers/course-discovery.controller';
import { authenticate, requireRole } from '../auth/auth.middleware';
import { validate } from '../validators/validate.middleware';
import {
  courseQuerySchema,
  courseIdParamSchema,
} from '../validators/course-discovery.validator';
import { asyncHandler } from '../errors/async.handler';

const router = Router();
const controller = new CourseDiscoveryController();

// Course Discovery is available to all authenticated users (Trainees, Trainers, Admins)
router.use(authenticate);

// 1. Filter metadata
router.get('/meta/filters', asyncHandler(controller.getFiltersMetadata));

// 2. Catalog listing with search & filters
router.get(
  '/',
  validate({ query: courseQuerySchema }),
  asyncHandler(controller.getCourses),
);

// 3. Course Details view
router.get(
  '/:courseId',
  validate({ params: courseIdParamSchema }),
  asyncHandler(controller.getCourseDetails),
);

// 4. Trainee Enrollment (Strictly Trainee, Admin, Super Admin)
router.post(
  '/:courseId/enroll',
  requireRole([Role.TRAINEE, Role.ADMIN, Role.SUPER_ADMIN]),
  validate({ params: courseIdParamSchema }),
  asyncHandler(controller.enrollCourse),
);

export default router;
export { router as courseDiscoveryRouter };
