/**
 * Ranking Service — Hybrid ML Learning-to-Rank Architecture
 * Capacity Connect — Learning-to-Rank Recommendation Engine
 * 
 * Pipeline:
 * 1. Feature snapshot generation (54 normalized features via FeatureBuilder)
 * 2. Primary ranker: LightGBM MLRanker (native TypeScript Booster evaluation)
 * 3. Resilient fallback: Deterministic BaselineRanker if model absent or fails
 * 4. Competency & Prerequisite Educational Safety Re-ranking
 * 5. MMR Diversity Re-ranking (Category & Trainer caps)
 * 6. Controlled Exploration Injection (10-20% novel candidates)
 */

import prisma from '../../../database/client';
import {
  RecommendationCandidate,
  RankedCandidate,
  FeatureWeights,
  RecommendationSurface,
  RecommendationFeatures,
} from '../recommendation.types';
import { FeatureBuilder } from '../features/feature-builder';
import { ModelLoader } from '../ranking/model-loader';
import { BaselineRanker } from '../ranking/baseline-ranker';
import { FinalReranker } from '../reranking/final-reranker';
import { CourseDiversityMetadata } from '../reranking/diversity-reranker';
import { DEFAULT_FEATURE_WEIGHTS, RECSYS_DEFAULTS } from '../recommendation.constants';
import logger from '../../../logger/winston.logger';

export interface RankCandidatesOptions {
  userId: string;
  surface?: RecommendationSurface;
  activeCourseId?: string;
  limit?: number;
  weights?: FeatureWeights;
  mmrLambda?: number;
  explorationRatio?: number;
}

export class RankingService {
  private baselineRanker: BaselineRanker;

  constructor() {
    this.baselineRanker = new BaselineRanker();
  }

  /**
   * Fetches active algorithm configuration from database, falling back to defaults.
   */
  public async getActiveWeights(): Promise<{ weights: FeatureWeights; version: string; mmrLambda: number; explorationRatio: number }> {
    const config = await prisma.recommendationAlgorithmConfig.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!config) {
      return {
        weights: DEFAULT_FEATURE_WEIGHTS,
        version: RECSYS_DEFAULTS.ALGORITHM_VERSION,
        mmrLambda: RECSYS_DEFAULTS.MMR_LAMBDA,
        explorationRatio: RECSYS_DEFAULTS.EXPLORATION_RATIO,
      };
    }

