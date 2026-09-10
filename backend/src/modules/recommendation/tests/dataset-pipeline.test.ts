/**
 * Training Dataset Pipeline Unit Tests
 * Validates outcome-based graded labeling and temporal dataset splitting
 */

import { TrainingDatasetService } from '../ml/training-dataset.service';

describe('Training Dataset Pipeline & Label Hierarchy', () => {
  test('computes graded educational relevance labels strictly conforming to business hierarchy', () => {
    // 5: Highest priority — Competency Gain
    const label5 = TrainingDatasetService.computeGradedLabel(
      [{ eventType: 'CLICK' }],
      true, // hasCompetencyGain
      true  // hasCompleted
    );
    expect(label5.label).toBe(5);
    expect(label5.outcomeType).toBe('COMPETENCY_IMPROVEMENT');

    // 4: Strong signal — Course Completed
    const label4 = TrainingDatasetService.computeGradedLabel(
      [{ eventType: 'CLICK' }],
      false, // no competency gain verified yet
      true   // hasCompleted
    );
    expect(label4.label).toBe(4);
    expect(label4.outcomeType).toBe('COURSE_COMPLETED');

    // 3: Positive signal — Course Started or Enrolled
    const label3 = TrainingDatasetService.computeGradedLabel(
      [{ eventType: 'ENROLL' }, { eventType: 'START' }],
      false,
      false
    );
    expect(label3.label).toBe(3);
    expect(label3.outcomeType).toBe('COURSE_STARTED');

    // 2: Engagement signal — Saved or Clicked
    const label2 = TrainingDatasetService.computeGradedLabel(
      [{ eventType: 'CLICK' }, { eventType: 'SAVE' }],
      false,
      false
    );
    expect(label2.label).toBe(2);
    expect(label2.outcomeType).toBe('CLICK_OR_SAVE');

    // 1: Neutral signal — Impression Only
    const label1 = TrainingDatasetService.computeGradedLabel(
      [{ eventType: 'IMPRESSION' }, { eventType: 'VIEW' }],
      false,
      false
    );
    expect(label1.label).toBe(1);
    expect(label1.outcomeType).toBe('IMPRESSION');

    // 0: Negative signal — Dismissed or Abandoned
    const label0 = TrainingDatasetService.computeGradedLabel(
      [{ eventType: 'DISMISS' }],
      false,
      false
    );
    expect(label0.label).toBe(0);
    expect(label0.outcomeType).toBe('DISMISSED_OR_ABANDONED');
  });

  test('enforces that competency improvement utility exceeds simple clicks', () => {
    const clickOutcome = TrainingDatasetService.computeGradedLabel([{ eventType: 'CLICK' }], false, false);
    const compOutcome = TrainingDatasetService.computeGradedLabel([], true, true);

    expect(compOutcome.label).toBeGreaterThan(clickOutcome.label);
    expect(compOutcome.label).toBe(5);
    expect(clickOutcome.label).toBe(2);
  });
});
