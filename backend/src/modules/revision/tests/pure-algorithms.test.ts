import {
  calculatePerformance,
  computeAdaptiveAlpha,
  updateCompetencyScore,
  calculateConfidence,
  calculateRetrievability,
  updateMemoryStability,
  calculateErrorSeverity,
  validateDAG,
  calculateDownstreamImpact,
  identifyRootWeaknesses,
  calculateGroupPriority,
  calculateTopicPriority,
  determineRevisionMode,
  optimizeSessionPlan,
  DAGNodeInfo,
  PrerequisiteStatus,
} from '../algorithms';

describe('Adaptive Revision Engine - Pure Algorithms Unit Tests', () => {
  describe('Competency Algorithm', () => {
    it('calculates performance correctly with 5-component weighting', () => {
      // 0.55 * 1.0 + 0.15 * 1.0 + 0.10 * 1.0 + 0.10 * 1.0 + 0.10 * 1.0 = 1.0
      const perfect = calculatePerformance({
        accuracy: 1.0,
        speedScore: 1.0,
        hintScore: 1.0,
        confidenceSelfScore: 1.0,
        independenceScore: 1.0,
      });
      expect(perfect).toBeCloseTo(1.0, 3);

      // 0.55 * 0.0 + 0.15 * 1.0 + 0.10 * 1.0 + 0.10 * 0.5 + 0.10 * 1.0 = 0.40
      const zeroAccuracy = calculatePerformance({
        accuracy: 0.0,
        speedScore: 1.0,
        hintScore: 1.0,
        confidenceSelfScore: 0.5,
        independenceScore: 1.0,
      });
      expect(zeroAccuracy).toBeCloseTo(0.40, 3);
    });

    it('bounds adaptive learning rate alpha between 0.10 and 0.30', () => {
      const alphaEarly = computeAdaptiveAlpha(0);
      expect(alphaEarly).toBeLessThanOrEqual(0.30);
      expect(alphaEarly).toBeGreaterThanOrEqual(0.10);

      const alphaMature = computeAdaptiveAlpha(50);
      expect(alphaMature).toBe(0.10); // clamped at lower bound
    });

    it('updates competency score smoothly and clamps between 0 and 100', () => {
      const result = updateCompetencyScore({
        currentScore: 50,
        sampleCount: 1,
        components: {
          accuracy: 1.0,
          speedScore: 1.0,
          hintScore: 1.0,
          confidenceSelfScore: 1.0,
          independenceScore: 1.0,
        },
      });

      expect(result.newScore).toBeGreaterThan(50);
      expect(result.newScore).toBeLessThanOrEqual(100);
      expect(result.alpha).toBeGreaterThanOrEqual(0.10);
      expect(result.alpha).toBeLessThanOrEqual(0.30);
    });
  });

  describe('Confidence Algorithm', () => {
    it('detects low confidence and triggers diagnostic when samples are few or variance is high', () => {
      const res = calculateConfidence({
        sampleCount: 1,
        recentScores: [30],
        daysSinceLastEvaluation: 0,
      });
      expect(res.confidenceScore).toBeLessThan(0.40);
      expect(res.requiresDiagnostic).toBe(true);
    });

    it('produces high confidence when sample count is high and variance is low', () => {
      const res = calculateConfidence({
        sampleCount: 12,
        recentScores: [85, 84, 86, 85, 85, 87, 86, 85],
        daysSinceLastEvaluation: 2,
      });
      expect(res.confidenceScore).toBeGreaterThan(0.70);
      expect(res.requiresDiagnostic).toBe(false);
    });
  });

  describe('Memory Retention Algorithm', () => {
    it('calculates exponential decay correctly: R = exp(-delta_t / S)', () => {
      const now = new Date();
      const past = new Date(now.getTime() - 2 * 86400000); // 2 days ago
      const res = calculateRetrievability({
        currentStabilityDays: 2.0,
        lastPracticedAt: past,
        currentDate: now,
      });

      // exp(-2/2) = exp(-1) ~= 0.368
      expect(res.retrievability).toBeCloseTo(0.368, 2);
      expect(res.forgettingFactor).toBeCloseTo(0.632, 2);
    });

    it('expands stability on successful recall and contracts on failure', () => {
      const expandedS = updateMemoryStability({
        currentStabilityDays: 2.0,
        performance: 0.95,
        daysElapsed: 2.0,
      });
      expect(expandedS).toBeGreaterThan(2.0);

      const contractedS = updateMemoryStability({
        currentStabilityDays: 10.0,
        performance: 0.20,
        daysElapsed: 5.0,
      });
      expect(contractedS).toBeLessThan(10.0);
    });
  });

  describe('Error Analysis Algorithm', () => {
    it('maps error counts accurately to severity: 0->0, 1->20, 2->45, 3->70, 4+->95', () => {
      expect(calculateErrorSeverity({ errorCount: 0 }).errorSeverityScore).toBe(0);
      expect(calculateErrorSeverity({ errorCount: 1 }).errorSeverityScore).toBe(20);
      expect(calculateErrorSeverity({ errorCount: 2 }).errorSeverityScore).toBe(45);
      expect(calculateErrorSeverity({ errorCount: 3 }).errorSeverityScore).toBe(70);
      expect(calculateErrorSeverity({ errorCount: 4 }).errorSeverityScore).toBe(95);
    });

    it('dampens severity when consecutive successes occur', () => {
      const res = calculateErrorSeverity({
        errorCount: 3,
        consecutiveSuccesses: 2,
      });
      expect(res.errorSeverityScore).toBeLessThan(70);
    });
  });

  describe('Dependency & DAG Algorithm', () => {
    const testNodes: DAGNodeInfo[] = [
      { topicId: 'T1', topicCode: 'RAD_REFL', name: 'Reflectivity', groupId: 'G1', importanceWeight: 4, prerequisiteIds: [] },
      { topicId: 'T2', topicCode: 'RAD_DOPP', name: 'Doppler Velocity', groupId: 'G1', importanceWeight: 5, prerequisiteIds: ['T1'] },
      { topicId: 'T3', topicCode: 'RAD_MESO', name: 'Mesocyclone', groupId: 'G1', importanceWeight: 5, prerequisiteIds: ['T2'] },
    ];

    it('validates acyclic DAG successfully', () => {
      const validation = validateDAG(testNodes);
      expect(validation.isValid).toBe(true);
    });

    it('detects circular dependency cycle', () => {
      const cyclicNodes: DAGNodeInfo[] = [
        { topicId: 'A', topicCode: 'A', name: 'A', groupId: 'G1', importanceWeight: 3, prerequisiteIds: ['C'] },
        { topicId: 'B', topicCode: 'B', name: 'B', groupId: 'G1', importanceWeight: 3, prerequisiteIds: ['A'] },
        { topicId: 'C', topicCode: 'C', name: 'C', groupId: 'G1', importanceWeight: 3, prerequisiteIds: ['B'] },
      ];
      const validation = validateDAG(cyclicNodes);
      expect(validation.isValid).toBe(false);
    });

    it('calculates downstream impact with depth discounting', () => {
      const impactMap = calculateDownstreamImpact(testNodes);
      const rootImpact = impactMap.get('T1')!;
      const leafImpact = impactMap.get('T3')!;

      expect(rootImpact.downstreamCount).toBe(2);
      expect(rootImpact.downstreamImpactScore).toBeGreaterThan(leafImpact.downstreamImpactScore);
      expect(leafImpact.downstreamCount).toBe(0);
    });

    it('identifies root prerequisite weakness when parent topic is failing', () => {
      const statusMap = new Map<string, PrerequisiteStatus>([
        ['T1', { topicId: 'T1', score: 35, retrievability: 0.3, isWeak: true }],
        ['T2', { topicId: 'T2', score: 25, retrievability: 0.2, isWeak: true }],
        ['T3', { topicId: 'T3', score: 20, retrievability: 0.2, isWeak: true }],
      ]);

      const weakSet = new Set(['T2', 'T3']);
      const roots = identifyRootWeaknesses(testNodes, statusMap, weakSet);

      expect(roots).toContain('T1'); // T1 is the root prerequisite weakness
    });
  });

  describe('Group Priority & Topic Priority Formulas', () => {
    it('computes group priority using 0.40*GW + 0.20*GF + 0.15*GI + 0.15*GD + 0.10*GU', () => {
      const group = calculateGroupPriority({
        groupId: 'G1',
        groupName: 'Radar Meteorology',
        averageScore: 30, // GW = 70 (boosted for roots)
        averageConfidence: 0.3,
        averageRetrievability: 0.3, // GF = 70
        averageImportanceWeight: 5, // GI = 100
        averageDownstreamImpact: 80, // GD = 80
        daysSinceLastPractice: 14, // GU = 49
        rootTopicIds: ['T1'],
        totalTopics: 3,
        unmasteredCount: 3,
      });

      expect(group.groupPriorityScore).toBeGreaterThan(65);
    });

    it('computes topic priority using 7-factor weighted formula', () => {
      const topic = calculateTopicPriority({
        topicId: 'T1',
        topicCode: 'RAD_REFL',
        topicName: 'Radar Reflectivity',
        groupId: 'G1',
        currentScore: 35, // W = 65
        retrievability: 0.30, // F = 70
        confidenceScore: 0.35,
        importanceWeight: 5, // I = 100
        downstreamImpactScore: 80, // D = 80
        errorSeverityScore: 70, // E = 70
        daysSinceLastPractice: 10, // U = 40
        isRootPrerequisite: true,
        prerequisitesMastered: true,
      });

      expect(topic.finalPriorityScore).toBeGreaterThan(60);
      expect(topic.isRootPrerequisite).toBe(true);
    });
  });

  describe('Session Optimizer & Mode Selection', () => {
    it('selects RECOVERY mode for scores <= 30 and REBUILD for 31-50', () => {
      expect(determineRevisionMode(25)).toBe('RECOVERY');
      expect(determineRevisionMode(45)).toBe('REBUILD');
      expect(determineRevisionMode(65)).toBe('STRENGTHEN');
      expect(determineRevisionMode(80)).toBe('RETRIEVE');
      expect(determineRevisionMode(92)).toBe('MAINTAIN_CHALLENGE');
    });

    it('schedules ROOT_PREREQUISITE first before PRIMARY_WEAKNESS', () => {
      const plan = optimizeSessionPlan({
        focusGroupId: 'G_RADAR',
        focusGroupName: 'Radar Meteorology',
        rankedGroupTopics: [
          {
            topicId: 'T2',
            topicCode: 'RAD_DOPP',
            topicName: 'Doppler Velocity',
            groupId: 'G_RADAR',
            weaknessScore: 75,
            forgettingRisk: 80,
            structuralImportance: 100,
            downstreamImpact: 60,
            errorSeverity: 70,
            urgencyScore: 40,
            remedialReadiness: 100,
            finalPriorityScore: 82,
            isRootPrerequisite: false,
            currentScore: 25,
            retrievability: 0.2,
            confidenceScore: 0.25,
          },
        ],
        rootPrerequisiteTopics: [
          {
            topicId: 'T1',
            topicCode: 'RAD_REFL',
            topicName: 'Radar Reflectivity',
            groupId: 'G_RADAR',
            weaknessScore: 65,
            forgettingRisk: 70,
            structuralImportance: 80,
            downstreamImpact: 90,
            errorSeverity: 20,
            urgencyScore: 40,
            remedialReadiness: 100,
            finalPriorityScore: 75,
            isRootPrerequisite: true,
            currentScore: 35,
            retrievability: 0.3,
            confidenceScore: 0.35,
          },
        ],
        targetDurationMinutes: 30,
        maxTopics: 3,
      });

      expect(plan.items.length).toBeGreaterThanOrEqual(2);
      expect(plan.items[0].itemRole).toBe('ROOT_PREREQUISITE');
      expect(plan.items[0].topicCode).toBe('RAD_REFL');
      expect(plan.items[1].itemRole).toBe('PRIMARY_WEAKNESS');
      expect(plan.items[1].topicCode).toBe('RAD_DOPP');
    });
  });
});
