/**
 * Exploration Candidate Generator
 * 
 * Selects novel, high-quality courses outside the learner's habitual categories
 * to facilitate controlled serendipity and expand institutional capabilities.
 */

import prisma from '../../../database/client';
import { RecommendationCandidate, CandidateSource } from '../recommendation.types';

export interface ExplorationGeneratorOptions {
  userId: string;
  limit?: number;
}

export class ExplorationCandidateGenerator {
  public readonly source: CandidateSource = 'EXPLORATION';

  public async generate(options: ExplorationGeneratorOptions): Promise<RecommendationCandidate[]> {
    const { userId, limit = 10 } = options;

    // 1. Fetch categories the user has already touched
    const userEnrollments = await prisma.enrollment.findMany({
      where: { userId },
      include: { course: { select: { category: true, id: true } } },
    });

    const enrolledCourseIds = new Set(userEnrollments.map(e => e.course.id));
    const familiarCategories = new Set(userEnrollments.map(e => e.course.category));

    // 2. Fetch candidate courses from categories the user has NOT experienced
    // Prioritize high-value MoES domains (NWP, AI/ML, Satellite, Climate)
    const novelCourses = await prisma.course.findMany({
      where: {
        status: 'PUBLISHED',
        id: { notIn: Array.from(enrolledCourseIds) },
        category: { notIn: Array.from(familiarCategories) },
      },
      include: {
        enrollments: {
          select: { status: true },
        },
      },
      take: 20,
    });

    const candidates: RecommendationCandidate[] = [];

    for (const course of novelCourses) {
      const total = course.enrollments.length;
      const completed = course.enrollments.filter(e => e.status === 'COMPLETED').length;
      const compRate = total > 0 ? completed / total : 0.8; // Default prior

      // Exploration score balances quality and novelty
      const noveltyScore = 70 + (compRate * 25);

      candidates.push({
        courseId: course.id,
        source: this.source,
        sourcePriority: noveltyScore,
        reasonCodes: ['EXPLORATION_HORIZON'],
        metadata: {
          title: course.title,
          category: course.category,
          level: course.difficulty,
          isNovelCategory: true,
        },
      });
    }

    candidates.sort((a, b) => b.sourcePriority - a.sourcePriority);
    return candidates.slice(0, limit);
  }
}
