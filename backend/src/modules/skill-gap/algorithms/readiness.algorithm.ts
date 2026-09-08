/**
 * Multi-Tier Readiness Calculation Algorithm
 * Computes overall, core, and critical readiness scores with hard CORE requirement gating.
 */

import {
  OverallReadinessResult,
  ReadinessStatus,
  CalculatedGapItem,
  SkillGapAlgorithmWeights,
  DEFAULT_ALGORITHM_WEIGHTS,
} from '../types/skill-gap.types';

export class ReadinessAlgorithm {
  public static calculate(
    items: CalculatedGapItem[],
    weights?: Partial<SkillGapAlgorithmWeights>
  ): OverallReadinessResult {
    const config = {
      ...DEFAULT_ALGORITHM_WEIGHTS,
      ...weights,
    };

    if (items.length === 0) {
      return {
        overallReadiness: 100,
        coreReadiness: 100,
        criticalReadiness: 100,
        readinessStatus: 'FULLY_READY',
        coreDeficienciesCount: 0,
        canEnrollOrAdvance: true,
        blockers: [],
      };
    }

    let totalWeightedRequired = 0;
    let totalWeightedCurrent = 0;

    let coreWeightedRequired = 0;
    let coreWeightedCurrent = 0;

    let criticalWeightedRequired = 0;
    let criticalWeightedCurrent = 0;

    let coreDeficienciesCount = 0;
    const blockers: string[] = [];

    for (const item of items) {
      const itemWeight = item.weight > 0 ? item.weight : 1.0;
      const cappedCurrent = Math.min(item.requiredLevel, item.currentLevel);

      // Overall
      totalWeightedRequired += item.requiredLevel * itemWeight;
      totalWeightedCurrent += cappedCurrent * itemWeight;

      // Core
      if (item.criticality === 'CORE') {
        coreWeightedRequired += item.requiredLevel * itemWeight;
        coreWeightedCurrent += cappedCurrent * itemWeight;

        if (item.rawGap > 0) {
          coreDeficienciesCount++;
          blockers.push(
            `Core competency "${item.name}" unmet: requires Level ${item.requiredLevel}, currently at Level ${item.currentLevel}.`
          );
        }
      }

      // Critical (CORE + IMPORTANT)
      if (item.criticality === 'CORE' || item.criticality === 'IMPORTANT') {
        criticalWeightedRequired += item.requiredLevel * itemWeight;
        criticalWeightedCurrent += cappedCurrent * itemWeight;
      }
    }

    // Compute ratios
    const overallReadiness =
      totalWeightedRequired > 0
        ? Math.round(
            Math.min(100, Math.max(0, (totalWeightedCurrent / totalWeightedRequired) * 100)) * 100
          ) / 100
        : 100;

    const coreReadiness =
      coreWeightedRequired > 0
        ? Math.round(
            Math.min(100, Math.max(0, (coreWeightedCurrent / coreWeightedRequired) * 100)) * 100
          ) / 100
        : overallReadiness;

    const criticalReadiness =
      criticalWeightedRequired > 0
        ? Math.round(
            Math.min(
              100,
              Math.max(0, (criticalWeightedCurrent / criticalWeightedRequired) * 100)
            ) * 100
          ) / 100
        : overallReadiness;

    // Determine Readiness Status with Hard Gating
    let readinessStatus: ReadinessStatus;
    let canEnrollOrAdvance = true;

    if (coreDeficienciesCount > 0) {
      // Hard Gating: Any CORE deficiency prevents FULLY_READY or GENERALLY_READY
      if (coreReadiness < 50 || overallReadiness < config.readinessThresholdCond || coreDeficienciesCount >= 2) {
        readinessStatus = 'NOT_READY';
        canEnrollOrAdvance = false;
      } else {
        readinessStatus = 'CONDITIONAL';
        canEnrollOrAdvance = true; // Allowed with mandatory prerequisite core training
      }
    } else {
      // No CORE deficiencies
      if (overallReadiness >= config.readinessThresholdFull && criticalReadiness >= 75) {
        readinessStatus = 'FULLY_READY';
      } else if (overallReadiness >= 70 && criticalReadiness >= 65) {
        readinessStatus = 'GENERALLY_READY';
      } else if (overallReadiness >= config.readinessThresholdCond) {
        readinessStatus = 'CONDITIONAL';
      } else {
        readinessStatus = 'NOT_READY';
        canEnrollOrAdvance = false;
      }
    }

    return {
      overallReadiness,
      coreReadiness,
      criticalReadiness,
      readinessStatus,
      coreDeficienciesCount,
      canEnrollOrAdvance,
      blockers,
    };
  }
}
