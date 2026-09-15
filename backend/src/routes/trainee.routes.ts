import { Router } from 'express';
import { authenticate } from '../auth/auth.middleware';
import { asyncHandler } from '../errors/async.handler';
import { ResponseHelper } from '../errors/response.helper';
import { onboardingService } from '../services/onboarding.service';
import { dataSufficiencyService } from '../services/data-sufficiency.service';
import { traineeRecommendationService } from '../services/trainee-recommendation.service';
import { SkillGapAnalysisService } from '../modules/skill-gap/services/skill-gap-analysis.service';
import { ProfileController } from '../controllers/profile.controller';

const router = Router();
const profileController = new ProfileController();

// All trainee routes require authentication
router.use(authenticate);

// ==============================================================================
// 1. ONBOARDING & DATA SUFFICIENCY WORKFLOW
// ==============================================================================

/**
 * Onboarding Status Check
 */
router.get(
  '/onboarding/status',
  asyncHandler(async (req, res) => {
    const userId = (req.user as any)?.id || req.user?.userId;
    const status = await onboardingService.getOnboardingStatus(userId);
    return ResponseHelper.success({
      res,
      message: 'Trainee onboarding status retrieved successfully',
      data: status,
    });
  }),
);

/**
 * Submit Trainee Onboarding Profile
 */
router.post(
  '/onboarding',
  asyncHandler(async (req, res) => {
    const userId = (req.user as any)?.id || req.user?.userId;
    const result = await onboardingService.submitOnboarding(userId, req.body);
    return ResponseHelper.success({
      res,
      message: 'Trainee onboarding submitted successfully',
      data: result,
    });
  }),
);

/**
 * Recommendation Data Sufficiency / Readiness Check
 */
router.get(
  '/recommendations/readiness',
  asyncHandler(async (req, res) => {
    const userId = (req.user as any)?.id || req.user?.userId;
    const readiness = await dataSufficiencyService.evaluateSufficiency(userId);
    return ResponseHelper.success({
      res,
      message: 'Recommendation readiness evaluated successfully',
      data: readiness,
    });
  }),
);

/**
 * Get Personalized Course Recommendations
 */
router.get(
  '/recommendations',
  asyncHandler(async (req, res) => {
    const userId = (req.user as any)?.id || req.user?.userId;
    const recommendations = await traineeRecommendationService.getTraineeRecommendations(userId);
    return ResponseHelper.success({
      res,
      message: 'Personalized recommendations retrieved successfully',
      data: recommendations,
    });
  }),
);

/**
 * Cold-Start Diagnostic Assessment Check
 */
router.get(
  '/diagnostic',
  asyncHandler(async (_req, res) => {
    const diagnostic = await dataSufficiencyService.getDiagnosticAssessment();
    return ResponseHelper.success({
      res,
      message: 'Diagnostic assessment retrieved successfully',
      data: diagnostic,
    });
  }),
);

/**
 * Submit Diagnostic Assessment
 */
router.post(
  '/diagnostic/submit',
  asyncHandler(async (req, res) => {
    const userId = (req.user as any)?.id || req.user?.userId;
    const answers = req.body?.answers || [];
    const result = await dataSufficiencyService.submitDiagnostic(userId, answers);
    return ResponseHelper.success({
      res,
      message: 'Diagnostic assessment evaluated successfully',
      data: result,
    });
  }),
);

/**
 * AI Skill Gap Analysis
 */
router.post(
  '/skill-gap/analyze',
  asyncHandler(async (req, res) => {
    const userId = (req.user as any)?.id || req.user?.userId;
    const { courseId } = req.body || {};
    const skillGapService = new SkillGapAnalysisService();
    const result = await skillGapService.analyzeLearnerGaps({
      userId,
      courseId: courseId || null,
      includeAiGuidance: true,
    });
    return ResponseHelper.success({
      res,
      message: 'Skill gap analysis generated successfully',
      data: result,
    });
  }),
);

// ==============================================================================
// 2. PROFILE & CREDENTIAL MANAGEMENT
// ==============================================================================

router.get('/profile', asyncHandler(profileController.getTraineeProfile));
router.patch('/profile', asyncHandler(profileController.updateTraineeProfile));

router.get('/skills', asyncHandler(profileController.getUserSkills));
router.post('/skills', asyncHandler(profileController.addUserSkill));
router.delete('/skills/:skillId', asyncHandler(profileController.removeUserSkill));
router.get('/skills/available', asyncHandler(profileController.getAvailableSkills));

router.get('/qualifications', asyncHandler(profileController.getQualifications));
router.post('/qualifications', asyncHandler(profileController.addQualification));
router.put('/qualifications/:id', asyncHandler(profileController.updateQualification));
router.delete('/qualifications/:id', asyncHandler(profileController.deleteQualification));

router.get('/experience', asyncHandler(profileController.getWorkExperiences));
router.post('/experience', asyncHandler(profileController.addWorkExperience));
router.put('/experience/:id', asyncHandler(profileController.updateWorkExperience));
router.delete('/experience/:id', asyncHandler(profileController.deleteWorkExperience));

router.get('/certificates', asyncHandler(profileController.getCertificates));
router.post('/certificates', asyncHandler(profileController.addCertificate));
router.delete('/certificates/:id', asyncHandler(profileController.deleteCertificate));

export { router as traineeRouter };
export default router;
