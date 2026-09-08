/**
 * Comprehensive Feature Builder
 * Capacity Connect — Learning-to-Rank Recommendation Engine
 * Extracts 54 versioned features for (USER, COURSE) candidate pairs
 */

import prisma from '../../../database/client';
import {
  RawFeatureVector,
  NormalizedFeatureVector,
  CURRENT_FEATURE_VERSION,
} from './feature.types';
import { FeatureNormalizer } from './feature-normalizer';

const CATEGORY_MAP: Record<string, number> = {
  NWP_MODELING: 1,
  RADAR_METEOROLOGY: 2,
  SATELLITE_METEOROLOGY: 3,
  SEISMOLOGY: 4,
  OCEAN_FORECASTING: 5,
  CLIMATE_DYNAMICS: 6,
  METEOROLOGICAL_INSTRUMENTATION: 7,
  DATA_ASSIMILATION: 8,
  HYDROLOGICAL_MODELING: 9,
  AGROMETEOROLOGY: 10,
  WEATHER_FORECASTING: 11,
  ATMOSPHERIC_PHYSICS: 12,
};

const DIFFICULTY_MAP: Record<string, number> = {
  BEGINNER: 1,
  INTERMEDIATE: 2,
  ADVANCED: 3,
  EXPERT: 4,
};

