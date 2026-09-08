/**
 * Content-Similarity Candidate Generator
 * 
 * Recommends courses whose content, topics, and category closely match
 * courses the learner has already enjoyed, completed, or highly rated.
 */

import prisma from '../../../database/client';
import { RecommendationCandidate, CandidateSource } from '../recommendation.types';
import { calculateContentSimilarity } from '../algorithms/content-similarity.algorithm';

export interface ContentGeneratorOptions {
  userId: string;
  limit?: number;
}

export class ContentCandidateGenerator {
  public readonly source: CandidateSource = 'CONTENT_SIMILARITY';

  public async generate(options: ContentGeneratorOptions): Promise<RecommendationCandidate[]> {
    const { userId, limit = 15 } = options;

    // 1. Fetch courses the user has successfully completed or rated highly
    const completedEnrollments = await prisma.enrollment.findMany({
      where: {
        userId,
        status: 'COMPLETED',
      },
      include: {
        course: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    });

    if (completedEnrollments.length === 0) {
      return [];
    }

    const completedCourseIds = new Set(completedEnrollments.map(e => e.courseId));

    // 2. Fetch candidate published courses that user has NOT completed
    const candidateCourses = await prisma.course.findMany({
      where: {
        status: 'PUBLISHED',
        id: { notIn: Array.from(completedCourseIds) },
      },
      take: 50,
    });

    const candidates: RecommendationCandidate[] = [];

    for (const cand of candidateCourses) {
      const candMeta = {
        category: cand.category,
        topics: [cand.category],
        description: cand.description || '',
      };

      let bestSimilarity = 0;
      let matchingSourceTitle = '';

      for (const enr of completedEnrollments) {
        const sourceMeta = {
          category: enr.course.category,
          topics: [enr.course.category],
          description: enr.course.description || '',
        };

        const sim = calculateContentSimilarity(candMeta, sourceMeta);
        if (sim > bestSimilarity) {
          bestSimilarity = sim;
          matchingSourceTitle = enr.course.title;
        }
      }

      // Filter out courses with trivial similarity
      if (bestSimilarity >= 30) {
        candidates.push({
          courseId: cand.id,
          source: this.source,
          sourcePriority: bestSimilarity,
          reasonCodes: ['SIMILAR_TO_COMPLETED'],
          metadata: {
            title: cand.title,
            category: cand.category,
            similarityScore: bestSimilarity,
            matchedCourseTitle: matchingSourceTitle,
          },
        });
      }
    }

    candidates.sort((a, b) => b.sourcePriority - a.sourcePriority);
    return candidates.slice(0, limit);
  }
}
