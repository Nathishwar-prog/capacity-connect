/**
 * Weighted Linear Combination Ranker
 * 
 * Computes the final ranking score as:
 *   FinalScore = Σ (Weight_i * Feature_i)
 * Where weights are normalized so Σ Weight_i = 1.0.
 */

import { IRanker, RankerInput, RankedItem } from './ranker.interface';
import { RankedCandidate, RecommendationFeatures, FeatureWeights } from '../recommendation.types';
import { DEFAULT_FEATURE_WEIGHTS } from '../recommendation.constants';

export class WeightedLinearRanker implements IRanker {
  public readonly name = 'WEIGHTED_LINEAR';
  public readonly version = 'v1.0.0';
  public readonly isML = false;

  private extractFeatures(raw: any): RecommendationFeatures {
    if (!raw) {
      return {
        skillRelevanceScore: 50,
        contentSimilarityScore: 30,
        behavioralAffinityScore: 20,
        collaborativeScore: 0,
        qualityScore: 60,
        freshnessScore: 60,
        contextualScore: 40,
        difficultyAlignmentScore: 70,
        historicalSuccessRate: 60,
      };
    }

    if ('skillRelevanceScore' in raw) {
      return raw as RecommendationFeatures;
    }

    // NormalizedFeatureVector adaptation
    const fm = raw.featureMap || {};
    return {
      skillRelevanceScore: Math.round((fm['skill_weightedSkillGap'] ?? 0.5) * 100),
      contentSimilarityScore: Math.round((fm['semantic_courseUserEmbeddingSimilarity'] ?? 0.5) * 100),
      behavioralAffinityScore: Math.round((fm['behavior_activityRecency'] ?? 0.5) * 100),
      collaborativeScore: Math.round((fm['behavior_similarCourseInteractions'] ?? 0) * 100),
      qualityScore: Math.round((fm['course_qualityScore'] ?? 0.75) * 100),
      freshnessScore: Math.round((fm['course_freshness'] ?? 0.8) * 100),
      contextualScore: Math.round((fm['context_departmentMatch'] ?? 0.5) * 100),
      difficultyAlignmentScore: 70,
      historicalSuccessRate: Math.round((fm['course_completionRate'] ?? 0.5) * 100),
    };
  }

  public rank(input: RankerInput): (RankedCandidate & RankedItem)[] {
    const { candidates, featuresMap } = input;
    const weights: FeatureWeights = (input.weights as any) || DEFAULT_FEATURE_WEIGHTS;

    const w = {
      skillRelevance: weights.skillRelevance ?? 0.25,
      contentSimilarity: weights.contentSimilarity ?? 0.15,
      behavioralAffinity: weights.behavioralAffinity ?? 0.15,
      collaborative: weights.collaborative ?? 0.10,
      quality: weights.quality ?? 0.10,
      freshness: weights.freshness ?? 0.05,
      contextual: weights.contextual ?? 0.08,
      difficultyAlignment: weights.difficultyAlignment ?? 0.05,
      historicalSuccess: weights.historicalSuccess ?? 0.07,
    };

    const weightSum =
      w.skillRelevance +
      w.contentSimilarity +
      w.behavioralAffinity +
      w.collaborative +
      w.quality +
      w.freshness +
      w.contextual +
      w.difficultyAlignment +
      w.historicalSuccess;

    const normW = {
      skillRelevance: w.skillRelevance / (weightSum || 1),
      contentSimilarity: w.contentSimilarity / (weightSum || 1),
      behavioralAffinity: w.behavioralAffinity / (weightSum || 1),
      collaborative: w.collaborative / (weightSum || 1),
      quality: w.quality / (weightSum || 1),
      freshness: w.freshness / (weightSum || 1),
      contextual: w.contextual / (weightSum || 1),
      difficultyAlignment: w.difficultyAlignment / (weightSum || 1),
      historicalSuccess: w.historicalSuccess / (weightSum || 1),
    };

    const ranked: (RankedCandidate & RankedItem)[] = [];

    for (const cand of candidates) {
      const feat = this.extractFeatures(featuresMap.get(cand.courseId));

      const score =
        feat.skillRelevanceScore * normW.skillRelevance +
        feat.contentSimilarityScore * normW.contentSimilarity +
        feat.behavioralAffinityScore * normW.behavioralAffinity +
        feat.collaborativeScore * normW.collaborative +
        feat.qualityScore * normW.quality +
        feat.freshnessScore * normW.freshness +
        feat.contextualScore * normW.contextual +
        feat.difficultyAlignmentScore * normW.difficultyAlignment +
        feat.historicalSuccessRate * normW.historicalSuccess;

      const finalScore = Math.max(0, Math.min(100, Math.round(score * 100) / 100));

      ranked.push({
        courseId: cand.courseId,
        source: cand.source,
        score: finalScore,
        finalScore,
        rankPosition: 0,
        reasonCodes: [...cand.reasonCodes],
        featureSnapshot: feat,
        algorithmVersion: this.name,
        modelVersion: this.version,
        featureVersion: 'v1.0.0',
      });
    }

    // Sort descending by finalScore
    ranked.sort((a, b) => b.finalScore - a.finalScore);

    // Assign 1-indexed rank positions
    ranked.forEach((cand, idx) => {
      cand.rankPosition = idx + 1;
    });

    return ranked;
  }
}
