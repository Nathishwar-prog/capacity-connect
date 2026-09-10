/**
 * Skill Gap Analysis Service
 * Master orchestrator connecting deterministic algorithms, evidence aggregation,
 * root cause DAG analysis, multi-tier readiness, and AI explanation.
 */

import { SkillGapRepository } from '../repositories/skill-gap.repository';
import { EvidenceAggregationService } from './evidence-aggregation.service';
import { RootCauseService } from './root-cause.service';
import { ReadinessService } from './readiness.service';
import { AISkillGapAnalyzer } from '../ai/skill-gap-analyzer';
import {
  GapCalculationAlgorithm,
  GapPriorityAlgorithm,
  GapClusteringAlgorithm,
  TrendAlgorithm,
} from '../algorithms';
import {
  CalculatedGapItem,
  SkillGapAnalysisResult,
} from '../types/skill-gap.types';
import prisma from '../../../database/client';
import logger from '../../../logger/winston.logger';

export interface AnalyzeSkillGapsInput {
  userId: string;
  courseId?: string | null;
  includeAiGuidance?: boolean;
}

export class SkillGapAnalysisService {
  private repository: SkillGapRepository;
  private evidenceService: EvidenceAggregationService;
  private rootCauseService: RootCauseService;
  private readinessService: ReadinessService;
  private aiAnalyzer: AISkillGapAnalyzer;

  constructor() {
    this.repository = new SkillGapRepository();
    this.evidenceService = new EvidenceAggregationService(this.repository);
    this.rootCauseService = new RootCauseService(this.repository);
    this.readinessService = new ReadinessService();
    this.aiAnalyzer = new AISkillGapAnalyzer();
  }

