import {
  calculateGroupPriority,
  calculateDownstreamImpact,
  identifyRootWeaknesses,
  DAGNodeInfo,
  PrerequisiteStatus,
} from '../algorithms';
import { revisionRepository } from '../repositories/revision.repository';
import { GroupEvaluationData, GroupPriorityComponents } from '../types/revision.types';

export class GroupAnalysisService {
  /**
   * Analyzes all competency groups for a user and ranks them deterministically.
   */
  async analyzeGroups(userId: string, courseId?: string): Promise<{
    rankedGroups: GroupPriorityComponents[];
    selectedGroup: GroupPriorityComponents;
    dagImpactMap: Map<string, any>;
  }> {
    const allGroups = await revisionRepository.getCompetencyGroupsWithTopics(courseId);
    const allTopics = await revisionRepository.getAllTopicsWithPrerequisites(courseId);
    const userTopics = await revisionRepository.getUserTopicCompetencies(userId);
    const userErrors = await revisionRepository.getUserTopicErrors(userId);

    // Map user topic states
    const topicStateMap = new Map<string, any>();
    userTopics.forEach((ut: any) => topicStateMap.set(ut.topicId, ut));

    // Map user topic errors
    const errorMap = new Map<string, any>();
    userErrors.forEach((ue: any) => errorMap.set(ue.topicId, ue));

    // Convert topics to DAG nodes
    const dagNodes: DAGNodeInfo[] = allTopics.map((t: any) => ({
      topicId: t.id,
      topicCode: t.code,
      name: t.name,
      groupId: t.groupId,
      importanceWeight: t.importance ?? 3,
      prerequisiteIds: t.prerequisites.map((p: any) => p.prerequisiteTopicId),
    }));

    // Compute downstream structural impact across the curriculum DAG
    const dagImpactMap = calculateDownstreamImpact(dagNodes);

    // Build prerequisite status map for root weakness detection
    const statusMap = new Map<string, PrerequisiteStatus>();
    allTopics.forEach((t: any) => {
      const state = topicStateMap.get(t.id);
      const score = state?.competencyScore ?? 50;
      const retrievability = state?.retention ?? 0.5;
      statusMap.set(t.id, {
        topicId: t.id,
        score,
        retrievability,
        isWeak: score < 60 || retrievability < 0.6,
      });
    });

    const now = new Date();
    const groupEvaluationList: GroupEvaluationData[] = [];

    for (const group of allGroups) {
      const groupTopics = group.topics;
      if (groupTopics.length === 0) continue;

      let scoreSum = 0;
      let confSum = 0;
      let retrievabilitySum = 0;
      let importanceSum = 0;
      let impactSum = 0;
      let minDaysSincePractice = 100;
      let unmasteredCount = 0;

      const weakTopicIds = new Set<string>();

      for (const topic of groupTopics) {
        const state = topicStateMap.get(topic.id);
        const score = state?.competencyScore ?? 50.0;
        const confidence = state?.confidenceScore ?? 0.3;
        const retrievability = state?.retention ?? 0.5;
        const importance = topic.importance ?? 3;
        const impact = dagImpactMap.get(topic.id)?.downstreamImpactScore ?? 0;

        scoreSum += score;
        confSum += confidence;
        retrievabilitySum += retrievability;
        importanceSum += importance;
        impactSum += impact;

        if (score < 70) {
          unmasteredCount++;
        }
        if (score < 60 || retrievability < 0.6) {
          weakTopicIds.add(topic.id);
        }

        if (state?.lastReviewedAt) {
          const days =
            (now.getTime() - new Date(state.lastReviewedAt).getTime()) / (1000 * 60 * 60 * 24);
          if (days < minDaysSincePractice) minDaysSincePractice = days;
        }
      }

      const count = groupTopics.length;
      const averageScore = scoreSum / count;
      const averageConfidence = confSum / count;
      const averageRetrievability = retrievabilitySum / count;
      const averageImportanceWeight = importanceSum / count;
      const averageDownstreamImpact = impactSum / count;
      const daysSinceLastPractice = minDaysSincePractice === 100 ? 14 : minDaysSincePractice;

      // Identify root weaknesses within or leading to this group
      const rootTopicIds = identifyRootWeaknesses(dagNodes, statusMap, weakTopicIds);

      groupEvaluationList.push({
        groupId: group.id,
        groupName: group.name,
        averageScore,
        averageConfidence,
        averageRetrievability,
        averageImportanceWeight,
        averageDownstreamImpact,
        daysSinceLastPractice,
        rootTopicIds,
        totalTopics: count,
        unmasteredCount,
      });
    }

    // Rank groups
    const rankedGroups = groupEvaluationList
      .map(calculateGroupPriority)
      .sort((a, b) => b.groupPriorityScore - a.groupPriorityScore);

    const selectedGroup =
      rankedGroups.length > 0
        ? rankedGroups[0]
        : {
            groupId: '',
            groupName: 'General Foundations',
            groupWeakness: 50,
            groupForgetting: 50,
            groupImportance: 50,
            downstreamImpact: 50,
            urgency: 50,
            groupPriorityScore: 50,
            rootTopicIds: [],
            totalTopics: 0,
            averageScore: 50,
            averageConfidence: 0.5,
          };

    return {
      rankedGroups,
      selectedGroup,
      dagImpactMap,
    };
  }
}

export const groupAnalysisService = new GroupAnalysisService();
