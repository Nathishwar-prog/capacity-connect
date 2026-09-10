import { revisionRepository } from '../repositories/revision.repository';

export interface EligibilityResult {
  isEligible: boolean;
  reason?: string;
  cooldownHoursRemaining?: number;
}

export class EligibilityService {
  /**
   * Checks if user is eligible to generate/start a revision session for a group.
   * Default cooldown: 2 hours between intense sessions of the same group to allow consolidation.
   */
  async checkSessionEligibility(userId: string, groupId?: string): Promise<EligibilityResult> {
    const latestSession = await revisionRepository.getLatestSession(userId);

    if (!latestSession) {
      return { isEligible: true };
    }

    // Check if there is an in-progress session
    if (latestSession.status === 'STARTED' || latestSession.status === 'GENERATED') {
      return {
        isEligible: true,
        reason: 'Existing session in progress. Learner may continue or complete.',
      };
    }

    // Cooldown check for the same group
    if (groupId && latestSession.focusGroupId === groupId && latestSession.completedAt) {
      const elapsedHours =
        (new Date().getTime() - new Date(latestSession.completedAt).getTime()) /
        (1000 * 60 * 60);

      const COOLDOWN_HOURS = 1.5; // 90 minutes
      if (elapsedHours < COOLDOWN_HOURS) {
        return {
          isEligible: true, // We still allow generation if requested, but flag cooldown notice
          cooldownHoursRemaining: Math.round((COOLDOWN_HOURS - elapsedHours) * 10) / 10,
          reason: `Group recently revised. Next optimal consolidation window in ${
            Math.round((COOLDOWN_HOURS - elapsedHours) * 10) / 10
          }h.`,
        };
      }
    }

    return { isEligible: true };
  }

  /**
   * Evaluates if a topic should be excluded from remediation due to high mastery.
   */
  isRemediationCandidate(score: number, retrievability: number): boolean {
    // If mastered (>85) and high retention (>0.80), not a remediation candidate
    return !(score >= 85 && retrievability >= 0.8);
  }
}

export const eligibilityService = new EligibilityService();
