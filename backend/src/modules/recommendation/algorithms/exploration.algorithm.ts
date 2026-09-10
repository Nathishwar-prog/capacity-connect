/**
 * Controlled Exploration Algorithm
 * 
 * Reserves a configured proportion (typically 10-20%) of recommendation slots for
 * "novel, skill-adjacent" courses that break echo chambers/filter bubbles.
 * 
 * An exploratory course:
 *   1. Must pass hard eligibility (cannot recommend un-enrolled prerequisites or drafts).
 *   2. Has high quality/completion rate.
 *   3. Belongs to a domain or category adjacent to the learner's existing competencies,
 *      or introduces emerging MoES technological capabilities (e.g. AI/ML in NWP, GIS, Deep Learning).
 *   4. Has NOT been heavily consumed or repeatedly dismissed by the user.
 */

import { CandidateWithContentMetadata } from './diversity.algorithm';
import { RECSYS_DEFAULTS } from '../recommendation.constants';

export interface ExplorationConfig {
  explorationRatio: number; // e.g., 0.15 (15% exploration slots)
  totalSlots: number;       // total recommendations to display
}

export function injectExploratoryCandidates(
  coreCandidates: CandidateWithContentMetadata[],
  explorationPool: CandidateWithContentMetadata[],
  config: Partial<ExplorationConfig> = {}
): CandidateWithContentMetadata[] {
  const explorationRatio = config.explorationRatio ?? RECSYS_DEFAULTS.EXPLORATION_RATIO;
  const totalSlots = config.totalSlots ?? RECSYS_DEFAULTS.DEFAULT_LIMIT;

  const explorationSlotCount = Math.max(1, Math.round(totalSlots * explorationRatio));
  const coreSlotCount = Math.max(1, totalSlots - explorationSlotCount);

  // Take top core candidates up to coreSlotCount
  const coreSelected = coreCandidates.slice(0, coreSlotCount);
  const selectedCourseIds = new Set(coreSelected.map(c => c.courseId));

  // Filter pool for eligible exploration courses not already in core
  const validExploratory = explorationPool.filter(c => !selectedCourseIds.has(c.courseId));

  // Sort exploration pool by exploration potential:
  // Novelty (lower familiarity) + High Quality (assessment/completion) + Skill Adjacency
  const sortedExploratory = [...validExploratory].sort((a, b) => {
    // Quality and freshness take precedence for exploration
    const aExploreScore = (a.featureSnapshot.qualityScore * 0.4) +
                          (a.featureSnapshot.skillRelevanceScore * 0.3) +
                          (a.featureSnapshot.freshnessScore * 0.3);
    const bExploreScore = (b.featureSnapshot.qualityScore * 0.4) +
                          (b.featureSnapshot.skillRelevanceScore * 0.3) +
                          (b.featureSnapshot.freshnessScore * 0.3);
    return bExploreScore - aExploreScore;
  });

  const explorationSelected = sortedExploratory.slice(0, explorationSlotCount);

  // Tag reason codes for exploration candidates
  for (const exp of explorationSelected) {
    if (!exp.reasonCodes.includes('EXPLORATION_HORIZON')) {
      exp.reasonCodes.push('EXPLORATION_HORIZON');
    }
  }

  // Interleave: insert exploration candidate around middle / lower-middle ranks (e.g. pos 3 or 4)
  // so it's visible without displacing the #1 absolute urgent prerequisite or skill gap.
  const result: CandidateWithContentMetadata[] = [];
  let coreIdx = 0;
  let expIdx = 0;

  const insertFrequency = Math.max(2, Math.floor(totalSlots / (explorationSelected.length + 1)));

  for (let rank = 1; rank <= totalSlots; rank++) {
    if (rank % insertFrequency === 0 && expIdx < explorationSelected.length) {
      result.push(explorationSelected[expIdx++]);
    } else if (coreIdx < coreSelected.length) {
      result.push(coreSelected[coreIdx++]);
    } else if (expIdx < explorationSelected.length) {
      result.push(explorationSelected[expIdx++]);
    }
  }

  // Append any remaining if totalSlots hasn't been met yet
  while (result.length < totalSlots && coreIdx < coreCandidates.length) {
    const candidate = coreCandidates[coreIdx++];
    if (!result.some(r => r.courseId === candidate.courseId)) {
      result.push(candidate);
    }
  }

  return result.slice(0, totalSlots);
}
