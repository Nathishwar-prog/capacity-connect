/**
 * Skill Gap Repository
 * Queries database evidence, requirements, prerequisite DAGs, and persists analysis snapshots.
 */

import prisma from '../../../database/client';
import {
  CompetencyRequirement,
  LearnerCompetencyState,
  PrerequisiteNode,
  SkillGapAlgorithmWeights,
  DEFAULT_ALGORITHM_WEIGHTS,
} from '../types/skill-gap.types';
import { HistoricalGapSnapshot } from '../algorithms/trend.algorithm';

export class SkillGapRepository {
  /**
   * Retrieves active algorithm configuration, or default if none found.
   */
  public async getActiveAlgorithmConfig(): Promise<SkillGapAlgorithmWeights & { version: string }> {
    const config = await prisma.skillGapAlgorithmConfig.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!config) {
      return {
        ...DEFAULT_ALGORITHM_WEIGHTS,
        version: 'v1.0.0',
      };
    }

    return {
      version: config.version,
      severityWeight: config.severityWeight,
      importanceWeight: config.importanceWeight,
      dependencyWeight: config.dependencyWeight,
      uncertaintyWeight: config.uncertaintyWeight,
      forgettingWeight: config.forgettingWeight,
      errorSeverityWeight: config.errorSeverityWeight,
      coreMultiplier: config.coreMultiplier,
      importantMultiplier: config.importantMultiplier,
      normalMultiplier: config.normalMultiplier,
      optionalMultiplier: config.optionalMultiplier,
      readinessThresholdFull: config.readinessThresholdFull,
      readinessThresholdCond: config.readinessThresholdCond,
    };
  }

  /**
   * Fetches required competencies for a specific course.
   */
  public async getCourseCompetencyRequirements(courseId: string): Promise<CompetencyRequirement[]> {
    const courseCompetencies = await prisma.courseCompetency.findMany({
      where: { courseId },
      include: {
        competency: true,
      },
    });

    return courseCompetencies.map((cc: any) => ({
      competencyId: cc.competencyId,
      code: cc.competency.code,
      name: cc.competency.name,
      category: cc.competency.category,
      targetLevel: cc.targetLevel,
      importance: cc.importance,
      criticality: cc.criticality,
      weight: cc.weight,
    }));
  }

  /**
   * Fetches all competencies across the platform (for global skill gap baseline).
   */
  public async getAllCompetencies(): Promise<CompetencyRequirement[]> {
    const competencies = await prisma.competency.findMany({
      orderBy: { code: 'asc' },
    });

    return competencies.map((c: any) => ({
      competencyId: c.id,
      code: c.code,
      name: c.name,
      category: c.category,
      targetLevel: 3, // Default baseline requirement
      importance: 1.0,
      criticality: 'NORMAL',
      weight: 1.0,
    }));
  }

  /**
   * Fetches learner competency states for a user.
   */
  public async getLearnerCompetencyStates(
    userId: string,
    competencyIds: string[]
  ): Promise<Map<string, LearnerCompetencyState>> {
    const userCompetencies = await prisma.userCompetency.findMany({
      where: {
        userId,
        competencyId: { in: competencyIds },
      },
      include: {
        competency: true,
      },
    });

    // Also check UserTopicError and LearningEvent to aggregate recent error severity
    // Topics mapped to these competencies
    const topicMappings = await prisma.learningTopicCompetency.findMany({
      where: { competencyId: { in: competencyIds } },
      select: { topicId: true, competencyId: true },
    });

    const topicIds = topicMappings.map((tm: any) => tm.topicId);

    const userTopicErrors =
      topicIds.length > 0
        ? await prisma.userTopicError.findMany({
            where: {
              userId,
              topicId: { in: topicIds },
              resolvedAt: null,
            },
          })
        : [];

    const topicErrorMap = new Map<string, number>();
    for (const err of userTopicErrors) {
      const current = topicErrorMap.get(err.topicId) || 0;
      topicErrorMap.set(err.topicId, Math.max(current, err.severity));
    }

    const map = new Map<string, LearnerCompetencyState>();

    for (const uc of userCompetencies) {
      // Find mapped topics to calculate aggregate error severity
      const mappedTopics = topicMappings.filter((tm: any) => tm.competencyId === uc.competencyId);
      let maxError = 0;
      for (const t of mappedTopics) {
        maxError = Math.max(maxError, topicErrorMap.get(t.topicId) || 0);
      }

      map.set(uc.competencyId, {
        competencyId: uc.competencyId,
        code: (uc as any).competency.code,
        name: (uc as any).competency.name,
        category: (uc as any).competency.category,
        currentLevel: uc.currentLevel,
        competencyScore: uc.competencyScore,
        confidenceScore: uc.confidenceScore ?? 0.1,
        evidenceCount: uc.evidenceCount,
        lastAssessedAt: uc.lastAssessedAt,
        lastActivityAt: uc.lastActivityAt,
        stability: uc.stability,
        retention: uc.retention,
        forgettingRisk: uc.forgettingRisk,
        recentErrorSeverity: maxError,
      });
    }

    return map;
  }

  /**
   * Fetches prerequisite edges for the competency DAG.
   */
  public async getPrerequisiteEdges(): Promise<PrerequisiteNode[]> {
    const edges = await prisma.competencyPrerequisite.findMany();
    return edges.map((e: any) => ({
      id: e.id,
      prerequisiteCompetencyId: e.prerequisiteCompetencyId,
      dependentCompetencyId: e.dependentCompetencyId,
      edgeWeight: e.edgeWeight,
      dependencyType: e.dependencyType as 'DIRECT' | 'INDIRECT',
    }));
  }

  /**
   * Fetches the latest previous analysis snapshot for trend comparison.
   */
  public async getPreviousAnalysis(
    userId: string,
    courseId?: string | null
  ): Promise<Map<string, HistoricalGapSnapshot>> {
    const previous = await prisma.skillGapAnalysis.findFirst({
      where: {
        userId,
        courseId: courseId ?? null,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
      },
    });

    const map = new Map<string, HistoricalGapSnapshot>();
    if (!previous) return map;

    for (const item of previous.items) {
      map.set(item.competencyId, {
        competencyId: item.competencyId,
        rawGap: item.gapLevel,
        gapSeverity: item.gapSeverity,
        currentLevel: item.currentLevel,
        calculatedAt: previous.createdAt,
      });
    }

    return map;
  }

  /**
   * Persists the comprehensive analysis record and updates active SkillGap table.
   */
  public async saveAnalysisResult(params: {
    userId: string;
    courseId?: string | null;
    algorithmVersion: string;
    readinessScore: number;
    coreReadiness: number;
    criticalReadiness: number;
    readinessStatus: string;
    summary: any;
    aiGuidance?: any;
    items: Array<{
      competencyId: string;
      currentLevel: number;
      requiredLevel: number;
      gapLevel: number;
      gapSeverity: number;
      priorityScore: number;
      classification: string;
      gapType: string;
      trend: string;
      criticality: any;
      rootCauseCompetencyId?: string | null;
      contributingPrereqs: string[];
      reasonCodes: string[];
      details?: any;
    }>;
  }) {
    const { userId, courseId, algorithmVersion, readinessScore, coreReadiness, criticalReadiness, readinessStatus, summary, aiGuidance, items } = params;

    // Create SkillGapAnalysis snapshot with items in a transaction
    const analysis = await prisma.skillGapAnalysis.create({
      data: {
        userId,
        courseId: courseId || null,
        algorithmVersion,
        readinessScore,
        coreReadiness,
        criticalReadiness,
        readinessStatus,
        summary,
        aiGuidance: aiGuidance || null,
        items: {
          create: items.map((item) => ({
            competencyId: item.competencyId,
            currentLevel: item.currentLevel,
            requiredLevel: item.requiredLevel,
            gapLevel: item.gapLevel,
            gapSeverity: item.gapSeverity,
            priorityScore: item.priorityScore,
            classification: item.classification,
            gapType: item.gapType,
            trend: item.trend,
            criticality: item.criticality,
            rootCauseCompetencyId: item.rootCauseCompetencyId || null,
            contributingPrereqs: item.contributingPrereqs,
            reasonCodes: item.reasonCodes,
            details: item.details || null,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    // Update active SkillGap table for persistent tracking
    for (const item of items) {
      const priorityEnum =
        item.priorityScore >= 75
          ? 'CRITICAL'
          : item.priorityScore >= 50
          ? 'HIGH'
          : item.priorityScore >= 25
          ? 'MEDIUM'
          : 'LOW';

      const statusEnum = item.gapLevel === 0 ? 'RESOLVED' : 'OPEN';

      // Find existing SkillGap for user + competency + course
      const existing = await prisma.skillGap.findFirst({
        where: {
          userId,
          competencyId: item.competencyId,
          courseId: courseId || null,
        },
      });

      if (existing) {
        await prisma.skillGap.update({
          where: { id: existing.id },
          data: {
            currentLevel: item.currentLevel,
            requiredLevel: item.requiredLevel,
            gapLevel: item.gapLevel,
            gapSeverity: item.gapSeverity,
            priorityScore: item.priorityScore,
            classification: item.classification,
            gapType: item.gapType,
            rootCauseCompetencyId: item.rootCauseCompetencyId || null,
            reasonCodes: item.reasonCodes,
            priority: priorityEnum,
            status: statusEnum,
            updatedAt: new Date(),
          },
        });
      } else {
        await prisma.skillGap.create({
          data: {
            userId,
            competencyId: item.competencyId,
            courseId: courseId || null,
            currentLevel: item.currentLevel,
            requiredLevel: item.requiredLevel,
            gapLevel: item.gapLevel,
            gapSeverity: item.gapSeverity,
            priorityScore: item.priorityScore,
            classification: item.classification,
            gapType: item.gapType,
            rootCauseCompetencyId: item.rootCauseCompetencyId || null,
            reasonCodes: item.reasonCodes,
            priority: priorityEnum,
            status: statusEnum,
          },
        });
      }
    }

    return analysis;
  }
}
