import { Request, Response } from 'express';
import { ResponseHelper } from '../../../errors/response.helper';
import { revisionPlanService } from '../services/revision-plan.service';
import { groupAnalysisService } from '../services/group-analysis.service';
import { learningEventService } from '../services/learning-event.service';
import { revisionOutcomeService } from '../services/revision-outcome.service';
import { revisionRepository } from '../repositories/revision.repository';
import {
  generatePlanSchema,
  ingestEventSchema,
  recordOutcomeSchema,
} from '../validators/revision.validator';

export class RevisionController {
  /**
   * Generates a new adaptive revision session for the authenticated learner.
   */
  public generateSession = async (req: Request, res: Response): Promise<Response> => {
    const userId = (req.user as any)?.id;
    const validatedInput = generatePlanSchema.parse(req.body || {});

    const sessionPlan = await revisionPlanService.generateSessionPlan(userId, validatedInput);
    return ResponseHelper.created(res, sessionPlan, 'Adaptive revision session generated successfully');
  };

  /**
   * Fetches a specific revision session with all scheduled items and educational content.
   */
  public getSession = async (req: Request, res: Response): Promise<Response> => {
    const { sessionId } = req.params;
    const session = await revisionRepository.getRevisionSession(sessionId);

    if (!session) {
      return res.status(404).json({ success: false, message: 'Revision session not found' });
    }

    return ResponseHelper.success({
      res,
      message: 'Revision session retrieved successfully',
      data: session,
    });
  };

  /**
   * Fetches learner's latest revision session.
   */
  public getLatestSession = async (req: Request, res: Response): Promise<Response> => {
    const userId = (req.user as any)?.id;
    const session = await revisionRepository.getLatestSession(userId);

    return ResponseHelper.success({
      res,
      message: 'Latest revision session retrieved',
      data: session,
    });
  };

  /**
   * Returns deterministic group priority ranking and pedagogical analysis.
   */
  public getGroupAnalysis = async (req: Request, res: Response): Promise<Response> => {
    const userId = (req.user as any)?.id;
    const analysis = await groupAnalysisService.analyzeGroups(userId);

    return ResponseHelper.success({
      res,
      message: 'Competency group analysis generated',
      data: analysis,
    });
  };

  /**
   * Records completed practice or retrieval verification item from a revision session.
   */
  public recordOutcome = async (req: Request, res: Response): Promise<Response> => {
    const userId = (req.user as any)?.id;
    const validated = recordOutcomeSchema.parse(req.body);

    const outcome = await revisionOutcomeService.recordOutcome({
      ...validated,
      userId,
    });

    return ResponseHelper.success({
      res,
      message: 'Revision outcome recorded and memory retention updated',
      data: outcome,
    });
  };

  /**
   * Ingests a generic learning event (assessment answer, diagnostic, simulation step).
   */
  public ingestLearningEvent = async (req: Request, res: Response): Promise<Response> => {
    const userId = (req.user as any)?.id;
    const validated = ingestEventSchema.parse(req.body);

    const result = await learningEventService.ingestEvent({
      ...validated,
      userId,
    });

    return ResponseHelper.created(res, result, 'Learning event processed successfully');
  };

  /**
   * Retrieves full learner profile: topic competencies, group mastery, and error history.
   */
  public getLearnerProfile = async (req: Request, res: Response): Promise<Response> => {
    const userId = (req.user as any)?.id;

    const [topics, groups, errors] = await Promise.all([
      revisionRepository.getUserTopicCompetencies(userId),
      revisionRepository.getUserGroupCompetencies(userId),
      revisionRepository.getUserTopicErrors(userId),
    ]);

    return ResponseHelper.success({
      res,
      message: 'Learner competency profile retrieved',
      data: {
        topics,
        groups,
        errors,
      },
    });
  };
}

export const revisionController = new RevisionController();
