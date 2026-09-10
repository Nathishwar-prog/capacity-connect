/**
 * ML Ranker Unit Tests
 * Validates LightGBM Tree Booster evaluation in TypeScript
 */

import { MLRanker, LightGBMBoosterModel } from '../ranking/ml-ranker';
import { ModelLoader } from '../ranking/model-loader';
import { RecommendationCandidate } from '../recommendation.types';
import { NormalizedFeatureVector, CURRENT_FEATURE_VERSION } from '../features/feature.types';

describe('MLRanker — LightGBM Decision Tree Evaluator', () => {
  // Synthetic booster model with 2 trees
  const syntheticBooster: LightGBMBoosterModel = {
    name: 'tree',
    version: 'v1.0.0',
    num_class: 1,
    num_tree_per_iteration: 1,
    max_feature_idx: 53,
    objective: 'lambdarank',
    tree_info: [
      {
        tree_index: 0,
        num_leaves: 3,
        tree_structure: {
          split_feature: 0, // skill_maxSkillGap
          threshold: 0.5,
          default_left: true,
          left_child: { leaf_value: -0.5 },
          right_child: {
            split_feature: 3, // skill_criticalGapCount
            threshold: 0.0,
            default_left: false,
            left_child: { leaf_value: 0.2 },
            right_child: { leaf_value: 0.8 },
          },
        },
      },
      {
        tree_index: 1,
        num_leaves: 2,
        tree_structure: {
          split_feature: 12, // prereq_satisfiedPrerequisiteRatio
          threshold: 0.5,
          default_left: true,
          left_child: { leaf_value: -0.4 },
          right_child: { leaf_value: 0.5 },
        },
      },
    ],
  };

  const ranker = new MLRanker('test-lgbm-v1', syntheticBooster);

  test('correctly traverses decision trees and computes margins', () => {
    // Case A: feature[0] <= 0.5 (left: -0.5), feature[12] <= 0.5 (left: -0.4) -> margin = -0.9
    const lowFeatures = new Array(54).fill(0.1);
    const marginA = ranker.predictMargin(lowFeatures);
    expect(marginA).toBeCloseTo(-0.9, 4);

    // Case B: feature[0] > 0.5, feature[3] > 0.0 (right: 0.8), feature[12] > 0.5 (right: 0.5) -> margin = 1.3
    const highFeatures = new Array(54).fill(0.8);
    const marginB = ranker.predictMargin(highFeatures);
    expect(marginB).toBeCloseTo(1.3, 4);
  });

  test('predictScore converts margin to bounded [0, 100] via sigmoid', () => {
    const lowFeatures = new Array(54).fill(0.1);
    const highFeatures = new Array(54).fill(0.8);

    const scoreLow = ranker.predictScore(lowFeatures);
    const scoreHigh = ranker.predictScore(highFeatures);

    expect(scoreLow).toBeGreaterThan(0);
    expect(scoreLow).toBeLessThan(50); // negative margin gives < 50
    expect(scoreHigh).toBeGreaterThan(50); // positive margin gives > 50
    expect(scoreHigh).toBeLessThanOrEqual(100);
  });

  test('ranks candidate list descending by predicted ML score', async () => {
    const candidates: RecommendationCandidate[] = [
      { courseId: 'c-low', source: 'POPULARITY', sourcePriority: 50, reasonCodes: [] },
      { courseId: 'c-high', source: 'SKILL_GAP', sourcePriority: 80, reasonCodes: [] },
    ];

    const lowVector: NormalizedFeatureVector = {
      userId: 'u1',
      courseId: 'c-low',
      featureVersion: CURRENT_FEATURE_VERSION,
      features: new Array(54).fill(0.1),
      featureMap: {},
    };

    const highVector: NormalizedFeatureVector = {
      userId: 'u1',
      courseId: 'c-high',
      featureVersion: CURRENT_FEATURE_VERSION,
      features: new Array(54).fill(0.8),
      featureMap: {},
    };

    const featuresMap = new Map<string, NormalizedFeatureVector>([
      ['c-low', lowVector],
      ['c-high', highVector],
    ]);

    const ranked = await ranker.rank({
      userId: 'u1',
      candidates,
      featuresMap,
    });

    expect(ranked).toHaveLength(2);
    expect(ranked[0].courseId).toBe('c-high');
    expect(ranked[0].rankPosition).toBe(1);
    expect(ranked[1].courseId).toBe('c-low');
    expect(ranked[1].rankPosition).toBe(2);
    expect(ranked[0].algorithmVersion).toBe('LIGHTGBM_LAMBDAMART');
    expect(ranked[0].modelVersion).toBe('test-lgbm-v1');
  });

  test('ModelLoader loads trained active model from filesystem', async () => {
    const activeRanker = await ModelLoader.getActiveRanker();
    expect(activeRanker).not.toBeNull();
    expect(activeRanker?.isML).toBe(true);
    expect(activeRanker?.name).toBe('LIGHTGBM_LAMBDAMART');
  });
});
