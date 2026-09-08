/**
 * Master Recommendation Service
 * 
 * Central coordinator for the Capacity Connect Intelligent Recommendation Engine:
 * 1. Multi-source candidate generation
 * 2. Hard eligibility filtering
 * 3. Multi-signal ranking & MMR diversity
 * 4. Controlled exploration injection
 * 5. Deterministic AI explanation generation
 * 6. Batch and recommendation persistence
 */

import prisma from '../../../database/client';
import {
  RecommendationRequest,
  RecommendationBatchResponse,
  RecommendationItemResponse,
  RecommendationSurface,
} from '../recommendation.types';
import { CandidateService } from './candidate.service';
import { EligibilityService } from './eligibility.service';
import { RankingService } from './ranking.service';
import { RecommendationExplainer } from '../ai/recommendation-explainer';
import { RecommendationEventService } from './event.service';
import { RecommendationFeedbackService } from './feedback.service';
import { RecommendationOutcomeService } from './outcome.service';
import { RECSYS_DEFAULTS } from '../recommendation.constants';
import logger from '../../../logger/winston.logger';

export class RecommendationService {
  private candidateService: CandidateService;
  private eligibilityService: EligibilityService;
  private rankingService: RankingService;
  private explainer: RecommendationExplainer;
  private eventService: RecommendationEventService;
  private feedbackService: RecommendationFeedbackService;
  private outcomeService: RecommendationOutcomeService;

  constructor() {
    this.candidateService = new CandidateService();
    this.eligibilityService = new EligibilityService();
    this.rankingService = new RankingService();
    this.explainer = new RecommendationExplainer();
    this.eventService = new RecommendationEventService();
    this.feedbackService = new RecommendationFeedbackService();
    this.outcomeService = new RecommendationOutcomeService();
  }

