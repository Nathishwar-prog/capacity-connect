import {
  GapCalculationAlgorithm,
  GapPriorityAlgorithm,
  RootCauseAlgorithm,
  ReadinessAlgorithm,
  GapClusteringAlgorithm,
  TrendAlgorithm,
} from '../algorithms';
import {
  CompetencyRequirement,
  LearnerCompetencyState,
  CalculatedGapItem,
  PrerequisiteNode,
} from '../types/skill-gap.types';

describe('AI Skill Gap Analyzer — Pure Algorithms', () => {
  describe('GapCalculationAlgorithm', () => {
    it('should calculate rawGap, gapSeverity and classification for a missing skill', () => {
      const requirement: CompetencyRequirement = {
        competencyId: 'comp-1',
        code: 'NWP-01',
        name: 'Numerical Weather Prediction',
        targetLevel: 4,
        importance: 1.0,
        criticality: 'CORE',
        weight: 1.0,
      };

      const result = GapCalculationAlgorithm.calculate(requirement, null);
      expect(result.rawGap).toBe(4);
      expect(result.gapSeverity).toBe(100);
      expect(result.classification).toBe('MISSING');
      expect(result.gapType).toBe('CRITICAL');
    });

    it('should identify WEAK competency when evidence exists but gap remains', () => {
      const requirement: CompetencyRequirement = {
        competencyId: 'comp-1',
        code: 'RAD-01',
        name: 'Doppler Radar Operations',
        targetLevel: 4,
        importance: 1.0,
        criticality: 'IMPORTANT',
        weight: 1.0,
      };

      const learnerState: LearnerCompetencyState = {
        competencyId: 'comp-1',
        code: 'RAD-01',
        name: 'Doppler Radar Operations',
        currentLevel: 2,
        competencyScore: 55,
        confidenceScore: 0.8,
        evidenceCount: 15,
        stability: 1.2,
        retention: 0.85,
        forgettingRisk: 0.15,
        recentErrorSeverity: 20,
      };

      const result = GapCalculationAlgorithm.calculate(requirement, learnerState);
      expect(result.rawGap).toBe(2);
      expect(result.gapSeverity).toBe(50);
      expect(result.classification).toBe('WEAK');
      expect(result.gapType).toBe('MEDIUM');
    });

    it('should detect AT_RISK when currentLevel meets requirement but forgetting risk is high', () => {
      const requirement: CompetencyRequirement = {
        competencyId: 'comp-2',
        code: 'SAT-01',
        name: 'Satellite Meteorology',
        targetLevel: 3,
        importance: 0.9,
        criticality: 'NORMAL',
        weight: 1.0,
      };

      const learnerState: LearnerCompetencyState = {
        competencyId: 'comp-2',
        code: 'SAT-01',
        name: 'Satellite Meteorology',
        currentLevel: 3,
        competencyScore: 80,
        confidenceScore: 0.9,
        evidenceCount: 20,
        stability: 0.4,
        retention: 0.45,
        forgettingRisk: 0.75, // > 0.65 threshold
        recentErrorSeverity: 0,
      };

      const result = GapCalculationAlgorithm.calculate(requirement, learnerState);
      expect(result.rawGap).toBe(0);
      expect(result.gapSeverity).toBe(0);
      expect(result.classification).toBe('AT_RISK');
      expect(result.gapType).toBe('NO_GAP');
    });

    it('should handle zero target level gracefully with no divide-by-zero error', () => {
      const requirement: CompetencyRequirement = {
        competencyId: 'comp-zero',
        code: 'GEN-00',
        name: 'Introductory Knowledge',
        targetLevel: 0,
        importance: 0,
        criticality: 'OPTIONAL',
        weight: 1.0,
      };

      const result = GapCalculationAlgorithm.calculate(requirement, null);
      expect(result.rawGap).toBe(0);
      expect(result.gapSeverity).toBe(0);
      expect(result.gapType).toBe('NO_GAP');
    });
  });

  describe('GapPriorityAlgorithm', () => {
    it('should rank a severe CORE deficiency higher than an OPTIONAL gap', () => {
      const coreResult = GapPriorityAlgorithm.calculate({
        gapSeverity: 100,
        importance: 1.0,
        dependentCount: 3,
        maxDependents: 5,
        confidenceScore: 0.2,
        forgettingRisk: 0.5,
        recentErrorSeverity: 60,
        criticality: 'CORE',
      });

      const optionalResult = GapPriorityAlgorithm.calculate({
        gapSeverity: 100,
        importance: 1.0,
        dependentCount: 3,
        maxDependents: 5,
        confidenceScore: 0.2,
        forgettingRisk: 0.5,
        recentErrorSeverity: 60,
        criticality: 'OPTIONAL',
      });

      expect(coreResult.priorityScore).toBeGreaterThan(optionalResult.priorityScore);
      expect(coreResult.priorityLevel).toBe('CRITICAL');
      expect(coreResult.factorBreakdown.criticalityMultiplier).toBe(1.25);
      expect(optionalResult.factorBreakdown.criticalityMultiplier).toBe(0.8);
    });
  });

  describe('RootCauseAlgorithm', () => {
    it('should identify upstream unmastered prerequisite as root cause', () => {
      const prerequisiteEdges: PrerequisiteNode[] = [
        {
          id: 'edge-1',
          prerequisiteCompetencyId: 'math-foundation',
          dependentCompetencyId: 'nwp-modeling',
          edgeWeight: 1.0,
          dependencyType: 'DIRECT',
        },
        {
          id: 'edge-2',
          prerequisiteCompetencyId: 'nwp-modeling',
          dependentCompetencyId: 'cyclone-track-prediction',
          edgeWeight: 1.0,
          dependencyType: 'DIRECT',
        },
      ];

      const gapMap = new Map([
        [
          'math-foundation',
          {
            competencyId: 'math-foundation',
            code: 'MATH-01',
            name: 'Atmospheric Thermodynamics & Math',
            rawGap: 2,
            gapSeverity: 66.6,
            currentLevel: 1,
            requiredLevel: 3,
            confidenceScore: 0.4,
            forgettingRisk: 0.2,
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
            forgettingRisk: 0.3,
            criticality: 'CORE',
          },
        ],
        [
          'cyclone-track-prediction',
          {
            competencyId: 'cyclone-track-prediction',
            code: 'CYC-01',
            name: 'Tropical Cyclone Track Forecasting',
            rawGap: 3,
            gapSeverity: 100.0,
            currentLevel: 0,
            requiredLevel: 3,
            confidenceScore: 0.1,
            forgettingRisk: 0.1,
            criticality: 'CORE',
          },
        ],
      ]);

      const result = RootCauseAlgorithm.analyze(
        'cyclone-track-prediction',
        gapMap,
        prerequisiteEdges
      );

      expect(result.contributingPrereqs).toContain('nwp-modeling');
      expect(result.contributingPrereqs).toContain('math-foundation');
      // Earliest upstream root cause
      expect(result.rootCauseCompetencyId).toBe('math-foundation');
      expect(result.reasonCodes).toContain('PREREQUISITE_DEFICIENCY');
      expect(result.reasonCodes).toContain('CORE_REQUIREMENT_UNMET');
    });
  });

  describe('ReadinessAlgorithm', () => {
    it('should gate readiness status to NOT_READY or CONDITIONAL if CORE competencies are unmet', () => {
      const items: CalculatedGapItem[] = [
        {
          competencyId: 'comp-1',
          code: 'RAD-01',
          name: 'Doppler Radar Operations',
          requiredLevel: 4,
          currentLevel: 4,
          rawGap: 0,
          gapSeverity: 0,
          priorityScore: 10,
          priorityLevel: 'LOW',
          classification: 'MEETS_REQUIREMENT',
          gapType: 'NO_GAP',
          criticality: 'IMPORTANT',
          weight: 1.0,
          importance: 0.8,
          confidenceScore: 0.9,
          forgettingRisk: 0.1,
          recentErrorSeverity: 0,
          dependencyCount: 0,
          contributingPrereqs: [],
          reasonCodes: [],
          trend: 'STABLE',
        },
        {
          competencyId: 'comp-2',
          code: 'CORE-01',
          name: 'Basic Atmospheric Physics',
          requiredLevel: 4,
          currentLevel: 1,
          rawGap: 3,
          gapSeverity: 75,
          priorityScore: 88,
          priorityLevel: 'CRITICAL',
          classification: 'WEAK',
          gapType: 'HIGH',
          criticality: 'CORE', // Core requirement unmet!
          weight: 1.0,
          importance: 1.0,
          confidenceScore: 0.3,
          forgettingRisk: 0.2,
          recentErrorSeverity: 40,
          dependencyCount: 2,
          contributingPrereqs: [],
          reasonCodes: ['CORE_REQUIREMENT_UNMET'],
          trend: 'NEW',
        },
      ];

      const readiness = ReadinessAlgorithm.calculate(items);
      expect(readiness.coreDeficienciesCount).toBe(1);
      expect(readiness.readinessStatus).not.toBe('FULLY_READY');
      expect(readiness.readinessStatus).not.toBe('GENERALLY_READY');
      expect(readiness.blockers.length).toBe(1);
    });

    it('should grant FULLY_READY when all requirements are met and readiness >= 80%', () => {
      const items: CalculatedGapItem[] = [
        {
          competencyId: 'comp-1',
          code: 'RAD-01',
          name: 'Doppler Radar Operations',
          requiredLevel: 3,
          currentLevel: 3,
          rawGap: 0,
          gapSeverity: 0,
          priorityScore: 5,
          priorityLevel: 'LOW',
          classification: 'MEETS_REQUIREMENT',
          gapType: 'NO_GAP',
          criticality: 'CORE',
          weight: 1.0,
          importance: 1.0,
          confidenceScore: 0.95,
          forgettingRisk: 0.05,
          recentErrorSeverity: 0,
          dependencyCount: 1,
          contributingPrereqs: [],
          reasonCodes: [],
          trend: 'RESOLVED',
        },
      ];

      const readiness = ReadinessAlgorithm.calculate(items);
      expect(readiness.overallReadiness).toBe(100);
      expect(readiness.coreReadiness).toBe(100);
      expect(readiness.coreDeficienciesCount).toBe(0);
      expect(readiness.readinessStatus).toBe('FULLY_READY');
      expect(readiness.canEnrollOrAdvance).toBe(true);
    });
  });

  describe('GapClusteringAlgorithm', () => {
    it('should cluster items by category and sort by average priority', () => {
      const items: CalculatedGapItem[] = [
        {
          competencyId: 'c1',
          code: 'NWP-1',
          name: 'NWP Model Setup',
          category: 'Numerical Weather Prediction (NWP)',
          requiredLevel: 4,
          currentLevel: 1,
          rawGap: 3,
          gapSeverity: 75,
          priorityScore: 85,
          priorityLevel: 'CRITICAL',
          classification: 'WEAK',
          gapType: 'HIGH',
          criticality: 'CORE',
          weight: 1,
          importance: 1,
          confidenceScore: 0.3,
          forgettingRisk: 0.2,
          recentErrorSeverity: 30,
          dependencyCount: 2,
          contributingPrereqs: [],
          reasonCodes: [],
          trend: 'NEW',
        },
        {
          competencyId: 'c2',
          code: 'RAD-1',
          name: 'Radar Calibration',
          category: 'Doppler Radar Operations',
          requiredLevel: 3,
          currentLevel: 2,
          rawGap: 1,
          gapSeverity: 33.3,
          priorityScore: 40,
          priorityLevel: 'MEDIUM',
          classification: 'WEAK',
          gapType: 'LOW',
          criticality: 'NORMAL',
          weight: 1,
          importance: 0.7,
          confidenceScore: 0.8,
          forgettingRisk: 0.1,
          recentErrorSeverity: 10,
          dependencyCount: 0,
          contributingPrereqs: [],
          reasonCodes: [],
          trend: 'STABLE',
        },
      ];

      const clusters = GapClusteringAlgorithm.cluster(items);
      expect(clusters.length).toBe(2);
      expect(clusters[0].category).toBe('Numerical Weather Prediction (NWP)');
      expect(clusters[0].averagePriority).toBe(85);
      expect(clusters[1].category).toBe('Doppler Radar Operations');
      expect(clusters[1].averagePriority).toBe(40);
    });
  });

  describe('TrendAlgorithm', () => {
    it('should accurately categorize IMPROVING, WORSENING, RESOLVED, and NEW', () => {
      const historicalMap = new Map([
        [
          'c1',
          {
            competencyId: 'c1',
            rawGap: 3,
            gapSeverity: 75,
            currentLevel: 1,
            calculatedAt: new Date(Date.now() - 86400000),
          },
        ],
        [
          'c2',
          {
            competencyId: 'c2',
            rawGap: 1,
            gapSeverity: 25,
            currentLevel: 3,
            calculatedAt: new Date(Date.now() - 86400000),
          },
        ],
      ]);

      // c1 decreased gap from 3 to 1 -> IMPROVING
      expect(TrendAlgorithm.determineTrend('c1', 1, 25, historicalMap)).toBe('IMPROVING');

      // c2 increased gap from 1 to 2 -> WORSENING
      expect(TrendAlgorithm.determineTrend('c2', 2, 50, historicalMap)).toBe('WORSENING');

      // c1 reached rawGap 0 -> RESOLVED
      expect(TrendAlgorithm.determineTrend('c1', 0, 0, historicalMap)).toBe('RESOLVED');

      // c3 not in historical -> NEW
      expect(TrendAlgorithm.determineTrend('c3', 2, 50, historicalMap)).toBe('NEW');
    });
  });
});
