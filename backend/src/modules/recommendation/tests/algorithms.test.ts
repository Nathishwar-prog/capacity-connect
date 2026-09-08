/**
 * Pure Algorithms Unit Tests
 * 
 * Verifies all 9 mathematical recommendation algorithms in isolation without database dependencies.
 */

import {
  SkillRelevanceAlgorithm,
  calculateSkillRelevanceScore,
  calculateContentSimilarity,
  calculateBehavioralAffinity,
  calculateCollaborativeScore,
  calculateCourseQualityScore,
  calculateFreshnessScore,
  calculateContextualScore,
  applyMMRDiversity,
  injectExploratoryCandidates,
} from '../algorithms';
import { WeightedLinearRanker } from '../ranking/weighted-ranker';
import { DEFAULT_FEATURE_WEIGHTS } from '../recommendation.constants';

describe('Intelligent Recommendation Engine — Pure Algorithms', () => {

  describe('1. Skill Relevance Algorithm', () => {
    it('returns 0 when no competency gaps are covered', () => {
      const score = calculateSkillRelevanceScore([]);
      expect(score).toBe(0);
    });

    it('gives higher score for CORE gaps with high severity', () => {
      const learnerGaps = [
        { competencyId: 'c1', gapSeverity: 80, requiredLevel: 4, criticality: 'CORE' as const },
        { competencyId: 'c2', gapSeverity: 40, requiredLevel: 2, criticality: 'OPTIONAL' as const },
      ];

      const courseCore = [{ competencyId: 'c1', targetLevel: 4, importance: 1.0 }];
      const courseOptional = [{ competencyId: 'c2', targetLevel: 2, importance: 1.0 }];

      const coreScore = SkillRelevanceAlgorithm.calculate(learnerGaps, courseCore).relevanceScore;
      const optionalScore = SkillRelevanceAlgorithm.calculate(learnerGaps, courseOptional).relevanceScore;

      expect(coreScore).toBeGreaterThan(optionalScore);
      expect(coreScore).toBeGreaterThan(60);
    });

    it('caps maximum skill relevance score at 100', () => {
      const highGaps = [
        { competencyId: 'c1', code: 'C1', name: 'N1', targetLevel: 5, learnerCurrentLevel: 0, severity: 100, criticality: 'CORE' as const },
        { competencyId: 'c2', code: 'C2', name: 'N2', targetLevel: 5, learnerCurrentLevel: 0, severity: 100, criticality: 'CORE' as const },
        { competencyId: 'c3', code: 'C3', name: 'N3', targetLevel: 5, learnerCurrentLevel: 0, severity: 100, criticality: 'CORE' as const },
      ];
      const score = calculateSkillRelevanceScore(highGaps);
      expect(score).toBeLessThanOrEqual(100);
      expect(score).toBe(100);
    });
  });

  describe('2. Content Similarity Algorithm', () => {
    it('computes high similarity for matching category and overlapping topics', () => {
      const courseA = {
        category: 'Radar Meteorology',
        topics: ['Doppler Radar', 'Velocity Azimuth Display', 'Severe Storms'],
        description: 'Operational Doppler weather radar analysis and severe storm tracking',
      };
      const courseB = {
        category: 'Radar Meteorology',
        topics: ['Doppler Radar', 'Dual Polarization', 'Severe Storms'],
        description: 'Advanced dual-polarization Doppler radar interpretation in storm environments',
      };

      const sim = calculateContentSimilarity(courseA, courseB);
      expect(sim).toBeGreaterThan(70);
    });

    it('computes lower similarity for completely unrelated domains', () => {
      const courseA = {
        category: 'Radar Meteorology',
        topics: ['Doppler Radar'],
        description: 'Radar signal analysis',
      };
      const courseB = {
        category: 'Ocean State Forecasting',
        topics: ['Swell Wave Modeling'],
        description: 'INCOIS wave model outputs',
      };

      const sim = calculateContentSimilarity(courseA, courseB);
      expect(sim).toBeLessThan(30);
    });
  });

  describe('3. Behavioral Affinity Algorithm', () => {
    it('decays older events and scores recent COMPLETE/ENROLL higher than DISMISS', () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

      const recentEvents = [
        { type: 'ENROLL', timestamp: yesterday },
        { type: 'START', timestamp: yesterday },
      ];

      const staleEvents = [
        { type: 'VIEW', timestamp: sixtyDaysAgo },
      ];

      const scoreRecent = calculateBehavioralAffinity(recentEvents, now);
      const scoreStale = calculateBehavioralAffinity(staleEvents, now);

      expect(scoreRecent).toBeGreaterThan(scoreStale);
    });

    it('penalizes abandoned or dismissed items', () => {
      const now = new Date();
      const eventsWithDismiss = [
        { type: 'DISMISS', timestamp: now },
      ];
      const score = calculateBehavioralAffinity(eventsWithDismiss, now);
      expect(score).toBe(0);
    });
  });

  describe('4. Collaborative Filtering Algorithm', () => {
    it('returns 0 when user has completed no courses (cold start safe)', () => {
      const score = calculateCollaborativeScore([], [{ peerUserId: 'p1', completedCourseIds: ['c1', 'c2'] }], 'c1');
      expect(score).toBe(0);
    });

    it('computes high score when peers with high overlap have completed the candidate course', () => {
      const userCourses = ['c1', 'c2', 'c3'];
      const peerHistories = [
        { peerUserId: 'p1', completedCourseIds: ['c1', 'c2', 'c3', 'c4'] }, // Jaccard 3/4 = 0.75
        { peerUserId: 'p2', completedCourseIds: ['c1', 'c2', 'c4'] },       // Jaccard 2/4 = 0.5
      ];

      const score = calculateCollaborativeScore(userCourses, peerHistories, 'c4');
      expect(score).toBeGreaterThan(60);
    });
  });

  describe('5. Course Quality Algorithm', () => {
    it('applies Bayesian dampening to prevent 1-review 5-star course from dominating', () => {
      const singleReviewFiveStar = calculateCourseQualityScore({
        completionRate: 1.0,
        averageRating: 5.0,
        ratingCount: 1, // small sample
      });

      const robustFourPointEight = calculateCourseQualityScore({
        completionRate: 0.9,
        averageRating: 4.8,
        ratingCount: 50, // large sample
      });

      expect(robustFourPointEight).toBeGreaterThan(singleReviewFiveStar);
    });
  });

  describe('6. Freshness Algorithm', () => {
    it('provides high freshness to recently launched courses and respects evergreen floor', () => {
      const brandNew = new Date();
      const oneYearOld = new Date(brandNew.getTime() - 365 * 24 * 60 * 60 * 1000);

      const scoreNew = calculateFreshnessScore(brandNew);
      const scoreOld = calculateFreshnessScore(oneYearOld);

      expect(scoreNew).toBeGreaterThanOrEqual(95);
      expect(scoreOld).toBeGreaterThanOrEqual(50); // Evergreen floor
      expect(scoreNew).toBeGreaterThan(scoreOld);
    });
  });

  describe('7. Contextual Score Algorithm', () => {
    it('gives highest score when course satisfies active continuation prerequisite and matches department', () => {
      const score = calculateContextualScore({
        isContinuationPrerequisite: true,
        isInActiveCourseView: false,
        isDepartmentMatch: true,
        surface: 'COURSE_PAGE',
      });

      expect(score).toBeGreaterThan(80);
    });
  });

  describe('8. Weighted Linear Ranker', () => {
    it('computes normalized weighted score correctly', () => {
      const ranker = new WeightedLinearRanker();
      const candidates = [
        { courseId: 'c1', source: 'SKILL_GAP' as const, sourcePriority: 80, reasonCodes: ['CLOSES_SKILL_GAP'], metadata: {} },
        { courseId: 'c2', source: 'POPULARITY' as const, sourcePriority: 50, reasonCodes: ['HIGH_COMPLETION_RATE'], metadata: {} },
      ];

      const featuresMap = new Map([
        ['c1', {
          skillRelevanceScore: 90,
          contentSimilarityScore: 60,
          behavioralAffinityScore: 50,
          collaborativeScore: 40,
          qualityScore: 80,
          freshnessScore: 70,
          contextualScore: 60,
          difficultyAlignmentScore: 85,
          historicalSuccessRate: 80,
        }],
        ['c2', {
          skillRelevanceScore: 20,
          contentSimilarityScore: 30,
          behavioralAffinityScore: 10,
          collaborativeScore: 10,
          qualityScore: 50,
          freshnessScore: 50,
          contextualScore: 30,
          difficultyAlignmentScore: 40,
          historicalSuccessRate: 40,
        }],
      ]);

      const ranked = ranker.rank({
        candidates,
        featuresMap,
        weights: DEFAULT_FEATURE_WEIGHTS,
      });

      expect(ranked[0].courseId).toBe('c1');
      expect(ranked[0].rankPosition).toBe(1);
      expect(ranked[0].finalScore).toBeGreaterThan(ranked[1].finalScore);
    });
  });

  describe('9. Diversity Re-Ranking (MMR)', () => {
    it('enforces maximum courses per category constraint', () => {
      const candidates = [
        {
          courseId: 'c1',
          source: 'SKILL_GAP' as const,
          finalScore: 95,
          rankPosition: 1,
          reasonCodes: [],
          featureSnapshot: {} as any,
          contentMetadata: { category: 'NWP', topics: ['GFS'], description: '' },
          trainerId: 't1',
        },
        {
          courseId: 'c2',
          source: 'SKILL_GAP' as const,
          finalScore: 94,
          rankPosition: 2,
          reasonCodes: [],
          featureSnapshot: {} as any,
          contentMetadata: { category: 'NWP', topics: ['WRF'], description: '' },
          trainerId: 't1',
        },
        {
          courseId: 'c3',
          source: 'SKILL_GAP' as const,
          finalScore: 93,
          rankPosition: 3,
          reasonCodes: [],
          featureSnapshot: {} as any,
          contentMetadata: { category: 'NWP', topics: ['Ensemble'], description: '' }, // 3rd NWP -> should be deferred
          trainerId: 't1',
        },
        {
          courseId: 'c4',
          source: 'SKILL_GAP' as const,
          finalScore: 85,
          rankPosition: 4,
          reasonCodes: [],
          featureSnapshot: {} as any,
          contentMetadata: { category: 'Satellite', topics: ['INSAT'], description: '' },
          trainerId: 't2',
        },
      ];

      const diversified = applyMMRDiversity(candidates, {
        maxPerCategory: 2,
        targetCount: 3,
      });

      const nwpCount = diversified.filter(c => c.contentMetadata.category === 'NWP').length;
      expect(nwpCount).toBeLessThanOrEqual(2);
      expect(diversified.some(c => c.contentMetadata.category === 'Satellite')).toBe(true);
    });
  });

  describe('10. Controlled Exploration Injection', () => {
    it('injects exploration courses and attaches EXPLORATION_HORIZON reason code', () => {
      const coreCandidates = [
        { courseId: 'c1', source: 'SKILL_GAP' as const, finalScore: 90, rankPosition: 1, reasonCodes: ['CLOSES_SKILL_GAP'], featureSnapshot: { qualityScore: 80, skillRelevanceScore: 70, freshnessScore: 80 } as any, contentMetadata: { category: 'Synoptic', topics: [], description: '' } },
        { courseId: 'c2', source: 'SKILL_GAP' as const, finalScore: 85, rankPosition: 2, reasonCodes: ['CLOSES_SKILL_GAP'], featureSnapshot: { qualityScore: 80, skillRelevanceScore: 70, freshnessScore: 80 } as any, contentMetadata: { category: 'Synoptic', topics: [], description: '' } },
        { courseId: 'c3', source: 'SKILL_GAP' as const, finalScore: 80, rankPosition: 3, reasonCodes: ['CLOSES_SKILL_GAP'], featureSnapshot: { qualityScore: 80, skillRelevanceScore: 70, freshnessScore: 80 } as any, contentMetadata: { category: 'Synoptic', topics: [], description: '' } },
        { courseId: 'c4', source: 'SKILL_GAP' as const, finalScore: 75, rankPosition: 4, reasonCodes: ['CLOSES_SKILL_GAP'], featureSnapshot: { qualityScore: 80, skillRelevanceScore: 70, freshnessScore: 80 } as any, contentMetadata: { category: 'Synoptic', topics: [], description: '' } },
      ];

      const explorationPool = [
        { courseId: 'exp1', source: 'EXPLORATION' as const, finalScore: 70, rankPosition: 0, reasonCodes: [], featureSnapshot: { qualityScore: 90, skillRelevanceScore: 60, freshnessScore: 90 } as any, contentMetadata: { category: 'Ocean Science', topics: ['INCOIS'], description: '' } },
      ];

      const result = injectExploratoryCandidates(coreCandidates, explorationPool, {
        explorationRatio: 0.25,
        totalSlots: 4,
      });

      expect(result.length).toBe(4);
      const expItem = result.find(c => c.courseId === 'exp1');
      expect(expItem).toBeDefined();
      expect(expItem?.reasonCodes).toContain('EXPLORATION_HORIZON');
    });
  });

});
