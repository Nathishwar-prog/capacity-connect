/**
 * Feature Engineering Types & Version Contract
 * Capacity Connect — Learning-to-Rank Recommendation Engine
 * Feature Version: v1.0.0
 */

export const CURRENT_FEATURE_VERSION = 'v1.0.0';

export interface SkillFeatures {
  maxSkillGap: number;            // 0 - 5
  avgSkillGap: number;            // 0 - 5
  weightedSkillGap: number;       // 0 - 10
  criticalGapCount: number;       // count >= 0
  highPriorityGapCount: number;   // count >= 0
  competencyCoverage: number;     // 0 - 1
  gapCoverage: number;            // 0 - 1
  requiredLevel: number;          // 1 - 5
  currentLevel: number;           // 0 - 5
  levelDifference: number;        // -5 - 5
  competencyImportance: number;   // 0 - 1
}

export interface PrerequisiteFeatures {
  prerequisiteCount: number;          // count >= 0
  satisfiedPrerequisiteRatio: number; // 0 - 1
  missingPrerequisiteCount: number;   // count >= 0
  prerequisiteGapSeverity: number;    // 0 - 1
  prerequisiteReadiness: number;      // 0 - 1
}

export interface BehaviorFeatures {
  courseViews: number;
  courseClicks: number;
  courseStarts: number;
  courseCompletions: number;
  courseAbandons: number;
  categoryViews: number;
  categoryCompletions: number;
  similarCourseInteractions: number;
  recentActivity: number;
  activityRecency: number; // exponential time decay score [0, 1]
}

export interface CourseFeatures {
  difficulty: number;                 // 1 (BEGINNER) to 4 (EXPERT)
  durationMinutes: number;            // raw minutes
  categoryCode: number;               // integer encoded category
  competencyCount: number;            // count >= 0
  targetLevel: number;                // 1 - 5
  freshness: number;                  // half-life decay score [0, 1]
  qualityScore: number;               // [0, 100]
  completionRate: number;             // [0, 1]
  averageRating: number;              // [1, 5]
  dropoutRate: number;                // [0, 1]
  assessmentImprovementRate: number;  // [0, 1]
}

export interface ContextFeatures {
  departmentMatch: number;    // 0 or 1
  organizationMatch: number;  // 0 or 1
  roleMatch: number;          // 0 or 1
  categoryMatch: number;      // 0 or 1
  learningPathMatch: number;  // 0 or 1
}

export interface SemanticFeatures {
  courseUserEmbeddingSimilarity: number;  // [0, 1]
  competencySemanticSimilarity: number;   // [0, 1]
  recentLearningSimilarity: number;       // [0, 1]
}

export interface HistoricalFeatures {
  previousRecommendationCount: number;
  previousImpressionCount: number;
  previousClickRate: number;              // [0, 1]
  previousEnrollmentRate: number;         // [0, 1]
  previousCompletionRate: number;         // [0, 1]
  previousCompetencyImprovementRate: number; // [0, 1]
}

export interface TemporalFeatures {
  daysSinceLastInteraction: number;
  daysSinceCoursePublished: number;
  daysSinceLastLearningActivity: number;
}

/**
 * Unified raw feature vector for (USER, COURSE) pair
 */
export interface RawFeatureVector {
  userId: string;
  courseId: string;
  featureVersion: string;
  skill: SkillFeatures;
  prerequisite: PrerequisiteFeatures;
  behavior: BehaviorFeatures;
  course: CourseFeatures;
  context: ContextFeatures;
  semantic: SemanticFeatures;
  historical: HistoricalFeatures;
  temporal: TemporalFeatures;
}

/**
 * Array of ordered feature names for LightGBM model contract
 */
export const FEATURE_NAMES: string[] = [
  // Skill (11)
  'skill_maxSkillGap',
  'skill_avgSkillGap',
  'skill_weightedSkillGap',
  'skill_criticalGapCount',
  'skill_highPriorityGapCount',
  'skill_competencyCoverage',
  'skill_gapCoverage',
  'skill_requiredLevel',
  'skill_currentLevel',
  'skill_levelDifference',
  'skill_competencyImportance',
  // Prerequisite (5)
  'prereq_prerequisiteCount',
  'prereq_satisfiedPrerequisiteRatio',
  'prereq_missingPrerequisiteCount',
  'prereq_prerequisiteGapSeverity',
  'prereq_prerequisiteReadiness',
  // Behavior (10)
  'behavior_courseViews',
  'behavior_courseClicks',
  'behavior_courseStarts',
  'behavior_courseCompletions',
  'behavior_courseAbandons',
  'behavior_categoryViews',
  'behavior_categoryCompletions',
  'behavior_similarCourseInteractions',
  'behavior_recentActivity',
  'behavior_activityRecency',
  // Course (11)
  'course_difficulty',
  'course_durationMinutes',
  'course_categoryCode',
  'course_competencyCount',
  'course_targetLevel',
  'course_freshness',
  'course_qualityScore',
  'course_completionRate',
  'course_averageRating',
  'course_dropoutRate',
  'course_assessmentImprovementRate',
  // Context (5)
  'context_departmentMatch',
  'context_organizationMatch',
  'context_roleMatch',
  'context_categoryMatch',
  'context_learningPathMatch',
  // Semantic (3)
  'semantic_courseUserEmbeddingSimilarity',
  'semantic_competencySemanticSimilarity',
  'semantic_recentLearningSimilarity',
  // Historical (6)
  'history_previousRecommendationCount',
  'history_previousImpressionCount',
  'history_previousClickRate',
  'history_previousEnrollmentRate',
  'history_previousCompletionRate',
  'history_previousCompetencyImprovementRate',
  // Temporal (3)
  'temporal_daysSinceLastInteraction',
  'temporal_daysSinceCoursePublished',
  'temporal_daysSinceLastLearningActivity',
];

export interface NormalizedFeatureVector {
  userId: string;
  courseId: string;
  featureVersion: string;
  features: number[]; // Exact length of FEATURE_NAMES
  featureMap: Record<string, number>;
}
