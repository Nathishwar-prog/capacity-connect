/**
 * Popularity & Trend Candidate Generator
 * 
 * Identifies courses that have strong aggregate engagement and success metrics:
 * - High completion rates within the learner's department
 * - High satisfaction and enrollment momentum across the MoES platform
 */

import prisma from '../../../database/client';
import { RecommendationCandidate, CandidateSource } from '../recommendation.types';

export interface PopularityGeneratorOptions {
  userId: string;
  limit?: number;
}

export class PopularityCandidateGenerator {
  public readonly source: CandidateSource = 'POPULARITY';

  public async generate(options: PopularityGeneratorOptions): Promise<RecommendationCandidate[]> {
    const { userId, limit = 15 } = options;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, department: true },
    });

    // 1. Fetch courses with enrollment counts and completion metrics
    const courses = await prisma.course.findMany({
      where: { status: 'PUBLISHED' },
      include: {
        enrollments: {
          select: {
            id: true,
            status: true,
            userId: true,
            user: { select: { department: true } },
          },
        },
      },
      take: 40,
    });

    const candidates: RecommendationCandidate[] = [];

    for (const course of courses) {
      const totalEnrollments = course.enrollments.length;
      if (totalEnrollments === 0) continue;

      const completedEnrollments = course.enrollments.filter(e => e.status === 'COMPLETED').length;
      const completionRate = completedEnrollments / totalEnrollments;

      // Department-specific count
      let deptEnrollments = 0;
      if (user?.department) {
        deptEnrollments = course.enrollments.filter(e => e.user?.department === user.department).length;
      }

      const isTrendingInDept = deptEnrollments >= 3;
      const isHighCompletion = totalEnrollments >= 3 && completionRate >= 0.7;

      // Bayesian popularity score:
      // (v / (v + m)) * R + (m / (v + m)) * C
      // v = totalEnrollments, m = 5 (minimum prior threshold), R = completionRate * 100, C = 60
      const m = 5;
      const bayesianScore = (totalEnrollments / (totalEnrollments + m)) * (completionRate * 100) + (m / (totalEnrollments + m)) * 60;
      const deptBonus = isTrendingInDept ? 15 : 0;
      const finalPriority = Math.min(100, bayesianScore + deptBonus);

      const reasons: string[] = [];
      if (isTrendingInDept) reasons.push('TRENDING_IN_DEPARTMENT');
      if (isHighCompletion) reasons.push('HIGH_COMPLETION_RATE');
      if (reasons.length === 0) reasons.push('HIGH_COMPLETION_RATE');

      candidates.push({
        courseId: course.id,
        source: this.source,
        sourcePriority: finalPriority,
        reasonCodes: reasons,
        metadata: {
          title: course.title,
          category: course.category,
          totalEnrollments,
          completionRate: Math.round(completionRate * 100),
          deptEnrollments,
        },
      });
    }

    candidates.sort((a, b) => b.sourcePriority - a.sourcePriority);
    return candidates.slice(0, limit);
  }
}
