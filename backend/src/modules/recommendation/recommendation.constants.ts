/**
 * Recommendation Constants & Default Hyperparameters
 */

import {
  RecommendationAlgorithmWeights,
  RecommendationSurface,
  CandidateSource,
  FeatureWeights,
} from './recommendation.types';

export const RECSYS_DEFAULTS = {
  ALGORITHM_VERSION: 'v1.0.0',
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 50,
  MMR_LAMBDA: 0.70,
  EXPLORATION_RATIO: 0.15,
  MAX_PER_CATEGORY: 2,
  MAX_PER_TRAINER: 2,
  RECENCY_HALF_LIFE_DAYS: 30,
  FRESHNESS_HALF_LIFE_DAYS: 180,
  EVERGREEN_FLOOR: 50.0,
};

export const DEFAULT_FEATURE_WEIGHTS: FeatureWeights = {
  skillRelevance: 0.25,
  contentSimilarity: 0.15,
  behavioralAffinity: 0.10,
  collaborative: 0.10,
  quality: 0.15,
  freshness: 0.05,
  contextual: 0.10,
  difficultyAlignment: 0.05,
  historicalSuccess: 0.05,
};

export const DEFAULT_RECOMMENDATION_CONFIG: RecommendationAlgorithmWeights = {
  version: 'v1.0.0',
  skillWeight: 0.25,
  contentWeight: 0.15,
  behaviorWeight: 0.15,
  collaborativeWeight: 0.10,
  qualityWeight: 0.10,
  contextWeight: 0.08,
  popularityWeight: 0.07,
  freshnessWeight: 0.05,
  explorationWeight: 0.05,
  explorationPercentage: 0.15,
  diversityLambda: 0.70,
  maxSameCategory: 3,
  maxSameGroup: 2,
  maxSameTrainer: 2,
  minimumEvidence: 3,
};

export const BEHAVIORAL_EVENT_WEIGHTS: Record<string, number> = {
  COMPLETE: 25.0,
  ENROLL: 15.0,
  START: 10.0,
  SAVE: 8.0,
  VIEW: 3.0,
  CLICK: 2.0,
  IMPRESSION: 0.5,
  DISMISS: -20.0,
  ABANDON: -15.0,
};

export const SURFACE_CANDIDATE_QUOTAS: Record<RecommendationSurface, Partial<Record<CandidateSource, number>>> = {
  HOME: {
    SKILL_GAP: 8,
    CONTINUATION: 4,
    CONTEXTUAL: 4,
    CONTENT_SIMILARITY: 4,
    BEHAVIORAL: 4,
    POPULARITY: 4,
    EXPLORATION: 3,
    COLLABORATIVE: 3,
    LEARNING_PATH: 4,
  },
  DASHBOARD: {
    SKILL_GAP: 8,
    CONTINUATION: 4,
    CONTEXTUAL: 4,
    CONTENT_SIMILARITY: 4,
    BEHAVIORAL: 4,
    POPULARITY: 4,
    EXPLORATION: 3,
    COLLABORATIVE: 3,
  },
  COURSE_PAGE: {
    CONTINUATION: 6,
    CONTEXTUAL: 6,
    CONTENT_SIMILARITY: 4,
  },
  ASSESSMENT_RESULT: {
    SKILL_GAP: 10,
    BEHAVIORAL: 4,
  },
  SKILL_PROFILE: {
    SKILL_GAP: 12,
    CONTINUATION: 4,
  },
  SKILL_GAP: {
    SKILL_GAP: 15,
    CONTINUATION: 2,
    CONTEXTUAL: 3,
    CONTENT_SIMILARITY: 4,
    BEHAVIORAL: 2,
    POPULARITY: 2,
    EXPLORATION: 2,
    COLLABORATIVE: 2,
    LEARNING_PATH: 5,
  },
  COURSE_DETAIL: {
    CONTENT_SIMILARITY: 8,
    CONTINUATION: 5,
    COLLABORATIVE: 4,
    POPULARITY: 3,
    EXPLORATION: 2,
    SKILL_GAP: 3,
  },
  LEARNING_PATH: {
    CONTINUATION: 10,
    SKILL_GAP: 8,
    LEARNING_PATH: 10,
    CONTEXTUAL: 4,
  },
  SEARCH: {
    CONTENT_SIMILARITY: 10,
    POPULARITY: 6,
    SKILL_GAP: 4,
    EXPLORATION: 3,
  },
  POST_COMPLETION: {
    CONTINUATION: 10,
    SKILL_GAP: 6,
    CONTENT_SIMILARITY: 6,
    EXPLORATION: 4,
  },
};
