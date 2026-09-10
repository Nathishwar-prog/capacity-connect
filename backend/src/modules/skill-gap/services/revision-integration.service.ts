/**
 * Revision Integration Service
 * Seamlessly connects detected skill gaps and root causes to the Adaptive Revision Engine.
 */

import prisma from '../../../database/client';
import { RevisionPlanService } from '../../revision/services/revision-plan.service';
import logger from '../../../logger/winston.logger';

export class RevisionIntegrationService {
  private revisionPlanService: RevisionPlanService;

  constructor() {
    this.revisionPlanService = new RevisionPlanService();
  }

  /**
   * Spawns an adaptive revision session targeted at remediation of a specific skill gap or root cause.
   */
  public async createRemediationSession(params: {
    userId: string;
    competencyId: string;
    courseId?: string | null;
    availableMinutes?: number;
  }) {
    const { userId, competencyId, courseId, availableMinutes = 30 } = params;

    logger.info(
      `Creating remediation revision session for user=${userId}, competency=${competencyId}`
    );

    // 1. Find learning topics mapped to this competency
    const topicMappings = await prisma.learningTopicCompetency.findMany({
      where: { competencyId },
      include: {
        topic: {
          select: {
            id: true,
            groupId: true,
            courseId: true,
          },
        },
      },
    });

    let targetCourseId = courseId;
    let focusGroupId: string | undefined;

    if (topicMappings.length > 0) {
      // Pick the first associated course and group
      if (!targetCourseId) {
        targetCourseId = topicMappings[0].topic.courseId;
      }
      focusGroupId = topicMappings[0].topic.groupId;
    }

    // 2. Invoke Adaptive Revision Plan Service with the resolved focus group
    const sessionPlan = await this.revisionPlanService.generateSessionPlan(userId, {
      courseId: targetCourseId || undefined,
      focusGroupId,
      availableMinutes,
    });

    return {
      message: 'Remediation revision plan generated successfully.',
      competencyId,
      targetCourseId,
      focusGroupId,
      sessionPlan,
    };
  }
}
