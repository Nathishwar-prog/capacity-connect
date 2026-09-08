/**
 * Weighted Linear Combination Ranker
 * 
 * Computes the final ranking score as:
 *   FinalScore = Σ (Weight_i * Feature_i)
 * Where weights are normalized so Σ Weight_i = 1.0.
 */

import { IRanker, RankerInput } from './ranker.interface';
import { RankedCandidate, RecommendationFeatures } from '../recommendation.types';

export class WeightedLinearRanker implements IRanker {
  public rank(input: RankerInput): RankedCandidate[] {
    const { candidates, featuresMap, weights } = input;

    // Verify weights sum to 1.0 (or normalize if floating point drift)
    const weightSum =
      weights.skillRelevance +
      weights.contentSimilarity +
      weights.behavioralAffinity +
      weights.collaborative +
      weights.quality +
      weights.freshness +
      weights.contextual +
      weights.difficultyAlignment +
      weights.historicalSuccess;

    const normW = {
      skillRelevance: weights.skillRelevance / (weightSum || 1),
      contentSimilarity: weights.contentSimilarity / (weightSum || 1),
      behavioralAffinity: weights.behavioralAffinity / (weightSum || 1),
      collaborative: weights.collaborative / (weightSum || 1),
      quality: weights.quality / (weightSum || 1),
      freshness: weights.freshness / (weightSum || 1),
      contextual: weights.contextual / (weightSum || 1),
      difficultyAlignment: weights.difficultyAlignment / (weightSum || 1),
      historicalSuccess: weights.historicalSuccess / (weightSum || 1),
    };

    const defaultFeatures: RecommendationFeatures = {
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

    const ranked: RankedCandidate[] = [];

    for (const cand of candidates) {
      const feat = featuresMap.get(cand.courseId) || defaultFeatures;

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

      // Rounded to 2 decimal places [0, 100]
      const finalScore = Math.max(0, Math.min(100, Math.round(score * 100) / 100));

      ranked.push({
        courseId: cand.courseId,
        source: cand.source,
        finalScore,
        rankPosition: 0, // Will be set after sorting
        reasonCodes: [...cand.reasonCodes],
        featureSnapshot: feat,
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
