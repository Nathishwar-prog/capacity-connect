import { SessionPlanResult, GroupPriorityComponents } from '../types/revision.types';

export class ExplanationService {
  /**
   * Generates a comprehensive, learner-friendly explanation of why a revision plan was assembled.
   */
  generateDetailedExplanation(
    plan: SessionPlanResult,
    rankedGroups: GroupPriorityComponents[]
  ): {
    summary: string;
    groupComparisonTable: Array<{
      groupName: string;
      score: number;
      priority: number;
      isChosen: boolean;
      reason: string;
    }>;
    sequencingStrategy: string[];
  } {
    const groupComparisonTable = rankedGroups.map((g) => ({
      groupName: g.groupName,
      score: g.averageScore,
      priority: g.groupPriorityScore,
      isChosen: g.groupId === plan.focusGroupId,
      reason:
        g.groupId === plan.focusGroupId
          ? `Selected as primary focus due to highest priority score (${g.groupPriorityScore}/100) reflecting high weakness and forgetting factor.`
          : `Not selected (priority: ${g.groupPriorityScore}/100, average mastery: ${g.averageScore}%).`,
    }));

    const sequencingStrategy: string[] = [];
    plan.items.forEach((item, index) => {
      let roleDesc = '';
      if (item.itemRole === 'ROOT_PREREQUISITE') {
        roleDesc = `Step ${index + 1} [Foundational Prerequisite]: Remediates fundamental gaps in '${item.topicName}' before advanced concepts are introduced.`;
      } else if (item.itemRole === 'PRIMARY_WEAKNESS') {
        roleDesc = `Step ${index + 1} [Primary Weakness]: Concentrates on the primary struggling concept '${item.topicName}' with targeted instructional recap.`;
      } else if (item.itemRole === 'RELATED_WEAKNESS') {
        roleDesc = `Step ${index + 1} [Related Topic]: Extends understanding to closely linked concept '${item.topicName}' within the same group to establish mental models.`;
      } else if (item.itemRole === 'TARGETED_PRACTICE') {
        roleDesc = `Step ${index + 1} [Targeted Practice]: Applies concepts through operational scenario drills.`;
      } else {
        roleDesc = `Step ${index + 1} [Retrieval Verification]: High-yield active recall check on '${item.topicName}' to prevent memory decay.`;
      }
      sequencingStrategy.push(roleDesc);
    });

    return {
      summary: `Revision session customized for competency group '${plan.focusGroupName}' in ${plan.revisionMode} mode. Designed to avoid scattered context switching by following a prerequisite-first trajectory.`,
      groupComparisonTable,
      sequencingStrategy,
    };
  }
}

export const explanationService = new ExplanationService();
