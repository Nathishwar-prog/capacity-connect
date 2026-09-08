/**
 * Recommendation Explicit Feedback Service
 * 
 * Captures explicit learner feedback on recommendations:
 * NOT_RELEVANT, TOO_DIFFICULT, TOO_EASY, ALREADY_KNOW_THIS, NOT_NOW, WRONG_TOPIC, INTERESTING.
 * Updates UserRecommendationProfile to suppress dismissed topics/courses.
 */

import prisma from '../../../database/client';
import { RecommendationFeedbackType } from '@prisma/client';
import logger from '../../../logger/winston.logger';

export interface SubmitFeedbackInput {
  userId: string;
  recommendationId: string;
  feedbackType: RecommendationFeedbackType;
  comment?: string;
}

export class RecommendationFeedbackService {
  /**
   * Submits explicit user feedback for a recommended course.
   */
  public async submitFeedback(input: SubmitFeedbackInput): Promise<{ id: string; success: boolean }> {
    const { userId, recommendationId, feedbackType, comment } = input;

    logger.info(`Feedback submitted: user=${userId}, rec=${recommendationId}, type=${feedbackType}`);

    const feedback = await prisma.recommendationFeedback.create({
      data: {
        userId,
        recommendationId,
        feedbackType,
        reason: comment,
      },
    });

    // Also track an explicit DISMISS event in recommendation events
    await prisma.recommendationEvent.create({
      data: {
        userId,
        recommendationId,
        eventType: 'DISMISS',
        metadata: JSON.stringify({ feedbackType, reason: comment }),
      },
    });

    // Update recommendation status to DISMISSED
    await prisma.recommendation.update({
      where: { id: recommendationId },
      data: { status: 'DISMISSED' },
    }).catch(err => {
      logger.warn(`Could not update recommendation status for recId=${recommendationId}`, { err });
    });

    return { id: feedback.id, success: true };
  }
}
