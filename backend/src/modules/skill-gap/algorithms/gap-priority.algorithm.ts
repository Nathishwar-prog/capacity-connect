/**
 * Gap Priority Algorithm
 * Deterministically ranks skill gaps across 6 objective factors and criticality multipliers.
 */

import {
  GapPriorityLevel,
  RequirementCriticality,
  SkillGapAlgorithmWeights,
  DEFAULT_ALGORITHM_WEIGHTS,
} from '../types/skill-gap.types';

export interface GapPriorityInput {
  gapSeverity: number;          // 0 - 100
  importance: number;           // 0.0 - 1.0 or 0 - 100
  dependentCount: number;       // Downstream competencies dependent on this
  maxDependents?: number;       // Total dependent graph normalization
  confidenceScore: number;      // 0.0 - 1.0
  forgettingRisk: number;       // 0.0 - 1.0
  recentErrorSeverity: number;  // 0 - 100
  criticality: RequirementCriticality;
  weights?: Partial<SkillGapAlgorithmWeights>;
}

export interface GapPriorityOutput {
  priorityScore: number; // Clamped 0 - 100
  priorityLevel: GapPriorityLevel;
  factorBreakdown: {
    severityComponent: number;
    importanceComponent: number;
    dependencyComponent: number;
    uncertaintyComponent: number;
    forgettingComponent: number;
    errorComponent: number;
    criticalityMultiplier: number;
  };
}

export class GapPriorityAlgorithm {
  public static calculate(input: GapPriorityInput): GapPriorityOutput {
    const weights: SkillGapAlgorithmWeights = {
      ...DEFAULT_ALGORITHM_WEIGHTS,
      ...input.weights,
    };

    // 1. Normalize Factors to [0, 100]
    const sev = Math.min(100, Math.max(0, input.gapSeverity));
    
    // Importance: if <= 1.0 treat as normalized, if > 1.0 treat as already on 0-100 scale
    const imp = input.importance <= 1.0
      ? Math.min(100, Math.max(0, input.importance * 100))
      : Math.min(100, Math.max(0, input.importance));

    // Dependency Impact: scale dependent count (5+ dependents reaches 100)
    const maxDep = input.maxDependents && input.maxDependents > 0 ? input.maxDependents : 5;
    const dep = Math.min(100, (Math.max(0, input.dependentCount) / maxDep) * 100);

    // Uncertainty: (1 - confidence) * 100
    const unc = Math.min(100, Math.max(0, (1 - input.confidenceScore) * 100));

    // Forgetting Risk: risk * 100
    const fgt = Math.min(100, Math.max(0, input.forgettingRisk * 100));

    // Error Severity: already 0 - 100
    const err = Math.min(100, Math.max(0, input.recentErrorSeverity));

    // 2. Linear Combination
    const basePriority =
      weights.severityWeight * sev +
      weights.importanceWeight * imp +
      weights.dependencyWeight * dep +
      weights.uncertaintyWeight * unc +
      weights.forgettingWeight * fgt +
      weights.errorSeverityWeight * err;

    // 3. Multiplier based on Requirement Criticality
    let multiplier = weights.normalMultiplier;
    switch (input.criticality) {
      case 'CORE':
        multiplier = weights.coreMultiplier;
        break;
      case 'IMPORTANT':
        multiplier = weights.importantMultiplier;
        break;
      case 'NORMAL':
        multiplier = weights.normalMultiplier;
        break;
      case 'OPTIONAL':
        multiplier = weights.optionalMultiplier;
        break;
    }

    // 4. Final priority calculation clamped to [0, 100]
    const rawFinal = basePriority * multiplier;
    const priorityScore = Math.round(Math.min(100, Math.max(0, rawFinal)) * 100) / 100;

    // 5. Determine Priority Level
    let priorityLevel: GapPriorityLevel;
    if (priorityScore >= 75) {
      priorityLevel = 'CRITICAL';
    } else if (priorityScore >= 50) {
      priorityLevel = 'HIGH';
    } else if (priorityScore >= 25) {
      priorityLevel = 'MEDIUM';
    } else {
      priorityLevel = 'LOW';
    }

    return {
      priorityScore,
      priorityLevel,
      factorBreakdown: {
        severityComponent: Math.round(weights.severityWeight * sev * 100) / 100,
        importanceComponent: Math.round(weights.importanceWeight * imp * 100) / 100,
        dependencyComponent: Math.round(weights.dependencyWeight * dep * 100) / 100,
        uncertaintyComponent: Math.round(weights.uncertaintyWeight * unc * 100) / 100,
        forgettingComponent: Math.round(weights.forgettingWeight * fgt * 100) / 100,
        errorComponent: Math.round(weights.errorSeverityWeight * err * 100) / 100,
        criticalityMultiplier: multiplier,
      },
    };
  }
}
