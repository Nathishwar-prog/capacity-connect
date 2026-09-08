/**
 * Diversity Re-ranker (Maximal Marginal Relevance - MMR)
 * Capacity Connect — Learning-to-Rank Recommendation Engine
 * 
 * Prevents category and trainer saturation while maintaining relevance:
 *   Score_MMR(c) = λ * Relevance(c) - (1 - λ) * max_{s in S} Similarity(c, s)
 */

import { RankedItem } from '../ranking/ranker.interface';

export interface CourseDiversityMetadata {
  courseId: string;
  category: string;
  trainerId?: string;
  topics?: string[];
}

export interface DiversityOptions {
  lambda?: number;          // Trade-off: 1.0 = pure relevance, 0.0 = pure diversity. Default: 0.70
  maxSameCategory?: number; // Max items from identical category. Default: 3
  maxSameTrainer?: number;  // Max items from same trainer. Default: 2
  targetLimit?: number;     // Number of items to return. Default: 10
}

export class DiversityReranker {
  /**
   * Computes Jaccard/Categorical similarity between two courses
   */
  private static computeSimilarity(
    a: CourseDiversityMetadata,
    b: CourseDiversityMetadata
  ): number {
    let sim = 0;
    if (a.category === b.category) sim += 0.6;
    if (a.trainerId && b.trainerId && a.trainerId === b.trainerId) sim += 0.4;
    return Math.min(1.0, sim);
  }

  /**
   * Applies MMR diversity selection to ranked items
   */
  public static rerank(
    rankedItems: RankedItem[],
    metaMap: Map<string, CourseDiversityMetadata>,
    options: DiversityOptions = {}
  ): RankedItem[] {
    const {
      lambda = 0.70,
      maxSameCategory = 3,
      maxSameTrainer = 2,
      targetLimit = 10,
    } = options;

    if (rankedItems.length <= 1) return rankedItems;

    const unselected = [...rankedItems];
    const selected: RankedItem[] = [];

    const categoryCounts = new Map<string, number>();
    const trainerCounts = new Map<string, number>();

    const maxScore = Math.max(...rankedItems.map(r => r.score), 1.0);

    while (unselected.length > 0 && selected.length < targetLimit) {
      let bestIdx = -1;
      let bestMMRScore = -Infinity;

      for (let i = 0; i < unselected.length; i++) {
        const candidate = unselected[i];
        const meta = metaMap.get(candidate.courseId) || {
          courseId: candidate.courseId,
          category: 'General',
        };

        // Check saturation constraints (unless course has critical gap)
        const isCritical = candidate.reasonCodes.includes('CLOSES_CRITICAL_GAP');
        const catCount = categoryCounts.get(meta.category) || 0;
        const trainCount = meta.trainerId ? (trainerCounts.get(meta.trainerId) || 0) : 0;

        if (!isCritical) {
          if (catCount >= maxSameCategory) continue;
          if (meta.trainerId && trainCount >= maxSameTrainer) continue;
        }

        // Normalized relevance [0, 1]
        const normalizedRelevance = candidate.score / maxScore;

        // Maximum similarity to already selected items
        let maxSim = 0;
        for (const sel of selected) {
          const selMeta = metaMap.get(sel.courseId) || {
            courseId: sel.courseId,
            category: 'General',
          };
          const sim = this.computeSimilarity(meta, selMeta);
          if (sim > maxSim) maxSim = sim;
        }

        // MMR Objective
        const mmrScore = lambda * normalizedRelevance - (1.0 - lambda) * maxSim;

        if (mmrScore > bestMMRScore) {
          bestMMRScore = mmrScore;
          bestIdx = i;
        }
      }

      // If all remaining candidates violate caps, break out or pick top remaining
      if (bestIdx === -1) {
        if (unselected.length > 0 && selected.length < targetLimit) {
          // Fallback: take top unselected to satisfy limit
          const fallback = unselected.shift()!;
          selected.push(fallback);
          continue;
        }
        break;
      }

      const chosen = unselected.splice(bestIdx, 1)[0];
      selected.push(chosen);

      const chosenMeta = metaMap.get(chosen.courseId);
      if (chosenMeta) {
        categoryCounts.set(chosenMeta.category, (categoryCounts.get(chosenMeta.category) || 0) + 1);
        if (chosenMeta.trainerId) {
          trainerCounts.set(chosenMeta.trainerId, (trainerCounts.get(chosenMeta.trainerId) || 0) + 1);
        }
      }
    }

    // Reassign rank positions
    selected.forEach((item, idx) => {
      item.rankPosition = idx + 1;
    });

    return selected;
  }
}
