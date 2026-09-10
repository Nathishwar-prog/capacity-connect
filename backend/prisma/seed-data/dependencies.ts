export interface TopicDependencySeed {
  prerequisiteTopicCode: string;
  dependentTopicCode: string;
  edgeWeight: number; // 1.0 = direct, 0.5 = secondary
  dependencyType: string; // DIRECT, SECONDARY
}

export interface CompetencyDependencySeed {
  prerequisiteCompetencyCode: string;
  dependentCompetencyCode: string;
  edgeWeight: number;
  dependencyType: string;
}

export const TOPIC_DEPENDENCIES_SEED: TopicDependencySeed[] = [
  // Chain 1: Fundamentals to Thunderstorm Development
  { prerequisiteTopicCode: 'ATM_STRUCT', dependentTopicCode: 'ATM_PRESS', edgeWeight: 1.0, dependencyType: 'DIRECT' },
  { prerequisiteTopicCode: 'ATM_PRESS', dependentTopicCode: 'ATM_STAB', edgeWeight: 1.0, dependencyType: 'DIRECT' },
  { prerequisiteTopicCode: 'ATM_TEMP', dependentTopicCode: 'ATM_HUMID', edgeWeight: 1.0, dependencyType: 'DIRECT' },
  { prerequisiteTopicCode: 'ATM_HUMID', dependentTopicCode: 'ATM_STAB', edgeWeight: 1.0, dependencyType: 'DIRECT' },
  { prerequisiteTopicCode: 'ATM_STAB', dependentTopicCode: 'SYN_THUNDER', edgeWeight: 1.0, dependencyType: 'DIRECT' },
  { prerequisiteTopicCode: 'ATM_WIND', dependentTopicCode: 'SYN_MET', edgeWeight: 0.8, dependencyType: 'DIRECT' },

  // Chain 2: Observation to QC & Verification
  { prerequisiteTopicCode: 'OBS_SURF', dependentTopicCode: 'OBS_QC', edgeWeight: 1.0, dependencyType: 'DIRECT' },
  { prerequisiteTopicCode: 'OBS_AWS', dependentTopicCode: 'OBS_CALIB', edgeWeight: 1.0, dependencyType: 'DIRECT' },
  { prerequisiteTopicCode: 'OBS_SENS', dependentTopicCode: 'OBS_CALIB', edgeWeight: 1.0, dependencyType: 'DIRECT' },
  { prerequisiteTopicCode: 'OBS_CALIB', dependentTopicCode: 'OBS_QC', edgeWeight: 0.8, dependencyType: 'DIRECT' },
  { prerequisiteTopicCode: 'OBS_QC', dependentTopicCode: 'FCST_VERIF', edgeWeight: 0.8, dependencyType: 'SECONDARY' },
  { prerequisiteTopicCode: 'OBS_RAIN', dependentTopicCode: 'OPS_HYDRO', edgeWeight: 0.9, dependencyType: 'DIRECT' },

  // Chain 3: Weather Analysis to Warning
  { prerequisiteTopicCode: 'SYN_MAPS', dependentTopicCode: 'SYN_MET', edgeWeight: 1.0, dependencyType: 'DIRECT' },
  { prerequisiteTopicCode: 'SYN_FRONTS', dependentTopicCode: 'SYN_MET', edgeWeight: 0.8, dependencyType: 'DIRECT' },
  { prerequisiteTopicCode: 'SYN_MET', dependentTopicCode: 'SYN_CYCLONE', edgeWeight: 1.0, dependencyType: 'DIRECT' },
  { prerequisiteTopicCode: 'SYN_CYCLONE', dependentTopicCode: 'OPS_WARNING', edgeWeight: 1.0, dependencyType: 'DIRECT' },

  // Chain 4: Radar & Satellite to Nowcasting & Warning
  { prerequisiteTopicCode: 'RAD_FUND', dependentTopicCode: 'FCST_NOWCAST', edgeWeight: 1.0, dependencyType: 'DIRECT' },
  { prerequisiteTopicCode: 'SAT_FUND', dependentTopicCode: 'FCST_NOWCAST', edgeWeight: 0.8, dependencyType: 'DIRECT' },
  { prerequisiteTopicCode: 'SYN_THUNDER', dependentTopicCode: 'FCST_NOWCAST', edgeWeight: 0.9, dependencyType: 'DIRECT' },
  { prerequisiteTopicCode: 'FCST_NOWCAST', dependentTopicCode: 'OPS_WARNING', edgeWeight: 1.0, dependencyType: 'DIRECT' },

  // Chain 5: NWP to Short-Range & Verification
  { prerequisiteTopicCode: 'NWP_FUND', dependentTopicCode: 'FCST_SHORTRANGE', edgeWeight: 1.0, dependencyType: 'DIRECT' },
  { prerequisiteTopicCode: 'FCST_SHORTRANGE', dependentTopicCode: 'FCST_VERIF', edgeWeight: 0.8, dependencyType: 'DIRECT' },
  { prerequisiteTopicCode: 'NWP_ENSEMBLE', dependentTopicCode: 'FCST_PROB', edgeWeight: 1.0, dependencyType: 'DIRECT' },

  // Chain 6: Time-Series to Interpretation & Verification
  { prerequisiteTopicCode: 'CLIM_TIMESERIES', dependentTopicCode: 'CLIM_INTERP', edgeWeight: 1.0, dependencyType: 'DIRECT' },
  { prerequisiteTopicCode: 'CLIM_INTERP', dependentTopicCode: 'FCST_VERIF', edgeWeight: 0.8, dependencyType: 'SECONDARY' },
  { prerequisiteTopicCode: 'CLIM_VAR', dependentTopicCode: 'CLIM_CHANGE', edgeWeight: 0.8, dependencyType: 'DIRECT' },
  { prerequisiteTopicCode: 'CLIM_QC', dependentTopicCode: 'CLIM_INDICES', edgeWeight: 0.9, dependencyType: 'DIRECT' },

  // Chain 7: Operational Applications
  { prerequisiteTopicCode: 'OPS_WARNING', dependentTopicCode: 'OPS_DISASTER', edgeWeight: 1.0, dependencyType: 'DIRECT' },
  { prerequisiteTopicCode: 'OPS_WARNING', dependentTopicCode: 'OPS_DECISION', edgeWeight: 0.9, dependencyType: 'DIRECT' },
  { prerequisiteTopicCode: 'SYN_MET', dependentTopicCode: 'OPS_AVIATION', edgeWeight: 0.9, dependencyType: 'DIRECT' },
  { prerequisiteTopicCode: 'FCST_NOWCAST', dependentTopicCode: 'OPS_HYDRO', edgeWeight: 0.8, dependencyType: 'DIRECT' },
  { prerequisiteTopicCode: 'OPS_WARNING', dependentTopicCode: 'OPS_COMM', edgeWeight: 0.7, dependencyType: 'DIRECT' },
];

