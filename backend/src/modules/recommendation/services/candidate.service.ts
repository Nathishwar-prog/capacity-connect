/**
 * Candidate Service
 * 
 * Orchestrates multi-source candidate generation across all 8 generators:
 * - Skill-Gap
 * - Continuation
 * - Contextual
 * - Content Similarity
 * - Behavioral Affinity
 * - Popularity & Trending
 * - Controlled Exploration
 * - Collaborative Filtering
 * 
 * Deduplicates candidates by courseId, merges reason codes, and preserves source attribution.
 */

import {
  RecommendationCandidate,
  CandidateSource,
  RecommendationSurface,
} from '../recommendation.types';
import {
  SkillGapCandidateGenerator,
  ContinuationCandidateGenerator,
  ContextualCandidateGenerator,
  ContentCandidateGenerator,
  BehavioralCandidateGenerator,
  PopularityCandidateGenerator,
  ExplorationCandidateGenerator,
  CollaborativeCandidateGenerator,
} from '../candidate-generators';
import logger from '../../../logger/winston.logger';

export interface GenerateCandidatesContext {
  userId: string;
  surface?: RecommendationSurface;
  activeCourseId?: string;
  enabledSources?: CandidateSource[];
}

export class CandidateService {
  private skillGapGen: SkillGapCandidateGenerator;
  private continuationGen: ContinuationCandidateGenerator;
  private contextualGen: ContextualCandidateGenerator;
  private contentGen: ContentCandidateGenerator;
  private behavioralGen: BehavioralCandidateGenerator;
  private popularityGen: PopularityCandidateGenerator;
  private explorationGen: ExplorationCandidateGenerator;
  private collaborativeGen: CollaborativeCandidateGenerator;

  constructor() {
    this.skillGapGen = new SkillGapCandidateGenerator();
    this.continuationGen = new ContinuationCandidateGenerator();
    this.contextualGen = new ContextualCandidateGenerator();
    this.contentGen = new ContentCandidateGenerator();
    this.behavioralGen = new BehavioralCandidateGenerator();
    this.popularityGen = new PopularityCandidateGenerator();
    this.explorationGen = new ExplorationCandidateGenerator();
    this.collaborativeGen = new CollaborativeCandidateGenerator();
  }

  public async generateCandidates(
    context: GenerateCandidatesContext
  ): Promise<{
    candidates: RecommendationCandidate[];
    explorationPool: RecommendationCandidate[];
  }> {
    const { userId, surface = 'DASHBOARD', activeCourseId, enabledSources } = context;

    logger.debug(`Generating recommendation candidates for user=${userId}, surface=${surface}`);

    const isEnabled = (source: CandidateSource) =>
      !enabledSources || enabledSources.includes(source);

    const promises: Array<Promise<RecommendationCandidate[]>> = [];

    if (isEnabled('SKILL_GAP')) promises.push(this.skillGapGen.generate({ userId }));
    if (isEnabled('CONTINUATION')) promises.push(this.continuationGen.generate({ userId }));
    if (isEnabled('CONTEXTUAL')) promises.push(this.contextualGen.generate({ userId, surface, activeCourseId }));
    if (isEnabled('CONTENT_SIMILARITY')) promises.push(this.contentGen.generate({ userId }));
    if (isEnabled('BEHAVIORAL')) promises.push(this.behavioralGen.generate({ userId }));
    if (isEnabled('POPULARITY')) promises.push(this.popularityGen.generate({ userId }));
    if (isEnabled('COLLABORATIVE')) promises.push(this.collaborativeGen.generate({ userId }));

    const results = await Promise.allSettled(promises);

    // Also generate exploration candidates separately
    let explorationPool: RecommendationCandidate[] = [];
    if (isEnabled('EXPLORATION')) {
      try {
        explorationPool = await this.explorationGen.generate({ userId });
      } catch (err) {
        logger.warn('Failed to generate exploration candidates', { err });
      }
    }

    // Merge and deduplicate core candidates
    const candidateMap = new Map<string, RecommendationCandidate>();

    for (const res of results) {
      if (res.status === 'fulfilled') {
        for (const cand of res.value) {
          if (!candidateMap.has(cand.courseId)) {
            candidateMap.set(cand.courseId, {
              courseId: cand.courseId,
              source: cand.source,
              sourcePriority: cand.sourcePriority,
              reasonCodes: [...cand.reasonCodes],
              metadata: { ...cand.metadata },
            });
          } else {
            const existing = candidateMap.get(cand.courseId)!;
            // Merge reason codes
            for (const r of cand.reasonCodes) {
              if (!existing.reasonCodes.includes(r)) {
                existing.reasonCodes.push(r);
              }
            }
            // Keep higher priority
            if (cand.sourcePriority > existing.sourcePriority) {
              existing.sourcePriority = cand.sourcePriority;
              existing.source = cand.source; // attribute to strongest generator
            }
          }
        }
      } else {
        logger.error('Candidate generator failed', { reason: res.reason });
      }
    }

    const candidates = Array.from(candidateMap.values());
    logger.debug(`Generated ${candidates.length} unique core candidates and ${explorationPool.length} exploration candidates`);

    return { candidates, explorationPool };
  }
}
