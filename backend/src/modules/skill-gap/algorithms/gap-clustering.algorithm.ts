/**
 * Gap Clustering Algorithm
 * Clusters related skill gaps by category/domain and ranks them by cluster severity.
 */

import { CalculatedGapItem, ClusteredGaps } from '../types/skill-gap.types';

export class GapClusteringAlgorithm {
  public static cluster(items: CalculatedGapItem[]): ClusteredGaps[] {
    const clusterMap = new Map<string, CalculatedGapItem[]>();

    for (const item of items) {
      const category = item.category?.trim() || 'General Meteorology & Science';
      const list = clusterMap.get(category) || [];
      list.push(item);
      clusterMap.set(category, list);
    }

    const clusters: ClusteredGaps[] = [];

    for (const [category, groupItems] of clusterMap.entries()) {
      // Sort items within cluster by priorityScore descending
      groupItems.sort((a, b) => b.priorityScore - a.priorityScore);

      const totalGaps = groupItems.filter((i) => i.rawGap > 0).length;
      const criticalGaps = groupItems.filter(
        (i) => i.rawGap > 0 && (i.priorityLevel === 'CRITICAL' || i.criticality === 'CORE')
      ).length;

      const avgPriority =
        groupItems.length > 0
          ? Math.round(
              (groupItems.reduce((acc, curr) => acc + curr.priorityScore, 0) /
                groupItems.length) *
                100
            ) / 100
          : 0;

      clusters.push({
        category,
        averagePriority: avgPriority,
        totalGaps,
        criticalGaps,
        items: groupItems,
      });
    }

    // Sort clusters by averagePriority descending
    clusters.sort((a, b) => b.averagePriority - a.averagePriority);

    return clusters;
  }
}
