/**
 * Skill Gap Routes
 * API Endpoints for AI Skill Gap Analysis, Multi-Tier Readiness, and Remediation.
 */

import { Router } from 'express';
import { SkillGapController } from '../controllers/skill-gap.controller';
import { authenticate } from '../../../auth/auth.middleware';
import { asyncHandler } from '../../../errors/async.handler';

const router = Router();
const controller = new SkillGapController();

// Require authentication for all skill gap endpoints
router.use(authenticate);

// Analyze learner skill gaps against course or platform requirements
router.post('/analyze', asyncHandler(controller.analyze));

// Retrieve active open skill gaps for learner
router.get('/', asyncHandler(controller.getGaps));

// Evaluate readiness against a course or platform baseline
router.get('/readiness', asyncHandler(controller.getReadiness));

// Retrieve temporal history of skill gap analyses
router.get('/history', asyncHandler(controller.getHistory));

// Retrieve a specific analysis snapshot
router.get('/analysis/:id', asyncHandler(controller.getAnalysisById));

// Trigger targeted adaptive remediation for a skill gap
router.post('/remediate', asyncHandler(controller.remediate));

export default router;
