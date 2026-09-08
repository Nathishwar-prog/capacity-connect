/**
 * Behavioral Affinity Algorithm
 * Evaluates learner interactions with exponential time decay.
 */

import { BEHAVIORAL_EVENT_WEIGHTS } from '../recommendation.constants';

export interface LearnerBehaviorEvent {
  eventType: string;       // COMPLETE, ENROLL, START, SAVE, VIEW, DISMISS, ABANDON
  courseId: string;
  category?: string;
  occurredAt: Date;
}

export class BehavioralAffinityAlgorithm {
  private static readonly HALF_LIFE_DAYS = 30;

  /**
   * Calculates behavioral affinity score (0 - 100) for a candidate course based on user activity.
   */
  public static calculate(
    candidateCourseId: string,
    candidateCategory: string,
    events: LearnerBehaviorEvent[],
    now: Date = new Date()
  ): number {
    if (events.length === 0) return 50.0; // Neutral baseline for new learner

    let cumulativeAffinity = 50.0;
    const nowMs = now.getTime();

    for (const event of events) {
      const isDirectCourseMatch = event.courseId === candidateCourseId;
      const isCategoryMatch =
        event.category &&
        candidateCategory &&
        event.category.toLowerCase().trim() === candidateCategory.toLowerCase().trim();

      if (!isDirectCourseMatch && !isCategoryMatch) {
        continue;
      }

      const eventBaseWeight = BEHAVIORAL_EVENT_WEIGHTS[event.eventType] ?? 0;
      if (eventBaseWeight === 0) continue;

      // Time decay: exp(-deltaDays / 30)
      const deltaDays = Math.max(0, (nowMs - new Date(event.occurredAt).getTime()) / 86400000);
      const timeFactor = Math.exp(-deltaDays / this.HALF_LIFE_DAYS);

      // Direct match receives 1.0x, category match receives 0.5x
      const matchMultiplier = isDirectCourseMatch ? 1.0 : 0.5;

      cumulativeAffinity += eventBaseWeight * timeFactor * matchMultiplier;
    }

    return Math.round(Math.min(100, Math.max(0, cumulativeAffinity)) * 100) / 100;
  }
}

export function calculateBehavioralAffinity(
  events: Array<{ type?: string; eventType?: string; timestamp?: Date; occurredAt?: Date }>,
  now: Date = new Date()
): number {
  if (events.length === 0) return 50.0;

  let cumulativeAffinity = 50.0;
  const nowMs = now.getTime();

  for (const event of events) {
    const eType = event.type || event.eventType || '';
    const occurredAt = event.timestamp || event.occurredAt || now;

    // Direct penalty for dismissal
    if (eType === 'DISMISS') {
      return 0.0;
    }

    const eventBaseWeight = BEHAVIORAL_EVENT_WEIGHTS[eType] ?? 0;
    const deltaDays = Math.max(0, (nowMs - new Date(occurredAt).getTime()) / 86400000);
    const timeFactor = Math.exp(-deltaDays / 30);

    cumulativeAffinity += eventBaseWeight * timeFactor;
  }

  return Math.round(Math.min(100, Math.max(0, cumulativeAffinity)) * 100) / 100;
}
