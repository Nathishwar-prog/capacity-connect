import { Router } from 'express';
import { Role } from '@prisma/client';
import { TrainerController } from '../controllers/trainer.controller';
import { authenticate, requireRole, requirePermission, Permissions } from '../auth/auth.middleware';
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

import { ProfileController } from '../controllers/profile.controller';
import {
  createQualificationSchema,
  updateQualificationSchema,
  qualificationIdParamSchema,
  createWorkExperienceSchema,
  updateWorkExperienceSchema,
  experienceIdParamSchema,
  addUserSkillSchema,
  skillIdParamSchema,
  createCertificateSchema,
  certificateIdParamSchema,
} from '../validators/profile.validation';

const router = Router();
const trainerController = new TrainerController();
const profileController = new ProfileController();

// All trainer endpoints require valid JWT authentication and TRAINER / ADMIN / SUPER_ADMIN roles
router.use(authenticate);
router.use(requireRole([Role.TRAINER, Role.ADMIN, Role.SUPER_ADMIN]));

// --- 1. Profile, Expertise & Professional History ---
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

// Qualifications
router.get('/qualifications', asyncHandler(profileController.getQualifications));
router.post(
  '/qualifications',
  validate({ body: createQualificationSchema }),
  asyncHandler(profileController.addQualification),
);
router.put(
  '/qualifications/:id',
  validate({ params: qualificationIdParamSchema, body: updateQualificationSchema }),
  asyncHandler(profileController.updateQualification),
);
router.delete(
  '/qualifications/:id',
  validate({ params: qualificationIdParamSchema }),
  asyncHandler(profileController.deleteQualification),
);

// Work Experience
router.get('/experience', asyncHandler(profileController.getWorkExperiences));
router.post(
  '/experience',
  validate({ body: createWorkExperienceSchema }),
  asyncHandler(profileController.addWorkExperience),
);
router.put(
  '/experience/:id',
  validate({ params: experienceIdParamSchema, body: updateWorkExperienceSchema }),
  asyncHandler(profileController.updateWorkExperience),
);
router.delete(
  '/experience/:id',
  validate({ params: experienceIdParamSchema }),
  asyncHandler(profileController.deleteWorkExperience),
);

// Skills
router.get('/skills', asyncHandler(profileController.getUserSkills));
router.post(
  '/skills',
  validate({ body: addUserSkillSchema }),
  asyncHandler(profileController.addUserSkill),
);
router.delete(
  '/skills/:skillId',
  validate({ params: skillIdParamSchema }),
  asyncHandler(profileController.removeUserSkill),
);

// Certificates
router.get('/certificates', asyncHandler(profileController.getCertificates));
router.post(
  '/certificates',
  validate({ body: createCertificateSchema }),
  asyncHandler(profileController.addCertificate),
);
router.delete(
  '/certificates/:id',
  validate({ params: certificateIdParamSchema }),
  asyncHandler(profileController.deleteCertificate),
);

// --- 2. Dashboard ---
router.get('/dashboard', asyncHandler(trainerController.getDashboard));

// --- 3. Courses ---
router.get('/courses', asyncHandler(trainerController.getCourses));
router.post(
  '/courses',
  requirePermission(Permissions.COURSE_CREATE),
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
  requirePermission(Permissions.COURSE_UPDATE),
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
  requirePermission(Permissions.ASSESSMENT_CREATE),
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
router.get(
  '/analytics',
  requirePermission(Permissions.ANALYTICS_VIEW),
  asyncHandler(trainerController.getAnalytics),
);
router.get('/feedback', asyncHandler(trainerController.getFeedback));

export default router;
export { router as trainerRouter };
