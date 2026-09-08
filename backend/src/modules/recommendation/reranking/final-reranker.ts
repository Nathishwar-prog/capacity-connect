/**
 * Master Final Re-ranker
 * Capacity Connect — Learning-to-Rank Recommendation Engine
 * 
 * Coordinates:
 * 1. Competency / Prerequisite Safety Re-ranking
 * 2. MMR Diversity Re-ranking (Category & Trainer Caps)
 * 3. Controlled Exploration Injection
 */

import { RankedItem } from '../ranking/ranker.interface';
import { NormalizedFeatureVector } from '../features/feature.types';
import { CompetencySafetyReranker } from './competency-reranker';
import { DiversityReranker, CourseDiversityMetadata } from './diversity-reranker';
import { ExplorationReranker } from './exploration-reranker';

export interface FinalRerankOptions {
  limit?: number;
  mmrLambda?: number;
  maxSameCategory?: number;
  maxSameTrainer?: number;
  explorationRatio?: number;
}

export class FinalReranker {
  public static rerank(
    coreRanked: RankedItem[],
    explorationRanked: RankedItem[],
    featuresMap: Map<string, NormalizedFeatureVector>,
    courseMetaMap: Map<string, CourseDiversityMetadata>,
    options: FinalRerankOptions = {}
  ): RankedItem[] {
    const {
      limit = 10,
      mmrLambda = 0.70,
      maxSameCategory = 3,
      maxSameTrainer = 2,
      explorationRatio = 0.15,
    } = options;

    // 1. Apply Educational & Prerequisite Safety Re-ranking to Core
    const safeCore = CompetencySafetyReranker.rerank(coreRanked, featuresMap);

    // 2. Apply MMR Diversity Re-ranking across Category & Trainer
    const diversifiedCore = DiversityReranker.rerank(safeCore, courseMetaMap, {
      lambda: mmrLambda,
      maxSameCategory,
      maxSameTrainer,
      targetLimit: limit,
    });

    // 3. Inject Controlled Exploration candidates
    const finalItems = ExplorationReranker.inject(diversifiedCore, explorationRanked, {
      explorationRatio,
      targetLimit: limit,
    });

    return finalItems;
  }
}
