import { PerformanceComponents } from '../types/revision.types';

export interface CompetencyUpdateInput {
  currentScore: number; // 0 - 100
  sampleCount: number; // number of prior attempts
  components: PerformanceComponents;
  difficultyWeight?: number; // 0.8 to 1.2, default 1.0
}

export interface CompetencyUpdateResult {
  performance: number; // 0.0 - 1.0
  performanceScore: number; // 0 - 100
  alpha: number; // bounded learning rate [0.10, 0.30]
  previousScore: number;
  newScore: number; // 0 - 100
  scoreDelta: number;
}

/**
 * Calculates raw event performance score according to the formula:
 * P = 0.55 * acc + 0.15 * speed + 0.10 * hint + 0.10 * conf + 0.10 * indep
 * All input components are normalized to [0.0, 1.0].
 */
export function calculatePerformance(components: PerformanceComponents): number {
  const acc = Math.max(0, Math.min(1, components.accuracy));
  const speed = Math.max(0, Math.min(1, components.speedScore));
  const hint = Math.max(0, Math.min(1, components.hintScore));
  const conf = Math.max(0, Math.min(1, components.confidenceSelfScore));
  const indep = Math.max(0, Math.min(1, components.independenceScore));

  const p = 0.55 * acc + 0.15 * speed + 0.10 * hint + 0.10 * conf + 0.10 * indep;
  return Math.max(0, Math.min(1, p));
}

/**
 * Computes bounded adaptive learning rate alpha in [0.10, 0.30].
 * Early samples have higher learning rate (up to 0.30) to quickly escape default initialization.
 * Mature records converge smoothly towards 0.10 to prevent volatile score bouncing.
 */
export function computeAdaptiveAlpha(sampleCount: number, difficultyWeight = 1.0): number {
  const count = Math.max(0, sampleCount);
  const baseAlpha = 0.30 / (1.0 + 0.12 * count);
  const adjustedAlpha = baseAlpha * Math.max(0.8, Math.min(1.2, difficultyWeight));
  return Math.max(0.10, Math.min(0.30, Math.round(adjustedAlpha * 1000) / 1000));
}

/**
 * Updates competency score using bounded EMA-style adaptation.
 * Clamped strictly to [0.0, 100.0].
 */
export function updateCompetencyScore(input: CompetencyUpdateInput): CompetencyUpdateResult {
  const performance = calculatePerformance(input.components);
  const performanceScore = Math.round(performance * 100 * 10) / 10;
  const alpha = computeAdaptiveAlpha(input.sampleCount, input.difficultyWeight ?? 1.0);

  const currentScore = Math.max(0, Math.min(100, input.currentScore));
  const targetScore = performance * 100;
  const delta = targetScore - currentScore;

  const rawNewScore = currentScore + alpha * delta;
  const newScore = Math.max(0, Math.min(100, Math.round(rawNewScore * 10) / 10));

  return {
    performance,
    performanceScore,
    alpha,
    previousScore: currentScore,
    newScore,
    scoreDelta: Math.round((newScore - currentScore) * 10) / 10,
  };
}
