import prisma from '../database/client';
import { dataSufficiencyService, DataSufficiencyResult } from './data-sufficiency.service';
import { roleCompetencyService } from './role-competency.service';
import { courseMatchingService, MissingCompetencyInfo } from './course-matching.service';
import { courseRankingService, RankedCourseRecommendation } from './course-ranking.service';
import { NotFoundError } from '../errors/app-error';

export interface TraineeRecommendationResponse {
  sufficiency: DataSufficiencyResult;
  targetRole: {
    id: string;
    name: string;
    code: string;
    department: string | null;
  } | null;
  hasRecommendations: boolean;
  recommendations: RankedCourseRecommendation[];
  unmatchedCompetencies: Array<{
    competencyId: string;
    code: string;
    name: string;
    status: 'NO_COURSE_MATCH';
    message: string;
  }>;
  identifiedGaps: MissingCompetencyInfo[];
}

export class TraineeRecommendationService {
  /**
   * Complete end-to-end recommendation workflow:
   * 1. Data Sufficiency Validation
   * 2. Role Competency Resolution
   * 3. Gap Identification
   * 4. Course Database Matching (Hard Filter)
   * 5. Multi-Factor Explainable Ranking
   */
  public async getTraineeRecommendations(userId: string): Promise<TraineeRecommendationResponse> {
    // 1. Data Sufficiency Check (Deterministic State Machine)
    const sufficiency = await dataSufficiencyService.evaluateSufficiency(userId);

    // Fetch user profile and enrollments
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        traineeProfile: {
          include: { targetRole: true },
        },
        userCompetencies: {
          include: { competency: true },
        },
        enrollments: {
          select: { courseId: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundError(`User '${userId}' not found.`);
    }

    const targetRole = user.traineeProfile?.targetRole || null;
    const enrolledCourseIds = user.enrollments.map((e) => e.courseId);

    // If data is BLOCKED or NEEDS_MORE_DATA, return gracefully with actionable state
    if (sufficiency.status === 'BLOCKED' || sufficiency.status === 'NEEDS_MORE_DATA') {
      return {
        sufficiency,
        targetRole: targetRole
          ? {
              id: targetRole.id,
              name: targetRole.name,
              code: targetRole.code,
              department: targetRole.department,
            }
          : null,
        hasRecommendations: false,
        recommendations: [],
        unmatchedCompetencies: [],
        identifiedGaps: [],
      };
    }

    // 2. Resolve Role Competencies from DB Catalogue
    let missingCompetencies: MissingCompetencyInfo[] = [];

    if (targetRole) {
      const roleRequirements = await roleCompetencyService.getRoleCompetencies(targetRole.id);
      const userCompMap = new Map(user.userCompetencies.map((uc) => [uc.competencyId, uc]));

      for (const req of roleRequirements) {
        const userComp = userCompMap.get(req.competencyId);
        const currentLevel = userComp?.currentLevel ?? 1;
        const gapLevel = Math.max(0, req.requiredLevel - currentLevel);

        if (gapLevel > 0) {
          const gapSeverity =
            gapLevel >= 3 || req.criticality === 'CORE' ? 'CRITICAL' :
            gapLevel === 2 ? 'HIGH' :
            gapLevel === 1 ? 'MEDIUM' : 'LOW';

          missingCompetencies.push({
            competencyId: req.competencyId,
            code: req.code,
            name: req.name,
            requiredLevel: req.requiredLevel,
            currentLevel,
            gapLevel,
            gapSeverity,
            importance: req.importance,
          });
        }
      }
    }

    // 3. Course Matching Engine (HARD AVAILABILITY FILTER)
    const matchingResult = await courseMatchingService.matchCoursesForGaps(missingCompetencies);

    // 4. Recommendation Ranking (6-factor weights + explainable reasoning)
    const rankedRecommendations = courseRankingService.rankCourses(
      matchingResult.courses,
      missingCompetencies,
      {
        targetRoleName: targetRole?.name,
        preferredCategory: user.traineeProfile?.interests[0],
        enrolledCourseIds,
      },
    );

    return {
      sufficiency,
      targetRole: targetRole
        ? {
            id: targetRole.id,
            name: targetRole.name,
            code: targetRole.code,
            department: targetRole.department,
          }
        : null,
      hasRecommendations: rankedRecommendations.length > 0,
      recommendations: rankedRecommendations,
      unmatchedCompetencies: matchingResult.unmatchedCompetencies,
      identifiedGaps: missingCompetencies,
    };
  }
}

export const traineeRecommendationService = new TraineeRecommendationService();
