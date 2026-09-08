/**
 * Baseline Ranker
 * Capacity Connect — Learning-to-Rank Recommendation Engine
 * 
 * Deterministic multi-signal ranker for cold-start, model absence, or fallback.
 * Uses normalized feature maps with weighted combination across all educational dimensions.
 */

import { IRanker, RankerInput, RankedItem } from './ranker.interface';
import { CURRENT_FEATURE_VERSION } from '../features/feature.types';

export class BaselineRanker implements IRanker {
  public readonly name = 'BASELINE_MULTI_SIGNAL';
  public readonly version = 'baseline-v1.0.0';
  public readonly isML = false;

  public async rank(input: RankerInput): Promise<RankedItem[]> {
    const { candidates, featuresMap } = input;
    const ranked: RankedItem[] = [];

    for (const cand of candidates) {
      const rawFeat = featuresMap.get(cand.courseId);
      const f: Record<string, number> = (rawFeat && 'featureMap' in rawFeat)
        ? rawFeat.featureMap
        : (rawFeat as any) || {};

      // Deterministic Multi-Signal Score [0 - 100]
      // Educational priorities:
      // 1. Skill Relevance & Gap Coverage (30%)
      const skillScore = (
        (f['skill_weightedSkillGap'] ?? 0.5) * 0.35 +
        (f['skill_criticalGapCount'] ?? 0) * 0.25 +
        (f['skill_gapCoverage'] ?? 0.3) * 0.20 +
        (f['skill_competencyCoverage'] ?? 0.3) * 0.20
      ) * 100;

      // 2. Prerequisite Readiness (20%)
      const prereqScore = (
        (f['prereq_satisfiedPrerequisiteRatio'] ?? 1.0) * 0.60 +
        (f['prereq_prerequisiteReadiness'] ?? 1.0) * 0.40
      ) * 100;

      // 3. Behavioral Affinity (15%)
      const behaviorScore = (
        (f['behavior_activityRecency'] ?? 0.5) * 0.40 +
        (f['behavior_categoryCompletions'] ?? 0) * 0.30 +
        (f['behavior_similarCourseInteractions'] ?? 0) * 0.30
      ) * 100;

      // 4. Quality & Freshness (15%)
      const qualityScore = (
        (f['course_qualityScore'] ?? 0.75) * 0.50 +
        (f['course_completionRate'] ?? 0.5) * 0.30 +
        (f['course_freshness'] ?? 0.8) * 0.20
      ) * 100;

      // 5. Context & Organization (10%)
      const contextScore = (
        (f['context_departmentMatch'] ?? 0) * 0.50 +
        (f['context_organizationMatch'] ?? 1.0) * 0.30 +
        (f['context_categoryMatch'] ?? 0.5) * 0.20
      ) * 100;

      // 6. Semantic Relevance (10%)
      const semanticScore = (
        (f['semantic_courseUserEmbeddingSimilarity'] ?? 0.5) * 0.50 +
        (f['semantic_competencySemanticSimilarity'] ?? 0.5) * 0.50
      ) * 100;

      // Composite final score
      const rawScore =
        skillScore * 0.30 +
        prereqScore * 0.20 +
        behaviorScore * 0.15 +
        qualityScore * 0.15 +
        contextScore * 0.10 +
        semanticScore * 0.10;

      const score = Math.max(0, Math.min(100, Math.round(rawScore * 100) / 100));

      ranked.push({
        courseId: cand.courseId,
        source: cand.source,
        score,
        rankPosition: 0,
        reasonCodes: [...cand.reasonCodes],
        algorithmVersion: this.name,
        modelVersion: this.version,
        featureVersion: (rawFeat && 'featureVersion' in rawFeat) ? rawFeat.featureVersion : CURRENT_FEATURE_VERSION,
        explanationSignals: {
          skillScore,
          prereqScore,
          behaviorScore,
          qualityScore,
          contextScore,
          semanticScore,
        },
      });
    }

    // Sort descending by score
    ranked.sort((a, b) => b.score - a.score);

    // Assign rank positions
    ranked.forEach((item, idx) => {
      item.rankPosition = idx + 1;
    });

    return ranked;
  }
}
