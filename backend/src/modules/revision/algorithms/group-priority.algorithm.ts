import { GroupPriorityComponents } from '../types/revision.types';

export interface GroupEvaluationData {
  groupId: string;
  groupName: string;
  averageScore: number; // 0 - 100
  averageConfidence: number; // 0.0 - 1.0
  averageRetrievability: number; // 0.0 - 1.0
  averageImportanceWeight: number; // 1 - 5
  averageDownstreamImpact: number; // 0 - 100
  daysSinceLastPractice: number;
  rootTopicIds: string[];
  totalTopics: number;
  unmasteredCount: number;
}

/**
 * Calculates priority score for a competency group using the deterministic formula:
 * GP = 0.40 * GW + 0.20 * GF + 0.15 * GI + 0.15 * GD + 0.10 * GU
 *
 * All factors scaled to [0, 100].
 */
export function calculateGroupPriority(group: GroupEvaluationData): GroupPriorityComponents {
  // 1. Group Weakness (GW): Inversion of mastery score
  let gw = Math.max(0, 100 - group.averageScore);
  // If the group has root prerequisite weaknesses blocking topics, increase weakness urgency
  if (group.rootTopicIds.length > 0) {
    gw = Math.min(100, gw * 1.12);
  }

  // 2. Group Forgetting (GF): (1 - retrievability) * 100
  const gf = Math.max(0, Math.min(100, (1.0 - group.averageRetrievability) * 100));

  // 3. Group Importance (GI): (avgImportance / 5) * 100
  const gi = Math.max(0, Math.min(100, (group.averageImportanceWeight / 5.0) * 100));

  // 4. Downstream Impact (GD): average downstream impact across topics
  const gd = Math.max(0, Math.min(100, group.averageDownstreamImpact));

  // 5. Urgency (GU): Time lapse since last revision
  const gu = Math.max(0, Math.min(100, group.daysSinceLastPractice * 3.5));

  // Deterministic weighted formula
  const rawPriority = 0.4 * gw + 0.2 * gf + 0.15 * gi + 0.15 * gd + 0.1 * gu;
  const groupPriorityScore = Math.max(0, Math.min(100, Math.round(rawPriority * 10) / 10));

  return {
    groupId: group.groupId,
    groupName: group.groupName,
    groupWeakness: Math.round(gw * 10) / 10,
    groupForgetting: Math.round(gf * 10) / 10,
    groupImportance: Math.round(gi * 10) / 10,
    downstreamImpact: Math.round(gd * 10) / 10,
    urgency: Math.round(gu * 10) / 10,
    groupPriorityScore,
    rootTopicIds: group.rootTopicIds,
    totalTopics: group.totalTopics,
    averageScore: Math.round(group.averageScore * 10) / 10,
    averageConfidence: Math.round(group.averageConfidence * 100) / 100,
  };
}

/**
 * Ranks all candidate competency groups deterministically and selects the primary focus group.
 */
export function rankCompetencyGroups(groups: GroupEvaluationData[]): GroupPriorityComponents[] {
  const ranked = groups.map(calculateGroupPriority);
  return ranked.sort((a, b) => b.groupPriorityScore - a.groupPriorityScore);
}