  /**
   * Primary entrypoint: Performs deterministic skill gap analysis and AI guidance generation.
   */
  public async analyzeLearnerGaps(input: AnalyzeSkillGapsInput): Promise<SkillGapAnalysisResult> {
    const { userId, courseId, includeAiGuidance = true } = input;

    logger.info(`Starting skill gap analysis for user=${userId}, course=${courseId || 'GLOBAL'}`);

    // 1. Fetch Algorithm Config
    const config = await this.repository.getActiveAlgorithmConfig();

    // 2. Fetch Requirements
    let requirements = courseId
      ? await this.repository.getCourseCompetencyRequirements(courseId)
      : await this.repository.getAllCompetencies();

    let courseTitle: string | undefined;
    if (courseId) {
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: { title: true },
      });
      courseTitle = course?.title;
    }

    if (requirements.length === 0) {
      // If course has no explicit requirements, fallback to all competencies
      requirements = await this.repository.getAllCompetencies();
    }

    // 3. Aggregate Learner Evidence
    const learnerStates = await this.evidenceService.aggregateLearnerStates(userId, requirements);

    // 4. Fetch Previous Analysis for Trend Detection
    const historicalMap = await this.repository.getPreviousAnalysis(userId, courseId);

    // 5. Initial Gap Calculation
    const initialGaps: Array<{
      req: typeof requirements[0];
      state: ReturnType<typeof learnerStates.get>;
      calc: ReturnType<typeof GapCalculationAlgorithm.calculate>;
      trend: ReturnType<typeof TrendAlgorithm.determineTrend>;
    }> = [];

    const gapSummaryMap = new Map();

    for (const req of requirements) {
      const state = learnerStates.get(req.competencyId);
      const calc = GapCalculationAlgorithm.calculate(req, state);
      const trend = TrendAlgorithm.determineTrend(
        req.competencyId,
        calc.rawGap,
        calc.gapSeverity,
        historicalMap
      );

      initialGaps.push({ req, state, calc, trend });

      gapSummaryMap.set(req.competencyId, {
        competencyId: req.competencyId,
        code: req.code,
        name: req.name,
        rawGap: calc.rawGap,
        gapSeverity: calc.gapSeverity,
        currentLevel: state ? state.currentLevel : 0,
        requiredLevel: req.targetLevel,
        confidenceScore: state?.confidenceScore ?? 0.1,
        forgettingRisk: state?.forgettingRisk ?? 0.0,
        criticality: req.criticality,
      });
    }

    // 6. Root Cause & DAG Analysis
    const { rootCauseMap, dependentCounts, rootCauseSummaries } =
      await this.rootCauseService.analyzeRootCauses(gapSummaryMap);

    // 7. Calculate Priority Scores & Final CalculatedGapItems
    const calculatedItems: CalculatedGapItem[] = [];

    for (const { req, state, calc, trend } of initialGaps) {
      const rootCauseInfo = rootCauseMap.get(req.competencyId);
      const depCount = dependentCounts.get(req.competencyId) || 0;

      const priorityResult = GapPriorityAlgorithm.calculate({
        gapSeverity: calc.gapSeverity,
        importance: req.importance,
        dependentCount: depCount,
        confidenceScore: state?.confidenceScore ?? 0.1,
        forgettingRisk: state?.forgettingRisk ?? 0.0,
        recentErrorSeverity: state?.recentErrorSeverity ?? 0,
        criticality: req.criticality,
        weights: config,
      });

      const rootCauseName = rootCauseInfo?.rootCauseId
        ? gapSummaryMap.get(rootCauseInfo.rootCauseId)?.name || null
        : null;

      calculatedItems.push({
        competencyId: req.competencyId,
        code: req.code,
        name: req.name,
        category: req.category,
        requiredLevel: req.targetLevel,
        currentLevel: state ? state.currentLevel : 0,
        rawGap: calc.rawGap,
        gapSeverity: calc.gapSeverity,
        priorityScore: priorityResult.priorityScore,
        priorityLevel: priorityResult.priorityLevel,
        classification: calc.classification,
        gapType: calc.gapType,
        criticality: req.criticality,
        weight: req.weight,
        importance: req.importance,
        confidenceScore: state?.confidenceScore ?? 0.1,
        forgettingRisk: state?.forgettingRisk ?? 0.0,
        recentErrorSeverity: state?.recentErrorSeverity ?? 0,
        dependencyCount: depCount,
        rootCauseCompetencyId: rootCauseInfo?.rootCauseId ?? null,
        rootCauseCompetencyName: rootCauseName,
        contributingPrereqs: rootCauseInfo?.contributingPrereqs ?? [],
        reasonCodes: rootCauseInfo?.reasonCodes ?? [],
        trend,
      });
    }

    // Sort items by priorityScore descending
    calculatedItems.sort((a, b) => b.priorityScore - a.priorityScore);

    // 8. Cluster Gaps
    const clusters = GapClusteringAlgorithm.cluster(calculatedItems);

    // 9. Multi-Tier Readiness
    const readiness = this.readinessService.calculateReadiness(calculatedItems, config);

    // 10. AI Guidance (Optional / Default True)
    let aiGuidance = null;
    if (includeAiGuidance) {
      aiGuidance = await this.aiAnalyzer.generateGuidance({
        courseTitle,
        readiness,
        items: calculatedItems,
        clusters,
        rootCauses: rootCauseSummaries,
      });
    }

    // 11. Persist Results & Update Active SkillGap Table
    const persistedAnalysis = await this.repository.saveAnalysisResult({
      userId,
      courseId: courseId || null,
      algorithmVersion: config.version,
      readinessScore: readiness.overallReadiness,
      coreReadiness: readiness.coreReadiness,
      criticalReadiness: readiness.criticalReadiness,
      readinessStatus: readiness.readinessStatus,
      summary: {
        totalRequirements: calculatedItems.length,
        totalGaps: calculatedItems.filter((i) => i.rawGap > 0).length,
        criticalGapsCount: calculatedItems.filter((i) => i.priorityLevel === 'CRITICAL').length,
        coreDeficienciesCount: readiness.coreDeficienciesCount,
        blockers: readiness.blockers,
      },
      aiGuidance,
      items: calculatedItems.map((item) => ({
        competencyId: item.competencyId,
        currentLevel: item.currentLevel,
        requiredLevel: item.requiredLevel,
        gapLevel: item.rawGap,
        gapSeverity: item.gapSeverity,
        priorityScore: item.priorityScore,
        classification: item.classification,
        gapType: item.gapType,
        trend: item.trend,
        criticality: item.criticality,
        rootCauseCompetencyId: item.rootCauseCompetencyId,
        contributingPrereqs: item.contributingPrereqs,
        reasonCodes: item.reasonCodes,
        details: {
          confidenceScore: item.confidenceScore,
          forgettingRisk: item.forgettingRisk,
          recentErrorSeverity: item.recentErrorSeverity,
          dependencyCount: item.dependencyCount,
        },
      })),
    });

    const gapCount = calculatedItems.filter((i) => i.rawGap > 0).length;
    const criticalGapsCount = calculatedItems.filter(
      (i) => i.rawGap > 0 && i.priorityLevel === 'CRITICAL'
    ).length;

    return {
      id: persistedAnalysis.id,
      userId,
      courseId: courseId || null,
      algorithmVersion: config.version,
      readiness,
      gapCount,
      criticalGapsCount,
      items: calculatedItems,
      clusters,
      rootCauses: rootCauseSummaries,
      aiGuidance,
      analyzedAt: persistedAnalysis.createdAt,
    };
  }

  /**
   * Retrieves active open skill gaps for a user.
   */
  public async getLearnerSkillGaps(userId: string, courseId?: string | null) {
    const where: any = { userId };
    if (courseId !== undefined) {
      where.courseId = courseId;
    }

    return prisma.skillGap.findMany({
      where,
      include: {
        competency: {
          select: { id: true, name: true, code: true, category: true },
        },
        rootCauseCompetency: {
          select: { id: true, name: true, code: true },
        },
      },
      orderBy: { priorityScore: 'desc' },
    });
  }

  /**
   * Retrieves historical analysis snapshots for a user.
   */
  public async getAnalysisHistory(userId: string, courseId?: string | null) {
    const where: any = { userId };
    if (courseId !== undefined) {
      where.courseId = courseId;
    }

    return prisma.skillGapAnalysis.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        items: {
          include: {
            competency: {
              select: { id: true, name: true, code: true, category: true },
            },
          },
        },
      },
    });
  }

  /**
   * Retrieves a single analysis snapshot by ID.
   */
  public async getAnalysisById(analysisId: string, _requestingUserId?: string) {
    const analysis = await prisma.skillGapAnalysis.findUnique({
      where: { id: analysisId },
      include: {
        course: {
          select: { id: true, title: true, slug: true, category: true },
        },
        items: {
          include: {
            competency: {
              select: { id: true, name: true, code: true, category: true },
            },
          },
        },
      },
    });

    if (!analysis) {
      return null;
    }

    return analysis;
  }
}
