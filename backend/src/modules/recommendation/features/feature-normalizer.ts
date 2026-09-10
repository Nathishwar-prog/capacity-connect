/**
 * Feature Normalizer
 * Capacity Connect — Learning-to-Rank Recommendation Engine
 * Normalizes RawFeatureVector into deterministic, bounds-checked float arrays
 */

import {
  RawFeatureVector,
  NormalizedFeatureVector,
  FEATURE_NAMES,
  CURRENT_FEATURE_VERSION,
} from './feature.types';

export class FeatureNormalizer {
  private static clamp(val: number, min: number, max: number): number {
    if (isNaN(val) || !isFinite(val)) return min;
    return Math.max(min, Math.min(max, val));
  }

  private static log1pNorm(val: number, maxScale: number): number {
    if (val <= 0) return 0;
    return Math.min(1.0, Math.log1p(val) / Math.log1p(maxScale));
  }

  /**
   * Normalizes a RawFeatureVector into an array of floats matching FEATURE_NAMES
   */
  public static normalize(raw: RawFeatureVector): NormalizedFeatureVector {
    const featureMap: Record<string, number> = {};

    // Skill Features (11)
    featureMap['skill_maxSkillGap'] = this.clamp(raw.skill.maxSkillGap / 5.0, 0, 1);
    featureMap['skill_avgSkillGap'] = this.clamp(raw.skill.avgSkillGap / 5.0, 0, 1);
    featureMap['skill_weightedSkillGap'] = this.clamp(raw.skill.weightedSkillGap / 10.0, 0, 1);
    featureMap['skill_criticalGapCount'] = this.log1pNorm(raw.skill.criticalGapCount, 10);
    featureMap['skill_highPriorityGapCount'] = this.log1pNorm(raw.skill.highPriorityGapCount, 10);
    featureMap['skill_competencyCoverage'] = this.clamp(raw.skill.competencyCoverage, 0, 1);
    featureMap['skill_gapCoverage'] = this.clamp(raw.skill.gapCoverage, 0, 1);
    featureMap['skill_requiredLevel'] = this.clamp(raw.skill.requiredLevel / 5.0, 0, 1);
    featureMap['skill_currentLevel'] = this.clamp(raw.skill.currentLevel / 5.0, 0, 1);
    featureMap['skill_levelDifference'] = this.clamp((raw.skill.levelDifference + 5.0) / 10.0, 0, 1);
    featureMap['skill_competencyImportance'] = this.clamp(raw.skill.competencyImportance, 0, 1);

    // Prerequisite Features (5)
    featureMap['prereq_prerequisiteCount'] = this.log1pNorm(raw.prerequisite.prerequisiteCount, 10);
    featureMap['prereq_satisfiedPrerequisiteRatio'] = this.clamp(raw.prerequisite.satisfiedPrerequisiteRatio, 0, 1);
    featureMap['prereq_missingPrerequisiteCount'] = this.log1pNorm(raw.prerequisite.missingPrerequisiteCount, 10);
    featureMap['prereq_prerequisiteGapSeverity'] = this.clamp(raw.prerequisite.prerequisiteGapSeverity, 0, 1);
    featureMap['prereq_prerequisiteReadiness'] = this.clamp(raw.prerequisite.prerequisiteReadiness, 0, 1);

    // Behavior Features (10)
    featureMap['behavior_courseViews'] = this.log1pNorm(raw.behavior.courseViews, 50);
    featureMap['behavior_courseClicks'] = this.log1pNorm(raw.behavior.courseClicks, 30);
    featureMap['behavior_courseStarts'] = this.log1pNorm(raw.behavior.courseStarts, 10);
    featureMap['behavior_courseCompletions'] = this.log1pNorm(raw.behavior.courseCompletions, 10);
    featureMap['behavior_courseAbandons'] = this.log1pNorm(raw.behavior.courseAbandons, 10);
    featureMap['behavior_categoryViews'] = this.log1pNorm(raw.behavior.categoryViews, 100);
    featureMap['behavior_categoryCompletions'] = this.log1pNorm(raw.behavior.categoryCompletions, 20);
    featureMap['behavior_similarCourseInteractions'] = this.log1pNorm(raw.behavior.similarCourseInteractions, 50);
    featureMap['behavior_recentActivity'] = this.log1pNorm(raw.behavior.recentActivity, 100);
    featureMap['behavior_activityRecency'] = this.clamp(raw.behavior.activityRecency, 0, 1);

    // Course Features (11)
    featureMap['course_difficulty'] = this.clamp(raw.course.difficulty / 4.0, 0, 1);
    featureMap['course_durationMinutes'] = this.log1pNorm(raw.course.durationMinutes, 1200); // 20 hours
    featureMap['course_categoryCode'] = this.clamp(raw.course.categoryCode / 20.0, 0, 1);
    featureMap['course_competencyCount'] = this.log1pNorm(raw.course.competencyCount, 15);
    featureMap['course_targetLevel'] = this.clamp(raw.course.targetLevel / 5.0, 0, 1);
    featureMap['course_freshness'] = this.clamp(raw.course.freshness, 0, 1);
    featureMap['course_qualityScore'] = this.clamp(raw.course.qualityScore / 100.0, 0, 1);
    featureMap['course_completionRate'] = this.clamp(raw.course.completionRate, 0, 1);
    featureMap['course_averageRating'] = this.clamp((raw.course.averageRating - 1.0) / 4.0, 0, 1);
    featureMap['course_dropoutRate'] = this.clamp(raw.course.dropoutRate, 0, 1);
    featureMap['course_assessmentImprovementRate'] = this.clamp(raw.course.assessmentImprovementRate, 0, 1);

    // Context Features (5)
    featureMap['context_departmentMatch'] = this.clamp(raw.context.departmentMatch, 0, 1);
    featureMap['context_organizationMatch'] = this.clamp(raw.context.organizationMatch, 0, 1);
    featureMap['context_roleMatch'] = this.clamp(raw.context.roleMatch, 0, 1);
    featureMap['context_categoryMatch'] = this.clamp(raw.context.categoryMatch, 0, 1);
    featureMap['context_learningPathMatch'] = this.clamp(raw.context.learningPathMatch, 0, 1);

    // Semantic Features (3)
    featureMap['semantic_courseUserEmbeddingSimilarity'] = this.clamp(raw.semantic.courseUserEmbeddingSimilarity, 0, 1);
    featureMap['semantic_competencySemanticSimilarity'] = this.clamp(raw.semantic.competencySemanticSimilarity, 0, 1);
    featureMap['semantic_recentLearningSimilarity'] = this.clamp(raw.semantic.recentLearningSimilarity, 0, 1);

    // Historical Features (6)
    featureMap['history_previousRecommendationCount'] = this.log1pNorm(raw.historical.previousRecommendationCount, 50);
    featureMap['history_previousImpressionCount'] = this.log1pNorm(raw.historical.previousImpressionCount, 50);
    featureMap['history_previousClickRate'] = this.clamp(raw.historical.previousClickRate, 0, 1);
    featureMap['history_previousEnrollmentRate'] = this.clamp(raw.historical.previousEnrollmentRate, 0, 1);
    featureMap['history_previousCompletionRate'] = this.clamp(raw.historical.previousCompletionRate, 0, 1);
    featureMap['history_previousCompetencyImprovementRate'] = this.clamp(raw.historical.previousCompetencyImprovementRate, 0, 1);

    // Temporal Features (3)
    featureMap['temporal_daysSinceLastInteraction'] = this.clamp(raw.temporal.daysSinceLastInteraction / 180.0, 0, 1);
    featureMap['temporal_daysSinceCoursePublished'] = this.clamp(raw.temporal.daysSinceCoursePublished / 365.0, 0, 1);
    featureMap['temporal_daysSinceLastLearningActivity'] = this.clamp(raw.temporal.daysSinceLastLearningActivity / 180.0, 0, 1);

    // Form ordered array matching FEATURE_NAMES
    const features = FEATURE_NAMES.map(name => featureMap[name] ?? 0.0);

    return {
      userId: raw.userId,
      courseId: raw.courseId,
      featureVersion: raw.featureVersion || CURRENT_FEATURE_VERSION,
      features,
      featureMap,
    };
  }
}
