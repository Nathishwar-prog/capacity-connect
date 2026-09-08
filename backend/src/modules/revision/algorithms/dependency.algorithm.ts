export interface DAGNodeInfo {
  topicId: string;
  topicCode: string;
  name: string;
  groupId: string;
  importanceWeight: number; // 1 to 5
  prerequisiteIds: string[]; // parent topics required before this
}

export interface DownstreamImpactResult {
  topicId: string;
  downstreamCount: number;
  downstreamImpactScore: number; // 0 - 100
  descendantIds: string[];
}

export interface PrerequisiteStatus {
  topicId: string;
  score: number;
  retrievability: number;
  isWeak: boolean;
}

/**
 * Checks if the dependency graph contains any cycles using DFS.
 * Returns true if valid DAG (no cycles), false if cycle detected.
 */
export function validateDAG(nodes: DAGNodeInfo[]): { isValid: boolean; cycleNodes?: string[] } {
  const adj = new Map<string, string[]>();
  nodes.forEach((n) => adj.set(n.topicId, []));

  // If A requires B, edge is B -> A (B unlocks A)
  nodes.forEach((n) => {
    n.prerequisiteIds.forEach((pId) => {
      if (adj.has(pId)) {
        adj.get(pId)!.push(n.topicId);
      }
    });
  });

  const visited = new Map<string, number>(); // 0: unvisited, 1: visiting, 2: visited
  nodes.forEach((n) => visited.set(n.topicId, 0));

  const cycle: string[] = [];

  function dfs(nodeId: string): boolean {
    visited.set(nodeId, 1);
    const dependents = adj.get(nodeId) || [];

    for (const depId of dependents) {
      if (visited.get(depId) === 1) {
        cycle.push(nodeId, depId);
        return false; // cycle
      }
      if (visited.get(depId) === 0) {
        if (!dfs(depId)) {
          cycle.push(nodeId);
          return false;
        }
      }
    }

    visited.set(nodeId, 2);
    return true;
  }

  for (const node of nodes) {
    if (visited.get(node.topicId) === 0) {
      if (!dfs(node.topicId)) {
        return { isValid: false, cycleNodes: Array.from(new Set(cycle)) };
      }
    }
  }

  return { isValid: true };
}

/**
 * Calculates downstream structural impact score for each topic in the graph.
 * Topics that unlock many subsequent critical topics get higher scores:
 * D = min(100, sum(weight_dep * 0.5^(depth-1)) * 10)
 */
export function calculateDownstreamImpact(nodes: DAGNodeInfo[]): Map<string, DownstreamImpactResult> {
  const unlockMap = new Map<string, string[]>();
  const nodeMap = new Map<string, DAGNodeInfo>();

  nodes.forEach((n) => {
    nodeMap.set(n.topicId, n);
    unlockMap.set(n.topicId, []);
  });

  nodes.forEach((n) => {
    n.prerequisiteIds.forEach((pId) => {
      if (unlockMap.has(pId)) {
        unlockMap.get(pId)!.push(n.topicId);
      }
    });
  });

  const results = new Map<string, DownstreamImpactResult>();

  nodes.forEach((node) => {
    const visited = new Set<string>();
    let weightedImpactSum = 0;
    const descendants: string[] = [];

    // BFS with depth tracking
    const queue: Array<{ id: string; depth: number }> = [{ id: node.topicId, depth: 0 }];
    visited.add(node.topicId);

    while (queue.length > 0) {
      const { id, depth } = queue.shift()!;
      const dependents = unlockMap.get(id) || [];

      for (const depId of dependents) {
        if (!visited.has(depId)) {
          visited.add(depId);
          descendants.push(depId);
          const depNode = nodeMap.get(depId);
          const weight = depNode?.importanceWeight ?? 3;
          // Discount factor: 1.0 at depth 1, 0.5 at depth 2, 0.25 at depth 3, etc.
          weightedImpactSum += weight * Math.pow(0.5, depth);
          queue.push({ id: depId, depth: depth + 1 });
        }
      }
    }

    // Scale to [0, 100]
    // A node unlocking 4 direct dependents of weight 4 gets: 4 * 4 * 1.0 * 6.0 = 96
    const downstreamImpactScore = Math.max(
      0,
      Math.min(100, Math.round(weightedImpactSum * 6.5 * 10) / 10)
    );

    results.set(node.topicId, {
      topicId: node.topicId,
      downstreamCount: descendants.length,
      downstreamImpactScore,
      descendantIds: descendants,
    });
  });

  return results;
}

/**
 * Identifies root prerequisite weaknesses in a dependency network.
 * If topic T is weak, and its prerequisite P is also weak, P is identified as root weakness.
 * Returns sorted list of root prerequisite topic IDs.
 */
export function identifyRootWeaknesses(
  nodes: DAGNodeInfo[],
  statusMap: Map<string, PrerequisiteStatus>,
  weakTopicIds: Set<string>
): string[] {
  const rootWeaknesses = new Set<string>();

  for (const topicId of weakTopicIds) {
    const node = nodes.find((n) => n.topicId === topicId);
    if (!node) continue;

    // Inspect direct prerequisites
    for (const prereqId of node.prerequisiteIds) {
      const pStatus = statusMap.get(prereqId);
      // Prerequisite is weak if score < 60 or retrievability < 0.60
      if (pStatus && (pStatus.score < 60 || pStatus.retrievability < 0.6)) {
        // Check if this prerequisite has its own weak prerequisite
        const prereqNode = nodes.find((n) => n.topicId === prereqId);
        const hasDeeperWeakPrereq = prereqNode?.prerequisiteIds.some((deepPId) => {
          const deepStatus = statusMap.get(deepPId);
          return deepStatus && (deepStatus.score < 60 || deepStatus.retrievability < 0.6);
        });

        if (!hasDeeperWeakPrereq) {
          rootWeaknesses.add(prereqId);
        }
      }
    }
  }

  return Array.from(rootWeaknesses);
}
