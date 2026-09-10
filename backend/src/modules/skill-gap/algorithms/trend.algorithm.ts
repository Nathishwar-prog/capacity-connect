/**
 * Gap Trend Analysis Algorithm
 * Evaluates temporal trajectory across skill gap analysis snapshots.
 */

import { GapTrend } from '../types/skill-gap.types';

export interface HistoricalGapSnapshot {
  competencyId: string;
  rawGap: number;
  gapSeverity: number;
  currentLevel: number;
  calculatedAt: Date;
}

export class TrendAlgorithm {
  /**
   * Compares current gap state with historical baseline.
   */
  public static determineTrend(
    currentCompetencyId: string,
    currentRawGap: number,
    currentSeverity: number,
    historicalSnapshots: Map<string, HistoricalGapSnapshot>
  ): GapTrend {
    const historical = historicalSnapshots.get(currentCompetencyId);

    if (!historical) {
      return 'NEW';
    }

    if (historical.rawGap > 0 && currentRawGap === 0) {
      return 'RESOLVED';
    }

    if (currentRawGap < historical.rawGap) {
      return 'IMPROVING';
    }

    if (currentRawGap > historical.rawGap) {
      return 'WORSENING';
    }

    // rawGap is identical: check severity or stability changes
    if (currentSeverity > historical.gapSeverity + 5) {
      return 'WORSENING';
    }

    if (currentSeverity < historical.gapSeverity - 5) {
      return 'IMPROVING';
    }

    return 'STABLE';
  }
}
