import { Router, Request, Response } from 'express';
import { authenticate } from '../auth/auth.middleware';
import { asyncHandler } from '../errors/async.handler';
import { ResponseHelper } from '../errors/response.helper';
import { revisionPlanService } from '../modules/revision/services/revision-plan.service';
import { revisionRepository } from '../modules/revision/repositories/revision.repository';
import { LearningPipelineService } from '../services/learning-pipeline.service';
import prisma from '../database/client';

const router = Router();
const learningPipelineService = new LearningPipelineService();

router.use(authenticate);

// POST /api/v1/revision-sessions - Generates or initiates a session
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req.user as any)?.id || req.user?.userId;
    const body = req.body || {};
    const sessionPlan = await revisionPlanService.generateSessionPlan(userId, body);
    return ResponseHelper.created(res, sessionPlan, 'Revision session created successfully');
  })
);

// GET /api/v1/revision-sessions/:id - Retrieves session with all items and educational prompt
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const session = await revisionRepository.getRevisionSession(id);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Revision session not found' });
    }
    return ResponseHelper.success({
      res,
      message: 'Revision session retrieved successfully',
      data: session,
    });
  })
);

// POST /api/v1/revision-sessions/:id/start - Marks revision session as in-progress
router.post(
  '/:id/start',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const session = await prisma.revisionSession.update({
      where: { id },
      data: {
        status: 'STARTED',
        startedAt: new Date(),
      },
      include: {
        items: {
          include: {
            topic: true,
          },
          orderBy: { sequenceNumber: 'asc' },
        },
      },
    });

    return ResponseHelper.success({
      res,
      message: 'Revision session started',
      data: session,
    });
  })
);

// POST /api/v1/revision-sessions/:id/result - Submits answer/result and triggers pipeline update
router.post(
  '/:id/result',
  asyncHandler(async (req: Request, res: Response) => {
    const { id: sessionId } = req.params;
    const userId = (req.user as any)?.id || req.user?.userId;
    const {
      sessionItemId,
      questionsPresented = 1,
      questionsAnswered = 1,
      correctAnswers = 1,
      timeSpentSeconds = 60,
      retrievalScore,
    } = req.body;

    // Verify session and item existence
    const sessionItem = await prisma.revisionSessionItem.findFirst({
      where: {
        sessionId,
        ...(sessionItemId ? { id: sessionItemId } : {}),
      },
      include: { topic: true },
    });

    if (!sessionItem) {
      return res.status(404).json({ success: false, message: 'Session item not found' });
    }

    const calculatedScore = retrievalScore ?? (correctAnswers / Math.max(1, questionsAnswered)) * 100;

    const outcome = await learningPipelineService.processRevisionOutcome({
      sessionId,
      sessionItemId: sessionItem.id,
      userId,
      questionsPresented: Number(questionsPresented),
      questionsAnswered: Number(questionsAnswered),
      correctAnswers: Number(correctAnswers),
      timeSpentSeconds: Number(timeSpentSeconds),
      retrievalScore: calculatedScore,
    });

    // Check if all items in session are completed
    const remainingItems = await prisma.revisionSessionItem.count({
      where: {
        sessionId,
        outcome: null,
      },
    });

    if (remainingItems === 0) {
      await prisma.revisionSession.update({
        where: { id: sessionId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });
    }

    return ResponseHelper.success({
      res,
      message: 'Revision outcome recorded and competencies recalculated successfully',
      data: outcome,
    });
  })
);

export default router;
export { router as revisionSessionRouter };
