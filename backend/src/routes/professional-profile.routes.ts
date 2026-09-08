import { Router } from 'express';
import { Role } from '@prisma/client';
import { ProfessionalProfileController } from '../controllers/professional-profile.controller';
import { authenticate, requireRole } from '../auth/auth.middleware';
import { validate } from '../validators/validate.middleware';
import {
  updateBasicInfoSchema,
  qualificationSchema,
  workExperienceSchema,
  updateSkillsSchema,
  updateInterestsSchema,
} from '../validators/professional-profile.validator';
import { asyncHandler } from '../errors/async.handler';

const router = Router();
const controller = new ProfessionalProfileController();

// All profile management routes require authentication and trainee/admin role
router.use(authenticate);
router.use(requireRole([Role.TRAINEE, Role.ADMIN, Role.SUPER_ADMIN]));

// Full profile
router.get('/', asyncHandler(controller.getProfile));

// 1. Basic Info
router.patch(
  '/basic-info',
  validate({ body: updateBasicInfoSchema }),
  asyncHandler(controller.updateBasicInfo),
);

// 2. Qualifications
router.post(
  '/qualifications',
  validate({ body: qualificationSchema }),
  asyncHandler(controller.addQualification),
);
router.patch(
  '/qualifications/:id',
  validate({ body: qualificationSchema.partial() }),
  asyncHandler(controller.updateQualification),
);
router.delete('/qualifications/:id', asyncHandler(controller.deleteQualification));

// 3. Experiences
router.post(
  '/experiences',
  validate({ body: workExperienceSchema }),
  asyncHandler(controller.addExperience),
);
router.patch(
  '/experiences/:id',
  validate({ body: workExperienceSchema.partial() }),
  asyncHandler(controller.updateExperience),
);
router.delete('/experiences/:id', asyncHandler(controller.deleteExperience));

// 4. Skills
router.patch(
  '/skills',
  validate({ body: updateSkillsSchema }),
  asyncHandler(controller.updateSkills),
);

// 5. Interests
router.patch(
  '/interests',
  validate({ body: updateInterestsSchema }),
  asyncHandler(controller.updateInterests),
);

// 6. Certificates
router.get('/certificates', asyncHandler(controller.getCertificates));

export default router;
export { router as professionalProfileRouter };
