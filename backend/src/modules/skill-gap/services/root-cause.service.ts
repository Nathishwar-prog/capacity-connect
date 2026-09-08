/**
 * Root Cause Service
 * Coordinates DAG graph construction and prerequisite chain analysis.
 */

import { SkillGapRepository } from '../repositories/skill-gap.repository';
import { RootCauseAlgorithm, CompetencyGapSummary } from '../algorithms/root-cause.algorithm';

export class RootCauseService {
  constructor(private readonly repository: SkillGapRepository) {}

  public async analyzeRootCauses(
    gapSummaries: Map<string, CompetencyGapSummary>
  ): Promise<{
    rootCauseMap: Map<string, { rootCauseId: string | null; contributingPrereqs: string[]; reasonCodes: string[] }>;
    dependentCounts: Map<string, number>;
    rootCauseSummaries: Array<{
      competencyId: string;
      code: string;
      name: string;
      impactedCompetencies: string[];
    }>;
  }> {
    const edges = await this.repository.getPrerequisiteEdges();
    const dependentCounts = RootCauseAlgorithm.computeDependentCounts(edges);

    const rootCauseMap = new Map<
      string,
      { rootCauseId: string | null; contributingPrereqs: string[]; reasonCodes: string[] }
    >();

    const rootCauseImpactMap = new Map<string, string[]>();

    for (const [targetId, summary] of gapSummaries.entries()) {
      if (summary.rawGap > 0) {
        const analysis = RootCauseAlgorithm.analyze(targetId, gapSummaries, edges);
        rootCauseMap.set(targetId, {
          rootCauseId: analysis.rootCauseCompetencyId,
          contributingPrereqs: analysis.contributingPrereqs,
          reasonCodes: analysis.reasonCodes,
        });

        if (analysis.rootCauseCompetencyId) {
          const impacted = rootCauseImpactMap.get(analysis.rootCauseCompetencyId) || [];
          impacted.push(summary.name);
          rootCauseImpactMap.set(analysis.rootCauseCompetencyId, impacted);
        }
      } else {
        rootCauseMap.set(targetId, {
          rootCauseId: null,
          contributingPrereqs: [],
          reasonCodes: [],
        });
      }
    }

    const rootCauseSummaries: Array<{
      competencyId: string;
      code: string;
      name: string;
      impactedCompetencies: string[];
    }> = [];

    for (const [rootId, impacted] of rootCauseImpactMap.entries()) {
      const info = gapSummaries.get(rootId);
      if (info) {
        rootCauseSummaries.push({
          competencyId: rootId,
          code: info.code,
          name: info.name,
          impactedCompetencies: impacted,
        });
      }
    }

    return {
      rootCauseMap,
      dependentCounts,
      rootCauseSummaries,
    };
  }
}
