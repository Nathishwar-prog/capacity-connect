/**
 * Root Cause & Prerequisite DAG Analysis Algorithm
 * Identifies upstream unmastered prerequisites responsible for downstream failures.
 */

import { PrerequisiteNode } from '../types/skill-gap.types';

export interface CompetencyGapSummary {
  competencyId: string;
  code: string;
  name: string;
  rawGap: number;
  gapSeverity: number;
  currentLevel: number;
  requiredLevel: number;
  confidenceScore: number;
  forgettingRisk: number;
  criticality: string;
}

export interface RootCauseAnalysisResult {
  rootCauseCompetencyId: string | null;
  rootCauseCompetencyName: string | null;
  contributingPrereqs: string[];
  reasonCodes: string[];
  dependencyDepth: number;
}

export class RootCauseAlgorithm {
  /**
   * Analyzes prerequisite graph for a target competency to find upstream unfulfilled requirements.
   *
   * @param targetCompetencyId ID of the competency with a gap
   * @param gapMap Map of all competencies to their gap summary
   * @param prerequisiteEdges All prerequisite DAG edges (prerequisiteCompetencyId -> dependentCompetencyId)
   */
  public static analyze(
    targetCompetencyId: string,
    gapMap: Map<string, CompetencyGapSummary>,
    prerequisiteEdges: PrerequisiteNode[]
  ): RootCauseAnalysisResult {
    const target = gapMap.get(targetCompetencyId);
    const reasonCodes: string[] = [];

    if (!target) {
      return {
        rootCauseCompetencyId: null,
        rootCauseCompetencyName: null,
        contributingPrereqs: [],
        reasonCodes: [],
        dependencyDepth: 0,
      };
    }

    // Build incoming prerequisite map: childId -> parentIds
    const prereqMap = new Map<string, string[]>();
    for (const edge of prerequisiteEdges) {
      const list = prereqMap.get(edge.dependentCompetencyId) || [];
      list.push(edge.prerequisiteCompetencyId);
      prereqMap.set(edge.dependentCompetencyId, list);
    }

    // Traverse upstream BFS / DFS to find all weak/missing prerequisites
    const visited = new Set<string>();
    const contributingPrereqs: string[] = [];
    let rootCauseId: string | null = null;
    let maxDepth = 0;

    const queue: { id: string; depth: number }[] = [{ id: targetCompetencyId, depth: 0 }];
    visited.add(targetCompetencyId);

    while (queue.length > 0) {
      const current = queue.shift()!;
      const parents = prereqMap.get(current.id) || [];

      for (const parentId of parents) {
        if (!visited.has(parentId)) {
          visited.add(parentId);
          const parentGap = gapMap.get(parentId);
          
          // If the upstream parent has a gap or low level, it's a contributor
          if (parentGap && (parentGap.rawGap > 0 || parentGap.currentLevel === 0)) {
            contributingPrereqs.push(parentId);
            if (current.depth + 1 > maxDepth) {
              maxDepth = current.depth + 1;
              rootCauseId = parentId; // The deepest unmastered prerequisite
            }
          }

          queue.push({ id: parentId, depth: current.depth + 1 });
        }
      }
    }

    // Generate deterministic reason codes
    if (contributingPrereqs.length > 0) {
      reasonCodes.push('PREREQUISITE_DEFICIENCY');
    }

    if (target.currentLevel === 0 && target.requiredLevel > 0) {
      reasonCodes.push('NO_PRIOR_EVIDENCE');
    }

    if (target.gapSeverity >= 75) {
      reasonCodes.push('HIGH_SEVERITY_GAP');
    }

    if (target.criticality === 'CORE' && target.rawGap > 0) {
      reasonCodes.push('CORE_REQUIREMENT_UNMET');
    }

    if (target.forgettingRisk >= 0.65) {
      reasonCodes.push('RETENTION_DECAY');
    }

    if (target.confidenceScore < 0.40) {
      reasonCodes.push('EVIDENCE_UNCERTAINTY');
    }

    const rootCauseName = rootCauseId ? gapMap.get(rootCauseId)?.name || null : null;

    return {
      rootCauseCompetencyId: rootCauseId,
      rootCauseCompetencyName: rootCauseName,
      contributingPrereqs,
      reasonCodes,
      dependencyDepth: maxDepth,
    };
  }

  /**
   * Computes downstream dependent counts for each competency in the graph.
   * Useful for prioritizing foundation skills that block many others.
   */
  public static computeDependentCounts(prerequisiteEdges: PrerequisiteNode[]): Map<string, number> {
    const dependentCountMap = new Map<string, number>();

    // child -> parents
    // edge: prerequisiteCompetencyId -> dependentCompetencyId
    for (const edge of prerequisiteEdges) {
      const current = dependentCountMap.get(edge.prerequisiteCompetencyId) || 0;
      dependentCountMap.set(edge.prerequisiteCompetencyId, current + 1);
    }

    return dependentCountMap;
  }
}