export class FeatureBuilder {
  /**
   * Builds normalized feature vectors for all candidate courses for a given user.
   */
  public static async buildCandidateFeatures(
    userId: string,
    candidateCourseIds: string[],
    _context?: { surface?: string; activeCourseId?: string }
  ): Promise<Map<string, NormalizedFeatureVector>> {
    const resultMap = new Map<string, NormalizedFeatureVector>();
    if (candidateCourseIds.length === 0) return resultMap;

    // 1. Fetch User Profile, Competencies, Skill Gaps, Enrollments & Progress
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        department: true,
        userCompetencies: { include: { competency: true } },
        skillGaps: {
          where: { status: 'OPEN' },
          include: { competency: true },
        },
        enrollments: {
          include: {
            course: {
              select: {
                id: true,
                category: true,
                courseCompetencies: true,
              },
            },
          },
        },
      },
    });

    if (!user) return resultMap;

    const userDeptId = user.departmentId;
    const userOrgId = user.organizationId;
    const userRole = user.role;

    // Build User Competency Level Map
    const userCompMap = new Map<string, number>();
    for (const uc of user.userCompetencies) {
      userCompMap.set(uc.competencyId, uc.currentLevel);
    }

    // Build User Open Skill Gaps Map
    const skillGapMap = new Map<string, { required: number; current: number; priority: string; severity: number }>();
    for (const sg of user.skillGaps) {
      skillGapMap.set(sg.competencyId, {
        required: sg.requiredLevel,
        current: sg.currentLevel,
        priority: sg.priority,
        severity: sg.gapSeverity || Math.max(0, sg.requiredLevel - sg.currentLevel),
      });
    }

    // User completion history
    const completedCourseIds = new Set(
      user.enrollments.filter(e => e.status === 'COMPLETED').map(e => e.courseId)
    );
    const completedCategories = new Set(
      user.enrollments.filter(e => e.status === 'COMPLETED').map(e => e.course.category)
    );
    const viewedCategories = new Set(user.enrollments.map(e => e.course.category));

    // 2. Fetch Course Details for all candidates
    const courses = await prisma.course.findMany({
      where: { id: { in: candidateCourseIds } },
      include: {
        courseCompetencies: { include: { competency: true } },
        prerequisites: true,
        recommendationProfile: true,
        feedbacks: { select: { rating: true } },
        enrollments: { select: { status: true } },
      },
    });

    // 3. Fetch Historical Recommendation Events for this User
    const userEvents = await prisma.recommendationEvent.findMany({
      where: {
        userId,
        courseId: { in: candidateCourseIds },
      },
    });

    const eventStatsMap = new Map<string, {
      impressions: number;
      clicks: number;
      enrolls: number;
      completions: number;
      abandons: number;
      lastTimestamp: Date | null;
    }>();

    for (const ev of userEvents) {
      if (!ev.courseId) continue;
      if (!eventStatsMap.has(ev.courseId)) {
        eventStatsMap.set(ev.courseId, {
          impressions: 0,
          clicks: 0,
          enrolls: 0,
          completions: 0,
          abandons: 0,
          lastTimestamp: null,
        });
      }
      const stats = eventStatsMap.get(ev.courseId)!;
      if (ev.eventType === 'IMPRESSION' || ev.eventType === 'VIEW') stats.impressions++;
      if (ev.eventType === 'CLICK') stats.clicks++;
      if (ev.eventType === 'ENROLL' || ev.eventType === 'START') stats.enrolls++;
      if (ev.eventType === 'COMPLETE') stats.completions++;
      if (ev.eventType === 'ABANDON' || ev.eventType === 'DISMISS') stats.abandons++;
      if (!stats.lastTimestamp || ev.createdAt > stats.lastTimestamp) {
        stats.lastTimestamp = ev.createdAt;
      }
    }

    const now = new Date();

    // 4. Construct Feature Vectors for each Candidate
    for (const course of courses) {
      // Skill Features
      let maxGap = 0;
      let totalGap = 0;
      let weightedGap = 0;
      let criticalGaps = 0;
      let highGaps = 0;
      let matchedCompCount = 0;
      let totalCompImportance = 0;
      let avgRequired = 0;
      let avgCurrent = 0;

      const compCount = course.courseCompetencies.length;
      for (const cc of course.courseCompetencies) {
        const userLevel = userCompMap.get(cc.competencyId) ?? 0;
        const gapInfo = skillGapMap.get(cc.competencyId);
        const diff = cc.targetLevel - userLevel;

        avgRequired += cc.targetLevel;
        avgCurrent += userLevel;
        totalCompImportance += cc.importance;

        if (diff > 0) {
          matchedCompCount++;
          if (diff > maxGap) maxGap = diff;
          totalGap += diff;
          weightedGap += diff * cc.importance * (cc.criticality === 'CORE' ? 1.5 : 1.0);
        }

        if (gapInfo) {
          if (gapInfo.priority === 'CRITICAL') criticalGaps++;
          else if (gapInfo.priority === 'HIGH') highGaps++;
        }
      }

      const avgSkillGap = compCount > 0 ? totalGap / compCount : 0;
      const competencyCoverage = compCount > 0 ? matchedCompCount / compCount : 0;
      const gapCoverage = user.skillGaps.length > 0 ? matchedCompCount / user.skillGaps.length : 0;
      const requiredLevel = compCount > 0 ? avgRequired / compCount : 1;
      const currentLevel = compCount > 0 ? avgCurrent / compCount : 0;
      const levelDifference = requiredLevel - currentLevel;
      const competencyImportance = compCount > 0 ? totalCompImportance / compCount : 1.0;

      // Prerequisite Features
      const prereqCount = course.prerequisites.length;
      let satisfiedPrereqs = 0;
      for (const pr of course.prerequisites) {
        if (completedCourseIds.has(pr.prerequisiteCourseId)) {
          satisfiedPrereqs++;
        }
      }
      const satisfiedPrerequisiteRatio = prereqCount > 0 ? satisfiedPrereqs / prereqCount : 1.0;
      const missingPrerequisiteCount = prereqCount - satisfiedPrereqs;
      const prerequisiteGapSeverity = missingPrerequisiteCount > 0 ? missingPrerequisiteCount / Math.max(1, prereqCount) : 0;
      const prerequisiteReadiness = satisfiedPrerequisiteRatio;

      // Behavior Features
      const evStats = eventStatsMap.get(course.id) || {
        impressions: 0,
        clicks: 0,
        enrolls: 0,
        completions: 0,
        abandons: 0,
        lastTimestamp: null,
      };

      const daysSinceInteraction = evStats.lastTimestamp
        ? Math.max(0, (now.getTime() - evStats.lastTimestamp.getTime()) / (1000 * 60 * 60 * 24))
        : 180;
      const activityRecency = Math.exp(-0.05 * daysSinceInteraction);

      // Course Features
      const difficulty = DIFFICULTY_MAP[course.difficulty] || 1;
      const durationMinutes = course.durationMinutes || 60;
      const categoryCode = CATEGORY_MAP[course.category] || 11;
      const prof = course.recommendationProfile;
      const qualityScore = prof?.qualityScore ?? (course.feedbacks.length ? (course.feedbacks.reduce((a, b) => a + b.rating, 0) / course.feedbacks.length) * 20 : 75);
      const completionRate = prof?.completionRate ?? (course.enrollments.length ? course.enrollments.filter(e => e.status === 'COMPLETED').length / course.enrollments.length : 0.5);
      const averageRating = prof?.averageRating ?? (course.feedbacks.length ? course.feedbacks.reduce((a, b) => a + b.rating, 0) / course.feedbacks.length : 4.5);
      const dropoutRate = 1.0 - completionRate;

      const daysSincePublished = course.publishedAt
        ? Math.max(0, (now.getTime() - course.publishedAt.getTime()) / (1000 * 60 * 60 * 24))
        : 30;
      const freshness = Math.exp(-0.01 * daysSincePublished);

      // Context Features
      const departmentMatch = userDeptId && course.organizationId === userOrgId ? 1 : 0;
      const organizationMatch = course.organizationId === userOrgId ? 1 : 0;
      const roleMatch = userRole === 'TRAINEE' ? 1 : 0;
      const categoryMatch = viewedCategories.has(course.category) ? 1 : 0;
      const learningPathMatch = completedCategories.has(course.category) ? 1 : 0;

      // Semantic Features (Deterministic MoES domain topic alignment)
      const courseUserEmbeddingSimilarity = categoryMatch ? 0.85 : 0.40;
      const competencySemanticSimilarity = matchedCompCount > 0 ? 0.90 : 0.30;
      const recentLearningSimilarity = completedCategories.has(course.category) ? 0.80 : 0.35;

      // Historical Features
      const prevRecs = evStats.impressions;
      const prevClicks = evStats.clicks;
      const previousClickRate = prevRecs > 0 ? prevClicks / prevRecs : 0;
      const previousEnrollmentRate = prevRecs > 0 ? evStats.enrolls / prevRecs : 0;
      const previousCompletionRate = evStats.enrolls > 0 ? evStats.completions / evStats.enrolls : 0;
      const previousCompetencyImprovementRate = previousCompletionRate * 0.8;

      // Assemble Raw Vector
      const rawVector: RawFeatureVector = {
        userId,
        courseId: course.id,
        featureVersion: CURRENT_FEATURE_VERSION,
        skill: {
          maxSkillGap: maxGap,
          avgSkillGap,
          weightedSkillGap: weightedGap,
          criticalGapCount: criticalGaps,
          highPriorityGapCount: highGaps,
          competencyCoverage,
          gapCoverage,
          requiredLevel,
          currentLevel,
          levelDifference,
          competencyImportance,
        },
        prerequisite: {
          prerequisiteCount: prereqCount,
          satisfiedPrerequisiteRatio,
          missingPrerequisiteCount,
          prerequisiteGapSeverity,
          prerequisiteReadiness,
        },
        behavior: {
          courseViews: evStats.impressions,
          courseClicks: evStats.clicks,
          courseStarts: evStats.enrolls,
          courseCompletions: evStats.completions,
          courseAbandons: evStats.abandons,
          categoryViews: viewedCategories.has(course.category) ? 5 : 0,
          categoryCompletions: completedCategories.has(course.category) ? 2 : 0,
          similarCourseInteractions: completedCategories.has(course.category) ? 3 : 0,
          recentActivity: user.enrollments.length,
          activityRecency,
        },
        course: {
          difficulty,
          durationMinutes,
          categoryCode,
          competencyCount: compCount,
          targetLevel: requiredLevel,
          freshness,
          qualityScore,
          completionRate,
          averageRating,
          dropoutRate,
          assessmentImprovementRate: 0.75,
        },
        context: {
          departmentMatch,
          organizationMatch,
          roleMatch,
          categoryMatch,
          learningPathMatch,
        },
        semantic: {
          courseUserEmbeddingSimilarity,
          competencySemanticSimilarity,
          recentLearningSimilarity,
        },
        historical: {
          previousRecommendationCount: prevRecs,
          previousImpressionCount: prevRecs,
          previousClickRate,
          previousEnrollmentRate,
          previousCompletionRate,
          previousCompetencyImprovementRate,
        },
        temporal: {
          daysSinceLastInteraction: daysSinceInteraction,
          daysSinceCoursePublished: daysSincePublished,
          daysSinceLastLearningActivity: 14,
        },
      };

      const normalized = FeatureNormalizer.normalize(rawVector);
      resultMap.set(course.id, normalized);
    }

    return resultMap;
  }
}
