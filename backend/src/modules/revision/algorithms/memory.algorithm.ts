export interface MemoryCalculationInput {
  currentStabilityDays: number; // S in days (e.g. 1.0 to 90.0)
  lastPracticedAt: Date | null;
  currentDate?: Date;
}

export interface MemoryCalculationResult {
  retrievability: number; // R in [0.0, 1.0]
  forgettingFactor: number; // F = 1 - R in [0.0, 1.0]
  forgettingScore: number; // F * 100 in [0, 100]
  daysElapsed: number;
}

export interface StabilityUpdateInput {
  currentStabilityDays: number;
  performance: number; // 0.0 - 1.0
  daysElapsed: number;
}

const MIN_STABILITY = 0.5; // half a day
const MAX_STABILITY = 180.0; // 6 months
const DEFAULT_INITIAL_STABILITY = 2.0; // 2 days for a newly learned concept

/**
 * Calculates Retrievability (R) and Forgetting Factor (F) based on exponential decay:
 * R = exp(- delta_t / S)
 * F = 1 - R
 */
export function calculateRetrievability(input: MemoryCalculationInput): MemoryCalculationResult {
  const now = input.currentDate ?? new Date();
  const lastDate = input.lastPracticedAt ? new Date(input.lastPracticedAt) : null;

  if (!lastDate || isNaN(lastDate.getTime())) {
    // If never practiced, retrievability is low (0.20) and forgetting factor is high (0.80)
    return {
      retrievability: 0.2,
      forgettingFactor: 0.8,
      forgettingScore: 80.0,
      daysElapsed: 30.0,
    };
  }

  const millisElapsed = Math.max(0, now.getTime() - lastDate.getTime());
  const daysElapsed = millisElapsed / (1000 * 60 * 60 * 24);

  const stability = Math.max(MIN_STABILITY, input.currentStabilityDays || DEFAULT_INITIAL_STABILITY);
  const r = Math.exp(-daysElapsed / stability);
  const retrievability = Math.max(0.01, Math.min(1.0, Math.round(r * 1000) / 1000));
  const forgettingFactor = Math.max(0.0, Math.min(0.99, Math.round((1.0 - retrievability) * 1000) / 1000));
  const forgettingScore = Math.round(forgettingFactor * 100 * 10) / 10;

  return {
    retrievability,
    forgettingFactor,
    forgettingScore,
    daysElapsed: Math.round(daysElapsed * 10) / 10,
  };
}

/**
 * Updates memory stability (half-life in days) following a retrieval/practice event.
 * If performance is high (>= 0.70), stability expands.
 * If performance is poor (< 0.50), stability contracts.
 */
export function updateMemoryStability(input: StabilityUpdateInput): number {
  const currentS = Math.max(MIN_STABILITY, input.currentStabilityDays || DEFAULT_INITIAL_STABILITY);
  const p = Math.max(0, Math.min(1, input.performance));

  let newS: number;

  if (p >= 0.7) {
    // Successful recall: stability expands proportionally to performance and elapsed time
    const expansionFactor = 1.0 + 1.2 * p * Math.min(2.0, 1.0 + input.daysElapsed / currentS);
    newS = currentS * expansionFactor;
  } else if (p >= 0.5) {
    // Partial recall: slight stability bump
    newS = currentS * 1.1;
  } else {
    // Failed recall: stability regresses by 50%
    newS = Math.max(MIN_STABILITY, currentS * 0.5);
  }

  return Math.max(MIN_STABILITY, Math.min(MAX_STABILITY, Math.round(newS * 10) / 10));
}
