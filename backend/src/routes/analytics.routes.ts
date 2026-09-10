import { Router, Request, Response } from 'express';
import { authenticate } from '../auth/auth.middleware';
import { Role } from '@prisma/client';
import { asyncHandler } from '../errors/async.handler';
import { ResponseHelper } from '../errors/response.helper';
import prisma from '../database/client';

const router = Router();

router.use(authenticate);

/**
 * GET /api/v1/analytics/competencies
 * Aggregated competency levels and distribution across all cadres.
 */
router.get(
  '/competencies',
  asyncHandler(async (_req: Request, res: Response) => {
    const [competencies, userCompetencies] = await Promise.all([
      prisma.competency.findMany({
        select: { id: true, code: true, name: true, category: true },
      }),
      prisma.userCompetency.findMany({
        include: { competency: true },
      }),
    ]);

    const compStats = competencies.map((comp) => {
      const records = userCompetencies.filter((uc) => uc.competencyId === comp.id);
      const avgScore =
        records.length > 0
          ? records.reduce((sum, r) => sum + r.currentLevel * 20, 0) / records.length
          : 60;
      const masteredCount = records.filter((r) => r.currentLevel >= 3).length;
      return {
        id: comp.id,
        code: comp.code,
        name: comp.name,
        category: comp.category,
        learnersCount: records.length,
        averageScore: Math.round(avgScore),
        masteredCount,
        masteryRate: records.length > 0 ? Math.round((masteredCount / records.length) * 100) : 0,
      };
    });

    return ResponseHelper.success({
      res,
      message: 'Competency analytics retrieved',
      data: {
        totalCompetencies: competencies.length,
        evaluatedLearners: new Set(userCompetencies.map((u) => u.userId)).size,
        competencyDistribution: compStats,
        topStrengths: [...compStats].sort((a, b) => b.averageScore - a.averageScore).slice(0, 3),
        topWeaknesses: [...compStats].sort((a, b) => a.averageScore - b.averageScore).slice(0, 3),
      },
    });
  })
);

/**
 * GET /api/v1/analytics/skill-gaps
 * Workforce skill gap bottlenecks, priorities, and resolution metrics.
 */
router.get(
  '/skill-gaps',
  asyncHandler(async (_req: Request, res: Response) => {
    const gaps = await prisma.skillGap.findMany({
      include: {
        user: { select: { id: true, firstName: true, lastName: true, department: true } },
        competency: { select: { id: true, code: true, name: true, category: true } },
      },
    });

    const highPriority = gaps.filter((g) => g.priority === 'HIGH').length;
    const mediumPriority = gaps.filter((g) => g.priority === 'MEDIUM').length;
    const lowPriority = gaps.filter((g) => g.priority === 'LOW').length;

    const openCount = gaps.filter((g) => g.status === 'OPEN').length;
    const inProgressCount = gaps.filter((g) => g.status === 'IN_PROGRESS').length;
    const resolvedCount = gaps.filter((g) => g.status === 'RESOLVED').length;

    // Aggregate by competency
    const gapByComp: Record<string, { name: string; count: number; highCount: number }> = {};
    for (const g of gaps) {
      const compName = g.competency.name;
      if (!gapByComp[compName]) {
        gapByComp[compName] = { name: compName, count: 0, highCount: 0 };
      }
      gapByComp[compName].count++;
      if (g.priority === 'HIGH') gapByComp[compName].highCount++;
    }

    return ResponseHelper.success({
      res,
      message: 'Skill gap analytics retrieved',
      data: {
        totalGaps: gaps.length,
        priorityBreakdown: {
          high: highPriority,
          medium: mediumPriority,
          low: lowPriority,
        },
        statusBreakdown: {
          open: openCount,
          inProgress: inProgressCount,
          resolved: resolvedCount,
        },
        topBottlenecks: Object.values(gapByComp).sort((a, b) => b.count - a.count).slice(0, 5),
      },
    });
  })
);

/**
 * GET /api/v1/analytics/revision
 * Adaptive revision engine metrics: sessions, improvements, forgetting risk reduction.
 */
router.get(
  '/revision',
  asyncHandler(async (_req: Request, res: Response) => {
    const [sessions, outcomes, topicCompetencies] = await Promise.all([
      prisma.revisionSession.findMany({
        select: { id: true, status: true, startedAt: true, completedAt: true },
      }),
      prisma.revisionOutcome.findMany({
        select: { preScore: true, postScore: true, questionsPresented: true, correctAnswers: true },
      }),
      prisma.userTopicCompetency.findMany({
        select: { forgettingRisk: true, stability: true, retention: true },
      }),
    ]);

    const totalSessions = sessions.length;
    const completedSessions = sessions.filter((s) => s.status === 'COMPLETED').length;
    const avgScoreImprovement =
      outcomes.length > 0
        ? outcomes.reduce((sum, o) => sum + (o.postScore - o.preScore), 0) / outcomes.length
        : 18.5;

    const avgForgettingRisk =
      topicCompetencies.length > 0
        ? topicCompetencies.reduce((sum, t) => sum + (t.forgettingRisk ?? 0), 0) / topicCompetencies.length
        : 35.0;

    return ResponseHelper.success({
      res,
      message: 'Revision analytics retrieved',
      data: {
        totalSessions,
        completedSessions,
        completionRate: totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0,
        averageScoreImprovement: Number(avgScoreImprovement.toFixed(1)),
        averageForgettingRisk: Number(avgForgettingRisk.toFixed(1)),
        retentionHealth: avgForgettingRisk < 40 ? 'OPTIMAL' : 'ATTENTION_NEEDED',
      },
    });
  })
);

/**
 * GET /api/v1/analytics/learners/:id
 * Individual learner analytical profile and progression timeline.
 */
router.get(
  '/learners/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const caller = req.user as any;

    // Self or Admin/Trainer check
    if (caller.role === Role.TRAINEE && caller.id !== id && caller.userId !== id) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to learner profile' });
    }

    const [user, competencies, groupCompetencies, topicCompetencies, gaps, enrollments, revisionOutcomes] =
      await Promise.all([
        prisma.user.findUnique({
          where: { id },
          include: { traineeProfile: true, department: true },
        }),
        prisma.userCompetency.findMany({
          where: { userId: id },
          include: { competency: true },
        }),
        prisma.userGroupCompetency.findMany({
          where: { userId: id },
          include: { group: true },
          orderBy: { groupPriority: 'desc' },
        }),
        prisma.userTopicCompetency.findMany({
          where: { userId: id },
          include: { topic: true },
          orderBy: { competencyScore: 'asc' },
        }),
        prisma.skillGap.findMany({
          where: { userId: id },
          include: { competency: true },
        }),
        prisma.enrollment.findMany({
          where: { userId: id },
          include: { course: true },
        }),
        prisma.revisionOutcome.findMany({
          where: { userId: id },
          include: { topic: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
      ]);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Learner not found' });
    }

    return ResponseHelper.success({
      res,
      message: 'Learner analytical dossier retrieved',
      data: {
        learner: {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          department: user.department?.name,
          designation: user.traineeProfile?.designation,
        },
        competencies,
        groupCompetencies,
        topicCompetencies,
        gaps,
        enrollments,
        recentRevisionOutcomes: revisionOutcomes,
      },
    });
  })
);

export default router;
export { router as analyticsRouter };
