/**
 * Behavioral Candidate Generator
 * 
 * Recommends courses based on the learner's recent behavioral patterns:
 * - Repeatedly clicked or saved recommendations
 * - Courses tied to topics where the learner recently made assessment errors
 */

import prisma from '../../../database/client';
import { RecommendationCandidate, CandidateSource } from '../recommendation.types';

export interface BehavioralGeneratorOptions {
  userId: string;
  limit?: number;
}

export class BehavioralCandidateGenerator {
  public readonly source: CandidateSource = 'BEHAVIORAL';

  public async generate(options: BehavioralGeneratorOptions): Promise<RecommendationCandidate[]> {
    const { userId, limit = 15 } = options;
    const candidates: RecommendationCandidate[] = [];

    // 1. Check recent recommendation clicks or saves in the last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentEvents = await prisma.recommendationEvent.findMany({
      where: {
        userId,
        eventType: { in: ['CLICK', 'SAVE'] },
        createdAt: { gte: thirtyDaysAgo },
      },
      include: {
        recommendation: {
          include: { course: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    for (const ev of recentEvents) {
      if (
        ev.recommendation &&
        ev.recommendation.course &&
        ev.recommendation.courseId &&
        ev.recommendation.course.status === 'PUBLISHED'
      ) {
        const isSave = ev.eventType === 'SAVE';
        candidates.push({
          courseId: ev.recommendation.courseId,
          source: this.source,
          sourcePriority: isSave ? 80 : 65,
          reasonCodes: [isSave ? 'RECENTLY_SAVED' : 'FREQUENTLY_VIEWED_TOPIC'],
          metadata: {
            title: ev.recommendation.course.title,
            category: ev.recommendation.course.category,
            eventType: ev.eventType,
          },
        });
      }
    }

    // 2. Check recent unresolved topic errors (user is struggling with these concepts)
    try {
      const topicErrors = await prisma.userTopicError.findMany({
        where: {
          userId,
          resolvedAt: null,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });

      if (topicErrors.length > 0) {
        const topicIds = topicErrors.map(e => e.topicId);
        const mappings = await prisma.learningTopicCompetency.findMany({
          where: { topicId: { in: topicIds } },
          select: { competencyId: true },
        });

        const compIds = mappings.map(m => m.competencyId);
        if (compIds.length > 0) {
          const remedialCourses = await prisma.courseCompetency.findMany({
            where: {
              competencyId: { in: compIds },
              course: { status: 'PUBLISHED' },
            },
            include: { course: true },
            take: 10,
          });

          for (const rc of remedialCourses) {
            candidates.push({
              courseId: rc.courseId,
              source: this.source,
              sourcePriority: 75,
              reasonCodes: ['FREQUENTLY_VIEWED_TOPIC'],
              metadata: {
                title: rc.course.title,
                category: rc.course.category,
                remedialReason: 'RECENT_TOPIC_STRUGGLES',
              },
            });
          }
        }
      }
    } catch {
      // Graceful fallback if topic errors aren't populated
    }

    // Deduplicate
    const seen = new Set<string>();
    const unique: RecommendationCandidate[] = [];
    for (const c of candidates) {
      if (!seen.has(c.courseId)) {
        seen.add(c.courseId);
        unique.push(c);
      }
    }

    unique.sort((a, b) => b.sourcePriority - a.sourcePriority);
    return unique.slice(0, limit);
  }
}
