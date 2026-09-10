/**
 * Ranker Interface & Models
 * Capacity Connect — Learning-to-Rank Recommendation Engine
 */

import { RecommendationCandidate, CandidateSource, RecommendationFeatures, FeatureWeights } from '../recommendation.types';
import { NormalizedFeatureVector } from '../features/feature.types';

export interface RankerInput {
  userId?: string;
  candidates: RecommendationCandidate[];
  featuresMap: Map<string, NormalizedFeatureVector | RecommendationFeatures>;
  weights?: FeatureWeights | Record<string, number>;
  context?: Record<string, any>;
}

export interface RankedItem {
  courseId: string;
  source: CandidateSource;
  score: number;
  rankPosition: number;
  reasonCodes: string[];
  algorithmVersion: string;
  modelVersion: string;
  featureVersion: string;
  explanationSignals?: Record<string, any>;
}

export interface IRanker {
  readonly name: string;
  readonly version: string;
  readonly isML: boolean;

  rank(input: RankerInput): Promise<RankedItem[]> | RankedItem[];
}
