export type LearningEventType =
  | 'LESSON_VIEWED'
  | 'LESSON_COMPLETED'
  | 'QUIZ_ANSWERED'
  | 'PRACTICE_ATTEMPT'
  | 'ASSESSMENT_ANSWERED'
  | 'ASSESSMENT_COMPLETED'
  | 'REVISION_STARTED'
  | 'REVISION_COMPLETED'
  | 'RETRIEVAL_ATTEMPT'
  | 'DIAGNOSTIC_ATTEMPT';

export type RevisionSessionStatus =
  | 'GENERATED'
  | 'STARTED'
  | 'COMPLETED'
  | 'ABANDONED'
  | 'EXPIRED';

export type RevisionMode =
  | 'RECOVERY'
  | 'REBUILD'
  | 'STRENGTHEN'
  | 'RETRIEVE'
  | 'MAINTAIN_CHALLENGE';

export type ItemRole =
  | 'ROOT_PREREQUISITE'
  | 'PRIMARY_WEAKNESS'
  | 'RELATED_WEAKNESS'
  | 'TARGETED_PRACTICE'
  | 'RETRIEVAL_VERIFICATION';

export interface PerformanceComponents {
  accuracy: number; // 0.0 - 1.0 (score / maxScore or 1/0)
  speedScore: number; // 0.0 - 1.0 (relative to expected duration)
  hintScore: number; // 0.0 - 1.0 (1.0 = 0 hints, 0.5 = 1 hint, 0.0 = 2+ hints)
  confidenceSelfScore: number; // 0.0 - 1.0 (self-reported or 0.5 default)
  independenceScore: number; // 0.0 - 1.0 (1.0 = independent, scaled down by assistance)
}

export interface CompetencyState {
  currentScore: number; // 0 - 100
  confidenceScore: number; // 0.0 - 1.0
  sampleCount: number;
  variance: number;
  lastScore: number;
}

export interface MemoryState {
  stability: number; // S in days (e.g. 1.0 to 180.0)
  retention: number; // R in [0.0, 1.0]
  forgettingRisk: number; // F in [0.0, 1.0]
  lastReviewedAt: Date | null;
}

export interface TopicDAGNode {
  topicId: string;
  topicCode: string;
  name: string;
  groupId: string;
  importance: number; // 1 - 5
  prerequisites: Array<{
    prerequisiteTopicId: string;
    isStrict?: boolean;
  }>;
  dependents?: string[];
}

export interface GroupPriorityComponents {
  groupId: string;
  groupName: string;
  groupWeakness: number; // GW in [0, 100]
  groupForgetting: number; // GF in [0, 100]
  groupImportance: number; // GI in [0, 100]
  downstreamImpact: number; // GD in [0, 100]
  urgency: number; // GU in [0, 100]
  groupPriorityScore: number; // 0 - 100
  rootTopicIds: string[];
  totalTopics: number;
  averageScore: number;
  averageConfidence: number;
}

export interface TopicPriorityComponents {
  topicId: string;
  topicCode: string;
  topicName: string;
  groupId: string;
  weaknessScore: number; // W in [0, 100]
  forgettingRisk: number; // F in [0, 100]
  structuralImportance: number; // I in [0, 100]
  downstreamImpact: number; // D in [0, 100]
  errorSeverity: number; // E in [0, 100]
  urgencyScore: number; // U in [0, 100]
  remedialReadiness: number; // R in [0, 100]
  finalPriorityScore: number; // 0 - 100
  isRootPrerequisite: boolean;
  currentScore: number;
  retrievability: number;
  confidenceScore: number;
}

export interface RevisionSessionConfig {
  courseId?: string;
  availableMinutes?: number;
  targetDurationMinutes?: number; // typically 15 - 45 min
  maxTopics?: number; // default 3 - 5
  focusGroupId?: string;
  preferredMode?: RevisionMode;
}

export interface PracticeQuestion {
  questionId: string;
  questionText: string;
  options?: string[];
  correctOptionIndex?: number;
  explanation: string;
  hint: string;
  difficultyLevel: number;
}

export interface RetrievalCheck {
  prompt: string;
  targetCriteria: string[];
  expectedAnswerSummary: string;
}

export interface RevisionEducationalContent {
  conceptIntro: string;
  coreRuleRecap: string;
  commonTrapAvoided: string;
  meteorologicalExamples: string[];
  practiceQuestions: PracticeQuestion[];
  retrievalCheck: RetrievalCheck;
  quickSummary: string;
}

export interface PlannedRevisionItem {
  id?: string;
  topicId: string;
  topicCode: string;
  topicName: string;
  itemRole: ItemRole;
  sequenceNumber: number;
  allocatedMinutes: number;
  difficultyLevel: number;
  revisionMode: RevisionMode;
  priorityScore: number;
  groupPriorityScore: number;
  weaknessScore: number;
  forgettingRiskScore: number;
  importanceScore: number;
  dependencyImpactScore: number;
  errorSeverityScore: number;
  uncertaintyScore: number;
  recencyScore: number;
  reasonCodes: string[];
  reason: Record<string, any>;
  prerequisiteOfTopicId?: string;
  educationalContent?: RevisionEducationalContent;
}

export interface SessionPlanResult {
  sessionId?: string;
  focusGroupId: string;
  focusGroupName: string;
  revisionMode: RevisionMode;
  availableMinutes: number;
  items: PlannedRevisionItem[];
  pedagogicalRationale: string;
  explanationDetails: {
    selectedGroupReason: string;
    rootPrerequisitesFound: string[];
    priorityFormulaBreakdown: Array<{
      topicCode: string;
      finalScore: number;
      role: ItemRole;
    }>;
  };
}

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
