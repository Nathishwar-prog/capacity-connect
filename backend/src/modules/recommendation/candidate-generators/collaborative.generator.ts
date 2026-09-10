/**
 * Collaborative Filtering Candidate Generator
 * 
 * Recommends courses taken and completed by peer learners with similar
 * completion histories (Jaccard similarity on completed course sets).
 * Completely cold-start safe (returns empty if learner has no history).
 */

import prisma from '../../../database/client';
import { RecommendationCandidate, CandidateSource } from '../recommendation.types';
import { calculateCollaborativeScore, PeerLearnerHistory } from '../algorithms/collaborative.algorithm';

export interface CollaborativeGeneratorOptions {
  userId: string;
  limit?: number;
}

export class CollaborativeCandidateGenerator {
  public readonly source: CandidateSource = 'COLLABORATIVE';

  public async generate(options: CollaborativeGeneratorOptions): Promise<RecommendationCandidate[]> {
    const { userId, limit = 10 } = options;

    // 1. Fetch user's completed courses
    const userCompletions = await prisma.enrollment.findMany({
      where: {
        userId,
        status: 'COMPLETED',
      },
      select: { courseId: true },
    });

    const userCourseIds = userCompletions.map(c => c.courseId);
    if (userCourseIds.length === 0) {
      // Cold-start safe: return empty list, do not fabricate
      return [];
    }

    // 2. Fetch other learners who completed at least one of the same courses
    const peerCompletions = await prisma.enrollment.findMany({
      where: {
        userId: { not: userId },
        status: 'COMPLETED',
        courseId: { in: userCourseIds },
      },
      select: { userId: true },
      distinct: ['userId'],
      take: 30,
    });

    const peerUserIds = peerCompletions.map(p => p.userId);
    if (peerUserIds.length === 0) {
      return [];
    }

    // 3. Fetch all completed courses for these peer users
    const allPeerEnrollments = await prisma.enrollment.findMany({
      where: {
        userId: { in: peerUserIds },
        status: 'COMPLETED',
      },
      select: {
        userId: true,
        courseId: true,
      },
    });

    // Group by peer
    const peerMap = new Map<string, string[]>();
    for (const enr of allPeerEnrollments) {
      if (!peerMap.has(enr.userId)) {
        peerMap.set(enr.userId, []);
      }
      peerMap.get(enr.userId)!.push(enr.courseId);
    }

    const peerHistories: PeerLearnerHistory[] = [];
    const candidateCourseIds = new Set<string>();

    for (const [pId, courses] of peerMap.entries()) {
      peerHistories.push({
        peerUserId: pId,
        completedCourseIds: courses,
      });

      for (const cId of courses) {
        if (!userCourseIds.includes(cId)) {
          candidateCourseIds.add(cId);
        }
      }
    }

    if (candidateCourseIds.size === 0) {
      return [];
    }

    // 4. Fetch published course details for candidate courses
    const validCandidateCourses = await prisma.course.findMany({
      where: {
        id: { in: Array.from(candidateCourseIds) },
        status: 'PUBLISHED',
      },
      select: { id: true, title: true, category: true },
    });

    const candidates: RecommendationCandidate[] = [];

    for (const course of validCandidateCourses) {
      const collabScore = calculateCollaborativeScore(
        userCourseIds,
        peerHistories,
        course.id
      );

      if (collabScore > 10) {
        candidates.push({
          courseId: course.id,
          source: this.source,
          sourcePriority: collabScore,
          reasonCodes: ['PEER_COMPLETED'],
          metadata: {
            title: course.title,
            category: course.category,
            collaborativeScore: collabScore,
          },
        });
      }
    }

    candidates.sort((a, b) => b.sourcePriority - a.sourcePriority);
    return candidates.slice(0, limit);
  }
}
