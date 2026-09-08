/**
 * Ranker Interface
 */

import { RecommendationCandidate, RecommendationFeatures, RankedCandidate, FeatureWeights } from '../recommendation.types';

export interface RankerInput {
  candidates: RecommendationCandidate[];
  featuresMap: Map<string, RecommendationFeatures>;
  weights: FeatureWeights;
}

export interface IRanker {
  rank(input: RankerInput): RankedCandidate[];
}
