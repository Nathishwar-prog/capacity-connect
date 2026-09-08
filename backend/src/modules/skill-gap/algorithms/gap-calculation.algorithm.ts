/**
 * Gap Calculation Algorithm
 * Deterministically computes raw gap, normalized severity, classification, and gap type.
 */

import {
  GapClassification,
  GapType,
  LearnerCompetencyState,
  CompetencyRequirement,
} from '../types/skill-gap.types';

export interface GapCalculationOutput {
  rawGap: number;
  gapSeverity: number;
  classification: GapClassification;
  gapType: GapType;
}

export class GapCalculationAlgorithm {
  /**
   * Computes deterministic gap metrics for a learner against a specific competency requirement.
   */
  public static calculate(
    requirement: CompetencyRequirement,
    learnerState?: LearnerCompetencyState | null
  ): GapCalculationOutput {
    const requiredLevel = Math.max(0, requirement.targetLevel);
    const currentLevel = learnerState ? Math.max(0, learnerState.currentLevel) : 0;
    const confidenceScore = learnerState?.confidenceScore ?? 0.0;
    const forgettingRisk = learnerState?.forgettingRisk ?? 0.0;
    const evidenceCount = learnerState?.evidenceCount ?? 0;

    // 1. Raw Gap: max(0, requiredLevel - currentLevel)
    const rawGap = Math.max(0, requiredLevel - currentLevel);

    // 2. Gap Severity: (rawGap / requiredLevel) * 100 with zero-division safeguard
    const gapSeverity =
      requiredLevel > 0
        ? Math.min(100, Math.max(0, (rawGap / requiredLevel) * 100))
        : 0;

    // 3. Gap Classification
    // Rules:
    // - If currentLevel == 0 and requiredLevel > 0: MISSING
    // - If rawGap == 0 and currentLevel > requiredLevel: EXCEEDS_REQUIREMENT
    // - If rawGap == 0 and forgettingRisk >= 0.65: AT_RISK (retention degradation)
    // - If rawGap == 0: MEETS_REQUIREMENT
    // - If evidenceCount === 0 || confidenceScore < 0.40: UNCERTAIN
    // - If rawGap > 0: WEAK
    let classification: GapClassification;

    if (currentLevel === 0 && requiredLevel > 0) {
      classification = 'MISSING';
    } else if (rawGap === 0) {
      if (currentLevel > requiredLevel) {
        classification = 'EXCEEDS_REQUIREMENT';
      } else if (forgettingRisk >= 0.65) {
        classification = 'AT_RISK';
      } else {
        classification = 'MEETS_REQUIREMENT';
      }
    } else {
      // Learner has gap
      if (evidenceCount === 0 || confidenceScore < 0.40) {
        classification = 'UNCERTAIN';
      } else {
        classification = 'WEAK';
      }
    }

    // 4. Gap Type
    let gapType: GapType;
    if (gapSeverity === 0) {
      gapType = 'NO_GAP';
    } else if (gapSeverity <= 25) {
      gapType = 'LOW';
    } else if (gapSeverity <= 50) {
      gapType = 'MEDIUM';
    } else if (gapSeverity <= 75) {
      gapType = 'HIGH';
    } else {
      gapType = 'CRITICAL';
    }

    return {
      rawGap,
      gapSeverity: Math.round(gapSeverity * 100) / 100,
      classification,
      gapType,
    };
  }
}
