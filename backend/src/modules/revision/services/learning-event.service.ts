import {
  updateCompetencyScore,
  calculateConfidence,
  calculateRetrievability,
  updateMemoryStability,
  calculateErrorSeverity,
} from '../algorithms';
import { revisionRepository } from '../repositories/revision.repository';
import { LearningEventType, PerformanceComponents } from '../types/revision.types';
import logger from '../../../logger/winston.logger';

export interface IngestLearningEventDTO {
  userId: string;
  topicId: string;
  eventType: LearningEventType;
  score: number;
  maxScore: number;
  isCorrect: boolean;
  timeSpentSeconds: number;
  expectedDurationSeconds?: number;
  hintCount?: number;
  helpRequested?: boolean;
  confidenceSelfReport?: number; // 1 to 5 or 0.0 to 1.0
  errorCategory?: string;
  courseId?: string;
  lessonId?: string;
  assessmentQuestionId?: string;
  metadata?: any;
}

export class LearningEventService {
  /**
   * Ingests a learning event, updates topic competency, confidence, memory stability,
   * error analytics, and refreshes the parent group's aggregated competency.
   */
  async ingestEvent(dto: IngestLearningEventDTO) {
    const {
      userId,
      topicId,
      eventType,
      score,
      maxScore,
      isCorrect,
      timeSpentSeconds,
      expectedDurationSeconds = 60,
      hintCount = 0,
      helpRequested = false,
      confidenceSelfReport = 3,
      errorCategory,
      courseId,
      lessonId,
      assessmentQuestionId,
      metadata,
    } = dto;

    // 1. Normalize components to [0.0, 1.0]
    const accuracy = maxScore > 0 ? Math.max(0, Math.min(1, score / maxScore)) : isCorrect ? 1.0 : 0.0;

    // Speed score: 1.0 if completed within expected duration; decays if took > 2x expected
    const speedRatio = timeSpentSeconds / Math.max(10, expectedDurationSeconds);
    const speedScore = speedRatio <= 1.0 ? 1.0 : Math.max(0.2, 1.0 - (speedRatio - 1.0) * 0.4);

    // Hint score: 0 hints = 1.0, 1 hint = 0.6, 2 hints = 0.2, 3+ hints = 0.0
    const hintScore = hintCount === 0 ? 1.0 : hintCount === 1 ? 0.6 : hintCount === 2 ? 0.2 : 0.0;

    // Confidence: map 1-5 scale to 0.0 - 1.0
    const normalizedConfidence =
      confidenceSelfReport > 1.0
        ? Math.max(0.1, Math.min(1.0, confidenceSelfReport / 5.0))
        : Math.max(0.1, Math.min(1.0, confidenceSelfReport));

    // Independence: 1.0 if no help, 0.4 if help requested
    const independenceScore = helpRequested ? 0.4 : 1.0;

    const components: PerformanceComponents = {
      accuracy,
      speedScore,
      hintScore,
      confidenceSelfScore: normalizedConfidence,
      independenceScore,
    };

    // 2. Fetch existing topic state and history
    const existingTopicState = await revisionRepository.getUserTopicCompetency(userId, topicId);
    const recentEvents = await revisionRepository.getRecentEventsForTopic(userId, topicId, 10);

    const currentScore = existingTopicState?.competencyScore ?? 50.0;
    const sampleCount = (existingTopicState?.attemptCount ?? 0) + 1;
    const currentStability = existingTopicState?.stability ?? 2.0;
    const lastPracticedAt = existingTopicState?.lastReviewedAt ?? null;

    // 3. Competency Score Update
    const competencyResult = updateCompetencyScore({
      currentScore,
      sampleCount,
      components,
    });

    // 4. Confidence Score Calculation
    const recentScores = [
      competencyResult.performanceScore,
      ...recentEvents.map((e: any) => (e.rawScore !== null && e.rawScore !== undefined ? e.rawScore : 50)),
    ].slice(0, 10);

    const daysSinceEval = lastPracticedAt
      ? (new Date().getTime() - new Date(lastPracticedAt).getTime()) / (1000 * 60 * 60 * 24)
      : 0;

    const confidenceResult = calculateConfidence({
      sampleCount,
      recentScores,
      daysSinceLastEvaluation: daysSinceEval,
    });

    // 5. Memory Stability & Retrievability Update
    const memoryCheck = calculateRetrievability({
      currentStabilityDays: currentStability,
      lastPracticedAt,
    });

    const newStability = updateMemoryStability({
      currentStabilityDays: currentStability,
      performance: competencyResult.performance,
      daysElapsed: memoryCheck.daysElapsed,
    });

    // Calculate fresh retrievability with new stability
    const freshRetrievability = calculateRetrievability({
      currentStabilityDays: newStability,
      lastPracticedAt: new Date(),
    });

    // 6. Error Tracking
    const errorType = errorCategory || (isCorrect ? 'NONE' : 'CONCEPTUAL_ERROR');
    const existingErrors = await revisionRepository.getUserTopicErrors(userId);
    const topicError = existingErrors.find((e: any) => e.topicId === topicId);
    const errorSeverityResult = calculateErrorSeverity({
      errorCount: isCorrect ? topicError?.errorCount ?? 0 : (topicError?.errorCount ?? 0) + 1,
      consecutiveSuccesses: isCorrect ? 1 : 0,
      lastErrorTimestamp: topicError?.lastDetectedAt,
    });

    await revisionRepository.recordTopicError({
      userId,
      topicId,
      errorType,
      isCorrect,
      errorSeverity: errorSeverityResult.errorSeverityScore,
    });

    // 7. Persist Event & Updated Topic Competency
    const createdEvent = await revisionRepository.createLearningEvent({
      userId,
      topicId,
      eventType,
      source: 'REVISION_ENGINE',
      courseId,
      lessonId,
      questionId: assessmentQuestionId,
      rawScore: score,
      correct: isCorrect,
      responseTimeMs: timeSpentSeconds * 1000,
      hintsUsed: hintCount,
      confidenceRating: normalizedConfidence,
      normalizedPerformance: competencyResult.performance,
      previousCompetency: competencyResult.previousScore,
      newCompetency: competencyResult.newScore,
      metadata,
    });

    await revisionRepository.upsertUserTopicCompetency({
      userId,
      topicId,
      competencyScore: competencyResult.newScore,
      confidenceScore: confidenceResult.confidenceScore,
      accuracyScore: accuracy * 100,
      speedScore: speedScore * 100,
      hintScore: hintScore * 100,
      confidenceRatingScore: normalizedConfidence * 100,
      independenceScore: independenceScore * 100,
      stability: newStability,
      retention: freshRetrievability.retrievability,
      forgettingRisk: freshRetrievability.forgettingFactor * 100,
      priorityScore: Math.round((100 - competencyResult.newScore) * 10) / 10,
      lastReviewedAt: new Date(),
      lastAssessedAt: new Date(),
    });

    // 8. Trigger parent group aggregation
    await this.refreshGroupCompetency(userId, topicId);

    logger.info(
      `Ingested learning event for user ${userId}, topic ${topicId}: score ${competencyResult.previousScore} -> ${competencyResult.newScore}`
    );

    return {
      eventId: createdEvent.id,
      topicId,
      previousScore: competencyResult.previousScore,
      newScore: competencyResult.newScore,
      scoreDelta: competencyResult.scoreDelta,
      confidenceScore: confidenceResult.confidenceScore,
      stability: newStability,
      retention: freshRetrievability.retrievability,
      forgettingRisk: freshRetrievability.forgettingFactor * 100,
      errorSeverityScore: errorSeverityResult.errorSeverityScore,
      performance: competencyResult.performance,
    };
  }

