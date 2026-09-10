/**
 * Skill Relevance Algorithm
 * Deterministically computes how effectively a course addresses a learner's open skill gaps.
 */

export interface LearnerGapInfo {
  competencyId: string;
  gapSeverity: number;     // 0 - 100
  requiredLevel: number;
  criticality: 'CORE' | 'IMPORTANT' | 'NORMAL' | 'OPTIONAL';
}

export interface CourseCompetencyCoverage {
  competencyId: string;
  targetLevel: number;
  importance: number;
}

export class SkillRelevanceAlgorithm {
  /**
   * Computes normalized skill relevance score (0 - 100) between learner gaps and course coverage.
   */
  public static calculate(
    learnerGaps: LearnerGapInfo[],
    courseCompetencies: CourseCompetencyCoverage[]
  ): {
    relevanceScore: number;
    matchedGapCount: number;
    addressedCriticalGaps: number;
  } {
    if (learnerGaps.length === 0 || courseCompetencies.length === 0) {
      return { relevanceScore: 0, matchedGapCount: 0, addressedCriticalGaps: 0 };
    }

    const courseCompMap = new Map<string, CourseCompetencyCoverage>();
    for (const cc of courseCompetencies) {
      courseCompMap.set(cc.competencyId, cc);
    }

    let weightedMatchScore = 0;
    let totalMaxPotential = 0;
    let matchedGapCount = 0;
    let addressedCriticalGaps = 0;

    for (const gap of learnerGaps) {
      // Criticality multiplier
      let critMult = 1.0;
      if (gap.criticality === 'CORE') critMult = 1.25;
      else if (gap.criticality === 'IMPORTANT') critMult = 1.10;
      else if (gap.criticality === 'OPTIONAL') critMult = 0.80;

      const gapMax = gap.gapSeverity * critMult;
      totalMaxPotential += gapMax;

      const courseComp = courseCompMap.get(gap.competencyId);
      if (courseComp) {
        matchedGapCount++;
        if (gap.criticality === 'CORE' || gap.criticality === 'IMPORTANT') {
          addressedCriticalGaps++;
        }

        // Coverage factor based on course target level vs learner required level
        const levelCoverage =
          gap.requiredLevel > 0
            ? Math.min(1.0, courseComp.targetLevel / gap.requiredLevel)
            : 1.0;

        const compImportance = courseComp.importance > 0 ? courseComp.importance : 1.0;
        const score = gap.gapSeverity * levelCoverage * critMult * compImportance;
        weightedMatchScore += score;
      }
    }

    const rawRelevance = totalMaxPotential > 0 ? (weightedMatchScore / totalMaxPotential) * 100 : 0;
    const relevanceScore = Math.round(Math.min(100, Math.max(0, rawRelevance)) * 100) / 100;

    return {
      relevanceScore,
      matchedGapCount,
      addressedCriticalGaps,
    };
  }
}

export function calculateSkillRelevanceScore(
  gapsCovered: Array<{
    competencyId: string;
    code?: string;
    name?: string;
    targetLevel: number;
    learnerCurrentLevel?: number;
    severity: number;
    criticality: 'CORE' | 'IMPORTANT' | 'NORMAL' | 'OPTIONAL';
  }>
): number {
  if (gapsCovered.length === 0) return 0;

  const learnerGaps: LearnerGapInfo[] = gapsCovered.map(g => ({
    competencyId: g.competencyId,
    gapSeverity: g.severity,
    requiredLevel: g.targetLevel,
    criticality: g.criticality,
  }));

  const courseCompetencies: CourseCompetencyCoverage[] = gapsCovered.map(g => ({
    competencyId: g.competencyId,
    targetLevel: g.targetLevel,
    importance: 1.0,
  }));

  const res = SkillRelevanceAlgorithm.calculate(learnerGaps, courseCompetencies);
  return res.relevanceScore;
}
