import {
  ItemRole,
  PlannedRevisionItem,
  RevisionMode,
  TopicPriorityComponents,
} from '../types/revision.types';

export interface SessionOptimizerInput {
  focusGroupId: string;
  focusGroupName: string;
  rankedGroupTopics: TopicPriorityComponents[];
  rootPrerequisiteTopics: TopicPriorityComponents[]; // identified root weaknesses
  retentionCandidateTopics?: TopicPriorityComponents[]; // high forgetting topics across system
  targetDurationMinutes?: number; // default 30
  maxTopics?: number; // default 4
  preferredMode?: RevisionMode;
}

export interface OptimizedSessionPlan {
  revisionMode: RevisionMode;
  targetDurationMinutes: number;
  items: PlannedRevisionItem[];
  pedagogicalRationale: string;
}

/**
 * Determines revision mode based on average competency score:
 * 0 - 30: RECOVERY
 * 31 - 50: REBUILD
 * 51 - 70: STRENGTHEN
 * 71 - 85: RETRIEVE
 * 86 - 100: MAINTAIN_CHALLENGE
 */
export function determineRevisionMode(averageScore: number): RevisionMode {
  if (averageScore <= 30) return 'RECOVERY';
  if (averageScore <= 50) return 'REBUILD';
  if (averageScore <= 70) return 'STRENGTHEN';
  if (averageScore <= 85) return 'RETRIEVE';
  return 'MAINTAIN_CHALLENGE';
}

function buildItemHelper(
  topic: TopicPriorityComponents,
  role: ItemRole,
  seq: number,
  allocatedMinutes: number,
  difficulty: number,
  mode: RevisionMode,
  reasonCodes: string[],
  reasonText: string,
  prerequisiteOfTopicId?: string
): PlannedRevisionItem {
  return {
    topicId: topic.topicId,
    topicCode: topic.topicCode,
    topicName: topic.topicName,
    itemRole: role,
    sequenceNumber: seq,
    allocatedMinutes,
    difficultyLevel: difficulty,
    revisionMode: mode,
    priorityScore: topic.finalPriorityScore,
    groupPriorityScore: topic.finalPriorityScore,
    weaknessScore: topic.weaknessScore,
    forgettingRiskScore: topic.forgettingRisk,
    importanceScore: topic.structuralImportance,
    dependencyImpactScore: topic.downstreamImpact,
    errorSeverityScore: topic.errorSeverity,
    uncertaintyScore: Math.round((1.0 - topic.confidenceScore) * 100),
    recencyScore: topic.urgencyScore,
    reasonCodes,
    reason: {
      rationale: reasonText,
      role,
      priority: topic.finalPriorityScore,
    },
    prerequisiteOfTopicId,
  };
}

/**
 * Optimizes and structures a revision session ensuring group coherence,
 * root prerequisite repair, and strict pedagogical sequence ordering:
 * ROOT_PREREQUISITE -> PRIMARY_WEAKNESS -> RELATED_WEAKNESS -> TARGETED_PRACTICE -> RETRIEVAL_VERIFICATION
 */
