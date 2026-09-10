import prisma from '../database/client';
import { learningEventService } from '../modules/revision/services/learning-event.service';
import { revisionRepository } from '../modules/revision/repositories/revision.repository';
import { SkillGapAnalysisService } from '../modules/skill-gap/services/skill-gap-analysis.service';
import { LearningEventType } from '@prisma/client';
import logger from '../logger/winston.logger';

export interface RecordRevisionOutcomeInput {
  sessionId: string;
  sessionItemId: string;
  userId: string;
  questionsPresented: number;
  questionsAnswered: number;
  correctAnswers: number;
  timeSpentSeconds: number;
  retrievalScore?: number;
}

export class LearningPipelineService {
  private skillGapService: SkillGapAnalysisService;

  constructor() {
    this.skillGapService = new SkillGapAnalysisService();
  }

  /**
   * Complete pipeline when an Assessment Attempt is submitted:
   * AssessmentAttempt -> AssessmentAnswer -> AssessmentCompetencyResult ->
   * LearningEvent -> TopicCompetency -> MemoryStability -> ErrorAnalysis ->
   * GroupAggregation -> UserCompetency -> SkillGapUpdate -> RecommendationUpdate
   */
  public async processAssessmentSubmission(attemptId: string, userId: string): Promise<void> {
    logger.info(`Starting learning intelligence pipeline for assessment attempt ${attemptId}, user ${userId}`);

    // 1. Fetch Attempt with full relational context
    const attempt = await prisma.assessmentAttempt.findUnique({
      where: { id: attemptId },
      include: {
        assessment: {
          include: {
            course: {
              include: {
                courseCompetencies: {
                  include: { competency: true },
                },
                competencyGroups: {
                  include: { topics: true },
                },
              },
            },
            questions: {
              include: {
                options: true,
                questionTopics: {
                  include: { topic: true },
                },
              },
            },
          },
        },
        answers: true,
      },
    });

    if (!attempt || !attempt.assessment) {
      logger.warn(`Assessment attempt ${attemptId} not found or has no assessment attached.`);
      return;
    }

    const { assessment, answers } = attempt;
    const courseId = assessment.courseId;

    // 2. Process each answered question into an immutable LearningEvent & Topic Competency update
    for (const answer of answers) {
      const question = assessment.questions.find((q) => q.id === answer.questionId);
      if (!question) continue;

      const isCorrect = answer.isCorrect ?? false;
      const score = answer.marksObtained ?? (isCorrect ? question.marks : 0);
      const maxScore = question.marks || 1.0;
      const timeSpent = attempt.timeTakenSeconds
        ? Math.max(10, Math.floor(attempt.timeTakenSeconds / Math.max(1, answers.length)))
        : 60;

      // Identify topic(s) associated with this question
      const mappedTopics = question.questionTopics.map((qt) => qt.topicId);

      // If question is not explicitly mapped to a topic, check course default topics
      const targetTopicIds =
        mappedTopics.length > 0
          ? mappedTopics
          : assessment.course?.competencyGroups.flatMap((g) => g.topics.map((t) => t.id)) || [];

      // If still no topics found, look up any topic in the curriculum matching course
      let resolvedTopicIds = targetTopicIds;
      if (resolvedTopicIds.length === 0 && courseId) {
        const fallbackTopic = await prisma.learningTopic.findFirst({
          where: { courseId },
          select: { id: true },
        });
        if (fallbackTopic) resolvedTopicIds = [fallbackTopic.id];
      }

      for (const topicId of resolvedTopicIds) {
        try {
          await learningEventService.ingestEvent({
            userId,
            topicId,
            eventType: LearningEventType.ASSESSMENT_ANSWERED,
            score,
            maxScore,
            isCorrect,
            timeSpentSeconds: timeSpent,
            expectedDurationSeconds: 60,
            hintCount: 0,
            helpRequested: false,
            confidenceSelfReport: isCorrect ? 4 : 2,
            errorCategory: isCorrect ? undefined : 'ASSESSMENT_INCORRECT_ANSWER',
            courseId: courseId || undefined,
            assessmentQuestionId: question.id,
            metadata: {
              attemptId,
              assessmentId: assessment.id,
              questionText: question.questionText,
            },
          });
        } catch (eventErr) {
          logger.error(`Failed to ingest assessment learning event for topic ${topicId}:`, eventErr);
        }
      }
    }

    // 3. Compute and Record AssessmentCompetencyResults & UserCompetencies
    const courseCompetencies = assessment.course?.courseCompetencies || [];
    const attemptPercentage = attempt.percentage ?? 0;

    for (const cc of courseCompetencies) {
      const competencyId = cc.competencyId;
      // Derive level achieved from percentage score (0-100 mapped to level 0-5)
      let levelAchieved = 1;
      if (attemptPercentage >= 85) levelAchieved = 4;
      else if (attemptPercentage >= 70) levelAchieved = 3;
      else if (attemptPercentage >= 50) levelAchieved = 2;
      else if (attemptPercentage >= 30) levelAchieved = 1;
      else levelAchieved = 0;

      // Upsert AssessmentCompetencyResult
      await prisma.assessmentCompetencyResult.create({
        data: {
          attemptId: attempt.id,
          competencyId,
          score: attemptPercentage,
          levelAchieved,
        },
      });

      // Upsert UserCompetency with evidence count increment
      const existingUserComp = await prisma.userCompetency.findUnique({
        where: {
          userId_competencyId: { userId, competencyId },
        },
      });

      const previousScore = existingUserComp?.competencyScore ?? 50.0;
      const alpha = existingUserComp ? 0.20 : 0.35;
      const updatedScore = Math.round((previousScore + alpha * (attemptPercentage - previousScore)) * 10) / 10;
      const updatedLevel = Math.max(existingUserComp?.currentLevel ?? 0, levelAchieved);

      await prisma.userCompetency.upsert({
        where: {
          userId_competencyId: { userId, competencyId },
        },
        create: {
          userId,
          competencyId,
          currentLevel: updatedLevel,
          competencyScore: updatedScore,
          confidenceScore: 0.65,
          evidenceCount: 1,
          lastAssessedAt: new Date(),
          lastActivityAt: new Date(),
          stability: 4.0,
          retention: 0.9,
          forgettingRisk: 0.1,
          source: 'ASSESSMENT',
        },
        update: {
          currentLevel: updatedLevel,
          competencyScore: updatedScore,
          confidenceScore: 0.75,
          evidenceCount: { increment: 1 },
          lastAssessedAt: new Date(),
          lastActivityAt: new Date(),
          source: 'ASSESSMENT',
        },
      });
    }

    // 4. Trigger Deterministic Skill Gap Recalculation
    try {
      await this.skillGapService.analyzeLearnerGaps({
        userId,
        courseId: courseId || undefined,
        includeAiGuidance: false,
      });
      logger.info(`Recalculated skill gaps for user ${userId} following assessment ${attemptId}`);
    } catch (gapErr) {
      logger.error(`Error during skill gap recalculation post-assessment:`, gapErr);
    }
  }

