import {
  calculateTopicPriority,
  identifyRootWeaknesses,
  optimizeSessionPlan,
  DAGNodeInfo,
  PrerequisiteStatus,
} from '../algorithms';
import { groupAnalysisService } from './group-analysis.service';
import { revisionRepository } from '../repositories/revision.repository';
import { revisionContentGenerator } from '../llm/revision-generator';
import {
  RevisionSessionConfig,
  SessionPlanResult,
  TopicEvaluationData,
  TopicPriorityComponents,
} from '../types/revision.types';
import logger from '../../../logger/winston.logger';

export class RevisionPlanService {
  /**
   * Generates a coherent, group-focused adaptive revision session for a learner.
   */
  async generateSessionPlan(
    userId: string,
    config?: RevisionSessionConfig
  ): Promise<SessionPlanResult> {
    const targetDurationMinutes =
      config?.availableMinutes ?? config?.targetDurationMinutes ?? 30;
    const maxTopics = config?.maxTopics ?? 4;

    // 1. Group Analysis & Weakest Focus Group Selection
    const groupAnalysis = await groupAnalysisService.analyzeGroups(userId, config?.courseId);
    const selectedGroup =
      config?.focusGroupId
        ? groupAnalysis.rankedGroups.find((g) => g.groupId === config.focusGroupId) ||
          groupAnalysis.selectedGroup
        : groupAnalysis.selectedGroup;

    if (!selectedGroup.groupId) {
      throw new Error('No competency groups found in system for revision.');
    }

    // 2. Fetch all curriculum topics, learner topic states, and errors
    const allTopics = await revisionRepository.getAllTopicsWithPrerequisites(config?.courseId);
    const userTopics = await revisionRepository.getUserTopicCompetencies(userId);
    const userErrors = await revisionRepository.getUserTopicErrors(userId);

    const topicStateMap = new Map<string, any>();
    userTopics.forEach((ut: any) => topicStateMap.set(ut.topicId, ut));

    const errorMap = new Map<string, any>();
    userErrors.forEach((ue: any) => errorMap.set(ue.topicId, ue));

    // Build DAG nodes
    const dagNodes: DAGNodeInfo[] = allTopics.map((t: any) => ({
      topicId: t.id,
      topicCode: t.code,
      name: t.name,
      groupId: t.groupId,
      importanceWeight: t.importance ?? 3,
      prerequisiteIds: t.prerequisites.map((p: any) => p.prerequisiteTopicId),
    }));

    // Build Prerequisite Status Map
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

    // Identify weak topics within the selected focus group
    const focusGroupTopics = allTopics.filter((t: any) => t.groupId === selectedGroup.groupId);
    const weakFocusTopicIds = new Set<string>();
    focusGroupTopics.forEach((t: any) => {
      const status = statusMap.get(t.id);
      if (status?.isWeak) {
        weakFocusTopicIds.add(t.id);
      }
    });

    // 3. Root Prerequisite Weakness Detection
    const rootWeaknessIds = identifyRootWeaknesses(dagNodes, statusMap, weakFocusTopicIds);
    const rootWeaknessTopics: TopicPriorityComponents[] = [];

    const now = new Date();

    for (const rootId of rootWeaknessIds) {
      const rootTopic = allTopics.find((t: any) => t.id === rootId);
      if (!rootTopic) continue;

      const state = topicStateMap.get(rootId);
      const err = errorMap.get(rootId);
      const impactScore = groupAnalysis.dagImpactMap.get(rootId)?.downstreamImpactScore ?? 40;

      const daysSincePractice = state?.lastReviewedAt
        ? (now.getTime() - new Date(state.lastReviewedAt).getTime()) / (1000 * 60 * 60 * 24)
        : 14;

      const evaluationData: TopicEvaluationData = {
        topicId: rootTopic.id,
        topicCode: rootTopic.code,
        topicName: rootTopic.name,
        groupId: rootTopic.groupId,
        currentScore: state?.competencyScore ?? 50,
        retrievability: state?.retention ?? 0.4,
        confidenceScore: state?.confidenceScore ?? 0.3,
        importanceWeight: rootTopic.importance ?? 3,
        downstreamImpactScore: impactScore,
        errorSeverityScore: err?.severity ?? 20,
        daysSinceLastPractice: daysSincePractice,
        isRootPrerequisite: true,
        prerequisitesMastered: true,
      };

      rootWeaknessTopics.push(calculateTopicPriority(evaluationData));
    }

    // 4. Evaluate and Rank Topics Within Focus Group
    const groupTopicEvaluations: TopicEvaluationData[] = focusGroupTopics.map((topic: any) => {
      const state = topicStateMap.get(topic.id);
      const err = errorMap.get(topic.id);
      const impactScore = groupAnalysis.dagImpactMap.get(topic.id)?.downstreamImpactScore ?? 30;

      const daysSincePractice = state?.lastReviewedAt
        ? (now.getTime() - new Date(state.lastReviewedAt).getTime()) / (1000 * 60 * 60 * 24)
        : 14;

      // Check if prerequisites are mastered
      const prereqIds = topic.prerequisites.map((p: any) => p.prerequisiteTopicId);
      const prerequisitesMastered = prereqIds.every((pid: any) => {
        const pState = topicStateMap.get(pid);
        return (pState?.competencyScore ?? 50) >= 70;
      });

      return {
        topicId: topic.id,
        topicCode: topic.code,
        topicName: topic.name,
        groupId: topic.groupId,
        currentScore: state?.competencyScore ?? 50,
        retrievability: state?.retention ?? 0.5,
        confidenceScore: state?.confidenceScore ?? 0.3,
        importanceWeight: topic.importance ?? 3,
        downstreamImpactScore: impactScore,
        errorSeverityScore: err?.severity ?? 0,
        daysSinceLastPractice: daysSincePractice,
        isRootPrerequisite: rootWeaknessIds.includes(topic.id),
        prerequisitesMastered,
      };
    });

    const rankedGroupTopics = groupTopicEvaluations
      .map(calculateTopicPriority)
      .sort((a: TopicPriorityComponents, b: TopicPriorityComponents) => b.finalPriorityScore - a.finalPriorityScore);

    // 5. Retention candidates (high forgetting factor topics from any group)
    const retentionCandidates: TopicPriorityComponents[] = allTopics
      .filter((t: any) => t.groupId !== selectedGroup.groupId)
      .map((topic: any) => {
        const state = topicStateMap.get(topic.id);
        const err = errorMap.get(topic.id);
        const impactScore = groupAnalysis.dagImpactMap.get(topic.id)?.downstreamImpactScore ?? 20;

        const daysSincePractice = state?.lastReviewedAt
          ? (now.getTime() - new Date(state.lastReviewedAt).getTime()) / (1000 * 60 * 60 * 24)
          : 21;

        return calculateTopicPriority({
          topicId: topic.id,
          topicCode: topic.code,
          topicName: topic.name,
          groupId: topic.groupId,
          currentScore: state?.competencyScore ?? 65,
          retrievability: state?.retention ?? 0.3,
          confidenceScore: state?.confidenceScore ?? 0.5,
          importanceWeight: topic.importance ?? 3,
          downstreamImpactScore: impactScore,
          errorSeverityScore: err?.severity ?? 0,
          daysSinceLastPractice: daysSincePractice,
          isRootPrerequisite: false,
          prerequisitesMastered: true,
        });
      })
      .filter((t: TopicPriorityComponents) => t.forgettingRisk > 50)
      .sort((a: TopicPriorityComponents, b: TopicPriorityComponents) => b.forgettingRisk - a.forgettingRisk);

    // 6. Optimize Session Sequence
    const sessionPlan = optimizeSessionPlan({
      focusGroupId: selectedGroup.groupId,
      focusGroupName: selectedGroup.groupName,
      rankedGroupTopics,
      rootPrerequisiteTopics: rootWeaknessTopics,
      retentionCandidateTopics: retentionCandidates,
      targetDurationMinutes,
      maxTopics,
      preferredMode: config?.preferredMode,
    });

    // 7. Generate Educational Content for Each Item (LLM with Fallback)
    for (const item of sessionPlan.items) {
      const topicRecord = allTopics.find((t: any) => t.id === item.topicId);
      const parentGroup = topicRecord?.group?.name ?? selectedGroup.groupName;
      const userError = errorMap.get(item.topicId);

      const content = await revisionContentGenerator.generateContent({
        topicCode: item.topicCode,
        topicName: item.topicName,
        groupName: parentGroup,
        revisionMode: sessionPlan.revisionMode,
        itemRole: item.itemRole,
        errorTypes: userError ? [userError.errorType] : undefined,
        prerequisiteOfTopicName: item.prerequisiteOfTopicId
          ? allTopics.find((t: any) => t.id === item.prerequisiteOfTopicId)?.name
          : undefined,
        difficultyLevel: item.difficultyLevel,
      });

      item.educationalContent = content;
    }

    // 8. Snapshot & Persist Session in Database
    const resolvedCourseId =
      config?.courseId ??
      focusGroupTopics[0]?.courseId ??
      allTopics[0]?.courseId;

    if (!resolvedCourseId) {
      throw new Error('Course context required for creating revision session.');
    }

    const persistedSession = await revisionRepository.createRevisionSession({
      userId,
      courseId: resolvedCourseId,
      focusGroupId: selectedGroup.groupId,
      availableMinutes: sessionPlan.targetDurationMinutes,
      sessionType: 'ADAPTIVE_COMPETENCY',
      status: 'GENERATED',
      items: sessionPlan.items,
    });

    logger.info(
      `Created revision session ${persistedSession.id} for user ${userId} on group '${selectedGroup.groupName}' (${sessionPlan.items.length} items)`
    );

    return {
      sessionId: persistedSession.id,
      focusGroupId: selectedGroup.groupId,
      focusGroupName: selectedGroup.groupName,
      revisionMode: sessionPlan.revisionMode,
      availableMinutes: sessionPlan.targetDurationMinutes,
      items: sessionPlan.items,
      pedagogicalRationale: sessionPlan.pedagogicalRationale,
      explanationDetails: {
        selectedGroupReason: `Competency group '${selectedGroup.groupName}' exhibited highest priority score (${selectedGroup.groupPriorityScore}/100) due to average mastery of ${selectedGroup.averageScore}% and forgetting risk factor of ${selectedGroup.groupForgetting}%.`,
        rootPrerequisitesFound: rootWeaknessTopics.map((r) => `${r.topicCode}: ${r.topicName}`),
        priorityFormulaBreakdown: sessionPlan.items.map((it) => {
          const comp = rankedGroupTopics.find((r) => r.topicId === it.topicId);
          return {
            topicCode: it.topicCode,
            finalScore: comp?.finalPriorityScore ?? 50,
            role: it.itemRole,
          };
        }),
      },
    };
  }
}

export const revisionPlanService = new RevisionPlanService();
