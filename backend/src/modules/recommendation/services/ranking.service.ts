/**
 * Ranking Service
 * 
 * Coordinates multi-stage ranking pipeline:
 * 1. Feature snapshot generation across all 9 normalized features
 * 2. Weighted linear ranking
 * 3. MMR diversity re-ranking (Maximal Marginal Relevance)
 * 4. Controlled exploration candidate injection
 */

import prisma from '../../../database/client';
import {
  RecommendationCandidate,
  RankedCandidate,
  FeatureWeights,
  RecommendationSurface,
} from '../recommendation.types';
import { RecommendationFeatureBuilder } from '../ranking/feature-builder';
import { WeightedLinearRanker } from '../ranking/weighted-ranker';
import { applyMMRDiversity, CandidateWithContentMetadata } from '../algorithms/diversity.algorithm';
import { injectExploratoryCandidates } from '../algorithms/exploration.algorithm';
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
  private featureBuilder: RecommendationFeatureBuilder;
  private ranker: WeightedLinearRanker;

  constructor() {
    this.featureBuilder = new RecommendationFeatureBuilder();
    this.ranker = new WeightedLinearRanker();
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
   * Ranks eligible candidates through features, weighted ranker, MMR diversity, and exploration injection.
   */
  public async rankCandidates(
    eligibleCandidates: RecommendationCandidate[],
    explorationCandidates: RecommendationCandidate[],
    options: RankCandidatesOptions
  ): Promise<{ ranked: RankedCandidate[]; algorithmVersion: string }> {
    const { userId, surface = 'DASHBOARD', activeCourseId, limit = RECSYS_DEFAULTS.DEFAULT_LIMIT } = options;

    const activeConfig = await this.getActiveWeights();
    const weights = options.weights || activeConfig.weights;
    const mmrLambda = options.mmrLambda ?? activeConfig.mmrLambda;
    const explorationRatio = options.explorationRatio ?? activeConfig.explorationRatio;

    if (eligibleCandidates.length === 0) {
      return { ranked: [], algorithmVersion: activeConfig.version };
    }

    // 1. Build features for all core candidates
    const featuresMap = await this.featureBuilder.buildFeaturesForCandidates(
      eligibleCandidates,
      { userId, surface, activeCourseId }
    );

    // 2. Score and rank core candidates
    const rankedCore = this.ranker.rank({
      candidates: eligibleCandidates,
      featuresMap,
      weights,
    });

    // 3. Fetch course content metadata for MMR diversity re-ranking
    const allCourseIds = Array.from(
      new Set([...eligibleCandidates.map(c => c.courseId), ...explorationCandidates.map(c => c.courseId)])
    );

    const courses = await prisma.course.findMany({
      where: { id: { in: allCourseIds } },
      select: {
        id: true,
        category: true,
        description: true,
        trainerId: true,
      },
    });

    const courseMetaMap = new Map(
      courses.map(c => [
        c.id,
        {
          category: c.category,
          topics: [c.category],
          description: c.description || '',
          trainerId: c.trainerId,
        },
      ])
    );

    // Attach content metadata to ranked core
    const coreWithMeta: CandidateWithContentMetadata[] = rankedCore.map(rc => {
      const meta = courseMetaMap.get(rc.courseId) || { category: 'General', topics: [], description: '', trainerId: '' };
      return {
        ...rc,
        contentMetadata: {
          category: meta.category,
          topics: meta.topics,
          description: meta.description,
        },
        trainerId: meta.trainerId,
      };
    });

    // 4. Apply MMR Diversity Re-Ranking
    const diversified = applyMMRDiversity(coreWithMeta, {
      lambda: mmrLambda,
      targetCount: limit,
    });

    // 5. Build features for exploration candidates and inject if available
    let finalSelection = diversified;

    if (explorationCandidates.length > 0 && explorationRatio > 0) {
      const exploreFeaturesMap = await this.featureBuilder.buildFeaturesForCandidates(
        explorationCandidates,
        { userId, surface, activeCourseId }
      );

      const rankedExplore = this.ranker.rank({
        candidates: explorationCandidates,
        featuresMap: exploreFeaturesMap,
        weights,
      });

      const exploreWithMeta: CandidateWithContentMetadata[] = rankedExplore.map(ec => {
        const meta = courseMetaMap.get(ec.courseId) || { category: 'General', topics: [], description: '', trainerId: '' };
        return {
          ...ec,
          contentMetadata: {
            category: meta.category,
            topics: meta.topics,
            description: meta.description,
          },
          trainerId: meta.trainerId,
        };
      });

      finalSelection = injectExploratoryCandidates(diversified, exploreWithMeta, {
        explorationRatio,
        totalSlots: limit,
      });
    }

    // Re-index final rank positions
    finalSelection.forEach((c, idx) => {
      c.rankPosition = idx + 1;
    });

    logger.debug(`Ranked ${finalSelection.length} final candidates using version=${activeConfig.version}`);
    return {
      ranked: finalSelection.map(f => ({
        courseId: f.courseId,
        source: f.source,
        finalScore: f.finalScore,
        rankPosition: f.rankPosition,
        reasonCodes: f.reasonCodes,
        featureSnapshot: f.featureSnapshot,
      })),
      algorithmVersion: activeConfig.version,
    };
  }
}
