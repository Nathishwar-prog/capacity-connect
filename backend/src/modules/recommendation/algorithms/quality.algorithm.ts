/**
 * Course Quality Algorithm
 * Evaluates objective course quality metrics with Bayesian dampening against small-sample bias.
 */

export interface CourseQualityMetrics {
  completionRate: number;         // 0.0 - 1.0 or 0 - 100
  averageRating?: number | null;  // 1.0 - 5.0
  ratingCount?: number;           // Total reviews
  assessmentImprovement?: number; // 0 - 100
  dropoutRate?: number;           // 0 - 100
  assessmentScoreImprovement?: number;
}

export class QualityAlgorithm {
  private static readonly PRIOR_MEAN = 4.0;
  private static readonly MIN_EVIDENCE_THRESHOLD = 5;

  /**
   * Calculates normalized course quality score (0 - 100).
   */
  public static calculate(metrics: CourseQualityMetrics): number {
    const rawComp = metrics.completionRate <= 1.0 ? metrics.completionRate * 100 : metrics.completionRate;
    const ratingCount = metrics.ratingCount ?? 0;
    const averageRating = metrics.averageRating ?? 4.0;
    const assessmentGain = metrics.assessmentImprovement ?? metrics.assessmentScoreImprovement ?? 70;
    const dropout = metrics.dropoutRate ?? 15;

    // 1. Bayesian Dampened Rating
    const v = Math.max(0, ratingCount);
    const C = this.MIN_EVIDENCE_THRESHOLD;
    const m = this.PRIOR_MEAN;
    const rawR = Math.min(5.0, Math.max(1.0, averageRating));

    const dampenedRating = (C * m + v * rawR) / (C + v);
    // Convert 1 - 5 scale to 0 - 100
    const ratingScore = ((dampenedRating - 1.0) / 4.0) * 100;

    // 2. Completion Factor
    const compScore = Math.min(100, Math.max(0, rawComp));

    // 3. Assessment Improvement Factor
    const assessScore = Math.min(100, Math.max(0, assessmentGain));

    // 4. Low Dropout Bonus
    const retentionScore = Math.min(100, Math.max(0, 100 - dropout));

    // Weighted combination: Rating (40%), Completion (30%), Assessment Gain (20%), Low Dropout (10%)
    const finalQuality =
      0.40 * ratingScore +
      0.30 * compScore +
      0.20 * assessScore +
      0.10 * retentionScore;

    return Math.round(Math.min(100, Math.max(0, finalQuality)) * 100) / 100;
  }
}

export function calculateCourseQualityScore(metrics: CourseQualityMetrics): number {
  return QualityAlgorithm.calculate(metrics);
}
