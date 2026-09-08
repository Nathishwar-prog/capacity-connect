/**
 * Recommendation Event Tracking Service
 * 
 * Ingests and tracks granular user interaction events on recommendations:
 * IMPRESSION, CLICK, ENROLL, START, COMPLETE, DISMISS, SAVE, SHARE.
 * Updates recommendation status timestamps (shownAt, clickedAt, actedAt).
 */

import prisma from '../../../database/client';
import { RecommendationEventType } from '@prisma/client';
import logger from '../../../logger/winston.logger';

export interface TrackEventInput {
  userId: string;
  recommendationId?: string;
  batchId?: string;
  eventType: RecommendationEventType;
  metadata?: Record<string, any>;
}

export class RecommendationEventService {
  /**
   * Tracks a user interaction event on a recommendation or batch.
   */
  public async trackEvent(input: TrackEventInput): Promise<{ id: string; success: boolean }> {
    const { userId, recommendationId, batchId, eventType, metadata } = input;

    logger.debug(`Tracking recommendation event: type=${eventType}, user=${userId}, recId=${recommendationId}`);

    const event = await prisma.recommendationEvent.create({
      data: {
        userId,
        recommendationId,
        batchId,
        eventType,
        metadata: metadata ? JSON.stringify(metadata) : undefined,
      },
    });

    // Update recommendation timestamps if recommendationId is provided
    if (recommendationId) {
      const now = new Date();
      const updateData: any = {};

      if (eventType === 'IMPRESSION') {
        updateData.shownAt = now;
      } else if (eventType === 'CLICK') {
        updateData.clickedAt = now;
      } else if (eventType === 'ENROLL' || eventType === 'START' || eventType === 'COMPLETE') {
        updateData.actedAt = now;
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.recommendation.update({
          where: { id: recommendationId },
          data: updateData,
        }).catch(err => {
          logger.warn(`Could not update recommendation timestamp for id=${recommendationId}`, { err });
        });
      }
    }

    return { id: event.id, success: true };
  }

  /**
   * Batch track impressions (e.g. when a recommendation carousel or grid is displayed).
   */
  public async trackBatchImpressions(
    userId: string,
    batchId: string,
    recommendationIds: string[]
  ): Promise<void> {
    const now = new Date();

    const data = recommendationIds.map(recId => ({
      userId,
      batchId,
      recommendationId: recId,
      eventType: 'IMPRESSION' as RecommendationEventType,
    }));

    await prisma.recommendationEvent.createMany({
      data,
    });

    await prisma.recommendation.updateMany({
      where: { id: { in: recommendationIds }, shownAt: null },
      data: { shownAt: now },
    });
  }
}
