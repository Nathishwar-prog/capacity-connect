import { Router } from 'express';
import { CourseController } from '../controllers/course.controller';
import { CourseService } from '../services/course.service';
import { CourseRepository } from '../repositories/course.repository';
import { UserRepository } from '../repositories/user.repository';
import { validate } from '../validators/validate.middleware';
import { authenticate, requirePermission } from '../auth/auth.middleware';
import {
    createCourseSchema,
    updateCourseSchema,
    listCoursesQuerySchema,
} from '../validators/course.validation';
import { asyncHandler } from '../errors/async.handler';
import { Permissions } from '../permissions';

const router = Router();

const courseRepository = new CourseRepository();
const userRepository = new UserRepository();
const courseService = new CourseService(courseRepository, userRepository);
const courseController = new CourseController(courseService);

// All course routes require authentication
router.use(authenticate);

// List Courses
router.get(
    '/',
    requirePermission(Permissions.COURSES_READ),
    validate({ query: listCoursesQuerySchema }),
    asyncHandler(courseController.listCourses),
);

// Get Course by ID
router.get(
    '/:id',
    requirePermission(Permissions.COURSES_READ),
    asyncHandler(courseController.getCourse),
);

// Create Course
router.post(
    '/',
    requirePermission(Permissions.COURSES_CREATE),
    validate({ body: createCourseSchema }),
    asyncHandler(courseController.createCourse),
);

// Update Course
router.patch(
    '/:id',
    requirePermission(Permissions.COURSES_UPDATE),
    validate({ body: updateCourseSchema }),
    asyncHandler(courseController.updateCourse),
);

// Archive Course
router.delete(
    '/:id',
    requirePermission(Permissions.COURSES_ARCHIVE),
    asyncHandler(courseController.archiveCourse),
);

// Submit Course
router.post(
    '/:id/submit',
    requirePermission(Permissions.COURSES_SUBMIT),
    asyncHandler(courseController.submitCourse),
);

// Approve Course
router.post(
    '/:id/approve',
    requirePermission(Permissions.COURSES_APPROVE),
    asyncHandler(courseController.approveCourse),
);

// Reject Course
router.post(
    '/:id/reject',
    requirePermission(Permissions.COURSES_REJECT),
    asyncHandler(courseController.rejectCourse),
);

// Publish Course
router.post(
    '/:id/publish',
    requirePermission(Permissions.COURSES_PUBLISH),
    asyncHandler(courseController.publishCourse),
);

export default router;
export { router as courseRouter };
