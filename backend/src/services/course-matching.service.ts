import prisma from '../database/client';
import { CourseStatus } from '@prisma/client';

export interface MissingCompetencyInfo {
  competencyId: string;
  code: string;
  name: string;
  requiredLevel: number;
  currentLevel: number;
  gapLevel: number;
  gapSeverity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  importance: number;
}

export interface MatchedCourseItem {
  courseId: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  difficulty: string;
  durationMinutes: number;
  thumbnailUrl: string | null;
  trainer: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string | null;
  };
  courseCompetencies: Array<{
    competencyId: string;
    name: string;
    targetLevel: number;
    importance: number;
    weight: number;
  }>;
  averageRating: number;
  popularityScore: number;
  qualityScore: number;
}

export interface CourseMatchingResult {
  hasAvailableCourses: boolean;
  courses: MatchedCourseItem[];
  missingCompetenciesWithCourses: string[]; // Competency IDs covered by DB courses
  unmatchedCompetencies: Array<{
    competencyId: string;
    code: string;
    name: string;
    status: 'NO_COURSE_MATCH';
    message: string;
  }>;
}

export class CourseMatchingService {
  /**
   * Matches identified competency gaps to real, published courses in PostgreSQL
   * Enforces HARD AVAILABILITY FILTER
   */
  public async matchCoursesForGaps(
    missingCompetencies: MissingCompetencyInfo[],
  ): Promise<CourseMatchingResult> {
    if (missingCompetencies.length === 0) {
      // If no gaps, return top foundational published courses
      const publishedCourses = await prisma.course.findMany({
        where: {
          status: CourseStatus.PUBLISHED,
          deletedAt: null,
        },
        include: {
          trainer: true,
          courseCompetencies: {
            include: { competency: true },
          },
          recommendationProfile: true,
        },
        take: 6,
      });

      return {
        hasAvailableCourses: publishedCourses.length > 0,
        courses: publishedCourses.map(this.formatCourse),
        missingCompetenciesWithCourses: [],
        unmatchedCompetencies: [],
      };
    }

    const gapCompIds = missingCompetencies.map((g) => g.competencyId);

    // Query DB for PUBLISHED courses covering ANY of the missing competencies
    const availableCourses = await prisma.course.findMany({
      where: {
        status: CourseStatus.PUBLISHED,
        deletedAt: null,
        courseCompetencies: {
          some: {
            competencyId: { in: gapCompIds },
          },
        },
      },
      include: {
        trainer: true,
        courseCompetencies: {
          include: { competency: true },
        },
        recommendationProfile: true,
      },
    });

    // Identify which competencies are covered by at least one course
    const coveredCompIds = new Set<string>();
    for (const c of availableCourses) {
      for (const cc of c.courseCompetencies) {
        if (gapCompIds.includes(cc.competencyId)) {
          coveredCompIds.add(cc.competencyId);
        }
      }
    }

    // Determine unmatched competencies (HARD FILTER)
    const unmatchedCompetencies = missingCompetencies
      .filter((g) => !coveredCompIds.has(g.competencyId))
      .map((g) => ({
        competencyId: g.competencyId,
        code: g.code,
        name: g.name,
        status: 'NO_COURSE_MATCH' as const,
        message: `${g.name} is one of your key required skill areas, but we currently do not have a matching published course available in the curriculum. You can explore related foundational courses or check back when new modules are published.`,
      }));

    return {
      hasAvailableCourses: availableCourses.length > 0,
      courses: availableCourses.map(this.formatCourse),
      missingCompetenciesWithCourses: Array.from(coveredCompIds),
      unmatchedCompetencies,
    };
  }

  private formatCourse(c: any): MatchedCourseItem {
    return {
      courseId: c.id,
      title: c.title,
      slug: c.slug,
      description: c.description,
      category: c.category,
      difficulty: c.difficulty,
      durationMinutes: c.durationMinutes,
      thumbnailUrl: c.thumbnailUrl,
      trainer: {
        id: c.trainer.id,
        firstName: c.trainer.firstName,
        lastName: c.trainer.lastName,
        avatarUrl: c.trainer.avatarUrl,
      },
      courseCompetencies: c.courseCompetencies.map((cc: any) => ({
        competencyId: cc.competencyId,
        name: cc.competency.name,
        targetLevel: cc.targetLevel,
        importance: cc.importance,
        weight: cc.weight,
      })),
      averageRating: c.recommendationProfile?.averageRating || 4.7,
      popularityScore: c.recommendationProfile?.popularityScore || 65.0,
      qualityScore: c.recommendationProfile?.qualityScore || 80.0,
    };
  }
}

export const courseMatchingService = new CourseMatchingService();
