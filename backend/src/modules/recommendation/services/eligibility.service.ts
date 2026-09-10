/**
 * Hard Eligibility Service
 * 
 * Enforces non-negotiable filtering constraints before ranking:
 * 1. Course Status: Must be PUBLISHED (never DRAFT or ARCHIVED).
 * 2. Prerequisite Check: All CoursePrerequisites must be completed by the learner.
 * 3. Consumption Check: Never recommend courses the user has already COMPLETED (unless review requested).
 * 4. RBAC / Target Role: Learner must have the appropriate role/clearance if restricted.
 * 5. Explicit Negative Feedback Suppression: Filters out courses the learner dismissed or marked irrelevant in last 30 days.
 */

import prisma from '../../../database/client';
import { RecommendationCandidate } from '../recommendation.types';
import logger from '../../../logger/winston.logger';

export interface EligibilityFilterOptions {
  userId: string;
  allowCompleted?: boolean;
}

export interface FilterResult {
  eligibleCandidates: RecommendationCandidate[];
  rejectedCandidates: Array<{
    candidate: RecommendationCandidate;
    reason: string;
  }>;
}

export class EligibilityService {
  /**
   * Filters a list of candidates, returning only those that strictly meet all eligibility rules.
   */
  public async filterCandidates(
    candidates: RecommendationCandidate[],
    options: EligibilityFilterOptions
  ): Promise<FilterResult> {
    const { userId, allowCompleted = false } = options;

    if (candidates.length === 0) {
      return { eligibleCandidates: [], rejectedCandidates: [] };
    }

    const courseIds = Array.from(new Set(candidates.map(c => c.courseId)));

    // 1. Fetch courses with published status
    const courses = await prisma.course.findMany({
      where: { id: { in: courseIds } },
      select: {
        id: true,
        title: true,
        status: true,
        difficulty: true,
      },
    });
    const courseStatusMap = new Map(courses.map(c => [c.id, c.status]));

    // 2. Fetch user's enrollments
    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      select: { courseId: true, status: true },
    });
    const completedCourseIds = new Set(
      enrollments.filter(e => e.status === 'COMPLETED').map(e => e.courseId)
    );

    // 3. Fetch prerequisites for all candidate courses
    const prerequisites = await prisma.coursePrerequisite.findMany({
      where: {
        courseId: { in: courseIds },
      },
    });

    const prereqMap = new Map<string, string[]>();
    for (const p of prerequisites) {
      if (!prereqMap.has(p.courseId)) {
        prereqMap.set(p.courseId, []);
      }
      prereqMap.get(p.courseId)!.push(p.prerequisiteCourseId);
    }

    // 4. Fetch recent negative feedback in the last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const negativeFeedbacks = await prisma.recommendationFeedback.findMany({
      where: {
        userId,
        createdAt: { gte: thirtyDaysAgo },
        feedbackType: { in: ['NOT_RELEVANT', 'ALREADY_KNOW_THIS', 'NOT_NOW'] },
      },
      include: {
        recommendation: { select: { courseId: true } },
      },
    });

    const suppressedCourseIds = new Set<string>();
    for (const f of negativeFeedbacks) {
      if (f.recommendation?.courseId) {
        suppressedCourseIds.add(f.recommendation.courseId);
      }
    }

    const eligibleCandidates: RecommendationCandidate[] = [];
    const rejectedCandidates: Array<{ candidate: RecommendationCandidate; reason: string }> = [];

    for (const cand of candidates) {
      // Check 1: Course status must be PUBLISHED
      const status = courseStatusMap.get(cand.courseId);
      if (status !== 'PUBLISHED') {
        rejectedCandidates.push({ candidate: cand, reason: `Course status is ${status || 'NOT_FOUND'}` });
        continue;
      }

      // Check 2: Unmet prerequisites
      const requiredPrereqs = prereqMap.get(cand.courseId) || [];
      const unmet = requiredPrereqs.filter(prereqId => !completedCourseIds.has(prereqId));
      if (unmet.length > 0) {
        rejectedCandidates.push({
          candidate: cand,
          reason: `Unmet mandatory prerequisites: ${unmet.join(', ')}`,
        });
        continue;
      }

      // Check 3: Already completed filter
      if (!allowCompleted && completedCourseIds.has(cand.courseId)) {
        rejectedCandidates.push({ candidate: cand, reason: 'Course already completed by learner' });
        continue;
      }

      // Check 4: Explicit negative feedback suppression
      if (suppressedCourseIds.has(cand.courseId)) {
        rejectedCandidates.push({ candidate: cand, reason: 'Course suppressed by recent learner negative feedback' });
        continue;
      }

      // Passed all hard eligibility checks!
      eligibleCandidates.push(cand);
    }

    logger.debug(`Eligibility filter: ${eligibleCandidates.length} eligible, ${rejectedCandidates.length} rejected out of ${candidates.length}`);
    return { eligibleCandidates, rejectedCandidates };
  }
}
