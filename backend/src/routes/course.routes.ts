import { Router } from 'express';
import { CourseController } from '../controllers/course.controller';
import { CourseService } from '../services/course.service';
import { CourseRepository } from '../repositories/course.repository';
import { UserRepository } from '../repositories/user.repository';
import { CourseModuleRepository } from '../repositories/course-module.repository';
import { LessonRepository } from '../repositories/lesson.repository';
import { CourseStructureService } from '../services/course-structure.service';
import { CourseStructureController } from '../controllers/course-structure.controller';
import { validate } from '../validators/validate.middleware';
import { authenticate, requirePermission } from '../auth/auth.middleware';
import {
    createCourseSchema,
    updateCourseSchema,
    listCoursesQuerySchema,
} from '../validators/course.validation';
import {
    createModuleSchema,
    updateModuleSchema,
    reorderModulesSchema,
    createLessonSchema,
    updateLessonSchema,
    reorderLessonsSchema,
    attachLessonResourceSchema,
} from '../validators/course-structure.validation';
import { asyncHandler } from '../errors/async.handler';
import { Permissions } from '../permissions';

const router = Router();

const courseRepository = new CourseRepository();
const courseModuleRepository = new CourseModuleRepository();
const lessonRepository = new LessonRepository();
const userRepository = new UserRepository();

const courseService = new CourseService(courseRepository, userRepository);
const courseStructureService = new CourseStructureService(
    courseModuleRepository,
    lessonRepository,
    courseRepository,
    userRepository,
);

const courseController = new CourseController(courseService);
const courseStructureController = new CourseStructureController(courseStructureService);

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

// ── Course Structure Routes ──────────────────────────────────────────────────

// Get full course hierarchy
router.get(
    '/:courseId/structure',
    requirePermission(Permissions.COURSES_READ),
    asyncHandler(courseStructureController.getCourseStructure),
);

// Modules
router.post(
    '/:courseId/modules',
    requirePermission(Permissions.COURSES_UPDATE),
    validate({ body: createModuleSchema }),
    asyncHandler(courseStructureController.createModule),
);

router.get(
    '/:courseId/modules',
    requirePermission(Permissions.COURSES_READ),
    asyncHandler(courseStructureController.listModules),
);

router.patch(
    '/:courseId/modules/reorder',
    requirePermission(Permissions.COURSES_UPDATE),
    validate({ body: reorderModulesSchema }),
    asyncHandler(courseStructureController.reorderModules),
);

router.get(
    '/:courseId/modules/:moduleId',
    requirePermission(Permissions.COURSES_READ),
    asyncHandler(courseStructureController.getModule),
);

router.patch(
    '/:courseId/modules/:moduleId',
    requirePermission(Permissions.COURSES_UPDATE),
    validate({ body: updateModuleSchema }),
    asyncHandler(courseStructureController.updateModule),
);

router.delete(
    '/:courseId/modules/:moduleId',
    requirePermission(Permissions.COURSES_UPDATE),
    asyncHandler(courseStructureController.deleteModule),
);

// Lessons
router.post(
    '/:courseId/modules/:moduleId/lessons',
    requirePermission(Permissions.COURSES_UPDATE),
    validate({ body: createLessonSchema }),
    asyncHandler(courseStructureController.createLesson),
);

router.get(
    '/:courseId/modules/:moduleId/lessons',
    requirePermission(Permissions.COURSES_READ),
    asyncHandler(courseStructureController.listLessons),
);

router.patch(
    '/:courseId/modules/:moduleId/lessons/reorder',
    requirePermission(Permissions.COURSES_UPDATE),
    validate({ body: reorderLessonsSchema }),
    asyncHandler(courseStructureController.reorderLessons),
);

router.get(
    '/:courseId/modules/:moduleId/lessons/:lessonId',
    requirePermission(Permissions.COURSES_READ),
    asyncHandler(courseStructureController.getLesson),
);

router.patch(
    '/:courseId/modules/:moduleId/lessons/:lessonId',
    requirePermission(Permissions.COURSES_UPDATE),
    validate({ body: updateLessonSchema }),
    asyncHandler(courseStructureController.updateLesson),
);

router.delete(
    '/:courseId/modules/:moduleId/lessons/:lessonId',
    requirePermission(Permissions.COURSES_UPDATE),
    asyncHandler(courseStructureController.deleteLesson),
);

// Lesson Resources
router.post(
    '/:courseId/modules/:moduleId/lessons/:lessonId/resources',
    requirePermission(Permissions.COURSES_UPDATE),
    validate({ body: attachLessonResourceSchema }),
    asyncHandler(courseStructureController.attachResource),
);

router.delete(
    '/:courseId/modules/:moduleId/lessons/:lessonId/resources/:resourceId',
    requirePermission(Permissions.COURSES_UPDATE),
    asyncHandler(courseStructureController.detachResource),
);

export default router;
export { router as courseRouter };

