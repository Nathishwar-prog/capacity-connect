/**
 * Skill-Gap Candidate Generator
 * 
 * Generates recommendation candidates directly aligned with the learner's identified
 * competency deficiencies and prerequisite gaps.
 */

import prisma from '../../../database/client';
import { RecommendationCandidate, CandidateSource } from '../recommendation.types';
import { calculateSkillRelevanceScore } from '../algorithms/skill-relevance.algorithm';

export interface SkillGapGeneratorOptions {
  userId: string;
  limit?: number;
}

export class SkillGapCandidateGenerator {
  public readonly source: CandidateSource = 'SKILL_GAP';

  public async generate(options: SkillGapGeneratorOptions): Promise<RecommendationCandidate[]> {
    const { userId, limit = 20 } = options;

    // 1. Fetch active open skill gaps for this user
    const openGaps = await prisma.skillGap.findMany({
      where: {
        userId,
        status: { in: ['OPEN', 'IN_PROGRESS'] },
      },
      include: {
        competency: true,
      },
      orderBy: { priorityScore: 'desc' },
      take: 10,
    });

    let gapCompetencyIds: string[] = [];
    const gapMap = new Map<string, { severity: number; requiredLevel: number; currentLevel: number; criticality: string }>();

    if (openGaps.length > 0) {
      for (const gap of openGaps) {
        gapCompetencyIds.push(gap.competencyId);
        gapMap.set(gap.competencyId, {
          severity: gap.gapSeverity ?? (gap.gapLevel * 25),
          requiredLevel: gap.requiredLevel,
          currentLevel: gap.currentLevel,
          criticality: gap.priority === 'CRITICAL' || gap.priority === 'HIGH' ? 'CORE' : 'NORMAL',
        });
      }
    } else {
      // Fallback: Check UserCompetency with currentLevel < 3 (standard proficiency)
      const userCompetencies = await prisma.userCompetency.findMany({
        where: { userId },
        include: { competency: true },
      });

      for (const uc of userCompetencies) {
        if (uc.currentLevel < 3) {
          gapCompetencyIds.push(uc.competencyId);
          gapMap.set(uc.competencyId, {
            severity: (3 - uc.currentLevel) * 25,
            requiredLevel: 3,
            currentLevel: uc.currentLevel,
            criticality: 'NORMAL',
          });
        }
      }
    }

    if (gapCompetencyIds.length === 0) {
      // If user has no recorded competencies or gaps at all, find baseline beginner courses
      const foundationalCourses = await prisma.course.findMany({
        where: {
          status: 'PUBLISHED',
          difficulty: 'BEGINNER',
        },
        take: limit,
        include: {
          courseCompetencies: {
            include: { competency: true },
          },
        },
      });

      return foundationalCourses.map(course => ({
        courseId: course.id,
        source: this.source,
        sourcePriority: 60,
        reasonCodes: ['CLOSES_SKILL_GAP'],
        metadata: {
          title: course.title,
          category: course.category,
          level: course.difficulty,
        },
      }));
    }

    // 2. Find published courses that teach these weak/missing competencies
    const courseCompetencies = await prisma.courseCompetency.findMany({
      where: {
        competencyId: { in: gapCompetencyIds },
        course: { status: 'PUBLISHED' },
      },
      include: {
        course: true,
        competency: true,
      },
    });

    // Group by courseId
    const courseMap = new Map<string, {
      course: any;
      gapsCovered: Array<{
        competencyId: string;
        code: string;
        name: string;
        targetLevel: number;
        learnerCurrentLevel: number;
        severity: number;
        criticality: 'CORE' | 'IMPORTANT' | 'NORMAL' | 'OPTIONAL';
      }>;
    }>();

    for (const cc of courseCompetencies) {
      const gapInfo = gapMap.get(cc.competencyId);
      if (!gapInfo) continue;

      if (!courseMap.has(cc.courseId)) {
        courseMap.set(cc.courseId, {
          course: cc.course,
          gapsCovered: [],
        });
      }

      courseMap.get(cc.courseId)!.gapsCovered.push({
        competencyId: cc.competencyId,
        code: cc.competency.code,
        name: cc.competency.name,
        targetLevel: cc.targetLevel,
        learnerCurrentLevel: gapInfo.currentLevel,
        severity: gapInfo.severity,
        criticality: (cc.criticality || gapInfo.criticality || 'NORMAL') as any,
      });
    }

    const candidates: RecommendationCandidate[] = [];

    for (const [courseId, data] of courseMap.entries()) {
      const reasons: string[] = [];
      const hasCoreGap = data.gapsCovered.some(g => g.criticality === 'CORE');
      if (hasCoreGap) {
        reasons.push('CLOSES_CRITICAL_GAP');
      }
      reasons.push('CLOSES_SKILL_GAP');

      const relevanceScore = calculateSkillRelevanceScore(data.gapsCovered);

      candidates.push({
        courseId,
        source: this.source,
        sourcePriority: relevanceScore,
        reasonCodes: reasons,
        metadata: {
          title: data.course.title,
          category: data.course.category,
          level: data.course.difficulty,
          gapsCount: data.gapsCovered.length,
        },
      });
    }

    // Sort by sourcePriority desc and limit
    candidates.sort((a, b) => b.sourcePriority - a.sourcePriority);
    return candidates.slice(0, limit);
  }
}
