import { Router } from 'express';
import { revisionController } from '../controllers/revision.controller';
import { authenticate } from '../../../auth/auth.middleware';
import { asyncHandler } from '../../../errors/async.handler';

const router = Router();

// All revision endpoints require authenticated learner
router.use(authenticate);

// Generate an adaptive revision session
router.post('/sessions/generate', asyncHandler(revisionController.generateSession));

// Get a specific revision session with educational content
router.get('/sessions/:sessionId', asyncHandler(revisionController.getSession));

// Get learner's latest revision session
router.get('/sessions/latest/current', asyncHandler(revisionController.getLatestSession));

// Deterministic competency group analysis and ranking
router.get('/groups/analysis', asyncHandler(revisionController.getGroupAnalysis));

// Record practice / retrieval check outcome
router.post('/sessions/outcomes', asyncHandler(revisionController.recordOutcome));

// Ingest generic learning event (assessment answer, diagnostic, simulation step)
router.post('/events', asyncHandler(revisionController.ingestLearningEvent));

// Get full learner competency & retention profile
router.get('/profile', asyncHandler(revisionController.getLearnerProfile));

export default router;
