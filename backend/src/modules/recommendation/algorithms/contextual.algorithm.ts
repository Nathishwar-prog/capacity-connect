/**
 * Contextual Relevance Algorithm
 * Evaluates recommendation surface, active course views, and departmental focus.
 */

export interface ContextualInput {
  candidateCourseId?: string;
  candidateCategory?: string;
  candidatePrerequisiteIds?: string[];
  activeCourseId?: string | null;
  recentlyCompletedCourseId?: string | null;
  learnerDepartmentCode?: string | null;
  courseDepartmentCode?: string | null;
  isContinuationPrerequisite?: boolean;
  isInActiveCourseView?: boolean;
  isDepartmentMatch?: boolean;
  surface?: string;
}

export class ContextualAlgorithm {
  /**
   * Calculates contextual score (0 - 100).
   */
  public static calculate(input: ContextualInput): number {
    let contextScore = 40.0; // Baseline contextual score

    // 1. Direct flags support
    if (input.isContinuationPrerequisite) {
      contextScore += 45.0;
    } else if (
      input.recentlyCompletedCourseId &&
      input.candidatePrerequisiteIds?.includes(input.recentlyCompletedCourseId)
    ) {
      contextScore += 45.0; // Direct logical next step
    }

    // 2. Active Course View / Related Topic
    if (input.isInActiveCourseView) {
      contextScore += 15.0;
    } else if (input.activeCourseId && input.candidateCourseId !== input.activeCourseId) {
      contextScore += 15.0;
    }

    // 3. Departmental Alignment
    if (input.isDepartmentMatch) {
      contextScore += 15.0;
    } else if (
      input.learnerDepartmentCode &&
      input.courseDepartmentCode &&
      input.learnerDepartmentCode.toLowerCase().trim() ===
        input.courseDepartmentCode.toLowerCase().trim()
    ) {
      contextScore += 15.0;
    }

    return Math.round(Math.min(100, Math.max(0, contextScore)) * 100) / 100;
  }
}

export function calculateContextualScore(input: ContextualInput): number {
  return ContextualAlgorithm.calculate(input);
}
