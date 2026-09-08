/**
 * Readiness Service
 * Orchestrates multi-tier readiness score calculation and enrollment eligibility checks.
 */

import { ReadinessAlgorithm } from '../algorithms/readiness.algorithm';
import { CalculatedGapItem, OverallReadinessResult, SkillGapAlgorithmWeights } from '../types/skill-gap.types';

export class ReadinessService {
  public calculateReadiness(
    items: CalculatedGapItem[],
    weights?: Partial<SkillGapAlgorithmWeights>
  ): OverallReadinessResult {
    return ReadinessAlgorithm.calculate(items, weights);
  }
}
