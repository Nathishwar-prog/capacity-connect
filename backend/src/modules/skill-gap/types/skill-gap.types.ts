/**
 * Capacity Connect — AI Skill Gap Analyzer Types
 * Domain-Specific: Ministry of Earth Sciences (MoES) / IMD
 */

export type RequirementCriticality = 'CORE' | 'IMPORTANT' | 'NORMAL' | 'OPTIONAL';

export type GapClassification =
  | 'MISSING'
  | 'WEAK'
  | 'AT_RISK'
  | 'UNCERTAIN'
  | 'MEETS_REQUIREMENT'
  | 'EXCEEDS_REQUIREMENT';

export type GapType = 'NO_GAP' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type GapPriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ReadinessStatus =
  | 'NOT_READY'
  | 'CONDITIONAL'
  | 'GENERALLY_READY'
  | 'FULLY_READY';

export type GapTrend = 'IMPROVING' | 'STABLE' | 'WORSENING' | 'NEW' | 'RESOLVED';

export interface CompetencyRequirement {
  competencyId: string;
  code: string;
  name: string;
  category?: string | null;
  targetLevel: number;
  importance: number;
  criticality: RequirementCriticality;
  weight: number;
}

export interface LearnerCompetencyState {
  competencyId: string;
  code: string;
  name: string;
  category?: string | null;
  currentLevel: number;
  competencyScore: number;
  confidenceScore: number;
  evidenceCount: number;
  lastAssessedAt?: Date | null;
  lastActivityAt?: Date | null;
  stability: number;
  retention: number;
  forgettingRisk: number;
  recentErrorSeverity: number;
}

export interface PrerequisiteNode {
  id: string;
  prerequisiteCompetencyId: string;
  dependentCompetencyId: string;
  edgeWeight: number;
  dependencyType: 'DIRECT' | 'INDIRECT';
}

export interface CalculatedGapItem {
  competencyId: string;
  code: string;
  name: string;
  category?: string | null;
  requiredLevel: number;
  currentLevel: number;
  rawGap: number;
  gapSeverity: number;
  priorityScore: number;
  priorityLevel: GapPriorityLevel;
  classification: GapClassification;
  gapType: GapType;
  criticality: RequirementCriticality;
  weight: number;
  importance: number;
  confidenceScore: number;
  forgettingRisk: number;
  recentErrorSeverity: number;
  dependencyCount: number;
  rootCauseCompetencyId?: string | null;
  rootCauseCompetencyName?: string | null;
  contributingPrereqs: string[];
  reasonCodes: string[];
  trend: GapTrend;
}

export interface ClusteredGaps {
  category: string;
  averagePriority: number;
  totalGaps: number;
  criticalGaps: number;
  items: CalculatedGapItem[];
}

export interface OverallReadinessResult {
  overallReadiness: number;
  coreReadiness: number;
  criticalReadiness: number;
  readinessStatus: ReadinessStatus;
  coreDeficienciesCount: number;
  canEnrollOrAdvance: boolean;
  blockers: string[];
}

export interface SkillGapAlgorithmWeights {
  severityWeight: number;
  importanceWeight: number;
  dependencyWeight: number;
  uncertaintyWeight: number;
  forgettingWeight: number;
  errorSeverityWeight: number;
  coreMultiplier: number;
  importantMultiplier: number;
  normalMultiplier: number;
  optionalMultiplier: number;
  readinessThresholdFull: number;
  readinessThresholdCond: number;
}

export const DEFAULT_ALGORITHM_WEIGHTS: SkillGapAlgorithmWeights = {
  severityWeight: 0.35,
  importanceWeight: 0.20,
  dependencyWeight: 0.15,
  uncertaintyWeight: 0.10,
  forgettingWeight: 0.10,
  errorSeverityWeight: 0.10,
  coreMultiplier: 1.25,
  importantMultiplier: 1.10,
  normalMultiplier: 1.00,
  optionalMultiplier: 0.80,
  readinessThresholdFull: 80.0,
  readinessThresholdCond: 60.0,
};

export interface SkillGapAnalysisResult {
  id?: string;
  userId: string;
  courseId?: string | null;
  algorithmVersion: string;
  readiness: OverallReadinessResult;
  gapCount: number;
  criticalGapsCount: number;
  items: CalculatedGapItem[];
  clusters: ClusteredGaps[];
  rootCauses: {
    competencyId: string;
    code: string;
    name: string;
    impactedCompetencies: string[];
  }[];
  aiGuidance?: AIGuidanceOutput | null;
  analyzedAt: Date;
}

export interface AIGuidanceOutput {
  executiveSummary: string;
  readinessAssessment: {
    status: ReadinessStatus;
    readinessScore: number;
    explanation: string;
  };
  keyFindings: {
    criticalGaps: string[];
    rootCauses: string[];
    strengths: string[];
  };
  actionableLearningPath: {
    stepNumber: number;
    competencyName: string;
    action: string;
    estimatedHours: number;
    rationale: string;
  }[];
  mentorshipAndReviewAdvice: string;
  disclaimer: string;
}
