export interface ErrorAnalysisInput {
  errorCount: number;
  consecutiveSuccesses?: number;
  lastErrorTimestamp?: Date | null;
  currentDate?: Date;
}

export interface ErrorAnalysisResult {
  errorSeverityScore: number; // 0 - 100
  effectiveErrorCount: number;
  decayApplied: boolean;
}

/**
 * Calculates error severity score in [0, 100] based on error frequency and recovery.
 *
 * Base mapping for error counts:
 * 0 errors: 0
 * 1 error: 20
 * 2 errors: 45
 * 3 errors: 70
 * 4+ errors: 95
 *
 * Each consecutive clean success dampens the severity by 35%.
 */
export function calculateErrorSeverity(input: ErrorAnalysisInput): ErrorAnalysisResult {
  const { errorCount, consecutiveSuccesses = 0 } = input;

  if (errorCount <= 0) {
    return {
      errorSeverityScore: 0,
      effectiveErrorCount: 0,
      decayApplied: false,
    };
  }

  let baseSeverity: number;
  if (errorCount === 1) {
    baseSeverity = 20;
  } else if (errorCount === 2) {
    baseSeverity = 45;
  } else if (errorCount === 3) {
    baseSeverity = 70;
  } else {
    baseSeverity = Math.min(100, 95 + (errorCount - 4) * 1.5);
  }

  // Dampen with consecutive successful attempts
  let dampedSeverity = baseSeverity;
  if (consecutiveSuccesses > 0) {
    dampedSeverity = baseSeverity * Math.pow(0.65, Math.min(4, consecutiveSuccesses));
  }

  // Time decay if last error occurred > 14 days ago
  let decayApplied = false;
  if (input.lastErrorTimestamp) {
    const now = input.currentDate ?? new Date();
    const daysSinceError = Math.max(
      0,
      (now.getTime() - new Date(input.lastErrorTimestamp).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceError > 14) {
      dampedSeverity *= Math.exp(-(daysSinceError - 14) / 28);
      decayApplied = true;
    }
  }

  const finalScore = Math.max(0, Math.min(100, Math.round(dampedSeverity * 10) / 10));

  return {
    errorSeverityScore: finalScore,
    effectiveErrorCount: errorCount,
    decayApplied,
  };
}
