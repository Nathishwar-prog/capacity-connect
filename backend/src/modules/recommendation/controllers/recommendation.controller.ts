/**
 * Recommendation Controller
 * 
 * Handles HTTP endpoints for personalized recommendations, event tracking,
 * explicit learner feedback, and administrator outcome metrics.
 */

import { Request, Response } from 'express';
import { ResponseHelper } from '../../../errors/response.helper';
import { RecommendationService } from '../services/recommendation.service';
import {
  getRecommendationsQuerySchema,
  trackEventSchema,
  trackBatchImpressionsSchema,
  submitFeedbackSchema,
  getAdminMetricsQuerySchema,
} from '../validators/recommendation.validator';

export class RecommendationController {
  private recommendationService: RecommendationService;

  constructor() {
    this.recommendationService = new RecommendationService();
  }

  /**
   * GET /api/v1/recommendations
   * Fetches/generates personalized recommendations for the authenticated user.
   */
  public getRecommendations = async (req: Request, res: Response): Promise<Response> => {
    const validated = getRecommendationsQuerySchema.parse({ query: req.query });
    const authUser = (req.user as any);

    const targetUserId =
      authUser.role === 'TRAINEE' || !validated.query.userId
        ? authUser.id
        : validated.query.userId;

    const result = await this.recommendationService.getRecommendations({
      userId: targetUserId,
      surface: validated.query.surface as any,
      limit: validated.query.limit,
      activeCourseId: validated.query.activeCourseId,
    });

    return ResponseHelper.success({
      res,
      data: result,
      message: 'Personalized recommendations retrieved successfully',
    });
  };

  /**
   * GET /api/v1/recommendations/latest
   * Returns the user's latest generated recommendation batch.
   */
  public getLatestBatch = async (req: Request, res: Response): Promise<Response> => {
    const validated = getRecommendationsQuerySchema.parse({ query: req.query });
    const authUser = (req.user as any);

    const targetUserId =
      authUser.role === 'TRAINEE' || !validated.query.userId
        ? authUser.id
        : validated.query.userId;

    const result = await this.recommendationService.getLatestBatch(
      targetUserId,
      validated.query.surface as any
    );

    if (!result) {
      const fresh = await this.recommendationService.getRecommendations({
        userId: targetUserId,
        surface: validated.query.surface as any,
        limit: validated.query.limit,
      });
      return ResponseHelper.success({
        res,
        data: fresh,
        message: 'New recommendations generated',
      });
    }

    return ResponseHelper.success({
      res,
      data: result,
      message: 'Latest recommendation batch retrieved',
    });
  };

  /**
   * POST /api/v1/recommendations/events
   * Tracks an interaction event (IMPRESSION, CLICK, ENROLL, COMPLETE, etc.).
   */
  public trackEvent = async (req: Request, res: Response): Promise<Response> => {
    const validated = trackEventSchema.parse({ body: req.body });
    const authUser = (req.user as any);

    const result = await this.recommendationService.getEventService().trackEvent({
      userId: authUser.id,
      recommendationId: validated.body.recommendationId,
      batchId: validated.body.batchId,
      eventType: validated.body.eventType,
      metadata: validated.body.metadata,
    });

    return ResponseHelper.created(res, result, 'Recommendation event tracked successfully');
  };

  /**
   * POST /api/v1/recommendations/events/impressions
   * Batch tracks multiple impressions when a recommendation view is displayed.
   */
  public trackBatchImpressions = async (req: Request, res: Response): Promise<Response> => {
    const validated = trackBatchImpressionsSchema.parse({ body: req.body });
    const authUser = (req.user as any);

    await this.recommendationService.getEventService().trackBatchImpressions(
      authUser.id,
      validated.body.batchId,
      validated.body.recommendationIds
    );

    return ResponseHelper.success({
      res,
      data: { success: true },
      message: 'Batch impressions tracked',
    });
  };

  /**
   * POST /api/v1/recommendations/feedback
   * Submits explicit negative/positive feedback for a recommended course.
   */
  public submitFeedback = async (req: Request, res: Response): Promise<Response> => {
    const validated = submitFeedbackSchema.parse({ body: req.body });
    const authUser = (req.user as any);

    const result = await this.recommendationService.getFeedbackService().submitFeedback({
      userId: authUser.id,
      recommendationId: validated.body.recommendationId,
      feedbackType: validated.body.feedbackType,
      comment: validated.body.comment,
    });

    return ResponseHelper.created(res, result, 'Recommendation feedback submitted');
  };

  /**
   * GET /api/v1/recommendations/metrics
   * Retrieves educational outcome and recommendation efficacy metrics.
   */
  public getMetrics = async (req: Request, res: Response): Promise<Response> => {
    const validated = getAdminMetricsQuerySchema.parse({ query: req.query });

    const metrics = await this.recommendationService.getOutcomeService().getMetricsSummary(
      validated.query.department
    );

    return ResponseHelper.success({
      res,
      data: metrics,
      message: 'Recommendation outcome metrics retrieved',
    });
  };
}
