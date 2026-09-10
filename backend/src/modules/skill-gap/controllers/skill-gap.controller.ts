/**
 * Skill Gap Controller
 * Handles HTTP requests for Skill Gap Analysis, Multi-Tier Readiness, and Revision Integration.
 */

import { Request, Response } from 'express';
import { ResponseHelper } from '../../../errors/response.helper';
import { SkillGapAnalysisService } from '../services/skill-gap-analysis.service';
import { RevisionIntegrationService } from '../services/revision-integration.service';
import {
  analyzeSkillGapsSchema,
  getSkillGapsQuerySchema,
  getReadinessQuerySchema,
  getAnalysisHistoryQuerySchema,
  analysisIdParamSchema,
  remediateGapSchema,
} from '../validators/skill-gap.validator';

export class SkillGapController {
  private analysisService: SkillGapAnalysisService;
  private revisionIntegrationService: RevisionIntegrationService;

  constructor() {
    this.analysisService = new SkillGapAnalysisService();
    this.revisionIntegrationService = new RevisionIntegrationService();
  }

  /**
   * POST /api/v1/skill-gaps/analyze
   * Runs the complete deterministic analysis pipeline and AI guidance.
   */
  public analyze = async (req: Request, res: Response): Promise<Response> => {
    const validated = analyzeSkillGapsSchema.parse({ body: req.body });
    const authUser = (req.user as any);

    // If trainee, enforce that they can only analyze themselves
    const targetUserId =
      authUser.role === 'TRAINEE' || !validated.body.userId
        ? authUser.id
        : validated.body.userId;

    const result = await this.analysisService.analyzeLearnerGaps({
      userId: targetUserId,
      courseId: validated.body.courseId,
      includeAiGuidance: validated.body.includeAiGuidance,
    });

    return ResponseHelper.created(res, result, 'Skill gap analysis completed successfully');
  };

  /**
   * GET /api/v1/skill-gaps
   * Retrieves active open skill gaps for the learner.
   */
  public getGaps = async (req: Request, res: Response): Promise<Response> => {
    const validated = getSkillGapsQuerySchema.parse({ query: req.query });
    const authUser = (req.user as any);

    const targetUserId =
      authUser.role === 'TRAINEE' || !validated.query.userId
        ? authUser.id
        : validated.query.userId;

    const gaps = await this.analysisService.getLearnerSkillGaps(
      targetUserId,
      validated.query.courseId
    );

    return ResponseHelper.success({
      res,
      message: 'Learner skill gaps retrieved successfully',
      data: gaps,
    });
  };

  /**
   * GET /api/v1/skill-gaps/readiness
   * Retrieves readiness metrics against a course or platform baseline.
   */
  public getReadiness = async (req: Request, res: Response): Promise<Response> => {
    const validated = getReadinessQuerySchema.parse({ query: req.query });
    const authUser = (req.user as any);

    const targetUserId =
      authUser.role === 'TRAINEE' || !validated.query.userId
        ? authUser.id
        : validated.query.userId;

    const analysis = await this.analysisService.analyzeLearnerGaps({
      userId: targetUserId,
      courseId: validated.query.courseId,
      includeAiGuidance: false, // Fast calculation without AI
    });

    return ResponseHelper.success({
      res,
      message: 'Readiness evaluated successfully',
      data: {
        userId: targetUserId,
        courseId: validated.query.courseId || null,
        readiness: analysis.readiness,
        gapCount: analysis.gapCount,
        criticalGapsCount: analysis.criticalGapsCount,
      },
    });
  };

  /**
   * GET /api/v1/skill-gaps/history
   * Retrieves temporal history of analysis snapshots.
   */
  public getHistory = async (req: Request, res: Response): Promise<Response> => {
    const validated = getAnalysisHistoryQuerySchema.parse({ query: req.query });
    const authUser = (req.user as any);

    const targetUserId =
      authUser.role === 'TRAINEE' || !validated.query.userId
        ? authUser.id
        : validated.query.userId;

    const history = await this.analysisService.getAnalysisHistory(
      targetUserId,
      validated.query.courseId
    );

    return ResponseHelper.success({
      res,
      message: 'Analysis history snapshots retrieved',
      data: history,
    });
  };

  /**
   * GET /api/v1/skill-gaps/analysis/:id
   * Retrieves a specific past analysis snapshot by ID.
   */
  public getAnalysisById = async (req: Request, res: Response): Promise<Response> => {
    const { id } = analysisIdParamSchema.parse({ params: req.params }).params;
    const authUser = (req.user as any);

    const analysis = await this.analysisService.getAnalysisById(id, authUser.id);

    if (!analysis) {
      return res.status(404).json({ success: false, message: 'Skill gap analysis not found' });
    }

    if (authUser.role === 'TRAINEE' && analysis.userId !== authUser.id) {
      return res.status(403).json({ success: false, message: 'Forbidden: Access denied to analysis' });
    }

    return ResponseHelper.success({
      res,
      message: 'Skill gap analysis snapshot retrieved',
      data: analysis,
    });
  };

  /**
   * POST /api/v1/skill-gaps/remediate
   * Bridges skill gap remediation directly to the Adaptive Revision Engine.
   */
  public remediate = async (req: Request, res: Response): Promise<Response> => {
    const validated = remediateGapSchema.parse({ body: req.body });
    const authUser = (req.user as any);

    const targetUserId =
      authUser.role === 'TRAINEE' || !validated.body.userId
        ? authUser.id
        : validated.body.userId;

    const result = await this.revisionIntegrationService.createRemediationSession({
      userId: targetUserId,
      competencyId: validated.body.competencyId,
      courseId: validated.body.courseId,
      availableMinutes: validated.body.availableMinutes,
    });

    return ResponseHelper.created(res, result, 'Adaptive remediation session created successfully');
  };
}