export const COMPETENCY_DEPENDENCIES_SEED: CompetencyDependencySeed[] = [
  { prerequisiteCompetencyCode: 'COMP-INSTRUMENTATION', dependentCompetencyCode: 'COMP-RADAR-MET', edgeWeight: 1.0, dependencyType: 'DIRECT' },
  { prerequisiteCompetencyCode: 'COMP-RADAR-MET', dependentCompetencyCode: 'COMP-SYNOPTIC-MET', edgeWeight: 0.8, dependencyType: 'DIRECT' },
  { prerequisiteCompetencyCode: 'COMP-SAT-MET', dependentCompetencyCode: 'COMP-SYNOPTIC-MET', edgeWeight: 0.8, dependencyType: 'DIRECT' },
  { prerequisiteCompetencyCode: 'COMP-SYNOPTIC-MET', dependentCompetencyCode: 'COMP-NWP-MODELING', edgeWeight: 1.0, dependencyType: 'DIRECT' },
  { prerequisiteCompetencyCode: 'COMP-SYNOPTIC-MET', dependentCompetencyCode: 'COMP-OCEAN-SCI', edgeWeight: 1.0, dependencyType: 'DIRECT' },
  { prerequisiteCompetencyCode: 'COMP-CLIMATE-SCI', dependentCompetencyCode: 'COMP-NWP-MODELING', edgeWeight: 0.7, dependencyType: 'SECONDARY' },
];

/**
 * Validates that the topic dependencies form an Acyclic Directed Graph (DAG).
 * Throws an error if any cycle is detected.
 */
export function verifyNoDependencyCycles(deps: TopicDependencySeed[]): boolean {
  const adj = new Map<string, string[]>();
  for (const d of deps) {
    if (!adj.has(d.prerequisiteTopicCode)) adj.set(d.prerequisiteTopicCode, []);
    adj.get(d.prerequisiteTopicCode)!.push(d.dependentTopicCode);
  }

  const visited = new Map<string, number>(); // 0=unvisited, 1=visiting, 2=visited

  function dfs(node: string, path: string[]): void {
    visited.set(node, 1);
    const neighbors = adj.get(node) || [];
    for (const next of neighbors) {
      if (visited.get(next) === 1) {
        throw new Error(`Cycle detected in dependency graph: ${[...path, node, next].join(' -> ')}`);
      }
      if (!visited.get(next)) {
        dfs(next, [...path, node]);
      }
    }
    visited.set(node, 2);
  }

  for (const node of adj.keys()) {
    if (!visited.get(node)) {
      dfs(node, []);
    }
  }

  return true;
}