  /**
   * Complete pipeline when a revision session outcome is recorded:
   * RevisionItem Answer -> LearningEvent -> TopicCompetency -> MemoryStability ->
   * GroupAggregation -> SkillGapUpdate -> NextReviewAt
   */
  public async processRevisionOutcome(input: RecordRevisionOutcomeInput) {
    const {
      sessionId,
      sessionItemId,
      userId,
      questionsPresented,
      questionsAnswered,
      correctAnswers,
      timeSpentSeconds,
      retrievalScore,
    } = input;

    // 1. Fetch Session Item
    const sessionItem = await prisma.revisionSessionItem.findUnique({
      where: { id: sessionItemId },
      include: {
        session: true,
        topic: {
          include: {
            group: true,
            competencyMappings: true,
          },
        },
      },
    });

    if (!sessionItem) {
      throw new Error(`RevisionSessionItem ${sessionItemId} not found.`);
    }

    const topicId = sessionItem.topicId;
    const isCorrect = correctAnswers > 0 && correctAnswers >= Math.ceil(questionsAnswered / 2);
    const score = correctAnswers;
    const maxScore = Math.max(1, questionsAnswered);

    // 2. Ingest learning event through revision engine
    const eventResult = await learningEventService.ingestEvent({
      userId,
      topicId,
      eventType: LearningEventType.RETRIEVAL_ATTEMPT,
      score,
      maxScore,
      isCorrect,
      timeSpentSeconds,
      expectedDurationSeconds: sessionItem.allocatedMinutes * 60,
      hintCount: 0,
      helpRequested: false,
      confidenceSelfReport: isCorrect ? 4 : 2,
      errorCategory: isCorrect ? undefined : 'REVISION_CONCEPT_MISUNDERSTANDING',
      courseId: sessionItem.session.courseId,
      metadata: {
        revisionSessionId: sessionId,
        sessionItemId,
        revisionMode: sessionItem.revisionMode,
        questionsPresented,
        questionsAnswered,
        correctAnswers,
      },
    });

    // 3. Compute nextReviewAt interval (Spacing effect)
    const nextIntervalDays = Math.max(1, Math.round(eventResult.stability));
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + nextIntervalDays);

