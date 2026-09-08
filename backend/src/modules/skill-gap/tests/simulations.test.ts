/**
 * Comprehensive Simulation Test Suite
 * Validates Learner Profiles A through F and Resilient LLM Fallback (Section 37 Specifications).
 */

import {
  GapCalculationAlgorithm,
  GapPriorityAlgorithm,
  RootCauseAlgorithm,
  ReadinessAlgorithm,
  GapClusteringAlgorithm,
  TrendAlgorithm,
} from '../algorithms';
import { AISkillGapAnalyzer } from '../ai/skill-gap-analyzer';
import {
  CompetencyRequirement,
  LearnerCompetencyState,
  CalculatedGapItem,
  PrerequisiteNode,
} from '../types/skill-gap.types';

describe('AI Skill Gap Analyzer — Comprehensive Simulations', () => {
  const analyzer = new AISkillGapAnalyzer();

  describe('Learner A: Clean Foundation (Ready Learner)', () => {
    it('should calculate FULLY_READY status with zero core deficiencies and high readiness', () => {
      const requirements: CompetencyRequirement[] = [
        { competencyId: 'c1', code: 'SYN-01', name: 'Synoptic Forecasting', targetLevel: 4, importance: 1.0, criticality: 'CORE', weight: 1.0 },
        { competencyId: 'c2', code: 'RAD-01', name: 'Doppler Radar Operations', targetLevel: 3, importance: 0.9, criticality: 'CORE', weight: 1.0 },
        { competencyId: 'c3', code: 'SAT-01', name: 'Satellite Meteorology', targetLevel: 3, importance: 0.8, criticality: 'IMPORTANT', weight: 1.0 },
      ];

      const learnerStates: LearnerCompetencyState[] = [
        { competencyId: 'c1', code: 'SYN-01', name: 'Synoptic Forecasting', currentLevel: 4, competencyScore: 88, confidenceScore: 0.95, evidenceCount: 30, stability: 2.0, retention: 0.95, forgettingRisk: 0.05, recentErrorSeverity: 0 },
        { competencyId: 'c2', code: 'RAD-01', name: 'Doppler Radar Operations', currentLevel: 3, competencyScore: 82, confidenceScore: 0.90, evidenceCount: 25, stability: 1.8, retention: 0.90, forgettingRisk: 0.10, recentErrorSeverity: 0 },
        { competencyId: 'c3', code: 'SAT-01', name: 'Satellite Meteorology', currentLevel: 4, competencyScore: 92, confidenceScore: 0.95, evidenceCount: 28, stability: 2.1, retention: 0.95, forgettingRisk: 0.05, recentErrorSeverity: 0 },
      ];

      const items: CalculatedGapItem[] = requirements.map((req) => {
        const state = learnerStates.find((s) => s.competencyId === req.competencyId);
        const calc = GapCalculationAlgorithm.calculate(req, state);
        const priority = GapPriorityAlgorithm.calculate({
          gapSeverity: calc.gapSeverity,
          importance: req.importance,
          dependentCount: 0,
          confidenceScore: state?.confidenceScore ?? 0.1,
          forgettingRisk: state?.forgettingRisk ?? 0.0,
          recentErrorSeverity: state?.recentErrorSeverity ?? 0,
          criticality: req.criticality,
        });

        return {
          competencyId: req.competencyId,
          code: req.code,
          name: req.name,
          requiredLevel: req.targetLevel,
          currentLevel: state?.currentLevel ?? 0,
          rawGap: calc.rawGap,
          gapSeverity: calc.gapSeverity,
          priorityScore: priority.priorityScore,
          priorityLevel: priority.priorityLevel,
          classification: calc.classification,
          gapType: calc.gapType,
          criticality: req.criticality,
          weight: req.weight,
          importance: req.importance,
          confidenceScore: state?.confidenceScore ?? 0.1,
          forgettingRisk: state?.forgettingRisk ?? 0.0,
          recentErrorSeverity: state?.recentErrorSeverity ?? 0,
          dependencyCount: 0,
          contributingPrereqs: [],
          reasonCodes: [],
          trend: 'STABLE',
        };
      });

      const readiness = ReadinessAlgorithm.calculate(items);
      expect(readiness.readinessStatus).toBe('FULLY_READY');
      expect(readiness.overallReadiness).toBe(100);
      expect(readiness.coreReadiness).toBe(100);
      expect(readiness.coreDeficienciesCount).toBe(0);
      expect(readiness.canEnrollOrAdvance).toBe(true);
      expect(readiness.blockers.length).toBe(0);
    });
  });

  describe('Learner B: Core Prerequisite Gap (Gating Check)', () => {
    it('should gate readiness status to NOT_READY even when peripheral skills are advanced', () => {
      const requirements: CompetencyRequirement[] = [
        { competencyId: 'core-dyn', code: 'DYN-01', name: 'Atmospheric Dynamics (Core)', targetLevel: 4, importance: 1.0, criticality: 'CORE', weight: 1.0 },
        { competencyId: 'py-sci', code: 'PY-01', name: 'Python for Earth Sciences', targetLevel: 3, importance: 0.8, criticality: 'NORMAL', weight: 1.0 },
        { competencyId: 'netcdf', code: 'CDO-01', name: 'NetCDF Manipulation', targetLevel: 3, importance: 0.7, criticality: 'NORMAL', weight: 1.0 },
      ];

      // Advanced in Python & NetCDF, but zero background in Atmospheric Dynamics
      const items: CalculatedGapItem[] = [
        {
          competencyId: 'core-dyn',
          code: 'DYN-01',
          name: 'Atmospheric Dynamics (Core)',
          requiredLevel: 4,
          currentLevel: 0, // Severe Core Gap
          rawGap: 4,
          gapSeverity: 100,
          priorityScore: 92,
          priorityLevel: 'CRITICAL',
          classification: 'MISSING',
          gapType: 'CRITICAL',
          criticality: 'CORE',
          weight: 1.0,
          importance: 1.0,
          confidenceScore: 0.1,
          forgettingRisk: 0.0,
          recentErrorSeverity: 0,
          dependencyCount: 4,
          contributingPrereqs: [],
          reasonCodes: ['CORE_REQUIREMENT_UNMET', 'NO_PRIOR_EVIDENCE'],
          trend: 'NEW',
        },
        {
          competencyId: 'py-sci',
          code: 'PY-01',
          name: 'Python for Earth Sciences',
          requiredLevel: 3,
          currentLevel: 4,
          rawGap: 0,
          gapSeverity: 0,
          priorityScore: 5,
          priorityLevel: 'LOW',
          classification: 'EXCEEDS_REQUIREMENT',
          gapType: 'NO_GAP',
          criticality: 'NORMAL',
          weight: 1.0,
          importance: 0.8,
          confidenceScore: 0.95,
          forgettingRisk: 0.05,
          recentErrorSeverity: 0,
          dependencyCount: 0,
          contributingPrereqs: [],
          reasonCodes: [],
          trend: 'RESOLVED',
        },
        {
          competencyId: 'netcdf',
          code: 'CDO-01',
          name: 'NetCDF Manipulation',
          requiredLevel: 3,
          currentLevel: 3,
          rawGap: 0,
          gapSeverity: 0,
          priorityScore: 8,
          priorityLevel: 'LOW',
          classification: 'MEETS_REQUIREMENT',
          gapType: 'NO_GAP',
          criticality: 'NORMAL',
          weight: 1.0,
          importance: 0.7,
          confidenceScore: 0.90,
          forgettingRisk: 0.10,
          recentErrorSeverity: 0,
          dependencyCount: 0,
          contributingPrereqs: [],
          reasonCodes: [],
          trend: 'STABLE',
        },
      ];

      const readiness = ReadinessAlgorithm.calculate(items);
      expect(readiness.coreDeficienciesCount).toBe(1);
      expect(readiness.coreReadiness).toBe(0); // 0% of Core requirement met
      expect(readiness.readinessStatus).toBe('NOT_READY');
      expect(readiness.canEnrollOrAdvance).toBe(false);
      expect(readiness.blockers[0]).toContain('Core competency "Atmospheric Dynamics (Core)" unmet');
    });
  });

  describe('Learner C: Multi-Layer Root Cause (DAG Traversal)', () => {
    it('should traverse prerequisite graph and trace deepest upstream unmastered competency', () => {
      const edges: PrerequisiteNode[] = [
        { id: 'e1', prerequisiteCompetencyId: 'thermo-math', dependentCompetencyId: 'nwp-modeling', edgeWeight: 1.0, dependencyType: 'DIRECT' },
        { id: 'e2', prerequisiteCompetencyId: 'nwp-modeling', dependentCompetencyId: 'cyclone-prediction', edgeWeight: 1.0, dependencyType: 'DIRECT' },
      ];

      const gapMap = new Map([
        [
          'thermo-math',
          {
            competencyId: 'thermo-math',
            code: 'MATH-01',
            name: 'Atmospheric Thermodynamics & Math',
            rawGap: 2,
            gapSeverity: 66.6,
            currentLevel: 1,
            requiredLevel: 3,
            confidenceScore: 0.35,
            forgettingRisk: 0.1,
            criticality: 'CORE',
          },
        ],
        [
          'nwp-modeling',
          {
            competencyId: 'nwp-modeling',
            code: 'NWP-01',
            name: 'Numerical Weather Prediction',
            rawGap: 3,
            gapSeverity: 75.0,
            currentLevel: 1,
            requiredLevel: 4,
            confidenceScore: 0.3,
            forgettingRisk: 0.2,
            criticality: 'CORE',
          },
        ],
        [
          'cyclone-prediction',
          {
            competencyId: 'cyclone-prediction',
            code: 'CYC-01',
            name: 'Tropical Cyclone Track Forecasting',
            rawGap: 4,
            gapSeverity: 100.0,
            currentLevel: 0,
            requiredLevel: 4,
            confidenceScore: 0.1,
            forgettingRisk: 0.0,
            criticality: 'CORE',
          },
        ],
      ]);

      const rootCauseAnalysis = RootCauseAlgorithm.analyze('cyclone-prediction', gapMap, edges);

      // Deepest root cause is Atmospheric Thermodynamics & Math
      expect(rootCauseAnalysis.rootCauseCompetencyId).toBe('thermo-math');
      expect(rootCauseAnalysis.rootCauseCompetencyName).toBe('Atmospheric Thermodynamics & Math');
      expect(rootCauseAnalysis.contributingPrereqs).toEqual(['nwp-modeling', 'thermo-math']);
      expect(rootCauseAnalysis.reasonCodes).toContain('PREREQUISITE_DEFICIENCY');
    });
  });

  describe('Learner D: Retention Decay / High Forgetting Risk', () => {
    it('should classify meets-level competency as AT_RISK when forgetting risk is severe', () => {
      const requirement: CompetencyRequirement = {
        competencyId: 'dwr-01',
        code: 'RAD-01',
        name: 'Doppler Radar Operations',
        targetLevel: 3,
        importance: 0.9,
        criticality: 'IMPORTANT',
        weight: 1.0,
      };

      const learnerState: LearnerCompetencyState = {
        competencyId: 'dwr-01',
        code: 'RAD-01',
        name: 'Doppler Radar Operations',
        currentLevel: 3,
        competencyScore: 78,
        confidenceScore: 0.85,
        evidenceCount: 22,
        stability: 0.3,
        retention: 0.35,
        forgettingRisk: 0.85, // Severe forgetting risk
        recentErrorSeverity: 10,
      };

      const calc = GapCalculationAlgorithm.calculate(requirement, learnerState);
      expect(calc.rawGap).toBe(0);
      expect(calc.classification).toBe('AT_RISK');

      const priority = GapPriorityAlgorithm.calculate({
        gapSeverity: calc.gapSeverity,
        importance: requirement.importance,
        dependentCount: 2,
        confidenceScore: learnerState.confidenceScore,
        forgettingRisk: learnerState.forgettingRisk,
        recentErrorSeverity: learnerState.recentErrorSeverity,
        criticality: requirement.criticality,
      });

      // Priority should factor in forgetting component (0.10 * 85 = 8.5)
      expect(priority.factorBreakdown.forgettingComponent).toBe(8.5);
    });
  });

  describe('Learner E: Uncertain Evidence / Cold Start', () => {
    it('should classify unverified competency as UNCERTAIN with high uncertainty component', () => {
      const requirement: CompetencyRequirement = {
        competencyId: 'ocean-01',
        code: 'OCN-01',
        name: 'Ocean State Forecasting & Tsunami Warning',
        targetLevel: 3,
        importance: 1.0,
        criticality: 'CORE',
        weight: 1.0,
      };

      const learnerState: LearnerCompetencyState = {
        competencyId: 'ocean-01',
        code: 'OCN-01',
        name: 'Ocean State Forecasting & Tsunami Warning',
        currentLevel: 1,
        competencyScore: 30,
        confidenceScore: 0.15, // High uncertainty
        evidenceCount: 1,
        stability: 1.0,
        retention: 1.0,
        forgettingRisk: 0.0,
        recentErrorSeverity: 0,
      };

      const calc = GapCalculationAlgorithm.calculate(requirement, learnerState);
      expect(calc.classification).toBe('UNCERTAIN');

      const priority = GapPriorityAlgorithm.calculate({
        gapSeverity: calc.gapSeverity,
        importance: requirement.importance,
        dependentCount: 1,
        confidenceScore: learnerState.confidenceScore,
        forgettingRisk: learnerState.forgettingRisk,
        recentErrorSeverity: learnerState.recentErrorSeverity,
        criticality: requirement.criticality,
      });

      // Uncertainty factor: (1 - 0.15) * 100 = 85, weight 0.10 -> 8.5
      expect(priority.factorBreakdown.uncertaintyComponent).toBe(8.5);
    });
  });

  describe('Learner F: Recent Operational Error Rate', () => {
    it('should scale priority with recent error severity to highlight active operational hazards', () => {
      const highError = GapPriorityAlgorithm.calculate({
        gapSeverity: 50,
        importance: 1.0,
        dependentCount: 2,
        confidenceScore: 0.6,
        forgettingRisk: 0.2,
        recentErrorSeverity: 80, // High error severity
        criticality: 'CORE',
      });

      const lowError = GapPriorityAlgorithm.calculate({
        gapSeverity: 50,
        importance: 1.0,
        dependentCount: 2,
        confidenceScore: 0.6,
        forgettingRisk: 0.2,
        recentErrorSeverity: 0, // No recent error
        criticality: 'CORE',
      });

      expect(highError.priorityScore).toBeGreaterThan(lowError.priorityScore);
      expect(highError.factorBreakdown.errorComponent).toBe(8.0);
      expect(lowError.factorBreakdown.errorComponent).toBe(0.0);
    });
  });

  describe('Simulation G: Resilient LLM Failure & MoES Scientific Fallback', () => {
    it('should generate schema-compliant guidance with root cause sequence even when LLM fails', async () => {
      const items: CalculatedGapItem[] = [
        {
          competencyId: 'math-01',
          code: 'MATH-01',
          name: 'Atmospheric Thermodynamics & Mathematics',
          category: 'Atmospheric Sciences',
          requiredLevel: 4,
          currentLevel: 1,
          rawGap: 3,
          gapSeverity: 75,
          priorityScore: 86,
          priorityLevel: 'CRITICAL',
          classification: 'WEAK',
          gapType: 'HIGH',
          criticality: 'CORE',
          weight: 1.0,
          importance: 1.0,
          confidenceScore: 0.3,
          forgettingRisk: 0.2,
          recentErrorSeverity: 40,
          dependencyCount: 3,
          rootCauseCompetencyId: null,
          rootCauseCompetencyName: null,
          contributingPrereqs: [],
          reasonCodes: ['CORE_REQUIREMENT_UNMET', 'HIGH_SEVERITY_GAP'],
          trend: 'NEW',
        },
        {
          competencyId: 'nwp-01',
          code: 'NWP-01',
          name: 'Numerical Weather Prediction & Modeling',
          category: 'Atmospheric Sciences',
          requiredLevel: 4,
          currentLevel: 1,
          rawGap: 3,
          gapSeverity: 75,
          priorityScore: 84,
          priorityLevel: 'CRITICAL',
          classification: 'WEAK',
          gapType: 'HIGH',
          criticality: 'CORE',
          weight: 1.0,
          importance: 1.0,
          confidenceScore: 0.3,
          forgettingRisk: 0.2,
          recentErrorSeverity: 30,
          dependencyCount: 2,
          rootCauseCompetencyId: 'math-01',
          rootCauseCompetencyName: 'Atmospheric Thermodynamics & Mathematics',
          contributingPrereqs: ['math-01'],
          reasonCodes: ['PREREQUISITE_DEFICIENCY', 'CORE_REQUIREMENT_UNMET'],
          trend: 'NEW',
        },
      ];

      const clusters = GapClusteringAlgorithm.cluster(items);
      const readiness = ReadinessAlgorithm.calculate(items);
      const rootCauses = [
        {
          competencyId: 'math-01',
          code: 'MATH-01',
          name: 'Atmospheric Thermodynamics & Mathematics',
          impactedCompetencies: ['Numerical Weather Prediction & Modeling'],
        },
      ];

      // Explicitly invoke deterministic fallback
      const fallbackGuidance = analyzer.generateDeterministicFallback({
        courseTitle: 'Numerical Weather Prediction (NWP): Modeling & Operational Forecasting',
        readiness,
        items,
        clusters,
        rootCauses,
      });

      expect(fallbackGuidance.readinessAssessment.status).toBe(readiness.readinessStatus);
      expect(fallbackGuidance.readinessAssessment.readinessScore).toBe(readiness.overallReadiness);
      expect(fallbackGuidance.keyFindings.rootCauses[0]).toContain('MATH-01');
      expect(fallbackGuidance.actionableLearningPath.length).toBeGreaterThanOrEqual(2);
      // First step in learning path addresses root cause
      expect(fallbackGuidance.actionableLearningPath[0].stepNumber).toBe(1);
      expect(fallbackGuidance.actionableLearningPath[0].competencyName).toContain('MATH-01');
      expect(fallbackGuidance.actionableLearningPath[0].rationale).toContain('root cause');
      expect(fallbackGuidance.disclaimer).toContain('deterministically from verified platform evidence');
    });
  });
});
