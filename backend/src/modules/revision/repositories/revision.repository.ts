import prisma from '../../../database/client';
import {
  LearningEventType,
  RevisionSessionStatus,
  PlannedRevisionItem,
} from '../types/revision.types';

export class RevisionRepository {
  /**
   * Fetches all active competency groups with their topics and prerequisites.
   */
  async getCompetencyGroupsWithTopics(courseId?: string) {
    const where: any = { isActive: true };
    if (courseId) where.courseId = courseId;

    return prisma.competencyGroup.findMany({
      where,
      include: {
        topics: {
          where: { isActive: true },
          include: {
            prerequisites: {
              include: {
                prerequisiteTopic: true,
              },
            },
            prerequisiteFor: {
              include: {
                dependentTopic: true,
              },
            },
          },
        },
      },
      orderBy: { orderIndex: 'asc' },
    });
  }

  /**
   * Fetches all active learning topics with their prerequisites and parent group.
   */
  async getAllTopicsWithPrerequisites(courseId?: string) {
    const where: any = { isActive: true };
    if (courseId) where.courseId = courseId;

    return prisma.learningTopic.findMany({
      where,
      include: {
        group: true,
        prerequisites: {
          include: {
            prerequisiteTopic: true,
          },
        },
        prerequisiteFor: {
          include: {
            dependentTopic: true,
          },
        },
      },
    });
  }

  /**
   * Fetches all user topic competencies for a user.
   */
  async getUserTopicCompetencies(userId: string) {
    return prisma.userTopicCompetency.findMany({
      where: { userId },
      include: {
        topic: {
          include: {
            group: true,
            prerequisites: true,
          },
        },
      },
    });
  }

  /**
   * Fetches a specific user topic competency.
   */
  async getUserTopicCompetency(userId: string, topicId: string) {
    return prisma.userTopicCompetency.findUnique({
      where: {
        userId_topicId: { userId, topicId },
      },
      include: {
        topic: true,
      },
    });
  }

  /**
   * Fetches all user group competencies for a user.
   */
  async getUserGroupCompetencies(userId: string) {
    return prisma.userGroupCompetency.findMany({
      where: { userId },
      include: {
        group: true,
      },
    });
  }

  /**
   * Fetches all topic errors for a user.
   */
  async getUserTopicErrors(userId: string) {
    return prisma.userTopicError.findMany({
      where: { userId },
      include: {
        topic: true,
      },
    });
  }

  /**
   * Upserts a user topic competency record matching schema.prisma fields.
   */
  async upsertUserTopicCompetency(data: {
    userId: string;
    topicId: string;
    competencyScore: number;
    confidenceScore: number;
    accuracyScore?: number;
    speedScore?: number;
    hintScore?: number;
    confidenceRatingScore?: number;
    independenceScore?: number;
    stability: number;
    retention: number;
    forgettingRisk: number;
    priorityScore?: number;
    lastAssessedAt?: Date;
    lastReviewedAt?: Date;
    nextReviewAt?: Date;
  }) {
    return prisma.userTopicCompetency.upsert({
      where: {
        userId_topicId: {
          userId: data.userId,
          topicId: data.topicId,
        },
      },
      create: {
        userId: data.userId,
        topicId: data.topicId,
        competencyScore: data.competencyScore,
        confidenceScore: data.confidenceScore,
        accuracyScore: data.accuracyScore ?? data.competencyScore,
        speedScore: data.speedScore ?? 50.0,
        hintScore: data.hintScore ?? 100.0,
        confidenceRatingScore: data.confidenceRatingScore ?? 50.0,
        independenceScore: data.independenceScore ?? 100.0,
        attemptCount: 1,
        meaningfulAttemptCount: 1,
        stability: data.stability,
        retention: data.retention,
        forgettingRisk: data.forgettingRisk,
        priorityScore: data.priorityScore ?? 50.0,
        lastAssessedAt: data.lastAssessedAt ?? new Date(),
        lastReviewedAt: data.lastReviewedAt ?? new Date(),
        nextReviewAt: data.nextReviewAt,
      },
      update: {
        competencyScore: data.competencyScore,
        confidenceScore: data.confidenceScore,
        accuracyScore: data.accuracyScore,
        speedScore: data.speedScore,
        hintScore: data.hintScore,
        confidenceRatingScore: data.confidenceRatingScore,
        independenceScore: data.independenceScore,
        attemptCount: { increment: 1 },
        meaningfulAttemptCount: { increment: 1 },
        stability: data.stability,
        retention: data.retention,
        forgettingRisk: data.forgettingRisk,
        priorityScore: data.priorityScore,
        lastAssessedAt: data.lastAssessedAt ?? new Date(),
        lastReviewedAt: data.lastReviewedAt ?? new Date(),
        nextReviewAt: data.nextReviewAt,
      },
    });
  }

