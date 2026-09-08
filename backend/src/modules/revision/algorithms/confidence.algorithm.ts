export interface ConfidenceCalculationInput {
  sampleCount: number;
  recentScores: number[]; // up to last 10 scores
  daysSinceLastEvaluation?: number;
  diagnosticThreshold?: number; // default 0.40
}

export interface ConfidenceCalculationResult {
  confidenceScore: number; // 0.0 - 1.0
  sampleCoverage: number; // 0.0 - 1.0
  variance: number;
  variancePenalty: number;
  timeDecayFactor: number;
  requiresDiagnostic: boolean;
}

/**
 * Computes sample variance of score history.
 */
export function calculateVariance(scores: number[]): number {
  if (scores.length <= 1) return 0;
  const mean = scores.reduce((sum, s) => sum + s, 0) / scores.length;
  const squareDiffs = scores.map((s) => Math.pow(s - mean, 2));
  return squareDiffs.reduce((sum, d) => sum + d, 0) / (scores.length - 1);
}

/**
 * Calculates confidence score in [0.0, 1.0] based on:
 * 1. Sample count (saturates smoothly around 8-10 samples)
 * 2. Score stability / variance penalty (erratic scores penalize confidence)
 * 3. Time decay (if not evaluated in > 30 days)
 *
 * If confidence < diagnosticThreshold (0.40), marks requiresDiagnostic = true.
 */
export function calculateConfidence(
  input: ConfidenceCalculationInput
): ConfidenceCalculationResult {
  const { sampleCount, recentScores, daysSinceLastEvaluation = 0, diagnosticThreshold = 0.40 } =
    input;

  // 1. Sample coverage: 1 - exp(-N / 4.5)
  // At N=1: ~0.20, N=3: ~0.48, N=5: ~0.67, N=10: ~0.89, N=15: ~0.96
  const count = Math.max(0, sampleCount);
  const sampleCoverage = count === 0 ? 0.1 : 1 - Math.exp(-count / 4.5);

  // 2. Variance calculation & penalty
  const variance = calculateVariance(recentScores);
  // Normalized variance penalty: variance of 400 (std dev 20) produces ~0.20 penalty
  const variancePenalty = Math.min(0.35, (Math.sqrt(variance) / 100) * 0.7);

  // 3. Time decay factor: mild exponential decay over days
  // half-life for confidence freshness = 60 days
  const timeDecayFactor = Math.exp(-Math.max(0, daysSinceLastEvaluation) / 60);

  // Raw confidence
  let rawConfidence = (sampleCoverage - variancePenalty) * timeDecayFactor;
  // Floor at 0.10 for any record, cap at 1.0
  const confidenceScore = Math.max(0.1, Math.min(1.0, Math.round(rawConfidence * 1000) / 1000));

  return {
    confidenceScore,
    sampleCoverage: Math.round(sampleCoverage * 1000) / 1000,
    variance: Math.round(variance * 10) / 10,
    variancePenalty: Math.round(variancePenalty * 1000) / 1000,
    timeDecayFactor: Math.round(timeDecayFactor * 1000) / 1000,
    requiresDiagnostic: confidenceScore < diagnosticThreshold,
  };
}
