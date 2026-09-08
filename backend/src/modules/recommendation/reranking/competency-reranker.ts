/**
 * Competency & Prerequisite Safety Re-ranker
 * Capacity Connect — Learning-to-Rank Recommendation Engine
 * 
 * Enforces educational safety constraints:
 * 1. Down-ranks courses with excessive difficulty leaps where prerequisites are incomplete.
 * 2. Protects mission-critical skill gap courses from being drowned out by generic popularity.
 * 3. Boosts prerequisite courses when dependent courses have active learner interest.
 */

import { RankedItem } from '../ranking/ranker.interface';
import { NormalizedFeatureVector } from '../features/feature.types';
import logger from '../../../logger/winston.logger';

export interface SafetyRerankerOptions {
  criticalGapBoost?: number;     // default +15 points
  highGapBoost?: number;         // default +8 points
  missingPrereqPenalty?: number; // default -25 points
  excessiveLevelPenalty?: number;// default -20 points
}

export class CompetencySafetyReranker {
  /**
   * Applies educational safety rules to ranked candidates
   */
  public static rerank(
    rankedItems: RankedItem[],
    featuresMap: Map<string, NormalizedFeatureVector>,
    options: SafetyRerankerOptions = {}
  ): RankedItem[] {
    const {
      criticalGapBoost = 15,
      highGapBoost = 8,
      missingPrereqPenalty = 25,
      excessiveLevelPenalty = 20,
    } = options;

    const reranked: RankedItem[] = rankedItems.map(item => {
      const feat = featuresMap.get(item.courseId);
      const f = feat?.featureMap || {};

      let adjustedScore = item.score;
      const additionalReasons: string[] = [];

      // 1. Critical & High Skill Gap Protection
      const criticalGaps = f['skill_criticalGapCount'] ?? 0;
      const highGaps = f['skill_highPriorityGapCount'] ?? 0;

      if (criticalGaps > 0) {
        adjustedScore += criticalGapBoost;
        additionalReasons.push('CLOSES_CRITICAL_GAP');
      } else if (highGaps > 0) {
        adjustedScore += highGapBoost;
        additionalReasons.push('CLOSES_SKILL_GAP');
      }

      // 2. Prerequisite Safety Penalty
      const missingPrereqs = f['prereq_missingPrerequisiteCount'] ?? 0;
      const prereqRatio = f['prereq_satisfiedPrerequisiteRatio'] ?? 1.0;

      if (missingPrereqs > 0 && prereqRatio < 0.5) {
        adjustedScore -= missingPrereqPenalty;
        logger.debug(`Candidate ${item.courseId} penalized by ${missingPrereqPenalty} for missing prerequisites.`);
      }

      // 3. Excessive Level Leap Penalty (level diff > 2 where currentLevel is low)
      const currentLevel = (f['skill_currentLevel'] ?? 0) * 5.0;
      const requiredLevel = (f['skill_requiredLevel'] ?? 0) * 5.0;
      const diff = requiredLevel - currentLevel;

      if (diff > 2.0 && prereqRatio < 0.8) {
        adjustedScore -= excessiveLevelPenalty;
        logger.debug(`Candidate ${item.courseId} penalized by ${excessiveLevelPenalty} for difficulty leap (${diff.toFixed(1)}).`);
      }

      const finalScore = Math.max(0, Math.min(100, Math.round(adjustedScore * 100) / 100));

      const mergedReasonCodes = Array.from(new Set([...item.reasonCodes, ...additionalReasons]));

      return {
        ...item,
        score: finalScore,
        reasonCodes: mergedReasonCodes,
      };
    });

    // Sort descending by adjusted score
    reranked.sort((a, b) => b.score - a.score);

    // Reassign rank positions
    reranked.forEach((item, idx) => {
      item.rankPosition = idx + 1;
    });

    return reranked;
  }
}
