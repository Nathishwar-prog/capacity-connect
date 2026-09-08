import { TopicPriorityComponents } from '../types/revision.types';

export interface TopicEvaluationData {
  topicId: string;
  topicCode: string;
  topicName: string;
  groupId: string;
  currentScore: number; // 0 - 100
  retrievability: number; // 0.0 - 1.0
  confidenceScore: number; // 0.0 - 1.0
  importanceWeight: number; // 1 - 5
  downstreamImpactScore: number; // 0 - 100
  errorSeverityScore: number; // 0 - 100
  daysSinceLastPractice: number;
  isRootPrerequisite: boolean;
  prerequisitesMastered: boolean;
}

/**
 * Computes topic priority using the deterministic 7-factor formula:
 * TP = 0.35 * W + 0.18 * F + 0.12 * I + 0.12 * D + 0.10 * E + 0.08 * U + 0.05 * R
 *
 * All factors scaled to [0, 100].
 */
export function calculateTopicPriority(topic: TopicEvaluationData): TopicPriorityComponents {
  // 1. Weakness (W)
  const w = Math.max(0, 100 - topic.currentScore);

  // 2. Forgetting Risk (F)
  const f = Math.max(0, Math.min(100, (1.0 - topic.retrievability) * 100));

  // 3. Structural Importance (I)
  const i = Math.max(0, Math.min(100, (topic.importanceWeight / 5.0) * 100));

  // 4. Downstream Impact (D)
  const d = Math.max(0, Math.min(100, topic.downstreamImpactScore));

  // 5. Error Severity (E)
  const e = Math.max(0, Math.min(100, topic.errorSeverityScore));

  // 6. Urgency (U)
  const u = Math.max(0, Math.min(100, topic.daysSinceLastPractice * 4.0));

  // 7. Remedial Readiness (R)
  // If root prerequisite, readiness is maximal (100).
  // If prerequisites are mastered, readiness is 100.
  // If prerequisites are unmastered, readiness is penalized (50) to allow root prerequisite to lead.
  let r = 100;
  if (!topic.isRootPrerequisite && !topic.prerequisitesMastered) {
    r = 50;
  }

  // Pure weighted formula
  const rawScore =
    0.35 * w +
    0.18 * f +
    0.12 * i +
    0.12 * d +
    0.10 * e +
    0.08 * u +
    0.05 * r;

  const finalPriorityScore = Math.max(0, Math.min(100, Math.round(rawScore * 10) / 10));

  return {
    topicId: topic.topicId,
    topicCode: topic.topicCode,
    topicName: topic.topicName,
    groupId: topic.groupId,
    weaknessScore: Math.round(w * 10) / 10,
    forgettingRisk: Math.round(f * 10) / 10,
    structuralImportance: Math.round(i * 10) / 10,
    downstreamImpact: Math.round(d * 10) / 10,
    errorSeverity: Math.round(e * 10) / 10,
    urgencyScore: Math.round(u * 10) / 10,
    remedialReadiness: Math.round(r * 10) / 10,
    finalPriorityScore,
    isRootPrerequisite: topic.isRootPrerequisite,
    currentScore: Math.round(topic.currentScore * 10) / 10,
    retrievability: Math.round(topic.retrievability * 1000) / 1000,
    confidenceScore: Math.round(topic.confidenceScore * 100) / 100,
  };
}

/**
 * Ranks topics within a group deterministically by priority score.
 */
export function rankTopics(topics: TopicEvaluationData[]): TopicPriorityComponents[] {
  const ranked = topics.map(calculateTopicPriority);
  return ranked.sort((a, b) => b.finalPriorityScore - a.finalPriorityScore);
}