  /**
   * Refreshes the aggregated competency score for the topic's parent group.
   */
  private async refreshGroupCompetency(userId: string, topicId: string) {
    try {
      const topic = await revisionRepository.getAllTopicsWithPrerequisites();
      const currentTopic = topic.find((t: any) => t.id === topicId);
      if (!currentTopic?.groupId) return;

      const groupId = currentTopic.groupId;
      const groupTopics = topic.filter((t: any) => t.groupId === groupId);
      const userTopicStates = await revisionRepository.getUserTopicCompetencies(userId);
      const groupUserTopics = userTopicStates.filter((uts: any) => uts.topic.groupId === groupId);

      const totalTopics = groupTopics.length;
      if (totalTopics === 0) return;

      const scores = groupUserTopics.map((uts: any) => uts.competencyScore);
      const avgScore =
        scores.length > 0 ? scores.reduce((sum: number, s: number) => sum + s, 0) / groupTopics.length : 50;

      const confidences = groupUserTopics.map((uts: any) => uts.confidenceScore);
      const avgConfidence =
        confidences.length > 0
          ? confidences.reduce((sum: number, c: number) => sum + c, 0) / groupTopics.length
          : 0.3;

      const retentions = groupUserTopics.map((uts: any) => uts.retention);
      const avgRetention =
        retentions.length > 0
          ? retentions.reduce((sum: number, r: number) => sum + r, 0) / groupTopics.length
          : 0.5;

      const unmasteredCount = groupTopics.filter((t: any) => {
        const state = groupUserTopics.find((uts: any) => uts.topicId === t.id);
        return !state || state.competencyScore < 70;
      }).length;

      const weaknessScore = Math.max(0, 100 - avgScore);
      const forgettingRisk = Math.max(0, Math.min(100, (1.0 - avgRetention) * 100));

      await revisionRepository.upsertUserGroupCompetency({
        userId,
        groupId,
        groupCompetency: Math.round(avgScore * 10) / 10,
        groupConfidence: Math.round(avgConfidence * 100) / 100,
        groupWeakness: Math.round(weaknessScore * 10) / 10,
        groupForgettingRisk: Math.round(forgettingRisk * 10) / 10,
        groupImportance: currentTopic.group?.importance ?? 1.0,
        groupDependencyImpact: 20.0,
        groupPriority: Math.round(weaknessScore * 10) / 10,
        weakTopicCount: unmasteredCount,
        criticalTopicCount: groupTopics.filter((t: any) => t.importance >= 4).length,
        lastRevisionAt: new Date(),
        lastAssessmentAt: new Date(),
      });
    } catch (err) {
      logger.error('Failed to refresh group competency:', err);
    }
  }
}

export const learningEventService = new LearningEventService();
