/**
 * Controlled Exploration Re-ranker
 * Capacity Connect — Learning-to-Rank Recommendation Engine
 * 
 * Injects 10-20% controlled exploration into the diversified recommendation list.
 * Exploration candidates must be hard-eligible, educational, and skill-adjacent.
 */

import { RankedItem } from '../ranking/ranker.interface';

export interface ExplorationOptions {
  explorationRatio?: number; // default 0.15 (15%)
  targetLimit?: number;      // default 10
}

export class ExplorationReranker {
  /**
   * Injects exploration candidates into designated discovery slots
   */
  public static inject(
    coreItems: RankedItem[],
    explorationCandidates: RankedItem[],
    options: ExplorationOptions = {}
  ): RankedItem[] {
    const { explorationRatio = 0.15, targetLimit = 10 } = options;

    if (explorationCandidates.length === 0 || explorationRatio <= 0) {
      return coreItems.slice(0, targetLimit);
    }

    const numExploration = Math.max(1, Math.round(targetLimit * explorationRatio));
    const numCore = targetLimit - numExploration;

    const selectedCore = coreItems.slice(0, numCore);
    const selectedExploration = explorationCandidates.slice(0, numExploration);

    // Tag exploration candidates
    const taggedExploration: RankedItem[] = selectedExploration.map(item => ({
      ...item,
      reasonCodes: Array.from(new Set([...item.reasonCodes, 'RECOMMENDED_FOR_EXPLORATION', 'EXPLORATION_HORIZON'])),
      explanationSignals: {
        ...item.explanationSignals,
        isExploration: true,
      },
    }));

    // Interleave exploration item into middle/lower discovery position (e.g. slot 3 or 4)
    const result: RankedItem[] = [];
    let coreIdx = 0;
    let expIdx = 0;

    for (let slot = 0; slot < targetLimit; slot++) {
      // Injects exploration at slot 3 and slot 7 (0-indexed)
      if ((slot === 3 || slot === 7) && expIdx < taggedExploration.length) {
        result.push(taggedExploration[expIdx++]);
      } else if (coreIdx < selectedCore.length) {
        result.push(selectedCore[coreIdx++]);
      } else if (expIdx < taggedExploration.length) {
        result.push(taggedExploration[expIdx++]);
      }
    }

    // Reassign 1-indexed rank positions
    result.forEach((item, idx) => {
      item.rankPosition = idx + 1;
    });

    return result;
  }
}
