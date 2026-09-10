/**
 * Continuation Candidate Generator
 * 
 * Identifies courses that represent the logical next step in a learner's progression:
 * 1. Courses currently in progress that should be resumed/continued.
 * 2. Downstream courses whose prerequisites the learner has recently fulfilled.
 */

import prisma from '../../../database/client';
import { RecommendationCandidate, CandidateSource } from '../recommendation.types';

export interface ContinuationGeneratorOptions {
  userId: string;
  limit?: number;
}

export class ContinuationCandidateGenerator {
  public readonly source: CandidateSource = 'CONTINUATION';

  public async generate(options: ContinuationGeneratorOptions): Promise<RecommendationCandidate[]> {
    const { userId, limit = 15 } = options;
    const candidates: RecommendationCandidate[] = [];

    // 1. In-progress enrollments (resume learning)
    const inProgressEnrollments = await prisma.enrollment.findMany({
      where: {
        userId,
        status: { in: ['IN_PROGRESS', 'ENROLLED'] },
        course: { status: 'PUBLISHED' },
      },
      include: {
        course: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    });

    for (const enr of inProgressEnrollments) {
      // If progress > 0, high priority to continue
      const progress = enr.progressPercentage || 0;
      const progressBonus = progress > 0 ? (progress / 100) * 30 : 15;
      candidates.push({
        courseId: enr.courseId,
        source: this.source,
        sourcePriority: 70 + progressBonus,
        reasonCodes: ['CONTINUES_LEARNING_PATH'],
        metadata: {
          title: enr.course.title,
          category: enr.course.category,
          progress,
          type: 'IN_PROGRESS_RESUME',
        },
      });
    }

    // 2. Courses unlocked by recently completed courses
    const completedEnrollments = await prisma.enrollment.findMany({
      where: {
        userId,
        status: 'COMPLETED',
      },
      select: { courseId: true },
    });

    const completedCourseIds = completedEnrollments.map(e => e.courseId);

    if (completedCourseIds.length > 0) {
      // Find course prerequisites where prerequisiteCourseId is completed
      const downstreamPrereqs = await prisma.coursePrerequisite.findMany({
        where: {
          prerequisiteCourseId: { in: completedCourseIds },
          course: {
            status: 'PUBLISHED',
            id: { notIn: completedCourseIds }, // Don't recommend courses already completed
          },
        },
        include: {
          course: true,
          prerequisiteCourse: true,
        },
        take: limit,
      });

      // For each downstream course, verify if ALL its prerequisites are completed
      for (const dp of downstreamPrereqs) {
        const allPrereqs = await prisma.coursePrerequisite.findMany({
          where: { courseId: dp.courseId },
        });

        const allMet = allPrereqs.every(p => completedCourseIds.includes(p.prerequisiteCourseId));

        if (allMet) {
          // Downstream course is completely unlocked!
          candidates.push({
            courseId: dp.courseId,
            source: this.source,
            sourcePriority: 85,
            reasonCodes: ['PREREQUISITE_COMPLETED', 'CONTINUES_LEARNING_PATH'],
            metadata: {
              title: dp.course.title,
              category: dp.course.category,
              unlockedByCourseId: dp.prerequisiteCourseId,
              unlockedByTitle: dp.prerequisiteCourse.title,
              type: 'DOWNSTREAM_UNLOCKED',
            },
          });
        }
      }
    }

    // Deduplicate candidates by courseId
    const seen = new Set<string>();
    const uniqueCandidates: RecommendationCandidate[] = [];
    for (const c of candidates) {
      if (!seen.has(c.courseId)) {
        seen.add(c.courseId);
        uniqueCandidates.push(c);
      }
    }

    uniqueCandidates.sort((a, b) => b.sourcePriority - a.sourcePriority);
    return uniqueCandidates.slice(0, limit);
  }
}
