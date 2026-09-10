import { LearningEventType } from '@prisma/client';

export interface PlannedEventSeed {
  learnerCode: string;
  topicCode: string;
  eventType: LearningEventType;
  daysAgo: number;
  isCorrect: boolean;
  score: number;
  maxScore: number;
  timeSpentSeconds: number;
  expectedDurationSeconds: number;
  hintCount: number;
  helpRequested: boolean;
  confidenceSelfReport: number; // 1 to 5
  errorCategory?: string;
}

export function generateLearnerEvents(): PlannedEventSeed[] {
  const events: PlannedEventSeed[] = [];

  // -------------------------------------------------------------
  // LEARNER A — STRONG BEGINNER
  // Good performance in fundamentals over last 7 days, small sample size (3-4 events/topic)
  // -------------------------------------------------------------
  const fundamentalsA = ['ATM_STRUCT', 'ATM_PRESS', 'ATM_TEMP', 'ATM_HUMID'];
  for (const topic of fundamentalsA) {
    // 3 events per topic across past 5 days
    events.push(
      { learnerCode: 'LEARNER_A', topicCode: topic, eventType: LearningEventType.PRACTICE_ATTEMPT, daysAgo: 5, isCorrect: true, score: 5, maxScore: 5, timeSpentSeconds: 40, expectedDurationSeconds: 60, hintCount: 0, helpRequested: false, confidenceSelfReport: 4 },
      { learnerCode: 'LEARNER_A', topicCode: topic, eventType: LearningEventType.QUIZ_ANSWERED, daysAgo: 3, isCorrect: true, score: 5, maxScore: 5, timeSpentSeconds: 45, expectedDurationSeconds: 60, hintCount: 0, helpRequested: false, confidenceSelfReport: 4 },
      { learnerCode: 'LEARNER_A', topicCode: topic, eventType: LearningEventType.ASSESSMENT_ANSWERED, daysAgo: 1, isCorrect: true, score: 5, maxScore: 5, timeSpentSeconds: 35, expectedDurationSeconds: 60, hintCount: 0, helpRequested: false, confidenceSelfReport: 5 }
    );
  }

  // -------------------------------------------------------------
  // LEARNER B — WEAK FUNDAMENTALS
  // Poor performance in fundamentals (30-40% accuracy, hints, slow), attempted advanced topics
  // -------------------------------------------------------------
  const weakTopicsB = ['ATM_STRUCT', 'ATM_PRESS', 'ATM_TEMP', 'ATM_HUMID', 'ATM_STAB'];
  for (const topic of weakTopicsB) {
    // 5 attempts each across past 14 days, mostly incorrect
    events.push(
      { learnerCode: 'LEARNER_B', topicCode: topic, eventType: LearningEventType.PRACTICE_ATTEMPT, daysAgo: 14, isCorrect: false, score: 0, maxScore: 5, timeSpentSeconds: 75, expectedDurationSeconds: 60, hintCount: 2, helpRequested: true, confidenceSelfReport: 2, errorCategory: 'CONCEPTUAL_ERROR' },
      { learnerCode: 'LEARNER_B', topicCode: topic, eventType: LearningEventType.PRACTICE_ATTEMPT, daysAgo: 10, isCorrect: false, score: 0, maxScore: 5, timeSpentSeconds: 80, expectedDurationSeconds: 60, hintCount: 1, helpRequested: true, confidenceSelfReport: 2, errorCategory: 'THERMODYNAMIC_DERIVATION_ERROR' },
      { learnerCode: 'LEARNER_B', topicCode: topic, eventType: LearningEventType.QUIZ_ANSWERED, daysAgo: 7, isCorrect: true, score: 5, maxScore: 5, timeSpentSeconds: 65, expectedDurationSeconds: 60, hintCount: 2, helpRequested: true, confidenceSelfReport: 3 },
      { learnerCode: 'LEARNER_B', topicCode: topic, eventType: LearningEventType.PRACTICE_ATTEMPT, daysAgo: 4, isCorrect: false, score: 0, maxScore: 5, timeSpentSeconds: 70, expectedDurationSeconds: 60, hintCount: 2, helpRequested: false, confidenceSelfReport: 2, errorCategory: 'LAPSE_RATE_CONFUSION' },
      { learnerCode: 'LEARNER_B', topicCode: topic, eventType: LearningEventType.ASSESSMENT_ANSWERED, daysAgo: 1, isCorrect: false, score: 0, maxScore: 5, timeSpentSeconds: 85, expectedDurationSeconds: 60, hintCount: 1, helpRequested: true, confidenceSelfReport: 2, errorCategory: 'STABILITY_CRITERIA_FAILURE' }
    );
  }
  // Attempted downstream advanced topic: SYN_THUNDER
  events.push(
    { learnerCode: 'LEARNER_B', topicCode: 'SYN_THUNDER', eventType: LearningEventType.ASSESSMENT_ANSWERED, daysAgo: 2, isCorrect: false, score: 0, maxScore: 5, timeSpentSeconds: 90, expectedDurationSeconds: 60, hintCount: 2, helpRequested: true, confidenceSelfReport: 1, errorCategory: 'DOWNSTREAM_PREREQUISITE_DEFICIENCY' }
  );

  // -------------------------------------------------------------
  // LEARNER C — STRONG OBSERVER
  // High accuracy in Observation (OBS_SURF, OBS_AWS, OBS_SENS, OBS_CALIB, OBS_QC)
  // -------------------------------------------------------------
  const observerTopics = ['OBS_SURF', 'OBS_AWS', 'OBS_RAIN', 'OBS_SENS', 'OBS_CALIB', 'OBS_QC'];
  for (const topic of observerTopics) {
    events.push(
      { learnerCode: 'LEARNER_C', topicCode: topic, eventType: LearningEventType.PRACTICE_ATTEMPT, daysAgo: 21, isCorrect: true, score: 5, maxScore: 5, timeSpentSeconds: 30, expectedDurationSeconds: 60, hintCount: 0, helpRequested: false, confidenceSelfReport: 5 },
      { learnerCode: 'LEARNER_C', topicCode: topic, eventType: LearningEventType.QUIZ_ANSWERED, daysAgo: 14, isCorrect: true, score: 5, maxScore: 5, timeSpentSeconds: 35, expectedDurationSeconds: 60, hintCount: 0, helpRequested: false, confidenceSelfReport: 5 },
      { learnerCode: 'LEARNER_C', topicCode: topic, eventType: LearningEventType.ASSESSMENT_ANSWERED, daysAgo: 3, isCorrect: true, score: 5, maxScore: 5, timeSpentSeconds: 28, expectedDurationSeconds: 60, hintCount: 0, helpRequested: false, confidenceSelfReport: 5 }
    );
  }

  // -------------------------------------------------------------
  // LEARNER D — STRONG FORECASTER
  // High accuracy in Synoptic & NWP (SYN_MET, SYN_MAPS, SYN_CYCLONE, NWP_FUND)
  // -------------------------------------------------------------
  const forecasterTopics = ['SYN_MET', 'SYN_MAPS', 'SYN_FRONTS', 'SYN_CYCLONE', 'NWP_FUND'];
  for (const topic of forecasterTopics) {
    events.push(
      { learnerCode: 'LEARNER_D', topicCode: topic, eventType: LearningEventType.PRACTICE_ATTEMPT, daysAgo: 25, isCorrect: true, score: 5, maxScore: 5, timeSpentSeconds: 40, expectedDurationSeconds: 60, hintCount: 0, helpRequested: false, confidenceSelfReport: 5 },
      { learnerCode: 'LEARNER_D', topicCode: topic, eventType: LearningEventType.QUIZ_ANSWERED, daysAgo: 12, isCorrect: true, score: 5, maxScore: 5, timeSpentSeconds: 38, expectedDurationSeconds: 60, hintCount: 0, helpRequested: false, confidenceSelfReport: 5 },
      { learnerCode: 'LEARNER_D', topicCode: topic, eventType: LearningEventType.ASSESSMENT_ANSWERED, daysAgo: 2, isCorrect: true, score: 5, maxScore: 5, timeSpentSeconds: 32, expectedDurationSeconds: 60, hintCount: 0, helpRequested: false, confidenceSelfReport: 5 }
    );
  }

  // -------------------------------------------------------------
  // LEARNER E — FORGETTING RISK CASE
  // Mastered topics 50-60 days ago; zero activity since -> high forgetting risk
  // -------------------------------------------------------------
  const forgettingTopics = ['SYN_MAPS', 'SYN_MET', 'SYN_CYCLONE'];
  for (const topic of forgettingTopics) {
    events.push(
      { learnerCode: 'LEARNER_E', topicCode: topic, eventType: LearningEventType.PRACTICE_ATTEMPT, daysAgo: 60, isCorrect: true, score: 5, maxScore: 5, timeSpentSeconds: 45, expectedDurationSeconds: 60, hintCount: 0, helpRequested: false, confidenceSelfReport: 4 },
      { learnerCode: 'LEARNER_E', topicCode: topic, eventType: LearningEventType.QUIZ_ANSWERED, daysAgo: 55, isCorrect: true, score: 5, maxScore: 5, timeSpentSeconds: 40, expectedDurationSeconds: 60, hintCount: 0, helpRequested: false, confidenceSelfReport: 5 },
      { learnerCode: 'LEARNER_E', topicCode: topic, eventType: LearningEventType.ASSESSMENT_ANSWERED, daysAgo: 50, isCorrect: true, score: 5, maxScore: 5, timeSpentSeconds: 35, expectedDurationSeconds: 60, hintCount: 0, helpRequested: false, confidenceSelfReport: 5 }
    );
  }

  // -------------------------------------------------------------
  // LEARNER F — HIGH SCORE / LOW CONFIDENCE
  // Only 2 attempts on RAD_FUND, 100% correct, but evidenceCount = 2
  // -------------------------------------------------------------
  events.push(
    { learnerCode: 'LEARNER_F', topicCode: 'RAD_FUND', eventType: LearningEventType.PRACTICE_ATTEMPT, daysAgo: 2, isCorrect: true, score: 5, maxScore: 5, timeSpentSeconds: 35, expectedDurationSeconds: 60, hintCount: 0, helpRequested: false, confidenceSelfReport: 4 },
    { learnerCode: 'LEARNER_F', topicCode: 'RAD_FUND', eventType: LearningEventType.QUIZ_ANSWERED, daysAgo: 1, isCorrect: true, score: 5, maxScore: 5, timeSpentSeconds: 30, expectedDurationSeconds: 60, hintCount: 0, helpRequested: false, confidenceSelfReport: 4 }
  );

  // -------------------------------------------------------------
  // LEARNER G — HINT DEPENDENCY
  // Correct answers, but uses 2-3 hints and helpRequested on every event
  // -------------------------------------------------------------
  const hintTopics = ['NWP_FUND', 'FCST_SHORTRANGE'];
  for (const topic of hintTopics) {
    for (let i = 0; i < 5; i++) {
      events.push({
        learnerCode: 'LEARNER_G',
        topicCode: topic,
        eventType: LearningEventType.PRACTICE_ATTEMPT,
        daysAgo: 10 - i * 2,
        isCorrect: true,
        score: 5,
        maxScore: 5,
        timeSpentSeconds: 55,
        expectedDurationSeconds: 60,
        hintCount: 2,
        helpRequested: true,
        confidenceSelfReport: 3,
      });
    }
  }

  // -------------------------------------------------------------
  // LEARNER H — SLOW BUT ACCURATE
  // High correctness (100%), but takes 180s (expected 50s)
  // -------------------------------------------------------------
  const slowTopics = ['CLIM_TIMESERIES', 'CLIM_INDICES'];
  for (const topic of slowTopics) {
    for (let i = 0; i < 4; i++) {
      events.push({
        learnerCode: 'LEARNER_H',
        topicCode: topic,
        eventType: LearningEventType.PRACTICE_ATTEMPT,
        daysAgo: 12 - i * 3,
        isCorrect: true,
        score: 5,
        maxScore: 5,
        timeSpentSeconds: 190,
        expectedDurationSeconds: 50,
        hintCount: 0,
        helpRequested: false,
        confidenceSelfReport: 4,
      });
    }
  }

  // -------------------------------------------------------------
  // LEARNER I — RECENTLY FAILED
  // Strong until 7 days ago; yesterday and today had 4 consecutive failures
  // -------------------------------------------------------------
  const failTopics = ['SYN_THUNDER', 'FCST_NOWCAST', 'OPS_WARNING'];
  for (const topic of failTopics) {
    // Prior success
    events.push(
      { learnerCode: 'LEARNER_I', topicCode: topic, eventType: LearningEventType.PRACTICE_ATTEMPT, daysAgo: 14, isCorrect: true, score: 5, maxScore: 5, timeSpentSeconds: 40, expectedDurationSeconds: 60, hintCount: 0, helpRequested: false, confidenceSelfReport: 4 },
      { learnerCode: 'LEARNER_I', topicCode: topic, eventType: LearningEventType.QUIZ_ANSWERED, daysAgo: 8, isCorrect: true, score: 5, maxScore: 5, timeSpentSeconds: 45, expectedDurationSeconds: 60, hintCount: 0, helpRequested: false, confidenceSelfReport: 4 },
      // Recent sudden failures (yesterday and today)
      { learnerCode: 'LEARNER_I', topicCode: topic, eventType: LearningEventType.PRACTICE_ATTEMPT, daysAgo: 1, isCorrect: false, score: 0, maxScore: 5, timeSpentSeconds: 95, expectedDurationSeconds: 60, hintCount: 2, helpRequested: true, confidenceSelfReport: 1, errorCategory: 'URGENT_OPERATIONAL_MISJUDGMENT' },
      { learnerCode: 'LEARNER_I', topicCode: topic, eventType: LearningEventType.ASSESSMENT_ANSWERED, daysAgo: 0, isCorrect: false, score: 0, maxScore: 5, timeSpentSeconds: 110, expectedDurationSeconds: 60, hintCount: 2, helpRequested: true, confidenceSelfReport: 1, errorCategory: 'CRITICAL_LEAD_TIME_FAILURE' }
    );
  }

  // -------------------------------------------------------------
  // LEARNER J — WELL MASTERED
  // Repeated successful assessments across 60 days, fast response, high independence
  // -------------------------------------------------------------
  const masteredTopics = ['ATM_STRUCT', 'ATM_PRESS', 'ATM_STAB', 'SYN_MET', 'RAD_FUND'];
  for (const topic of masteredTopics) {
    for (const d of [60, 45, 30, 15, 5, 1]) {
      events.push({
        learnerCode: 'LEARNER_J',
        topicCode: topic,
        eventType: LearningEventType.PRACTICE_ATTEMPT,
        daysAgo: d,
        isCorrect: true,
        score: 5,
        maxScore: 5,
        timeSpentSeconds: 25,
        expectedDurationSeconds: 60,
        hintCount: 0,
        helpRequested: false,
        confidenceSelfReport: 5,
      });
    }
  }

  // -------------------------------------------------------------
  // LEARNER K — MIXED PROFILE
  // Strong in Climate (CLIM_INDICES 95%), moderate in Synoptic (SYN_MET 65%), weak in Radar (RAD_FUND 35%)
  // -------------------------------------------------------------
  // Strong in CLIM_INDICES
  events.push(
    { learnerCode: 'LEARNER_K', topicCode: 'CLIM_INDICES', eventType: LearningEventType.ASSESSMENT_ANSWERED, daysAgo: 5, isCorrect: true, score: 5, maxScore: 5, timeSpentSeconds: 30, expectedDurationSeconds: 60, hintCount: 0, helpRequested: false, confidenceSelfReport: 5 },
    { learnerCode: 'LEARNER_K', topicCode: 'CLIM_INDICES', eventType: LearningEventType.ASSESSMENT_ANSWERED, daysAgo: 2, isCorrect: true, score: 5, maxScore: 5, timeSpentSeconds: 28, expectedDurationSeconds: 60, hintCount: 0, helpRequested: false, confidenceSelfReport: 5 }
  );
  // Moderate in SYN_MET
  events.push(
    { learnerCode: 'LEARNER_K', topicCode: 'SYN_MET', eventType: LearningEventType.PRACTICE_ATTEMPT, daysAgo: 6, isCorrect: true, score: 5, maxScore: 5, timeSpentSeconds: 50, expectedDurationSeconds: 60, hintCount: 1, helpRequested: false, confidenceSelfReport: 3 },
    { learnerCode: 'LEARNER_K', topicCode: 'SYN_MET', eventType: LearningEventType.QUIZ_ANSWERED, daysAgo: 3, isCorrect: false, score: 0, maxScore: 5, timeSpentSeconds: 65, expectedDurationSeconds: 60, hintCount: 1, helpRequested: false, confidenceSelfReport: 3 },
    { learnerCode: 'LEARNER_K', topicCode: 'SYN_MET', eventType: LearningEventType.ASSESSMENT_ANSWERED, daysAgo: 1, isCorrect: true, score: 5, maxScore: 5, timeSpentSeconds: 45, expectedDurationSeconds: 60, hintCount: 0, helpRequested: false, confidenceSelfReport: 4 }
  );
  // Weak in RAD_FUND
  events.push(
    { learnerCode: 'LEARNER_K', topicCode: 'RAD_FUND', eventType: LearningEventType.PRACTICE_ATTEMPT, daysAgo: 4, isCorrect: false, score: 0, maxScore: 5, timeSpentSeconds: 80, expectedDurationSeconds: 60, hintCount: 2, helpRequested: true, confidenceSelfReport: 2, errorCategory: 'RADAR_EQUATION_MISUNDERSTANDING' },
    { learnerCode: 'LEARNER_K', topicCode: 'RAD_FUND', eventType: LearningEventType.ASSESSMENT_ANSWERED, daysAgo: 1, isCorrect: false, score: 0, maxScore: 5, timeSpentSeconds: 85, expectedDurationSeconds: 60, hintCount: 2, helpRequested: true, confidenceSelfReport: 2, errorCategory: 'DEALIASING_CONFUSION' }
  );

  // LEARNER L — COLD START: 0 events

  return events;
}
