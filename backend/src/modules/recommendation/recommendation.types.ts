/**
 * Capacity Connect — Intelligent Recommendation Engine Types
 * Domain-Specific: Ministry of Earth Sciences (MoES) / IMD
 */

export type RecommendationSurface =
  | 'HOME'
  | 'COURSE_DETAIL'
  | 'SKILL_GAP'
  | 'LEARNING_PATH'
  | 'SEARCH'
  | 'DASHBOARD'
  | 'POST_COMPLETION'
  | 'COURSE_PAGE'
  | 'ASSESSMENT_RESULT'
  | 'SKILL_PROFILE';

export type CandidateSource =
  | 'SKILL_GAP'
  | 'CONTINUATION'
  | 'CONTEXTUAL'
  | 'CONTENT_SIMILARITY'
  | 'BEHAVIORAL'
  | 'POPULARITY'
  | 'EXPLORATION'
  | 'COLLABORATIVE'
  | 'LEARNING_PATH';

export type RecommendationReasonCode =
  | 'CLOSES_CRITICAL_GAP'
  | 'CLOSES_SKILL_GAP'
  | 'CONTINUES_LEARNING_PATH'
  | 'PREREQUISITE_COMPLETED'
  | 'RELATED_TO_CURRENT_COURSE'
  | 'DOMAIN_MANDATORY'
  | 'DEPARTMENT_FOCUS'
  | 'SIMILAR_TO_COMPLETED'
  | 'FREQUENTLY_VIEWED_TOPIC'
  | 'RECENTLY_SAVED'
  | 'TRENDING_IN_DEPARTMENT'
  | 'HIGH_COMPLETION_RATE'
  | 'PEER_COMPLETED'
  | 'EXPLORATION_HORIZON'
  | 'SKILL_GAP_MATCH'
  | 'HIGH_COMPETENCY_COVERAGE'
  | 'PREREQUISITE_ALIGNED'
  | 'SIMILAR_TO_COMPLETED_COURSE'
  | 'POPULAR_IN_DEPARTMENT'
  | 'HIGH_COURSE_QUALITY'
  | 'RECENTLY_UPDATED'
  | 'INTEREST_MATCH'
  | 'NEXT_LEARNING_STEP'
  | 'DIFFICULTY_FIT';

export interface RecommendationFeatures {
  skillRelevanceScore: number;       // 0 - 100
  contentSimilarityScore: number;    // 0 - 100
  behavioralAffinityScore: number;   // 0 - 100
  collaborativeScore: number;        // 0 - 100
  qualityScore: number;              // 0 - 100
  freshnessScore: number;            // 0 - 100
  contextualScore: number;           // 0 - 100
  difficultyAlignmentScore: number;  // 0 - 100
  historicalSuccessRate: number;     // 0 - 100
}

export interface FeatureWeights {
  skillRelevance: number;
  contentSimilarity: number;
  behavioralAffinity: number;
  collaborative: number;
  quality: number;
  freshness: number;
  contextual: number;
  difficultyAlignment: number;
  historicalSuccess: number;
}

export interface RecommendationCandidate {
  courseId: string;
  source: CandidateSource;
  sourcePriority: number;
  reasonCodes: string[];
  metadata?: Record<string, any>;
}

export interface ContentMetadata {
  category: string;
  topics: string[];
  description: string;
}

export interface RankedCandidate {
  courseId: string;
  source: CandidateSource;
  finalScore: number;
  rankPosition: number;
  reasonCodes: string[];
  featureSnapshot: RecommendationFeatures;
  algorithmVersion?: string;
  modelVersion?: string;
  featureVersion?: string;
}

export interface RecommendationRequest {
  userId: string;
  surface?: RecommendationSurface;
  limit?: number;
  activeCourseId?: string;
  context?: Record<string, any>;
  enabledSources?: CandidateSource[];
}

export interface RecommendationExplanation {
  headline: string;
  whyRecommended: string;
  competencyOutcome: string;
  pedagogicalAdvice: string;
}

export interface RecommendationItemResponse {
  id: string;
  courseId: string;
  courseTitle: string;
  courseCategory: string;
  courseLevel: string;
  instructorName?: string;
  rankPosition: number;
  score: number;
  candidateSource: CandidateSource;
  reasonCodes: string[];
  featureSnapshot: RecommendationFeatures;
  explanation: RecommendationExplanation;
}

export interface RecommendationBatchResponse {
  batchId: string;
  algorithmVersion: string;
  surface: RecommendationSurface;
  createdAt: Date;
  summaryRationale: string;
  targetedMilestone: string;
  learningPathSequence: string[];
  items: RecommendationItemResponse[];
}

// Backwards-compatible interfaces
export interface RecommendationAlgorithmWeights {
  version: string;
  skillWeight: number;
  contentWeight: number;
  behaviorWeight: number;
  collaborativeWeight: number;
  qualityWeight: number;
  contextWeight: number;
  popularityWeight: number;
  freshnessWeight: number;
  explorationWeight: number;
  explorationPercentage: number;
  diversityLambda: number;
  maxSameCategory: number;
  maxSameGroup: number;
  maxSameTrainer: number;
  minimumEvidence: number;
}

export interface CandidateCourse {
  courseId: string;
  title: string;
  category: string;
  difficulty: string;
  durationMinutes: number;
  trainerId: string;
  source: CandidateSource;
  sourceScore: number;
  reasonCodes: string[];
  metadata?: Record<string, any>;
}

export interface CandidateFeatureVector {
  courseId: string;
  skillRelevance: number;
  contentSimilarity: number;
  behavioralAffinity: number;
  collaborativeScore: number;
  courseQuality: number;
  contextRelevance: number;
  popularity: number;
  freshness: number;
  exploration: number;
  difficultyFit: number;
  durationFit: number;
}

export interface ScoredCandidate {
  courseId: string;
  title: string;
  category: string;
  difficulty: string;
  durationMinutes: number;
  trainerId: string;
  source: CandidateSource;
  features: CandidateFeatureVector;
  finalScore: number;
  reasonCodes: string[];
  explanation?: string;
  isExploration?: boolean;
}

export interface FinalRecommendationItem {
  id: string;
  type: 'COURSE' | 'RESOURCE' | 'LEARNING_PATH';
  course: {
    id: string;
    title: string;
    slug?: string;
    thumbnailUrl?: string | null;
    durationMinutes: number;
    difficulty: string;
    category: string;
    trainerName?: string;
  };
  score: number;
  rankPosition: number;
  candidateSource: CandidateSource;
  reasonCodes: string[];
  reason: string;
}

export interface RecommendationBatchResult {
  batchId: string;
  userId: string;
  surface: RecommendationSurface;
  algorithmVersion: string;
  totalGenerated: number;
  recommendations: FinalRecommendationItem[];
  createdAt: Date;
}
