import { Router } from 'express';
import { CourseController } from '../controllers/course.controller';
import { CourseService } from '../services/course.service';
import { CourseRepository } from '../repositories/course.repository';
import { UserRepository } from '../repositories/user.repository';
import { CourseModuleRepository } from '../repositories/course-module.repository';
import { LessonRepository } from '../repositories/lesson.repository';
import { CourseStructureService } from '../services/course-structure.service';
import { CourseStructureController } from '../controllers/course-structure.controller';
import { CourseImportController } from '../controllers/course-import.controller';
import { courseDocumentUpload } from '../middlewares/course-document-upload.middleware';
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
import { enrollmentController } from './enrollment.routes';

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
const courseImportController = new CourseImportController();

// All course routes require authentication
router.use(authenticate);

// ── Course Document Import Workflow ───────────────────────────────────────────
router.post(
    '/import',
    requirePermission(Permissions.COURSES_CREATE),
    courseDocumentUpload.single('file'),
    asyncHandler(courseImportController.importDocument),
);

router.get(
    '/import/:jobId',
    requirePermission(Permissions.COURSES_READ),
    asyncHandler(courseImportController.getJobStatus),
);

router.get(
    '/import/:jobId/preview',
    requirePermission(Permissions.COURSES_READ),
    asyncHandler(courseImportController.getJobPreview),
);

router.post(
    '/import/:jobId/approve',
    requirePermission(Permissions.COURSES_CREATE),
    asyncHandler(courseImportController.approveJob),
);

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

// Get Course-Specific Recommended Mentors & Trainers
router.get(
    '/:id/trainers',
    requirePermission(Permissions.COURSES_READ),
    asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { trainerMatchingService } = await import('../services/trainer-matching.service');
        const { ResponseHelper } = await import('../errors/response.helper');
        const result = await trainerMatchingService.matchTrainersForCourse(id);
        return ResponseHelper.success({
            res,
            message: 'Course-specific recommended mentors retrieved successfully',
            data: result,
        });
    }),
);

// Course Health Validation
router.get(
    '/:id/validate',
    requirePermission(Permissions.COURSES_READ),
    asyncHandler(courseController.validateCourse),
);

// Autosave Draft
router.patch(
    '/:id/draft',
    requirePermission(Permissions.COURSES_UPDATE),
    asyncHandler(courseController.saveDraft),
);

// Topics & Competency Mappings for Builder
router.get(
    '/:id/topics-competencies',
    requirePermission(Permissions.COURSES_READ),
    asyncHandler(courseImportController.getTopicsAndCompetencies),
);

router.put(
    '/:id/topics-competencies',
    requirePermission(Permissions.COURSES_UPDATE),
    asyncHandler(courseImportController.updateTopicCompetencyMapping),
);

// Enroll in Course: POST /:id/enroll
router.post(
    '/:id/enroll',
    requirePermission(Permissions.COURSES_READ),
    asyncHandler(async (req, res, next) => {
        req.params.courseId = req.params.id;
        req.body = { ...req.body, courseId: req.params.id };
        return enrollmentController.enroll(req, res, next);
    }),
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

// Delete / Archive Course
router.delete(
    '/:id',
    requirePermission(Permissions.COURSES_ARCHIVE),
    asyncHandler(courseController.deleteCourse),
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

// Publish Course (with Validation Check)
router.post(
    '/:id/publish',
    requirePermission(Permissions.COURSES_PUBLISH),
    asyncHandler(courseController.publishCourse),
);

// Unpublish Course
router.post(
    '/:id/unpublish',
    requirePermission(Permissions.COURSES_PUBLISH),
    asyncHandler(courseController.unpublishCourse),
);

// Duplicate Course
router.post(
    '/:id/duplicate',
    requirePermission(Permissions.COURSES_CREATE),
    asyncHandler(courseController.duplicateCourse),
);

// ── Course Structure Routes ──────────────────────────────────────────────────

// Get full course hierarchy (for builder/editor)
router.get(
    '/:courseId/structure',
    requirePermission(Permissions.COURSES_READ),
    asyncHandler(courseStructureController.getCourseStructure),
);

// ── Trainee Course Viewer Endpoints ──────────────────────────────────────────

// 1. Lightweight Course Outline + Trainee Progress Summary (<15KB)
router.get(
    '/:courseId/outline',
    requirePermission(Permissions.COURSES_READ),
    asyncHandler(courseStructureController.getCourseOutline),
);

// 2. Detailed Lesson Content (Lazy loaded on demand)
router.get(
    '/:courseId/lessons/:lessonId',
    requirePermission(Permissions.COURSES_READ),
    asyncHandler(courseStructureController.getLessonDetail),
);

// 3. Complete Lesson (Idempotent optimistic update + adaptive learning event)
router.post(
    '/:courseId/lessons/:lessonId/complete',
    requirePermission(Permissions.COURSES_READ),
    asyncHandler(courseStructureController.completeLesson),
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

