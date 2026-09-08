import { Router } from 'express';
import { Role } from '@prisma/client';
import { DashboardController } from '../controllers/dashboard.controller';
import { DashboardService } from '../services/dashboard.service';
import { ProfileController } from '../controllers/profile.controller';
import { authenticate, requireRole } from '../auth/auth.middleware';
import { asyncHandler } from '../errors/async.handler';
import { validate } from '../validators/validate.middleware';
import {
  updateTraineeProfileSchema,
  createQualificationSchema,
  updateQualificationSchema,
  qualificationIdParamSchema,
  createWorkExperienceSchema,
  updateWorkExperienceSchema,
  experienceIdParamSchema,
  addUserSkillSchema,
  skillIdParamSchema,
  availableSkillsQuerySchema,
  createCertificateSchema,
  certificateIdParamSchema,
} from '../validators/profile.validation';

const router = Router();
const dashboardService = new DashboardService();
const dashboardController = new DashboardController(dashboardService);
const profileController = new ProfileController();

router.use(authenticate);
router.use(requireRole([Role.TRAINEE, Role.ADMIN, Role.SUPER_ADMIN]));

// --- Dashboard ---
router.get('/dashboard', asyncHandler(dashboardController.getTraineeDashboard));

// --- Trainee Profile & Personal Information ---
router.get('/profile', asyncHandler(profileController.getTraineeProfile));
router.patch(
  '/profile',
  validate({ body: updateTraineeProfileSchema }),
  asyncHandler(profileController.updateTraineeProfile),
);

// --- Skills Catalog & User Skills ---
router.get(
  '/skills/available',
  validate({ query: availableSkillsQuerySchema }),
  asyncHandler(profileController.getAvailableSkills),
);
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

// --- Qualifications ---
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

// --- Work Experience ---
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

// --- Certificates ---
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

export default router;
export { router as traineeRouter };
