/**
 * Diversity Re-Ranking Algorithm (Maximal Marginal Relevance - MMR)
 * 
 * Prevents recommendation monoculture by balancing relevance score with diversity.
 * Uses MMR formulation:
 *   MMR_Score(c) = λ * Relevance(c) - (1 - λ) * max_{s in Selected}(Similarity(c, s))
 * Also applies hard diversity constraints:
 *   - Max courses from same category (default: 2)
 *   - Max courses from same instructor/trainer (default: 2)
 */

import { RankedCandidate, ContentMetadata } from '../recommendation.types';
import { calculateContentSimilarity } from './content-similarity.algorithm';
import { RECSYS_DEFAULTS } from '../recommendation.constants';

export interface MMRConfig {
  lambda: number;             // Trade-off: 1.0 = pure relevance, 0.0 = pure diversity. Default 0.7
  maxPerCategory: number;     // Hard cap per category. Default 2
  maxPerTrainer: number;      // Hard cap per trainer. Default 2
  targetCount: number;        // Number of items to select
}

export interface CandidateWithContentMetadata extends RankedCandidate {
  contentMetadata: ContentMetadata;
  trainerId?: string | null;
}

export function applyMMRDiversity(
  candidates: CandidateWithContentMetadata[],
  config: Partial<MMRConfig> = {}
): CandidateWithContentMetadata[] {
  const lambda = config.lambda ?? RECSYS_DEFAULTS.MMR_LAMBDA;
  const maxPerCategory = config.maxPerCategory ?? RECSYS_DEFAULTS.MAX_PER_CATEGORY;
  const maxPerTrainer = config.maxPerTrainer ?? RECSYS_DEFAULTS.MAX_PER_TRAINER;
  const targetCount = config.targetCount ?? RECSYS_DEFAULTS.DEFAULT_LIMIT;

  if (candidates.length === 0) return [];
  if (candidates.length <= 1) return [...candidates];

  const unselected = [...candidates];
  const selected: CandidateWithContentMetadata[] = [];
  const categoryCounts: Record<string, number> = {};
  const trainerCounts: Record<string, number> = {};

  // Step 1: Select the highest-ranked candidate as the starting point
  const first = unselected.shift()!;
  selected.push(first);
  categoryCounts[first.contentMetadata.category] = 1;
  if (first.trainerId) {
    trainerCounts[first.trainerId] = 1;
  }

  // Step 2: Iteratively select candidates maximizing MMR objective while respecting constraints
  while (selected.length < targetCount && unselected.length > 0) {
    let bestIndex = -1;
    let bestMmrScore = -Infinity;

    for (let i = 0; i < unselected.length; i++) {
      const candidate = unselected[i];
      const cat = candidate.contentMetadata.category;
      const trainer = candidate.trainerId;

      // Check hard diversity caps
      if ((categoryCounts[cat] || 0) >= maxPerCategory) {
        continue;
      }
      if (trainer && (trainerCounts[trainer] || 0) >= maxPerTrainer) {
        continue;
      }

      // Compute maximum similarity to any already selected candidate
      let maxSim = 0;
      for (const sel of selected) {
        const sim = calculateContentSimilarity(candidate.contentMetadata, sel.contentMetadata);
        if (sim > maxSim) {
          maxSim = sim;
        }
      }

      // Normalize relevance and similarity to [0, 1]
      const relNorm = candidate.finalScore / 100;
      const simNorm = maxSim / 100;

      // MMR Score
      const mmrScore = lambda * relNorm - (1 - lambda) * simNorm;

      if (mmrScore > bestMmrScore) {
        bestMmrScore = mmrScore;
        bestIndex = i;
      }
    }

    // If no candidate satisfies hard constraints, relax them to avoid starving the list
    if (bestIndex === -1) {
      // Pick the highest remaining relevance candidate
      bestIndex = 0;
    }

    const chosen = unselected.splice(bestIndex, 1)[0];
    selected.push(chosen);

    const chosenCat = chosen.contentMetadata.category;
    categoryCounts[chosenCat] = (categoryCounts[chosenCat] || 0) + 1;

    if (chosen.trainerId) {
      trainerCounts[chosen.trainerId] = (trainerCounts[chosen.trainerId] || 0) + 1;
    }
  }

  return selected;
}