export function optimizeSessionPlan(input: SessionOptimizerInput): OptimizedSessionPlan {
  const targetDuration = Math.max(15, Math.min(60, input.targetDurationMinutes ?? 30));
  const maxTopics = Math.max(2, Math.min(6, input.maxTopics ?? 4));

  // Determine mode from primary topics
  const primaryScores = input.rankedGroupTopics.map((t) => t.currentScore);
  const avgScore =
    primaryScores.length > 0
      ? primaryScores.reduce((sum, s) => sum + s, 0) / primaryScores.length
      : 50;

  const mode = input.preferredMode ?? determineRevisionMode(avgScore);

  const plannedItems: PlannedRevisionItem[] = [];
  const selectedTopicIds = new Set<string>();

  // 1. Root Prerequisite (if any exists and needs repair)
  if (input.rootPrerequisiteTopics.length > 0) {
    const root = input.rootPrerequisiteTopics[0];
    selectedTopicIds.add(root.topicId);
    plannedItems.push(
      buildItemHelper(
        root,
        'ROOT_PREREQUISITE',
        1,
        Math.round(targetDuration * 0.25),
        1,
        mode,
        ['ROOT_PREREQUISITE_WEAKNESS', 'FOUNDATIONAL_GAP'],
        `Prerequisite '${root.topicName}' requires remedial stabilization before addressing dependent topics.`
      )
    );
  }

  // 2. Primary Weakness (top ranked topic in the chosen group)
  const remainingGroupTopics = input.rankedGroupTopics.filter(
    (t) => !selectedTopicIds.has(t.topicId)
  );

  if (remainingGroupTopics.length > 0) {
    const primary = remainingGroupTopics[0];
    selectedTopicIds.add(primary.topicId);
    plannedItems.push(
      buildItemHelper(
        primary,
        'PRIMARY_WEAKNESS',
        plannedItems.length + 1,
        Math.round(targetDuration * 0.35),
        mode === 'RECOVERY' ? 2 : 3,
        mode,
        ['PRIMARY_COMPETENCY_WEAKNESS', 'HIGH_PRIORITY'],
        `Primary struggling concept in group '${input.focusGroupName}' with priority score ${primary.finalPriorityScore}/100.`,
        input.rootPrerequisiteTopics[0]?.topicId
      )
    );
  }

  // 3. Related Weakness (next topic in the same group)
  const nextGroupTopic = remainingGroupTopics.find((t) => !selectedTopicIds.has(t.topicId));
  if (nextGroupTopic && plannedItems.length < maxTopics) {
    selectedTopicIds.add(nextGroupTopic.topicId);
    plannedItems.push(
      buildItemHelper(
        nextGroupTopic,
        'RELATED_WEAKNESS',
        plannedItems.length + 1,
        Math.round(targetDuration * 0.2),
        2,
        mode,
        ['COGNITIVE_COHERENCE', 'INTRA_GROUP_ASSOCIATION'],
        `Related concept in '${input.focusGroupName}' to reinforce relational schema.`
      )
    );
  }

  // 4. Targeted Practice / Retrieval Verification
  const retentionTopic = input.retentionCandidateTopics?.find(
    (t) => !selectedTopicIds.has(t.topicId)
  );

  if (retentionTopic && plannedItems.length < maxTopics) {
    selectedTopicIds.add(retentionTopic.topicId);
    plannedItems.push(
      buildItemHelper(
        retentionTopic,
        'RETRIEVAL_VERIFICATION',
        plannedItems.length + 1,
        Math.round(targetDuration * 0.2),
        3,
        mode,
        ['SPACED_RETRIEVAL', 'FORGETTING_CURVE_PREVENTION'],
        `Spaced retrieval check for '${retentionTopic.topicName}' to counteract memory decay.`
      )
    );
  } else if (remainingGroupTopics.length > 2 && plannedItems.length < maxTopics) {
    const practiceTopic = remainingGroupTopics.find((t) => !selectedTopicIds.has(t.topicId));
    if (practiceTopic) {
      selectedTopicIds.add(practiceTopic.topicId);
      plannedItems.push(
        buildItemHelper(
          practiceTopic,
          'TARGETED_PRACTICE',
          plannedItems.length + 1,
          Math.round(targetDuration * 0.2),
          3,
          mode,
          ['OPERATIONAL_APPLICATION', 'MASTERY_REINFORCEMENT'],
          `Practical application exercises for '${practiceTopic.topicName}'.`
        )
      );
    }
  }

  // Re-number sequence numbers sequentially and calculate total minutes
  let totalMinutes = 0;
  plannedItems.forEach((item, idx) => {
    item.sequenceNumber = idx + 1;
    totalMinutes += item.allocatedMinutes;
  });

  // Build pedagogical rationale
  const rationaleParts: string[] = [];
  rationaleParts.push(
    `Focused on competency group '${input.focusGroupName}' in ${mode} mode.`
  );
  if (input.rootPrerequisiteTopics.length > 0) {
    rationaleParts.push(
      `Pre-remedies root prerequisite '${input.rootPrerequisiteTopics[0].topicName}' before progressing to advanced topics.`
    );
  }
  rationaleParts.push(
    `Structured sequentially through ${plannedItems.length} cohesive steps to solidify foundational understanding without scattered context switching.`
  );

  return {
    revisionMode: mode,
    targetDurationMinutes: totalMinutes,
    items: plannedItems,
    pedagogicalRationale: rationaleParts.join(' '),
  };
}