    return {
      weights: {
        skillRelevance: config.skillWeight,
        contentSimilarity: config.contentWeight,
        behavioralAffinity: config.behaviorWeight,
        collaborative: config.collaborativeWeight,
        quality: config.qualityWeight,
        freshness: config.freshnessWeight,
        contextual: config.contextWeight,
        difficultyAlignment: 0.05,
        historicalSuccess: config.popularityWeight,
      },
      version: config.version,
      mmrLambda: config.diversityLambda,
      explorationRatio: config.explorationPercentage,
    };
  }

  /**
   * Ranks eligible candidates through features, ML or Baseline ranker, safety re-ranking,
   * MMR diversity, and controlled exploration injection.
   */
  public async rankCandidates(
    eligibleCandidates: RecommendationCandidate[],
    explorationCandidates: RecommendationCandidate[],
    options: RankCandidatesOptions
  ): Promise<{ ranked: RankedCandidate[]; algorithmVersion: string; modelVersion: string }> {
    const { userId, surface = 'DASHBOARD', activeCourseId, limit = RECSYS_DEFAULTS.DEFAULT_LIMIT } = options;

    const activeConfig = await this.getActiveWeights();
    const mmrLambda = options.mmrLambda ?? activeConfig.mmrLambda;
    const explorationRatio = options.explorationRatio ?? activeConfig.explorationRatio;

    if (eligibleCandidates.length === 0) {
      return {
        ranked: [],
        algorithmVersion: this.baselineRanker.name,
        modelVersion: this.baselineRanker.version,
      };
    }

    // 1. Build comprehensive normalized 54-feature vectors for candidates
    const allCourseIds = Array.from(
      new Set([...eligibleCandidates.map(c => c.courseId), ...explorationCandidates.map(c => c.courseId)])
    );

    const featuresMap = await FeatureBuilder.buildCandidateFeatures(
      userId,
      allCourseIds,
      { surface, activeCourseId }
    );

    // 2. Select Ranker: Attempt MLRanker via ModelLoader, fallback to BaselineRanker
    let ranker = await ModelLoader.getActiveRanker();
    let algorithmName = ranker ? ranker.name : this.baselineRanker.name;
    let modelVersion = ranker ? ranker.version : this.baselineRanker.version;

    let rawRankedCore: any[] = [];
    try {
      if (ranker) {
        logger.info(`Ranking candidates using active ML model: ${ranker.version}`);
        rawRankedCore = await ranker.rank({
          userId,
          candidates: eligibleCandidates,
          featuresMap,
        });
      } else {
        logger.info('No active ML model found; using deterministic BaselineRanker.');
        rawRankedCore = await this.baselineRanker.rank({
          userId,
          candidates: eligibleCandidates,
          featuresMap,
        });
      }
    } catch (err: any) {
      logger.error(`ML inference failed: ${err.message}. Falling back to BaselineRanker.`);
      algorithmName = this.baselineRanker.name;
      modelVersion = this.baselineRanker.version;
      rawRankedCore = await this.baselineRanker.rank({
        userId,
        candidates: eligibleCandidates,
        featuresMap,
      });
    }

    // 3. Score Exploration Candidates if available
    let rawRankedExplore: any[] = [];
    if (explorationCandidates.length > 0 && explorationRatio > 0) {
      try {
        const activeOrBase = ranker || this.baselineRanker;
        rawRankedExplore = await activeOrBase.rank({
          userId,
          candidates: explorationCandidates,
          featuresMap,
        });
      } catch (err) {
        rawRankedExplore = await this.baselineRanker.rank({
          userId,
          candidates: explorationCandidates,
          featuresMap,
        });
      }
    }

    // 4. Fetch Course Diversity Metadata (category, trainer)
    const courses = await prisma.course.findMany({
      where: { id: { in: allCourseIds } },
      select: {
        id: true,
        category: true,
        trainerId: true,
      },
    });

    const metaMap = new Map<string, CourseDiversityMetadata>(
      courses.map(c => [
        c.id,
        {
          courseId: c.id,
          category: c.category,
          trainerId: c.trainerId,
        },
      ])
    );

    // 5. Apply Educational Safety, MMR Diversity, and Exploration Re-ranking
    const finalItems = FinalReranker.rerank(
      rawRankedCore,
      rawRankedExplore,
      featuresMap,
      metaMap,
      {
        limit,
        mmrLambda,
        maxSameCategory: activeConfig.weights ? 3 : 3,
        maxSameTrainer: 2,
        explorationRatio,
      }
    );

    // 6. Map to RankedCandidate response with backward-compatible feature snapshot
    const ranked: RankedCandidate[] = finalItems.map(item => {
      const feat = featuresMap.get(item.courseId);
      const f = feat?.featureMap || {};

      const defaultSnapshot: RecommendationFeatures = {
        skillRelevanceScore: Math.round((f['skill_weightedSkillGap'] ?? 0.5) * 100),
        contentSimilarityScore: Math.round((f['semantic_courseUserEmbeddingSimilarity'] ?? 0.5) * 100),
        behavioralAffinityScore: Math.round((f['behavior_activityRecency'] ?? 0.5) * 100),
        collaborativeScore: Math.round((f['behavior_similarCourseInteractions'] ?? 0) * 100),
        qualityScore: Math.round((f['course_qualityScore'] ?? 0.75) * 100),
        freshnessScore: Math.round((f['course_freshness'] ?? 0.8) * 100),
        contextualScore: Math.round((f['context_departmentMatch'] ?? 0.5) * 100),
        difficultyAlignmentScore: Math.round((1.0 - Math.abs((f['skill_levelDifference'] ?? 0.5) - 0.5)) * 100),
        historicalSuccessRate: Math.round((f['course_completionRate'] ?? 0.5) * 100),
      };

      return {
        courseId: item.courseId,
        source: item.source,
        finalScore: item.score,
        rankPosition: item.rankPosition,
        reasonCodes: item.reasonCodes,
        featureSnapshot: defaultSnapshot,
        algorithmVersion: algorithmName,
        modelVersion,
        featureVersion: feat?.featureVersion || 'v1.0.0',
      };
    });

    logger.debug(`Completed ranking: ${ranked.length} items using ${algorithmName} (${modelVersion})`);
    return {
      ranked,
      algorithmVersion: algorithmName,
      modelVersion,
    };
  }
}
