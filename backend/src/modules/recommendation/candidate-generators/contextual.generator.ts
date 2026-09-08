/**
 * Contextual Candidate Generator
 * 
 * Generates candidates based on the active session context:
 * - Surface (DASHBOARD, COURSE_PAGE, ASSESSMENT_RESULT, etc.)
 * - Active course being viewed or completed
 * - Learner's departmental affiliation and role
 */

import prisma from '../../../database/client';
import { RecommendationCandidate, CandidateSource, RecommendationSurface } from '../recommendation.types';

export interface ContextualGeneratorOptions {
  userId: string;
  surface?: RecommendationSurface;
  activeCourseId?: string;
  limit?: number;
}

export class ContextualCandidateGenerator {
  public readonly source: CandidateSource = 'CONTEXTUAL';

  public async generate(options: ContextualGeneratorOptions): Promise<RecommendationCandidate[]> {
    const { userId, surface = 'DASHBOARD', activeCourseId, limit = 15 } = options;
    const candidates: RecommendationCandidate[] = [];

    // Fetch user profile (to determine department/role)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        department: true,
        role: true,
      },
    });

    const deptName = user?.department?.name;

    // 1. Course page context: find courses in same category or sibling courses
    if (activeCourseId) {
      const activeCourse = await prisma.course.findUnique({
        where: { id: activeCourseId },
        select: { id: true, category: true, difficulty: true },
      });

      if (activeCourse) {
        const relatedCourses = await prisma.course.findMany({
          where: {
            id: { not: activeCourseId },
            status: 'PUBLISHED',
            category: activeCourse.category,
          },
          take: 10,
        });

        for (const rc of relatedCourses) {
          candidates.push({
            courseId: rc.id,
            source: this.source,
            sourcePriority: 75,
            reasonCodes: ['RELATED_TO_CURRENT_COURSE'],
            metadata: {
              title: rc.title,
              category: rc.category,
              relation: 'SAME_CATEGORY',
            },
          });
        }
      }
    }

    // 2. Departmental / Institutional focus
    if (deptName) {
      // Find courses categorized under or matching user department
      const deptCourses = await prisma.course.findMany({
        where: {
          status: 'PUBLISHED',
          OR: [
            { category: { contains: deptName, mode: 'insensitive' } },
            { description: { contains: deptName, mode: 'insensitive' } },
            { title: { contains: deptName, mode: 'insensitive' } },
          ],
        },
        take: 10,
      });

      for (const dc of deptCourses) {
        if (!candidates.some(c => c.courseId === dc.id)) {
          candidates.push({
            courseId: dc.id,
            source: this.source,
            sourcePriority: 70,
            reasonCodes: ['DEPARTMENT_FOCUS'],
            metadata: {
              title: dc.title,
              category: dc.category,
              department: deptName,
            },
          });
        }
      }
    }

    // 3. Surface-specific boosts
    if (surface === 'ASSESSMENT_RESULT') {
      for (const c of candidates) {
        c.sourcePriority = Math.min(100, c.sourcePriority + 10);
      }
    }

    candidates.sort((a, b) => b.sourcePriority - a.sourcePriority);
    return candidates.slice(0, limit);
  }
}