  /**
   * Generates a new personalized recommendation batch for a learner.
   */
  public async getRecommendations(request: RecommendationRequest): Promise<RecommendationBatchResponse> {
    const {
      userId,
      surface = 'DASHBOARD',
      limit = RECSYS_DEFAULTS.DEFAULT_LIMIT,
      activeCourseId,
      enabledSources,
    } = request;

    logger.info(`Generating recommendations for user=${userId}, surface=${surface}, limit=${limit}`);

    // Step 1: Candidate Generation
    const { candidates, explorationPool } = await this.candidateService.generateCandidates({
      userId,
      surface,
      activeCourseId,
      enabledSources,
    });

    // Step 2: Hard Eligibility Filtering
    const { eligibleCandidates: eligibleCore } = await this.eligibilityService.filterCandidates(
      candidates,
      { userId, allowCompleted: false }
    );

    const { eligibleCandidates: eligibleExploration } = await this.eligibilityService.filterCandidates(
      explorationPool,
      { userId, allowCompleted: false }
    );

    // If core candidates are empty (e.g. brand new user with no history or gaps), fallback to beginner courses
    let finalEligibleCore = eligibleCore;
    if (finalEligibleCore.length === 0) {
      const fallbackCourses = await prisma.course.findMany({
        where: { status: 'PUBLISHED', difficulty: 'BEGINNER' },
        take: limit,
      });

      finalEligibleCore = fallbackCourses.map(course => ({
        courseId: course.id,
        source: 'POPULARITY' as const,
        sourcePriority: 60,
        reasonCodes: ['DOMAIN_MANDATORY'],
        metadata: { title: course.title, category: course.category },
      }));
    }

    // Step 3: Multi-Signal Ranking, MMR Diversity, and Exploration
    const { ranked, algorithmVersion } = await this.rankingService.rankCandidates(
      finalEligibleCore,
      eligibleExploration,
      {
        userId,
        surface,
        activeCourseId,
        limit,
      }
    );

    // Step 4: Fetch detailed course info for selected items
    const selectedCourseIds = ranked.map(r => r.courseId);
    const courses = await prisma.course.findMany({
      where: { id: { in: selectedCourseIds } },
      include: {
        trainer: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    const courseMap = new Map(courses.map(c => [c.id, c]));

    // Fetch user department for AI explanation context
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { department: true },
    });

    const promptItems = ranked.map(r => {
      const c = courseMap.get(r.courseId);
      return {
        courseId: r.courseId,
        title: c?.title || 'Scientific Course',
        category: c?.category || 'Meteorology',
        level: c?.difficulty || 'BEGINNER',
        rankPosition: r.rankPosition,
        reasonCodes: r.reasonCodes,
        candidateSource: r.source,
      };
    });

    // Step 5: Pedagogical Narrative Generation
    const explanation = await this.explainer.explainBatch({
      surface,
      learnerDepartment: user?.department?.name,
      items: promptItems,
    });

    const explanationMap = new Map(explanation.items.map(i => [i.courseId, i]));

    // Step 6: Persist RecommendationBatch and Recommendations in Database
    const batch = await prisma.recommendationBatch.create({
      data: {
        userId,
        surface,
        algorithmVersion,
        context: {
          activeCourseId,
          learnerDepartment: user?.department?.name,
          surface,
          totalItems: ranked.length,
        },
      },
    });

    const itemResponses: RecommendationItemResponse[] = [];

    for (const item of ranked) {
      const course = courseMap.get(item.courseId);
      const exp = explanationMap.get(item.courseId);

      const dbRec = await prisma.recommendation.create({
        data: {
          userId,
          courseId: item.courseId,
          recommendationType: 'COURSE',
          batchId: batch.id,
          rankPosition: item.rankPosition,
          algorithmVersion,
          surface,
          candidateSource: item.source,
          score: item.finalScore,
          reasonCodes: item.reasonCodes,
          featureSnapshot: item.featureSnapshot as any,
          reason: exp?.whyRecommended || `Recommended for ${course?.category}`,
        },
      });

      const instructorName = course?.trainer
        ? `${course.trainer.firstName} ${course.trainer.lastName || ''}`.trim()
        : undefined;

      itemResponses.push({
        id: dbRec.id,
        courseId: item.courseId,
        courseTitle: course?.title || 'Unknown Course',
        courseCategory: course?.category || 'General',
        courseLevel: course?.difficulty || 'BEGINNER',
        instructorName,
        rankPosition: item.rankPosition,
        score: item.finalScore,
        candidateSource: item.source,
        reasonCodes: item.reasonCodes,
        featureSnapshot: item.featureSnapshot,
        explanation: {
          headline: exp?.headline || `Key competency in ${course?.category}`,
          whyRecommended: exp?.whyRecommended || dbRec.reason || 'Course recommended based on competency profile',
          competencyOutcome: exp?.competencyOutcome || `Develops expertise in ${course?.category}`,
          pedagogicalAdvice: exp?.pedagogicalAdvice || 'Proceed through lessons sequentially.',
        },
      });
    }

    return {
      batchId: batch.id,
      algorithmVersion,
      surface,
      createdAt: batch.createdAt,
      summaryRationale: explanation.summaryRationale,
      targetedMilestone: explanation.targetedMilestone,
      learningPathSequence: explanation.learningPathSequence,
      items: itemResponses,
    };
  }

  /**
   * Retrieves the most recent recommendation batch for a user on a given surface.
   */
  public async getLatestBatch(userId: string, surface?: RecommendationSurface): Promise<RecommendationBatchResponse | null> {
    const batch = await prisma.recommendationBatch.findFirst({
      where: {
        userId,
        ...(surface ? { surface } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        recommendations: {
          include: {
            course: {
              include: { trainer: { select: { id: true, firstName: true, lastName: true } } },
            },
          },
          orderBy: { rankPosition: 'asc' },
        },
      },
    });

    if (!batch) return null;

    const items: RecommendationItemResponse[] = batch.recommendations.map(r => {
      let featureSnap: any = {};
      try {
        featureSnap = r.featureSnapshot ? (typeof r.featureSnapshot === 'string' ? JSON.parse(r.featureSnapshot) : r.featureSnapshot) : {};
      } catch {}

      const instructorName = r.course?.trainer
        ? `${r.course.trainer.firstName} ${r.course.trainer.lastName || ''}`.trim()
        : undefined;

      return {
        id: r.id,
        courseId: r.courseId || '',
        courseTitle: r.course?.title || 'Course',
        courseCategory: r.course?.category || 'General',
        courseLevel: r.course?.difficulty || 'BEGINNER',
        instructorName,
        rankPosition: r.rankPosition || 1,
        score: r.score || 70,
        candidateSource: (r.candidateSource as any) || 'SKILL_GAP',
        reasonCodes: r.reasonCodes,
        featureSnapshot: featureSnap,
        explanation: {
          headline: `Recommended for ${r.course?.category}`,
          whyRecommended: r.reason || 'Recommended based on skill profile',
          competencyOutcome: `Strengthens ${r.course?.category} competency`,
          pedagogicalAdvice: 'Study sequential course materials.',
        },
      };
    });

    return {
      batchId: batch.id,
      algorithmVersion: batch.algorithmVersion,
      surface: batch.surface as RecommendationSurface,
      createdAt: batch.createdAt,
      summaryRationale: 'Recent personalized recommendation sequence.',
      targetedMilestone: 'Continuous Competency Development',
      learningPathSequence: items.map(i => i.courseTitle),
      items,
    };
  }

  public getEventService(): RecommendationEventService {
    return this.eventService;
  }

  public getFeedbackService(): RecommendationFeedbackService {
    return this.feedbackService;
  }

  public getOutcomeService(): RecommendationOutcomeService {
    return this.outcomeService;
  }
}
