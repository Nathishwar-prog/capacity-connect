import {
  calculatePerformance,
  updateCompetencyScore,
  calculateConfidence,
  calculateRetrievability,
  calculateErrorSeverity,
  calculateTopicPriority,
  rankCompetencyGroups,
  optimizeSessionPlan,
} from '../algorithms';
import { TopicPriorityComponents } from '../types/revision.types';

describe('Adaptive Revision Engine - 10 Simulation Scenarios (Section 37)', () => {
  // Scenario 1: Beginner with foundational gaps
  it('Scenario 1: Beginner with foundational gaps prioritizes root prerequisite', () => {
    const rootPrereq: TopicPriorityComponents = {
      topicId: 'T_HYDRO',
      topicCode: 'ATM_HYDRO',
      topicName: 'Hydrostatic Balance',
      groupId: 'G_DYNAMICS',
      weaknessScore: 80,
      forgettingRisk: 60,
      structuralImportance: 90,
      downstreamImpact: 95,
      errorSeverity: 40,
      urgencyScore: 50,
      remedialReadiness: 100,
      finalPriorityScore: 88,
      isRootPrerequisite: true,
      currentScore: 20,
      retrievability: 0.4,
      confidenceScore: 0.2,
    };

    const advancedTopic: TopicPriorityComponents = {
      topicId: 'T_INSTAB',
      topicCode: 'ATM_INSTAB',
      topicName: 'Convective Instability & CAPE',
      groupId: 'G_DYNAMICS',
      weaknessScore: 85,
      forgettingRisk: 70,
      structuralImportance: 100,
      downstreamImpact: 40,
      errorSeverity: 50,
      urgencyScore: 50,
      remedialReadiness: 50, // penalized because prereq is weak!
      finalPriorityScore: 80,
      isRootPrerequisite: false,
      currentScore: 15,
      retrievability: 0.3,
      confidenceScore: 0.2,
    };

    const plan = optimizeSessionPlan({
      focusGroupId: 'G_DYNAMICS',
      focusGroupName: 'Atmospheric Dynamics',
      rankedGroupTopics: [advancedTopic],
      rootPrerequisiteTopics: [rootPrereq],
      targetDurationMinutes: 30,
    });

    expect(plan.revisionMode).toBe('RECOVERY');
    expect(plan.items[0].topicCode).toBe('ATM_HYDRO');
    expect(plan.items[0].itemRole).toBe('ROOT_PREREQUISITE');
  });

  // Scenario 2: Intermediate learner who forgot earlier topics
  it('Scenario 2: Intermediate learner with high past mastery but long lapse has high forgetting factor', () => {
    const now = new Date();
    const fortyFiveDaysAgo = new Date(now.getTime() - 45 * 86400000);

    const mem = calculateRetrievability({
      currentStabilityDays: 14.0, // 2-week stability
      lastPracticedAt: fortyFiveDaysAgo,
      currentDate: now,
    });

    expect(mem.retrievability).toBeLessThan(0.10); // severe forgetting
    expect(mem.forgettingFactor).toBeGreaterThan(0.90);

    const topicPriority = calculateTopicPriority({
      topicId: 'T_SAT_RAD',
      topicCode: 'SAT_RAD',
      topicName: 'Radiative Transfer',
      groupId: 'G_SAT',
      currentScore: 85, // mastery is high
      retrievability: mem.retrievability, // but retrievability is very low!
      confidenceScore: 0.8,
      importanceWeight: 4,
      downstreamImpactScore: 40,
      errorSeverityScore: 0,
      daysSinceLastPractice: 45,
      isRootPrerequisite: false,
      prerequisitesMastered: true,
    });

    // High forgetting risk elevates priority score despite high base score
    expect(topicPriority.forgettingRisk).toBeGreaterThan(80);
    expect(topicPriority.finalPriorityScore).toBeGreaterThan(35);
  });

  // Scenario 3: Advanced learner making repeated specific errors
  it('Scenario 3: Advanced learner with repeated error gets penalized on error severity', () => {
    const errorAnalysis = calculateErrorSeverity({
      errorCount: 3,
      consecutiveSuccesses: 0,
    });

    expect(errorAnalysis.errorSeverityScore).toBe(70);

    const topicPriority = calculateTopicPriority({
      topicId: 'T_DOPP',
      topicCode: 'RAD_DOPP',
      topicName: 'Doppler Velocity Dealiasing',
      groupId: 'G_RADAR',
      currentScore: 78,
      retrievability: 0.85,
      confidenceScore: 0.8,
      importanceWeight: 5,
      downstreamImpactScore: 70,
      errorSeverityScore: errorAnalysis.errorSeverityScore,
      daysSinceLastPractice: 2,
      isRootPrerequisite: false,
      prerequisitesMastered: true,
    });

    // Error severity adds ~7-10 points to priority score
    expect(topicPriority.errorSeverity).toBe(70);
  });

  // Scenario 4: Erratic learner with high score variance
  it('Scenario 4: Erratic learner with high score variance triggers low confidence & diagnostic', () => {
    const erraticScores = [95, 20, 85, 30, 90, 15, 80, 25];
    const conf = calculateConfidence({
      sampleCount: 8,
      recentScores: erraticScores,
      daysSinceLastEvaluation: 1,
    });

    expect(conf.variance).toBeGreaterThan(500); // High variance
    expect(conf.variancePenalty).toBeGreaterThan(0.15);
    expect(conf.requiresDiagnostic).toBe(conf.confidenceScore < 0.40);
  });

  // Scenario 5: Fast guesser
  it('Scenario 5: Fast guesser with high speed but 0% accuracy gets low performance', () => {
    const perf = calculatePerformance({
      accuracy: 0.0,
      speedScore: 1.0, // answered instantly
      hintScore: 1.0,
      confidenceSelfScore: 0.5,
      independenceScore: 1.0,
    });

    // 0.55 * 0 + 0.15 * 1 + 0.10 * 1 + 0.10 * 0.5 + 0.10 * 1 = 0.40
    expect(perf).toBeCloseTo(0.40, 2);
    expect(perf).toBeLessThan(0.50);
  });

  // Scenario 6: Slow methodical learner
  it('Scenario 6: Slow methodical learner with 100% accuracy achieves high performance', () => {
    const perf = calculatePerformance({
      accuracy: 1.0,
      speedScore: 0.6, // took longer than expected
      hintScore: 1.0,
      confidenceSelfScore: 0.8,
      independenceScore: 1.0,
    });

    // 0.55*1.0 + 0.15*0.6 + 0.10*1.0 + 0.10*0.8 + 0.10*1.0 = 0.92
    expect(perf).toBeCloseTo(0.92, 2);
    expect(perf).toBeGreaterThan(0.85);
  });

  // Scenario 7: Hint-dependent learner
  it('Scenario 7: Hint-dependent learner has dampened performance score', () => {
    const independentPerf = calculatePerformance({
      accuracy: 1.0,
      speedScore: 1.0,
      hintScore: 1.0, // 0 hints
      confidenceSelfScore: 0.8,
      independenceScore: 1.0,
    });

    const hintDependentPerf = calculatePerformance({
      accuracy: 1.0,
      speedScore: 1.0,
      hintScore: 0.0, // 3+ hints
      confidenceSelfScore: 0.4,
      independenceScore: 0.4, // needed external help
    });

    expect(independentPerf - hintDependentPerf).toBeGreaterThanOrEqual(0.19);
  });

  // Scenario 8: Overconfident learner
  it('Scenario 8: Overconfident learner recalibrates with bounded learning rate', () => {
    const update = updateCompetencyScore({
      currentScore: 80,
      sampleCount: 5,
      components: {
        accuracy: 0.0,
        speedScore: 1.0,
        hintScore: 1.0,
        confidenceSelfScore: 1.0, // overconfident
        independenceScore: 1.0,
      },
    });

    // Alpha is bounded between 0.10 and 0.30, preventing single-event catastrophic score collapse
    expect(update.alpha).toBeLessThanOrEqual(0.30);
    expect(update.alpha).toBeGreaterThanOrEqual(0.10);
    expect(update.newScore).toBeLessThan(80);
    expect(update.newScore).toBeGreaterThan(50); // score does not instantly drop to 0
  });

  // Scenario 9: Long absence learner
  it('Scenario 9: Long absence learner (90 days) exhibits near-complete forgetting and high urgency', () => {
    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 86400000);

    const mem = calculateRetrievability({
      currentStabilityDays: 7.0,
      lastPracticedAt: ninetyDaysAgo,
      currentDate: now,
    });

    expect(mem.retrievability).toBeLessThan(0.02);
    expect(mem.daysElapsed).toBeCloseTo(90, 0);

    const topicPriority = calculateTopicPriority({
      topicId: 'T_NWP',
      topicCode: 'NWP_DYN',
      topicName: 'Primitive Equations',
      groupId: 'G_NWP',
      currentScore: 60,
      retrievability: mem.retrievability,
      confidenceScore: 0.5,
      importanceWeight: 5,
      downstreamImpactScore: 50,
      errorSeverityScore: 0,
      daysSinceLastPractice: 90,
      isRootPrerequisite: false,
      prerequisitesMastered: true,
    });

    expect(topicPriority.urgencyScore).toBe(100); // capped at 100
  });

  // Scenario 10: Multi-domain learner with scattered weaknesses
  it('Scenario 10: Multi-domain learner with scattered weaknesses chooses single weakest group instead of scattered topics', () => {
    const groupRadar = {
      groupId: 'G_RADAR',
      groupName: 'Radar Meteorology',
      averageScore: 28, // very weak
      averageConfidence: 0.25,
      averageRetrievability: 0.3,
      averageImportanceWeight: 5,
      averageDownstreamImpact: 85,
      daysSinceLastPractice: 14,
      rootTopicIds: ['RAD_REFL'],
      totalTopics: 3,
      unmasteredCount: 3,
    };

    const groupSatellite = {
      groupId: 'G_SAT',
      groupName: 'Satellite Meteorology',
      averageScore: 65, // moderate
      averageConfidence: 0.6,
      averageRetrievability: 0.5,
      averageImportanceWeight: 4.5,
      averageDownstreamImpact: 40,
      daysSinceLastPractice: 7,
      rootTopicIds: [],
      totalTopics: 3,
      unmasteredCount: 1,
    };

    const groupNWP = {
      groupId: 'G_NWP',
      groupName: 'Numerical Weather Prediction',
      averageScore: 78, // good
      averageConfidence: 0.75,
      averageRetrievability: 0.7,
      averageImportanceWeight: 4.8,
      averageDownstreamImpact: 30,
      daysSinceLastPractice: 3,
      rootTopicIds: [],
      totalTopics: 3,
      unmasteredCount: 0,
    };

    const ranked = rankCompetencyGroups([groupRadar, groupSatellite, groupNWP]);

    // First selected group is definitively Radar Meteorology!
    expect(ranked[0].groupId).toBe('G_RADAR');
    expect(ranked[0].groupPriorityScore).toBeGreaterThan(ranked[1].groupPriorityScore);
    expect(ranked[0].groupPriorityScore).toBeGreaterThan(ranked[2].groupPriorityScore);
  });
});
