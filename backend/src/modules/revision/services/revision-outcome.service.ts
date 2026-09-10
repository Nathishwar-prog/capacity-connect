import { revisionRepository } from '../repositories/revision.repository';
import { learningEventService } from './learning-event.service';
import logger from '../../../logger/winston.logger';

export interface RecordRevisionOutcomeDTO {
  sessionId: string;
  userId: string;
  topicId: string;
  isCorrect: boolean;
  score: number; // 0 to 100
  timeSpentSeconds: number;
  hintCount?: number;
  confidenceSelfReport?: number;
}

export class RevisionOutcomeService {
  /**
   * Records completed revision exercise, ingests learning event, updates topic retrievability,
   * and checks if session is complete.
   */
  async recordOutcome(dto: RecordRevisionOutcomeDTO) {
    const {
      sessionId,
      userId,
      topicId,
      isCorrect,
      score,
      timeSpentSeconds,
      hintCount = 0,
      confidenceSelfReport = 3,
    } = dto;

    const session = await revisionRepository.getRevisionSession(sessionId);
    if (!session) {
      throw new Error(`Revision session ${sessionId} not found.`);
    }

    const sessionItem = session.items.find((it: any) => it.topicId === topicId) || session.items[0];
    const sessionItemId = sessionItem?.id;

    if (!sessionItemId) {
      throw new Error(`Session item for topic ${topicId} not found in session ${sessionId}.`);
    }

    // Fetch existing state before update
    const existingTopicState = await revisionRepository.getUserTopicCompetency(userId, topicId);
    const scoreBefore = existingTopicState?.competencyScore ?? 50.0;

    // Ingest learning event
    const eventResult = await learningEventService.ingestEvent({
      userId,
      topicId,
      eventType: 'RETRIEVAL_ATTEMPT',
      score,
      maxScore: 100,
      isCorrect,
      timeSpentSeconds,
      hintCount,
      confidenceSelfReport,
      courseId: session.courseId,
      metadata: { sessionId, sessionItemId },
    });

    // Record outcome row
    const outcome = await revisionRepository.recordRevisionOutcome({
      sessionId,
      sessionItemId,
      userId,
      topicId,
      preScore: scoreBefore,
      postScore: eventResult.newScore,
      retrievalScore: score,
      timeSpentSeconds,
      correctAnswers: isCorrect ? 1 : 0,
      questionsAnswered: 1,
      questionsPresented: 1,
      completed: true,
    });

    // Check if session has remaining items
    const completedTopicIds = new Set(session.outcomes.map((o: any) => o.topicId));
    completedTopicIds.add(topicId);

    const allDone = session.items.every((it: any) => completedTopicIds.has(it.topicId));
    if (allDone) {
      await revisionRepository.updateSessionStatus(sessionId, 'COMPLETED');
      logger.info(`Session ${sessionId} marked COMPLETED for user ${userId}`);
    } else if (session.status === 'GENERATED') {
      await revisionRepository.updateSessionStatus(sessionId, 'STARTED');
    }

    return {
      outcomeId: outcome.id,
      sessionId,
      topicId,
      scoreBefore,
      scoreAfter: eventResult.newScore,
      stability: eventResult.stability,
      retention: eventResult.retention,
      completed: outcome.completed,
    };
  }
}

export const revisionOutcomeService = new RevisionOutcomeService();
