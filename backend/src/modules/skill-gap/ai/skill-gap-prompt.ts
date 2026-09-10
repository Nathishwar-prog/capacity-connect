/**
 * Skill Gap AI Prompt Builder
 * Strips all PII and provides deterministic gap evidence for explanation and guidance generation.
 */

import {
  CalculatedGapItem,
  OverallReadinessResult,
  ClusteredGaps,
} from '../types/skill-gap.types';

export class SkillGapPromptBuilder {
  public static buildSystemPrompt(): string {
    return `You are the Chief Scientific Learning Advisor for the Ministry of Earth Sciences (MoES) and India Meteorological Department (IMD) Capacity Connect Platform.

YOUR MANDATE:
1. Explain deterministically calculated skill gaps in professional, objective, scientific language.
2. Formulate a structured, targeted learning and revision sequence starting with foundational root causes before advancing to complex operations.
3. STRICT CONSTRAINT: You MUST NOT invent new competencies, modify computed numerical scores, or recalculate readiness. All scores, classifications, and gaps provided in the user prompt are FIXED GROUND TRUTH.
4. Output MUST be valid JSON adhering strictly to the required schema. No markdown backticks or commentary outside JSON.`;
  }

  public static buildUserPrompt(params: {
    courseTitle?: string;
    readiness: OverallReadinessResult;
    items: CalculatedGapItem[];
    clusters: ClusteredGaps[];
    rootCauses: Array<{
      competencyId: string;
      code: string;
      name: string;
      impactedCompetencies: string[];
    }>;
  }): string {
    const { courseTitle, readiness, items, clusters, rootCauses } = params;

    // Filter strengths
    const strengths = items.filter((i) => i.rawGap === 0 && i.currentLevel > 0);

    const anonymizedPayload = {
      targetContext: courseTitle ? `Course: ${courseTitle}` : 'General Meteorological Competency Framework',
      officialReadiness: {
        overallScore: readiness.overallReadiness,
        coreScore: readiness.coreReadiness,
        criticalScore: readiness.criticalReadiness,
        status: readiness.readinessStatus,
        coreDeficienciesCount: readiness.coreDeficienciesCount,
        blockers: readiness.blockers,
      },
      rootCauseCompetencies: rootCauses.map((rc) => ({
        competency: `${rc.code} - ${rc.name}`,
        impacts: rc.impactedCompetencies,
      })),
      gapClusters: clusters.map((c) => ({
        domain: c.category,
        averagePriority: c.averagePriority,
        totalGaps: c.totalGaps,
        criticalGaps: c.criticalGaps,
        gaps: c.items
          .filter((i) => i.rawGap > 0)
          .map((i) => ({
            competency: `${i.code} - ${i.name}`,
            requiredLevel: i.requiredLevel,
            currentLevel: i.currentLevel,
            gapSeverity: i.gapSeverity,
            priorityScore: i.priorityScore,
            priorityLevel: i.priorityLevel,
            classification: i.classification,
            criticality: i.criticality,
            reasonCodes: i.reasonCodes,
            rootCause: i.rootCauseCompetencyName || 'None (Self-contained)',
          })),
      })),
      demonstratedStrengths: strengths.map((s) => ({
        competency: `${s.code} - ${s.name}`,
        currentLevel: s.currentLevel,
        requiredLevel: s.requiredLevel,
      })),
    };

    return `Please analyze the following deterministic skill gap assessment data and generate developmental guidance:

${JSON.stringify(anonymizedPayload, null, 2)}

Ensure the actionable learning path addresses ROOT CAUSE competencies first. Provide realistic operational timelines.`;
  }
}
