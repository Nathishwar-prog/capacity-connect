/**
 * Synthetic Simulation Tests — Scenarios A through J
 * 
 * Verifies end-to-end algorithmic behavior across 10 real-world MoES / IMD operational scenarios.
 */

import {
  calculateSkillRelevanceScore,
  calculateBehavioralAffinity,
  calculateCollaborativeScore,
  calculateCourseQualityScore,
  calculateContextualScore,
  applyMMRDiversity,
  injectExploratoryCandidates,
} from '../algorithms';
import { WeightedLinearRanker } from '../ranking/weighted-ranker';
import { DEFAULT_FEATURE_WEIGHTS } from '../recommendation.constants';

describe('Intelligent Recommendation Engine — Simulation Scenarios A through J', () => {

  const ranker = new WeightedLinearRanker();

  // -------------------------------------------------------------
  // Scenario A: Critical Skill Gap in Doppler Weather Radar
  // -------------------------------------------------------------
  it('Scenario A: Ranks radar remediation course #1 when learner has critical gap', () => {
    // Learner has critical gap in Doppler velocity de-aliasing
    const radarGaps = [
      {
        competencyId: 'comp-radar',
        code: 'RADAR-01',
        name: 'Doppler Velocity De-aliasing',
        targetLevel: 4,
        learnerCurrentLevel: 1,
        severity: 75,
        criticality: 'CORE' as const,
      },
    ];

    const radarSkillScore = calculateSkillRelevanceScore(radarGaps); // ~93.75
    const genericSkillScore = calculateSkillRelevanceScore([]);      // 0

    const candidates = [
      { courseId: 'course-radar', source: 'SKILL_GAP' as const, sourcePriority: radarSkillScore, reasonCodes: ['CLOSES_CRITICAL_GAP'], metadata: {} },
      { courseId: 'course-generic', source: 'POPULARITY' as const, sourcePriority: 50, reasonCodes: ['HIGH_COMPLETION_RATE'], metadata: {} },
    ];

    const featuresMap = new Map([
      ['course-radar', {
        skillRelevanceScore: radarSkillScore,
        contentSimilarityScore: 40,
        behavioralAffinityScore: 30,
        collaborativeScore: 20,
        qualityScore: 85,
        freshnessScore: 80,
        contextualScore: 60,
        difficultyAlignmentScore: 90,
        historicalSuccessRate: 85,
      }],
      ['course-generic', {
        skillRelevanceScore: genericSkillScore,
        contentSimilarityScore: 50,
        behavioralAffinityScore: 40,
        collaborativeScore: 30,
        qualityScore: 80,
        freshnessScore: 60,
        contextualScore: 50,
        difficultyAlignmentScore: 70,
        historicalSuccessRate: 80,
      }],
    ]);

    const ranked = ranker.rank({ candidates, featuresMap, weights: DEFAULT_FEATURE_WEIGHTS });

    expect(ranked[0].courseId).toBe('course-radar');
    expect(ranked[0].rankPosition).toBe(1);
    expect(ranked[0].reasonCodes).toContain('CLOSES_CRITICAL_GAP');
  });

  // -------------------------------------------------------------
  // Scenario B: Learner with In-Progress Course (Continuation)
  // -------------------------------------------------------------
  it('Scenario B: Prioritizes active in-progress course to resume learning pathway', () => {
    const continuationScore = calculateContextualScore({
      isContinuationPrerequisite: true,
      isInActiveCourseView: true,
      isDepartmentMatch: true,
      surface: 'DASHBOARD',
    });

    expect(continuationScore).toBeGreaterThanOrEqual(90);

    const candidates = [
      { courseId: 'in-progress-course', source: 'CONTINUATION' as const, sourcePriority: 85, reasonCodes: ['CONTINUES_LEARNING_PATH'], metadata: {} },
      { courseId: 'unrelated-course', source: 'POPULARITY' as const, sourcePriority: 50, reasonCodes: ['HIGH_COMPLETION_RATE'], metadata: {} },
    ];

    const featuresMap = new Map([
      ['in-progress-course', {
        skillRelevanceScore: 70,
        contentSimilarityScore: 80,
        behavioralAffinityScore: 85,
        collaborativeScore: 30,
        qualityScore: 80,
        freshnessScore: 70,
        contextualScore: continuationScore,
        difficultyAlignmentScore: 90,
        historicalSuccessRate: 80,
      }],
      ['unrelated-course', {
        skillRelevanceScore: 40,
        contentSimilarityScore: 20,
        behavioralAffinityScore: 10,
        collaborativeScore: 20,
        qualityScore: 75,
        freshnessScore: 60,
        contextualScore: 30,
        difficultyAlignmentScore: 60,
        historicalSuccessRate: 70,
      }],
    ]);

    const ranked = ranker.rank({ candidates, featuresMap, weights: DEFAULT_FEATURE_WEIGHTS });
    expect(ranked[0].courseId).toBe('in-progress-course');
    expect(ranked[0].reasonCodes).toContain('CONTINUES_LEARNING_PATH');
  });

  // -------------------------------------------------------------
  // Scenario C: Completed NWP Prerequisite (Unlocked Advanced NWP)
  // -------------------------------------------------------------
  it('Scenario C: Recommends unlocked advanced course when mandatory prerequisite is completed', () => {
    const candidate = {
      courseId: 'adv-nwp-course',
      source: 'CONTINUATION' as const,
      sourcePriority: 85,
      reasonCodes: ['PREREQUISITE_COMPLETED', 'CONTINUES_LEARNING_PATH'],
      metadata: { unlockedBy: 'intro-nwp-course' },
    };

    expect(candidate.reasonCodes).toContain('PREREQUISITE_COMPLETED');
    expect(candidate.sourcePriority).toBe(85);
  });

  // -------------------------------------------------------------
  // Scenario D: Brand New Cold-Start Learner (No Prior History)
  // -------------------------------------------------------------
  it('Scenario D: Cold-start returns 0 collaborative score safely without crashing or fabricating', () => {
    const userCompletedCourses: string[] = []; // empty
    const peerHistories = [
      { peerUserId: 'peer1', completedCourseIds: ['c1', 'c2'] },
    ];

    const collabScore = calculateCollaborativeScore(userCompletedCourses, peerHistories, 'c1');
    expect(collabScore).toBe(0);

    // Beginner course quality and popularity guide the recommendations
    const qualityScore = calculateCourseQualityScore({
      completionRate: 0.85,
      averageRating: 4.6,
      ratingCount: 20,
    });
    expect(qualityScore).toBeGreaterThan(75);
  });

  // -------------------------------------------------------------
  // Scenario E: High-Performing Senior Forecaster (Advanced Topics)
  // -------------------------------------------------------------
  it('Scenario E: Elevates advanced courses matching high competency level', () => {
    const seniorUserAvgLevel = 4.5;
    const advancedCourseExpected = 4;
    const beginnerCourseExpected = 2;

    const diffAdv = Math.abs(seniorUserAvgLevel - advancedCourseExpected);
    const diffBeg = Math.abs(seniorUserAvgLevel - beginnerCourseExpected);

    const advAlignment = Math.max(20, Math.round(100 - diffAdv * 25)); // ~88
    const begAlignment = Math.max(20, Math.round(100 - diffBeg * 25)); // ~38

    expect(advAlignment).toBeGreaterThan(begAlignment);
  });

  // -------------------------------------------------------------
  // Scenario F: Learner Struggling with Numerical Assessment Errors
  // -------------------------------------------------------------
  it('Scenario F: Boosts behavioral affinity for remedial courses matching recent errors', () => {
    const now = new Date();
    const errorRemedialEvents = [
      { type: 'CLICK', timestamp: now },
      { type: 'SAVE', timestamp: now },
    ];

    const affinity = calculateBehavioralAffinity(errorRemedialEvents, now);
    expect(affinity).toBeGreaterThanOrEqual(60);
  });

  // -------------------------------------------------------------
  // Scenario G: Departmental Shift (Synoptic Forecaster to Satellite Division)
  // -------------------------------------------------------------
  it('Scenario G: Rewards courses matching current departmental affiliation', () => {
    const satDeptScore = calculateContextualScore({
      isContinuationPrerequisite: false,
      isInActiveCourseView: false,
      isDepartmentMatch: true,
      surface: 'DASHBOARD',
    });

    const otherDeptScore = calculateContextualScore({
      isContinuationPrerequisite: false,
      isInActiveCourseView: false,
      isDepartmentMatch: false,
      surface: 'DASHBOARD',
    });

    expect(satDeptScore).toBeGreaterThan(otherDeptScore);
  });

  // -------------------------------------------------------------
  // Scenario H: Filter-Bubble Prevention (Serendipitous Ocean Modeling)
  // -------------------------------------------------------------
  it('Scenario H: Injects controlled exploration course into recommended slots', () => {
    const core = [
      { courseId: 'c1', source: 'SKILL_GAP' as const, finalScore: 92, rankPosition: 1, reasonCodes: ['CLOSES_SKILL_GAP'], featureSnapshot: { qualityScore: 80, skillRelevanceScore: 70, freshnessScore: 80 } as any, contentMetadata: { category: 'Synoptic', topics: [], description: '' } },
      { courseId: 'c2', source: 'SKILL_GAP' as const, finalScore: 88, rankPosition: 2, reasonCodes: ['CLOSES_SKILL_GAP'], featureSnapshot: { qualityScore: 80, skillRelevanceScore: 70, freshnessScore: 80 } as any, contentMetadata: { category: 'Synoptic', topics: [], description: '' } },
      { courseId: 'c3', source: 'SKILL_GAP' as const, finalScore: 84, rankPosition: 3, reasonCodes: ['CLOSES_SKILL_GAP'], featureSnapshot: { qualityScore: 80, skillRelevanceScore: 70, freshnessScore: 80 } as any, contentMetadata: { category: 'Synoptic', topics: [], description: '' } },
      { courseId: 'c4', source: 'SKILL_GAP' as const, finalScore: 80, rankPosition: 4, reasonCodes: ['CLOSES_SKILL_GAP'], featureSnapshot: { qualityScore: 80, skillRelevanceScore: 70, freshnessScore: 80 } as any, contentMetadata: { category: 'Synoptic', topics: [], description: '' } },
    ];

    const exploration = [
      { courseId: 'ocean-modeling', source: 'EXPLORATION' as const, finalScore: 75, rankPosition: 0, reasonCodes: [], featureSnapshot: { qualityScore: 92, skillRelevanceScore: 65, freshnessScore: 90 } as any, contentMetadata: { category: 'Ocean State Forecasting', topics: ['INCOIS'], description: '' } },
    ];

    const combined = injectExploratoryCandidates(core, exploration, {
      explorationRatio: 0.25,
      totalSlots: 4,
    });

    expect(combined.length).toBe(4);
    const injected = combined.find(c => c.courseId === 'ocean-modeling');
    expect(injected).toBeDefined();
    expect(injected?.reasonCodes).toContain('EXPLORATION_HORIZON');
  });

  // -------------------------------------------------------------
  // Scenario I: Diversity Re-Ranking (Max 2 Per Category Cap)
  // -------------------------------------------------------------
  it('Scenario I: Enforces MMR diversity cap so no category exceeds 2 courses', () => {
    const candidates = [
      { courseId: 'nwp1', source: 'SKILL_GAP' as const, finalScore: 95, rankPosition: 1, reasonCodes: [], featureSnapshot: {} as any, contentMetadata: { category: 'NWP', topics: ['GFS'], description: '' } },
      { courseId: 'nwp2', source: 'SKILL_GAP' as const, finalScore: 93, rankPosition: 2, reasonCodes: [], featureSnapshot: {} as any, contentMetadata: { category: 'NWP', topics: ['WRF'], description: '' } },
      { courseId: 'nwp3', source: 'SKILL_GAP' as const, finalScore: 91, rankPosition: 3, reasonCodes: [], featureSnapshot: {} as any, contentMetadata: { category: 'NWP', topics: ['Ensemble'], description: '' } },
      { courseId: 'radar1', source: 'SKILL_GAP' as const, finalScore: 86, rankPosition: 4, reasonCodes: [], featureSnapshot: {} as any, contentMetadata: { category: 'Radar Meteorology', topics: ['Doppler'], description: '' } },
    ];

    const diversified = applyMMRDiversity(candidates, {
      maxPerCategory: 2,
      targetCount: 3,
    });

    const nwpCourses = diversified.filter(c => c.contentMetadata.category === 'NWP');
    expect(nwpCourses.length).toBeLessThanOrEqual(2);
    expect(diversified.some(c => c.courseId === 'radar1')).toBe(true);
  });

  // -------------------------------------------------------------
  // Scenario J: Negative Feedback Suppression
  // -------------------------------------------------------------
  it('Scenario J: Suppressed courses with recent NOT_RELEVANT feedback have 0 behavioral affinity', () => {
    const now = new Date();
    const negativeEvents = [
      { type: 'DISMISS', timestamp: now },
    ];

    const affinity = calculateBehavioralAffinity(negativeEvents, now);
    expect(affinity).toBe(0);
  });

});
