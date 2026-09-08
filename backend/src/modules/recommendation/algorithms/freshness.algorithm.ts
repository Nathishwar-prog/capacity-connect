/**
 * Course Freshness Algorithm
 * Evaluates publication and update recency with half-life decay and evergreen preservation floor.
 */

export class FreshnessAlgorithm {
  private static readonly HALF_LIFE_DAYS = 180;
  private static readonly EVERGREEN_FLOOR = 50.0;

  /**
   * Calculates freshness score (0 - 100) preserving evergreen foundational courses.
   */
  public static calculate(
    publishedAt?: Date | null,
    updatedAt?: Date | null,
    now: Date = new Date()
  ): number {
    const effectiveDate = updatedAt || publishedAt || now;
    const deltaDays = Math.max(0, (now.getTime() - new Date(effectiveDate).getTime()) / 86400000);

    const decayFactor = Math.pow(0.5, deltaDays / this.HALF_LIFE_DAYS);
    // Scale between EVERGREEN_FLOOR (50) and 100
    const score = this.EVERGREEN_FLOOR + (100 - this.EVERGREEN_FLOOR) * decayFactor;

    return Math.round(Math.min(100, Math.max(this.EVERGREEN_FLOOR, score)) * 100) / 100;
  }
}

export function calculateFreshnessScore(
  publishedAt?: Date | null,
  updatedAt?: Date | null,
  now: Date = new Date()
): number {
  return FreshnessAlgorithm.calculate(publishedAt, updatedAt, now);
}
