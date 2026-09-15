import { MatchedCourseItem, MissingCompetencyInfo } from './course-matching.service';

export interface RankedCourseRecommendation {
  courseId: string;
  course: MatchedCourseItem;
  finalScore: number; // 0 - 100
  matchPercentage: number;
  reasonCodes: string[];
  explanation: {
    headline: string;
    whyRecommended: string;
    competencyOutcome: string;
  };
  factorScores: {
    skillGapRelevance: number; // 35%
    competencyCoverage: number; // 25%
    prerequisiteFit: number; // 15%
    courseQuality: number; // 10%
    difficultyFit: number; // 10%
    learnerPreference: number; // 5%
  };
}

export class CourseRankingService {
  /**
   * Multi-factor deterministic ranking with explainable reasoning
   */
  public rankCourses(
    courses: MatchedCourseItem[],
    missingCompetencies: MissingCompetencyInfo[],
    userContext?: {
      targetRoleName?: string;
      preferredCategory?: string;
      preferredDifficulty?: string;
      enrolledCourseIds?: string[];
    },
  ): RankedCourseRecommendation[] {
    const roleName = userContext?.targetRoleName || 'operational cadre';
    const enrolledIds = new Set(userContext?.enrolledCourseIds || []);

    const ranked: RankedCourseRecommendation[] = [];

    for (const course of courses) {
      // Skip courses trainee has already enrolled in
      if (enrolledIds.has(course.courseId)) {
        continue;
      }

      // 1. Skill Gap Relevance (35% weight)
      let gapMatchCount = 0;
      let highestSeverityWeight = 0;
      const matchedGaps: MissingCompetencyInfo[] = [];

      for (const cc of course.courseCompetencies) {
        const gap = missingCompetencies.find((g) => g.competencyId === cc.competencyId);
        if (gap) {
          gapMatchCount++;
          matchedGaps.push(gap);
          const sevScore =
            gap.gapSeverity === 'CRITICAL' ? 1.0 :
            gap.gapSeverity === 'HIGH' ? 0.85 :
            gap.gapSeverity === 'MEDIUM' ? 0.65 : 0.40;
          if (sevScore > highestSeverityWeight) {
            highestSeverityWeight = sevScore;
          }
        }
      }

      const skillGapScore = missingCompetencies.length > 0
        ? Math.min(100, (gapMatchCount / Math.max(1, missingCompetencies.length)) * 50 + highestSeverityWeight * 50)
        : 75;

      // 2. Competency Coverage (25% weight)
      let totalTargetLevelProvided = 0;
      let totalRequiredLevelNeeded = 0;

      for (const mg of matchedGaps) {
        totalRequiredLevelNeeded += mg.requiredLevel;
        const courseComp = course.courseCompetencies.find((cc) => cc.competencyId === mg.competencyId);
        if (courseComp) {
          totalTargetLevelProvided += Math.min(mg.requiredLevel, courseComp.targetLevel);
        }
      }

      const coverageRatio = totalRequiredLevelNeeded > 0
        ? Math.min(1.0, totalTargetLevelProvided / totalRequiredLevelNeeded)
        : 0.70;
      const competencyCoverageScore = coverageRatio * 100;

      // 3. Prerequisite Fit (15% weight)
      // If learner has baseline (currentLevel >= 1) and course matches, good fit
      let prerequisiteFitScore = 85;
      const avgLearnerLevel = matchedGaps.length > 0
        ? matchedGaps.reduce((acc, g) => acc + g.currentLevel, 0) / matchedGaps.length
        : 2;

      if (course.difficulty === 'BEGINNER') {
        prerequisiteFitScore = 95;
      } else if (course.difficulty === 'INTERMEDIATE') {
        prerequisiteFitScore = avgLearnerLevel >= 1 ? 90 : 65;
      } else if (course.difficulty === 'ADVANCED' || course.difficulty === 'EXPERT') {
        prerequisiteFitScore = avgLearnerLevel >= 2 ? 88 : 50;
      }

      // 4. Course Quality (10% weight)
      // Normalized from averageRating (4.0 - 5.0) and qualityScore (0 - 100)
      const ratingComponent = Math.max(0, Math.min(100, (course.averageRating / 5.0) * 100));
      const qualityScore = (ratingComponent * 0.6) + (course.qualityScore * 0.4);

      // 5. Difficulty Fit (10% weight)
      let difficultyFitScore = 80;
      if (course.difficulty === 'INTERMEDIATE' && avgLearnerLevel >= 2) {
        difficultyFitScore = 95;
      } else if (course.difficulty === 'BEGINNER' && avgLearnerLevel <= 2) {
        difficultyFitScore = 95;
      } else if (course.difficulty === 'ADVANCED' && avgLearnerLevel >= 3) {
        difficultyFitScore = 90;
      }

      // 6. Learner Preference (5% weight)
      let preferenceScore = 70;
      if (userContext?.preferredCategory && course.category.toLowerCase().includes(userContext.preferredCategory.toLowerCase())) {
        preferenceScore = 100;
      }

      // Final Multi-Factor Weighted Score
      const finalWeightedScore =
        (skillGapScore * 0.35) +
        (competencyCoverageScore * 0.25) +
        (prerequisiteFitScore * 0.15) +
        (qualityScore * 0.10) +
        (difficultyFitScore * 0.10) +
        (preferenceScore * 0.05);

      const finalScore = Math.min(99, Math.max(50, Math.round(finalWeightedScore)));

      // Generate explainable reason codes & text
      const reasonCodes: string[] = [];
      if (highestSeverityWeight >= 0.85) reasonCodes.push('HIGH_SEVERITY_GAP_MATCH');
      if (coverageRatio >= 0.70) reasonCodes.push('COMPETENCY_COVERAGE_HIGH');
      if (course.averageRating >= 4.7) reasonCodes.push('TOP_RATED_CURRICULUM');
      if (prerequisiteFitScore >= 90) reasonCodes.push('PREREQUISITE_ALIGNED');
      reasonCodes.push('CADRE_ROLE_RELEVANCE');

      const primaryGap = matchedGaps[0];
      const primaryGapName = primaryGap ? primaryGap.name : course.category;
      const headline = `Direct alignment with your ${roleName} training track`;
      const whyRecommended = primaryGap
        ? `Covers ${Math.round(coverageRatio * 100)}% of your ${primaryGapName} competency requirement and bridges your current Level ${primaryGap.currentLevel} proficiency to the target standard.`
        : `Provides foundational capacity building in ${course.title} mapped to your departmental cadre.`;
      const competencyOutcome = primaryGap
        ? `Advances ${primaryGapName} proficiency to Level ${primaryGap.requiredLevel} standard required for ${roleName}.`
        : `Establishes verified core competency in ${course.category}.`;

      ranked.push({
        courseId: course.courseId,
        course,
        finalScore,
        matchPercentage: finalScore,
        reasonCodes,
        explanation: {
          headline,
          whyRecommended,
          competencyOutcome,
        },
        factorScores: {
          skillGapRelevance: Math.round(skillGapScore),
          competencyCoverage: Math.round(competencyCoverageScore),
          prerequisiteFit: Math.round(prerequisiteFitScore),
          courseQuality: Math.round(qualityScore),
          difficultyFit: Math.round(difficultyFitScore),
          learnerPreference: Math.round(preferenceScore),
        },
      });
    }

    // Order by finalScore descending
    ranked.sort((a, b) => b.finalScore - a.finalScore);
    return ranked;
  }
}

export const courseRankingService = new CourseRankingService();
