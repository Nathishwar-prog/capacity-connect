/**
 * Re-ranking Unit Tests
 * Validates Competency Safety, Diversity (MMR), and Exploration Re-rankers
 */

import { CompetencySafetyReranker } from '../reranking/competency-reranker';
import { DiversityReranker, CourseDiversityMetadata } from '../reranking/diversity-reranker';
import { ExplorationReranker } from '../reranking/exploration-reranker';
import { FinalReranker } from '../reranking/final-reranker';
import { RankedItem } from '../ranking/ranker.interface';
import { NormalizedFeatureVector, CURRENT_FEATURE_VERSION } from '../features/feature.types';

describe('Re-ranking Layer', () => {
  const createMockItem = (id: string, score: number, reasonCodes: string[] = []): RankedItem => ({
    courseId: id,
    source: 'SKILL_GAP',
    score,
    rankPosition: 1,
    reasonCodes,
    algorithmVersion: 'LIGHTGBM_LAMBDAMART',
    modelVersion: 'v1.0.0',
    featureVersion: CURRENT_FEATURE_VERSION,
  });

  const createMockVector = (id: string, overrides: Record<string, number>): NormalizedFeatureVector => ({
    userId: 'u1',
    courseId: id,
    featureVersion: CURRENT_FEATURE_VERSION,
    features: new Array(54).fill(0),
    featureMap: overrides,
  });

  describe('CompetencySafetyReranker', () => {
    test('boosts courses addressing critical skill gaps', () => {
      const items = [
        createMockItem('c1-normal', 80),
        createMockItem('c2-critical', 75),
      ];

      const featuresMap = new Map<string, NormalizedFeatureVector>([
        ['c1-normal', createMockVector('c1-normal', { skill_criticalGapCount: 0 })],
        ['c2-critical', createMockVector('c2-critical', { skill_criticalGapCount: 0.3 })], // > 0
      ]);

      const reranked = CompetencySafetyReranker.rerank(items, featuresMap, {
        criticalGapBoost: 15,
      });

      // c2-critical had 75 + 15 = 90, outranking c1-normal (80)
      expect(reranked[0].courseId).toBe('c2-critical');
      expect(reranked[0].score).toBe(90);
      expect(reranked[0].reasonCodes).toContain('CLOSES_CRITICAL_GAP');
    });

    test('penalizes courses with unfulfilled prerequisites', () => {
      const items = [createMockItem('c-prereq-missing', 85)];
      const featuresMap = new Map<string, NormalizedFeatureVector>([
        ['c-prereq-missing', createMockVector('c-prereq-missing', {
          prereq_missingPrerequisiteCount: 0.2, // > 0
          prereq_satisfiedPrerequisiteRatio: 0.2, // < 0.5
        })],
      ]);

      const reranked = CompetencySafetyReranker.rerank(items, featuresMap, {
        missingPrereqPenalty: 25,
      });

      // 85 - 25 = 60
      expect(reranked[0].score).toBe(60);
    });
  });

  describe('DiversityReranker (MMR)', () => {
    test('enforces category cap and diversifies recommendations', () => {
      const items = [
        createMockItem('radar-1', 95),
        createMockItem('radar-2', 90),
        createMockItem('radar-3', 85),
        createMockItem('radar-4', 80), // 4th in Radar
        createMockItem('nwp-1', 78),    // 1st in NWP
      ];

      const metaMap = new Map<string, CourseDiversityMetadata>([
        ['radar-1', { courseId: 'radar-1', category: 'RADAR_METEOROLOGY' }],
        ['radar-2', { courseId: 'radar-2', category: 'RADAR_METEOROLOGY' }],
        ['radar-3', { courseId: 'radar-3', category: 'RADAR_METEOROLOGY' }],
        ['radar-4', { courseId: 'radar-4', category: 'RADAR_METEOROLOGY' }],
        ['nwp-1', { courseId: 'nwp-1', category: 'NWP_MODELING' }],
      ]);

      const diversified = DiversityReranker.rerank(items, metaMap, {
        maxSameCategory: 3,
        targetLimit: 4,
        lambda: 0.7,
      });

      const categories = diversified.map(d => metaMap.get(d.courseId)?.category);
      const radarCount = categories.filter(c => c === 'RADAR_METEOROLOGY').length;
      expect(radarCount).toBeLessThanOrEqual(3);
      expect(categories).toContain('NWP_MODELING');
    });
  });

  describe('ExplorationReranker', () => {
    test('injects exploration candidate with proper discovery tagging', () => {
      const core = [
        createMockItem('core-1', 90),
        createMockItem('core-2', 85),
        createMockItem('core-3', 80),
        createMockItem('core-4', 75),
        createMockItem('core-5', 70),
      ];

      const explore = [
        createMockItem('explore-novel', 65, ['INTEREST_MATCH']),
      ];

      const injected = ExplorationReranker.inject(core, explore, {
        explorationRatio: 0.20,
        targetLimit: 5,
      });

      expect(injected).toHaveLength(5);
      const expItem = injected.find(i => i.courseId === 'explore-novel');
      expect(expItem).toBeDefined();
      expect(expItem?.reasonCodes).toContain('RECOMMENDED_FOR_EXPLORATION');
      expect(expItem?.explanationSignals?.isExploration).toBe(true);
    });
  });

  describe('FinalReranker Master Orchestrator', () => {
    test('seamlessly coordinates safety, diversity, and exploration', () => {
      const core = [
        createMockItem('c1', 95),
        createMockItem('c2', 90),
        createMockItem('c3', 85),
        createMockItem('c4', 80),
      ];
      const explore = [createMockItem('c-exp', 70)];

      const featuresMap = new Map<string, NormalizedFeatureVector>([
        ['c1', createMockVector('c1', {})],
        ['c2', createMockVector('c2', {})],
        ['c3', createMockVector('c3', {})],
        ['c4', createMockVector('c4', {})],
        ['c-exp', createMockVector('c-exp', {})],
      ]);

      const metaMap = new Map<string, CourseDiversityMetadata>([
        ['c1', { courseId: 'c1', category: 'A' }],
        ['c2', { courseId: 'c2', category: 'A' }],
        ['c3', { courseId: 'c3', category: 'B' }],
        ['c4', { courseId: 'c4', category: 'C' }],
        ['c-exp', { courseId: 'c-exp', category: 'D' }],
      ]);

      const finalItems = FinalReranker.rerank(core, explore, featuresMap, metaMap, {
        limit: 4,
        maxSameCategory: 2,
        explorationRatio: 0.25,
      });

      expect(finalItems).toHaveLength(4);
      // Ranks are properly 1-indexed
      expect(finalItems[0].rankPosition).toBe(1);
      expect(finalItems[1].rankPosition).toBe(2);
      expect(finalItems[2].rankPosition).toBe(3);
      expect(finalItems[3].rankPosition).toBe(4);
    });
  });
});