  /**
   * Upserts a user group competency record.
   */
  async upsertUserGroupCompetency(data: {
    userId: string;
    groupId: string;
    groupCompetency: number;
    groupConfidence: number;
    groupWeakness: number;
    groupForgettingRisk: number;
    groupImportance: number;
    groupDependencyImpact: number;
    groupPriority: number;
    weakTopicCount: number;
    criticalTopicCount: number;
    lastRevisionAt?: Date;
    lastAssessmentAt?: Date;
  }) {
    return prisma.userGroupCompetency.upsert({
      where: {
        userId_groupId: {
          userId: data.userId,
          groupId: data.groupId,
        },
      },
      create: {
        userId: data.userId,
        groupId: data.groupId,
        groupCompetency: data.groupCompetency,
        groupConfidence: data.groupConfidence,
        groupWeakness: data.groupWeakness,
        groupForgettingRisk: data.groupForgettingRisk,
        groupImportance: data.groupImportance,
        groupDependencyImpact: data.groupDependencyImpact,
        groupPriority: data.groupPriority,
        weakTopicCount: data.weakTopicCount,
        criticalTopicCount: data.criticalTopicCount,
        lastRevisionAt: data.lastRevisionAt ?? new Date(),
        lastAssessmentAt: data.lastAssessmentAt ?? new Date(),
      },
      update: {
        groupCompetency: data.groupCompetency,
        groupConfidence: data.groupConfidence,
        groupWeakness: data.groupWeakness,
        groupForgettingRisk: data.groupForgettingRisk,
        groupImportance: data.groupImportance,
        groupDependencyImpact: data.groupDependencyImpact,
        groupPriority: data.groupPriority,
        weakTopicCount: data.weakTopicCount,
        criticalTopicCount: data.criticalTopicCount,
        lastRevisionAt: data.lastRevisionAt ?? new Date(),
        lastAssessmentAt: data.lastAssessmentAt ?? new Date(),
      },
    });
  }

  /**
   * Updates error tracking record for a user & topic.
   */
  async recordTopicError(data: {
    userId: string;
    topicId: string;
    errorType: string;
    isCorrect: boolean;
    errorSeverity: number;
    description?: string;
  }) {
    const existing = await prisma.userTopicError.findFirst({
      where: {
        userId: data.userId,
        topicId: data.topicId,
        errorType: data.errorType,
      },
    });

    if (existing) {
      const errorCount = data.isCorrect ? existing.errorCount : existing.errorCount + 1;

      return prisma.userTopicError.update({
        where: { id: existing.id },
        data: {
          errorCount,
          severity: data.errorSeverity,
          lastDetectedAt: new Date(),
          resolvedAt: data.isCorrect && data.errorSeverity < 10 ? new Date() : undefined,
        },
      });
    }

    if (!data.isCorrect) {
      return prisma.userTopicError.create({
        data: {
          userId: data.userId,
          topicId: data.topicId,
          errorType: data.errorType,
          description: data.description,
          errorCount: 1,
          severity: data.errorSeverity,
          firstDetectedAt: new Date(),
          lastDetectedAt: new Date(),
        },
      });
    }

    return null;
  }

  /**
   * Ingests a new learning event matching schema.prisma LearningEvent.
   */
  async createLearningEvent(data: {
    userId: string;
    topicId: string;
    eventType: LearningEventType;
    source?: string;
    courseId?: string;
    groupId?: string;
    lessonId?: string;
    questionId?: string;
    assessmentAttemptId?: string;
    revisionSessionId?: string;
    correct?: boolean;
    responseTimeMs?: number;
    hintsUsed?: number;
    confidenceRating?: number;
    difficulty?: number;
    rawScore?: number;
    normalizedPerformance?: number;
    previousCompetency?: number;
    newCompetency?: number;
    metadata?: any;
  }) {
    return prisma.learningEvent.create({
      data: {
        userId: data.userId,
        topicId: data.topicId,
        eventType: data.eventType,
        source: data.source ?? 'REVISION_ENGINE',
        courseId: data.courseId,
        groupId: data.groupId,
        lessonId: data.lessonId,
        questionId: data.questionId,
        assessmentAttemptId: data.assessmentAttemptId,
        revisionSessionId: data.revisionSessionId,
        correct: data.correct,
        responseTimeMs: data.responseTimeMs,
        hintsUsed: data.hintsUsed ?? 0,
        confidenceRating: data.confidenceRating,
        difficulty: data.difficulty,
        rawScore: data.rawScore,
        normalizedPerformance: data.normalizedPerformance,
        previousCompetency: data.previousCompetency,
        newCompetency: data.newCompetency,
        metadata: data.metadata,
      },
    });
  }

