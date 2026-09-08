/**
 * Evidence Aggregation Service
 * Collects and normalizes multi-source learner evidence into competency state.
 */

import { SkillGapRepository } from '../repositories/skill-gap.repository';
import { LearnerCompetencyState, CompetencyRequirement } from '../types/skill-gap.types';

export class EvidenceAggregationService {
  constructor(private readonly repository: SkillGapRepository) {}

  /**
   * Builds map of learner competency states with fallback defaults for missing evidence.
   */
  public async aggregateLearnerStates(
    userId: string,
    requirements: CompetencyRequirement[]
  ): Promise<Map<string, LearnerCompetencyState>> {
    const competencyIds = requirements.map((r) => r.competencyId);
    const existingStates = await this.repository.getLearnerCompetencyStates(userId, competencyIds);

    const completeMap = new Map<string, LearnerCompetencyState>();

    for (const req of requirements) {
      const state = existingStates.get(req.competencyId);

      if (state) {
        completeMap.set(req.competencyId, state);
      } else {
        // Learner has zero recorded evidence for this competency: Level 0, low confidence, high uncertainty
        completeMap.set(req.competencyId, {
          competencyId: req.competencyId,
          code: req.code,
          name: req.name,
          category: req.category,
          currentLevel: 0,
          competencyScore: 0,
          confidenceScore: 0.1, // Minimum confidence
          evidenceCount: 0,
          lastAssessedAt: null,
          lastActivityAt: null,
          stability: 1.0,
          retention: 1.0,
          forgettingRisk: 0.0,
          recentErrorSeverity: 0,
        });
      }
    }

    return completeMap;
  }
}
