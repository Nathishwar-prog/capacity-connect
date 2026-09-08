/**
 * Recommendation Feature Builder
 * 
 * Extracts and normalizes the 9 core ranking signals for each candidate course:
 * 1. skillRelevanceScore [0, 100]
 * 2. contentSimilarityScore [0, 100]
 * 3. behavioralAffinityScore [0, 100]
 * 4. collaborativeScore [0, 100]
 * 5. qualityScore [0, 100]
 * 6. freshnessScore [0, 100]
 * 7. contextualScore [0, 100]
 * 8. difficultyAlignmentScore [0, 100]
 * 9. historicalSuccessRate [0, 100]
 */

import prisma from '../../../database/client';
import { RecommendationCandidate, RecommendationFeatures, RecommendationSurface } from '../recommendation.types';
import {
  calculateSkillRelevanceScore,
  calculateContentSimilarity,
  calculateBehavioralAffinity,
  calculateCollaborativeScore,
  calculateCourseQualityScore,
  calculateFreshnessScore,
  calculateContextualScore,
} from '../algorithms';

export interface BuildFeaturesContext {
  userId: string;
  surface?: RecommendationSurface;
  activeCourseId?: string;
}

export class RecommendationFeatureBuilder {
  /**
   * Builds feature snapshot for each candidate course.
   */
  public async buildFeaturesForCandidates(
    candidates: RecommendationCandidate[],
    context: BuildFeaturesContext
  ): Promise<Map<string, RecommendationFeatures>> {
    const { userId, surface = 'DASHBOARD', activeCourseId } = context;
    const courseIds = candidates.map(c => c.courseId);

    // 1. Fetch User Profile, Competencies, and Enrollments
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userCompetencies: { include: { competency: true } },
        enrollments: { include: { course: true } },
        department: true,
      },
    });

    const userDept = user?.department?.name || undefined;
    const completedCourses = user?.enrollments.filter(e => e.status === 'COMPLETED') || [];
    const completedCourseIds = completedCourses.map(e => e.courseId);

    // Average user competency level
    const userAvgLevel = user?.userCompetencies.length
      ? user.userCompetencies.reduce((acc, uc) => acc + uc.currentLevel, 0) / user.userCompetencies.length
      : 1;

    // 2. Fetch Detailed Course Data for Candidates
    const courses = await prisma.course.findMany({
      where: { id: { in: courseIds } },
      include: {
        courseCompetencies: { include: { competency: true } },
        enrollments: {
          select: {
            status: true,
            user: { select: { department: true } },
          },
        },
        feedbacks: {
          select: { rating: true },
        },
        prerequisites: true,
      },
    });

    const courseMap = new Map(courses.map(c => [c.id, c]));

    // 3. Fetch User's Recent Recommendation Events
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const userEvents = await prisma.recommendationEvent.findMany({
      where: {
        userId,
        createdAt: { gte: thirtyDaysAgo },
      },
      include: { recommendation: { select: { courseId: true } } },
    });

    // Group events by courseId
    const courseEventMap = new Map<string, Array<{ type: any; timestamp: Date }>>();
    for (const ev of userEvents) {
      if (ev.recommendation?.courseId) {
        const cId = ev.recommendation.courseId;
        if (!courseEventMap.has(cId)) courseEventMap.set(cId, []);
        courseEventMap.get(cId)!.push({
          type: ev.eventType,
          timestamp: ev.createdAt,
        });
      }
    }

    // 4. Fetch Peer Learners for Collaborative Filtering
    const peerCompletions = await prisma.enrollment.findMany({
      where: {
        userId: { not: userId },
        status: 'COMPLETED',
        courseId: { in: completedCourseIds },
      },
      select: { userId: true },
      distinct: ['userId'],
      take: 20,
    });

    const peerUserIds = peerCompletions.map(p => p.userId);
    const peerHistories: Array<{ peerUserId: string; completedCourseIds: string[] }> = [];

    if (peerUserIds.length > 0) {
      const allPeerEnr = await prisma.enrollment.findMany({
        where: { userId: { in: peerUserIds }, status: 'COMPLETED' },
        select: { userId: true, courseId: true },
      });
      const peerGroupMap = new Map<string, string[]>();
      for (const pe of allPeerEnr) {
        if (!peerGroupMap.has(pe.userId)) peerGroupMap.set(pe.userId, []);
        peerGroupMap.get(pe.userId)!.push(pe.courseId);
      }
      for (const [pId, cIds] of peerGroupMap.entries()) {
        peerHistories.push({ peerUserId: pId, completedCourseIds: cIds });
      }
    }

    // 5. Build features for each candidate
    const resultMap = new Map<string, RecommendationFeatures>();

    for (const cand of candidates) {
      const course = courseMap.get(cand.courseId);
      if (!course) continue;

      // 5.1 Skill Relevance
      const gapsCovered = course.courseCompetencies.map(cc => {
        const userComp = user?.userCompetencies.find(uc => uc.competencyId === cc.competencyId);
        const currentLevel = userComp ? userComp.currentLevel : 0;
        const targetLevel = cc.targetLevel || 3;
        const severity = Math.max(0, (targetLevel - currentLevel) * 25);
        return {
          competencyId: cc.competencyId,
          code: cc.competency.code,
          name: cc.competency.name,
          targetLevel,
          learnerCurrentLevel: currentLevel,
          severity,
          criticality: (cc.criticality || 'NORMAL') as any,
        };
      });
      const skillRelevanceScore = calculateSkillRelevanceScore(gapsCovered);

      // 5.2 Content Similarity
      let contentSimilarityScore = 0;
      const candMeta = {
        title: course.title,
        category: course.category,
        topics: [course.category],
        description: course.description || '',
      };

      for (const comp of completedCourses) {
        const sim = calculateContentSimilarity(candMeta, {
          title: comp.course.title,
          category: comp.course.category,
          topics: [comp.course.category],
          description: comp.course.description || '',
        });
        if (sim > contentSimilarityScore) {
          contentSimilarityScore = sim;
        }
      }

      // 5.3 Behavioral Affinity
      const eventsForCourse = courseEventMap.get(course.id) || [];
      const behavioralAffinityScore = calculateBehavioralAffinity(eventsForCourse);

      // 5.4 Collaborative Score
      const collaborativeScore = calculateCollaborativeScore(
        completedCourseIds,
        peerHistories,
        course.id
      );

      // 5.5 Quality Score
      const totalEnr = course.enrollments.length;
      const compEnr = course.enrollments.filter(e => e.status === 'COMPLETED').length;
      const compRate = totalEnr > 0 ? compEnr / totalEnr : 0.6;
      const ratings = course.feedbacks.map(r => r.rating);
      const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;

      const qualityScore = calculateCourseQualityScore({
        completionRate: compRate,
        averageRating: avgRating,
        ratingCount: ratings.length,
        assessmentScoreImprovement: 15,
        dropoutRate: totalEnr > 0 ? 1 - compRate : 0.3,
      });

      // 5.6 Freshness Score
      const freshnessScore = calculateFreshnessScore(course.createdAt);

      // 5.7 Contextual Score
      const isPrereqCompleted = course.prerequisites.every(p =>
        completedCourseIds.includes(p.prerequisiteCourseId)
      );
      const contextualScore = calculateContextualScore({
        isContinuationPrerequisite: isPrereqCompleted && course.prerequisites.length > 0,
        isInActiveCourseView: activeCourseId === course.id,
        isDepartmentMatch: !!(userDept && course.category.toLowerCase().includes(userDept.toLowerCase())),
        surface,
      });

      // 5.8 Difficulty Alignment Score
      // BEGINNER (target ~1-2), INTERMEDIATE (target ~3), ADVANCED (target ~4-5)
      let expectedLevel = 2;
      if (course.difficulty === 'INTERMEDIATE') expectedLevel = 3;
      if (course.difficulty === 'ADVANCED') expectedLevel = 4;

      const levelDiff = Math.abs(userAvgLevel - expectedLevel);
      const difficultyAlignmentScore = Math.max(20, Math.round(100 - levelDiff * 25));

      // 5.9 Historical Success Rate
      let deptCompRate = compRate;
      if (userDept) {
        const deptEnr = course.enrollments.filter(e => e.user?.department?.name === userDept);
        if (deptEnr.length >= 2) {
          const deptDone = deptEnr.filter(e => e.status === 'COMPLETED').length;
          deptCompRate = deptDone / deptEnr.length;
        }
      }
      const historicalSuccessRate = Math.round(deptCompRate * 100);

      resultMap.set(cand.courseId, {
        skillRelevanceScore,
        contentSimilarityScore,
        behavioralAffinityScore,
        collaborativeScore,
        qualityScore,
        freshnessScore,
        contextualScore,
        difficultyAlignmentScore,
        historicalSuccessRate,
      });
    }

    return resultMap;
  }
}
