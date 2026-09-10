/**
 * Feature Engineering Unit Tests
 * Validates extraction and normalization of 54 features
 */

import { FeatureNormalizer } from '../features/feature-normalizer';
import { RawFeatureVector, FEATURE_NAMES, CURRENT_FEATURE_VERSION } from '../features/feature.types';

describe('Feature Engineering & Normalization', () => {
  test('feature names array has exact length 54 matching the schema contract', () => {
    expect(FEATURE_NAMES).toHaveLength(54);
    // Unique feature names
    const uniqueNames = new Set(FEATURE_NAMES);
    expect(uniqueNames.size).toBe(54);
  });

  test('normalizes raw feature vector into bounded [0, 1] float array', () => {
    const raw: RawFeatureVector = {
      userId: 'u101',
      courseId: 'c202',
      featureVersion: CURRENT_FEATURE_VERSION,
      skill: {
        maxSkillGap: 4.0,
        avgSkillGap: 3.0,
        weightedSkillGap: 6.5,
        criticalGapCount: 2,
        highPriorityGapCount: 1,
        competencyCoverage: 0.8,
        gapCoverage: 0.6,
        requiredLevel: 4,
        currentLevel: 2,
        levelDifference: 2,
        competencyImportance: 1.0,
      },
      prerequisite: {
        prerequisiteCount: 3,
        satisfiedPrerequisiteRatio: 0.66,
        missingPrerequisiteCount: 1,
        prerequisiteGapSeverity: 0.33,
        prerequisiteReadiness: 0.66,
      },
      behavior: {
        courseViews: 10,
        courseClicks: 4,
        courseStarts: 2,
        courseCompletions: 1,
        courseAbandons: 0,
        categoryViews: 25,
        categoryCompletions: 5,
        similarCourseInteractions: 12,
        recentActivity: 8,
        activityRecency: 0.85,
      },
      course: {
        difficulty: 3,
        durationMinutes: 180,
        categoryCode: 2,
        competencyCount: 4,
        targetLevel: 3.5,
        freshness: 0.9,
        qualityScore: 85,
        completionRate: 0.75,
        averageRating: 4.8,
        dropoutRate: 0.25,
        assessmentImprovementRate: 0.8,
      },
      context: {
        departmentMatch: 1,
        organizationMatch: 1,
        roleMatch: 1,
        categoryMatch: 1,
        learningPathMatch: 1,
      },
      semantic: {
        courseUserEmbeddingSimilarity: 0.82,
        competencySemanticSimilarity: 0.88,
        recentLearningSimilarity: 0.75,
      },
      historical: {
        previousRecommendationCount: 5,
        previousImpressionCount: 5,
        previousClickRate: 0.4,
        previousEnrollmentRate: 0.2,
        previousCompletionRate: 0.2,
        previousCompetencyImprovementRate: 0.16,
      },
      temporal: {
        daysSinceLastInteraction: 12,
        daysSinceCoursePublished: 45,
        daysSinceLastLearningActivity: 5,
      },
    };

    const normalized = FeatureNormalizer.normalize(raw);

    expect(normalized.features).toHaveLength(54);
    expect(normalized.featureVersion).toBe(CURRENT_FEATURE_VERSION);

    // Verify all features are numbers between 0 and 1
    for (let i = 0; i < normalized.features.length; i++) {
      const val = normalized.features[i];
      expect(typeof val).toBe('number');
      expect(isNaN(val)).toBe(false);
      expect(isFinite(val)).toBe(true);
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThanOrEqual(1);
    }
  });

  test('gracefully handles zero/missing/outlier values without NaN or infinity', () => {
    const extremeRaw: RawFeatureVector = {
      userId: 'u-zero',
      courseId: 'c-zero',
      featureVersion: CURRENT_FEATURE_VERSION,
      skill: {
        maxSkillGap: 0,
        avgSkillGap: 0,
        weightedSkillGap: 0,
        criticalGapCount: 0,
        highPriorityGapCount: 0,
        competencyCoverage: 0,
        gapCoverage: 0,
        requiredLevel: 0,
        currentLevel: 5,
        levelDifference: -5,
        competencyImportance: 0,
      },
      prerequisite: {
        prerequisiteCount: 0,
        satisfiedPrerequisiteRatio: 0,
        missingPrerequisiteCount: 0,
        prerequisiteGapSeverity: 0,
        prerequisiteReadiness: 0,
      },
      behavior: {
        courseViews: 0,
        courseClicks: 0,
        courseStarts: 0,
        courseCompletions: 0,
        courseAbandons: 0,
        categoryViews: 0,
        categoryCompletions: 0,
        similarCourseInteractions: 0,
        recentActivity: 0,
        activityRecency: 0,
      },
      course: {
        difficulty: 1,
        durationMinutes: 0,
        categoryCode: 0,
        competencyCount: 0,
        targetLevel: 0,
        freshness: 0,
        qualityScore: 0,
        completionRate: 0,
        averageRating: 1,
        dropoutRate: 1,
        assessmentImprovementRate: 0,
      },
      context: {
        departmentMatch: 0,
        organizationMatch: 0,
        roleMatch: 0,
        categoryMatch: 0,
        learningPathMatch: 0,
      },
      semantic: {
        courseUserEmbeddingSimilarity: 0,
        competencySemanticSimilarity: 0,
        recentLearningSimilarity: 0,
      },
      historical: {
        previousRecommendationCount: 0,
        previousImpressionCount: 0,
        previousClickRate: 0,
        previousEnrollmentRate: 0,
        previousCompletionRate: 0,
        previousCompetencyImprovementRate: 0,
      },
      temporal: {
        daysSinceLastInteraction: 9999,
        daysSinceCoursePublished: 9999,
        daysSinceLastLearningActivity: 9999,
      },
    };

    const normalized = FeatureNormalizer.normalize(extremeRaw);

    expect(normalized.features).toHaveLength(54);
    for (const val of normalized.features) {
      expect(isNaN(val)).toBe(false);
      expect(isFinite(val)).toBe(true);
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThanOrEqual(1);
    }
  });
});
