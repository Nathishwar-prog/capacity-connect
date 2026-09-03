import { Router } from 'express';
import { Role } from '@prisma/client';
import { TrainerController } from '../controllers/trainer.controller';
import { authenticate, requireRole } from '../auth/auth.middleware';
import { asyncHandler } from '../errors/async.handler';
import { validate } from '../validators/validate.middleware';
import {
  updateTrainerProfileSchema,
  addTrainerExpertiseSchema,
  createCourseSchema,
  updateCourseSchema,
  courseIdParamSchema,
  createModuleSchema,
  updateModuleSchema,
  moduleIdParamSchema,
  createLessonSchema,
  updateLessonSchema,
  lessonIdParamSchema,
  reorderCourseSchema,
  mapCompetencySchema,
  prerequisiteSchema,
  traineeQuerySchema,
  traineeIdParamSchema,
  createAssessmentSchema,
  assessmentIdParamSchema,
} from '../validators/trainer.validation';

const router = Router();
const trainerController = new TrainerController();

// All trainer endpoints require valid JWT authentication and TRAINER / ADMIN / SUPER_ADMIN roles
router.use(authenticate);
router.use(requireRole([Role.TRAINER, Role.ADMIN, Role.SUPER_ADMIN]));

// --- 1. Profile & Expertise ---
router.get('/profile', asyncHandler(trainerController.getProfile));
router.patch(
  '/profile',
  validate({ body: updateTrainerProfileSchema }),
  asyncHandler(trainerController.updateProfile),
);
router.post(
  '/expertise',
  validate({ body: addTrainerExpertiseSchema }),
  asyncHandler(trainerController.addExpertise),
);
router.delete('/expertise/:skillId', asyncHandler(trainerController.removeExpertise));

// --- 2. Dashboard ---
router.get('/dashboard', asyncHandler(trainerController.getDashboard));

// --- 3. Courses ---
router.get('/courses', asyncHandler(trainerController.getCourses));
router.post(
  '/courses',
  validate({ body: createCourseSchema }),
  asyncHandler(trainerController.createCourse),
);
router.get(
  '/courses/:courseId',
  validate({ params: courseIdParamSchema }),
  asyncHandler(trainerController.getCourseById),
);
router.patch(
  '/courses/:courseId',
  validate({ params: courseIdParamSchema, body: updateCourseSchema }),
  asyncHandler(trainerController.updateCourse),
);
router.delete(
  '/courses/:courseId',
  validate({ params: courseIdParamSchema }),
  asyncHandler(trainerController.deleteCourse),
);
router.post(
  '/courses/:courseId/submit',
  validate({ params: courseIdParamSchema }),
  asyncHandler(trainerController.submitCourseForApproval),
);

// --- 4. Course Builder (Modules & Lessons) ---
router.post(
  '/courses/:courseId/modules',
  validate({ params: courseIdParamSchema, body: createModuleSchema }),
  asyncHandler(trainerController.createModule),
);
router.patch(
  '/courses/:courseId/modules/:moduleId',
  validate({ params: moduleIdParamSchema, body: updateModuleSchema }),
  asyncHandler(trainerController.updateModule),
);
router.delete(
  '/courses/:courseId/modules/:moduleId',
  validate({ params: moduleIdParamSchema }),
  asyncHandler(trainerController.deleteModule),
);

router.post(
  '/courses/:courseId/modules/:moduleId/lessons',
  validate({ params: moduleIdParamSchema, body: createLessonSchema }),
  asyncHandler(trainerController.createLesson),
);
router.patch(
  '/courses/:courseId/modules/:moduleId/lessons/:lessonId',
  validate({ params: lessonIdParamSchema, body: updateLessonSchema }),
  asyncHandler(trainerController.updateLesson),
);
router.delete(
  '/courses/:courseId/modules/:moduleId/lessons/:lessonId',
  validate({ params: lessonIdParamSchema }),
  asyncHandler(trainerController.deleteLesson),
);

router.put(
  '/courses/:courseId/reorder',
  validate({ params: courseIdParamSchema, body: reorderCourseSchema }),
  asyncHandler(trainerController.reorderCourse),
);

// --- 5. Course Competencies & Prerequisites ---
router.post(
  '/courses/:courseId/competencies',
  validate({ params: courseIdParamSchema, body: mapCompetencySchema }),
  asyncHandler(trainerController.mapCompetency),
);
router.delete(
  '/courses/:courseId/competencies/:competencyId',
  asyncHandler(trainerController.unmapCompetency),
);

router.post(
  '/courses/:courseId/prerequisites',
  validate({ params: courseIdParamSchema, body: prerequisiteSchema }),
  asyncHandler(trainerController.addPrerequisite),
);
router.delete(
  '/courses/:courseId/prerequisites/:prerequisiteCourseId',
  asyncHandler(trainerController.removePrerequisite),
);

// --- 6. Trainees ---
router.get(
  '/trainees',
  validate({ query: traineeQuerySchema }),
  asyncHandler(trainerController.getTrainees),
);
router.get(
  '/trainees/:traineeId',
  validate({ params: traineeIdParamSchema }),
  asyncHandler(trainerController.getTraineeDetail),
);

// --- 7. Assessments ---
router.get('/assessments', asyncHandler(trainerController.getAssessments));
router.post(
  '/assessments',
  validate({ body: createAssessmentSchema }),
  asyncHandler(trainerController.createAssessment),
);
router.get(
  '/assessments/:assessmentId',
  validate({ params: assessmentIdParamSchema }),
  asyncHandler(trainerController.getAssessmentById),
);
router.get(
  '/assessments/:assessmentId/attempts',
  validate({ params: assessmentIdParamSchema }),
  asyncHandler(trainerController.getAssessmentAttempts),
);

// --- 8. Analytics & Feedback ---
router.get('/analytics', asyncHandler(trainerController.getAnalytics));
router.get('/feedback', asyncHandler(trainerController.getFeedback));

export default router;
export { router as trainerRouter };