    await revisionRepository.upsertUserTopicCompetency({
      userId,
      topicId,
      competencyScore: eventResult.newScore,
      confidenceScore: eventResult.confidenceScore,
      stability: eventResult.stability,
      retention: eventResult.retention,
      forgettingRisk: eventResult.forgettingRisk,
      lastReviewedAt: new Date(),
      nextReviewAt: nextReviewDate,
    });

    // 4. Record or Update RevisionOutcome in database
    const outcome = await prisma.revisionOutcome.upsert({
      where: { sessionItemId },
      create: {
        sessionId,
        sessionItemId,
        userId,
        topicId,
        preScore: sessionItem.preCompetency ?? sessionItem.weaknessScore,
        postScore: eventResult.newScore,
        questionsPresented,
        questionsAnswered,
        correctAnswers,
        timeSpentSeconds,
        retrievalScore: retrievalScore ?? (correctAnswers / maxScore) * 100,
        completed: true,
      },
      update: {
        postScore: eventResult.newScore,
        questionsPresented,
        questionsAnswered,
        correctAnswers,
        timeSpentSeconds,
        retrievalScore: retrievalScore ?? (correctAnswers / maxScore) * 100,
        completed: true,
      },
    });

    // 5. Update RevisionSessionItem
    await prisma.revisionSessionItem.update({
      where: { id: sessionItemId },
      data: {
        status: 'COMPLETED',
        postCompetency: eventResult.newScore,
      },
    });

    // 6. Check if all items in session are completed -> complete session
    const allItems = await prisma.revisionSessionItem.findMany({
      where: { sessionId },
    });
    const allDone = allItems.every((it) => it.status === 'COMPLETED');
    if (allDone) {
      await prisma.revisionSession.update({
        where: { id: sessionId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });
    }

    // 7. Update any mapped Competencies & Skill Gaps
    for (const mapping of sessionItem.topic.competencyMappings) {
      const existingUserComp = await prisma.userCompetency.findUnique({
        where: {
          userId_competencyId: { userId, competencyId: mapping.competencyId },
        },
      });
      if (existingUserComp) {
        const compScoreDelta = eventResult.newScore - (existingUserComp.competencyScore ?? 50);
        const updatedCompScore = Math.min(100, Math.max(0, existingUserComp.competencyScore + compScoreDelta * 0.25));
        await prisma.userCompetency.update({
          where: { id: existingUserComp.id },
          data: {
            competencyScore: updatedCompScore,
            stability: eventResult.stability,
            retention: eventResult.retention,
            forgettingRisk: eventResult.forgettingRisk,
            lastActivityAt: new Date(),
          },
        });
      }
    }

    // Recalculate Skill Gaps
    try {
      await this.skillGapService.analyzeLearnerGaps({
        userId,
        courseId: sessionItem.session.courseId,
        includeAiGuidance: false,
      });
    } catch (err) {
      logger.error('Error recalculating skill gaps post-revision:', err);
    }

    return {
      outcomeId: outcome.id,
      topicId,
      previousScore: eventResult.previousScore,
      newScore: eventResult.newScore,
      scoreDelta: eventResult.scoreDelta,
      stabilityDays: eventResult.stability,
      nextReviewAt: nextReviewDate,
      retention: eventResult.retention,
    };
  }
}

export const learningPipelineService = new LearningPipelineService();
export default learningPipelineService;