  /**
   * Fetches recent learning events for a user and topic.
   */
  async getRecentEventsForTopic(userId: string, topicId: string, limit = 10) {
    return prisma.learningEvent.findMany({
      where: { userId, topicId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Creates a revision session with items in database.
   */
  async createRevisionSession(data: {
    userId: string;
    courseId: string;
    focusGroupId?: string;
    availableMinutes: number;
    sessionType?: string;
    status?: RevisionSessionStatus;
    items: PlannedRevisionItem[];
  }) {
    return prisma.revisionSession.create({
      data: {
        userId: data.userId,
        courseId: data.courseId,
        focusGroupId: data.focusGroupId,
        availableMinutes: data.availableMinutes,
        sessionType: data.sessionType ?? 'ADAPTIVE_COMPETENCY',
        status: data.status ?? 'GENERATED',
        items: {
          create: data.items.map((item) => ({
            topicId: item.topicId,
            sequenceNumber: item.sequenceNumber,
            priorityScore: item.priorityScore,
            groupPriorityScore: item.groupPriorityScore,
            weaknessScore: item.weaknessScore,
            forgettingRiskScore: item.forgettingRiskScore,
            importanceScore: item.importanceScore,
            dependencyImpactScore: item.dependencyImpactScore,
            errorSeverityScore: item.errorSeverityScore,
            uncertaintyScore: item.uncertaintyScore,
            recencyScore: item.recencyScore,
            reason: item.reason,
            reasonCodes: item.reasonCodes,
            revisionMode: item.revisionMode,
            allocatedMinutes: item.allocatedMinutes,
            status: 'PENDING',
            educationalContent: item.educationalContent as any,
          })),
        },
      },
      include: {
        items: {
          include: {
            topic: true,
          },
          orderBy: { sequenceNumber: 'asc' },
        },
        focusGroup: true,
      },
    });
  }

  /**
   * Fetches a revision session by ID.
   */
  async getRevisionSession(sessionId: string) {
    return prisma.revisionSession.findUnique({
      where: { id: sessionId },
      include: {
        items: {
          include: {
            topic: true,
          },
          orderBy: { sequenceNumber: 'asc' },
        },
        focusGroup: true,
        outcomes: true,
      },
    });
  }

  /**
   * Fetches user's latest revision session.
   */
  async getLatestSession(userId: string) {
    return prisma.revisionSession.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            topic: true,
          },
          orderBy: { sequenceNumber: 'asc' },
        },
        focusGroup: true,
      },
    });
  }

  /**
   * Updates revision session status.
   */
  async updateSessionStatus(sessionId: string, status: RevisionSessionStatus) {
    return prisma.revisionSession.update({
      where: { id: sessionId },
      data: {
        status,
        completedAt: status === 'COMPLETED' ? new Date() : undefined,
        startedAt: status === 'STARTED' ? new Date() : undefined,
      },
    });
  }

  /**
   * Records a completed revision outcome.
   */
  async recordRevisionOutcome(data: {
    sessionId: string;
    sessionItemId: string;
    userId: string;
    topicId: string;
    preScore: number;
    postScore: number;
    retrievalScore?: number;
    timeSpentSeconds: number;
    correctAnswers?: number;
    questionsAnswered?: number;
    questionsPresented?: number;
    completed?: boolean;
  }) {
    return prisma.revisionOutcome.create({
      data: {
        sessionId: data.sessionId,
        sessionItemId: data.sessionItemId,
        userId: data.userId,
        topicId: data.topicId,
        preScore: data.preScore,
        postScore: data.postScore,
        retrievalScore: data.retrievalScore,
        timeSpentSeconds: data.timeSpentSeconds,
        correctAnswers: data.correctAnswers ?? 1,
        questionsAnswered: data.questionsAnswered ?? 1,
        questionsPresented: data.questionsPresented ?? 1,
        completed: data.completed ?? true,
      },
    });
  }
}

export const revisionRepository = new RevisionRepository();
