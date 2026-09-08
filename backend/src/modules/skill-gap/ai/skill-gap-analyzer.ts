/**
 * AI Skill Gap Analyzer Layer
 * Coordinates LLM calls for guidance with deterministic MoES/IMD scientific fallback.
 */

import { SkillGapPromptBuilder } from './skill-gap-prompt';
import { AIGuidanceSchema } from './skill-gap-schema';
import {
  CalculatedGapItem,
  OverallReadinessResult,
  ClusteredGaps,
  AIGuidanceOutput,
} from '../types/skill-gap.types';
import logger from '../../../logger/winston.logger';

export class AISkillGapAnalyzer {
  public async generateGuidance(params: {
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
  }): Promise<AIGuidanceOutput> {
    const systemPrompt = SkillGapPromptBuilder.buildSystemPrompt();
    const userPrompt = SkillGapPromptBuilder.buildUserPrompt(params);

    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      try {
        const rawContent = await this.callLLMProvider(apiKey, systemPrompt, userPrompt);
        if (rawContent) {
          const parsed = JSON.parse(rawContent);
          const validated = AIGuidanceSchema.parse(parsed);
          return validated;
        }
      } catch (err: any) {
        logger.warn(
          `AI Skill Gap Guidance generation via LLM failed. Engaging deterministic MoES fallback. Error: ${err.message}`
        );
      }
    }

    // High-fidelity deterministic MoES/IMD scientific fallback
    return this.generateDeterministicFallback(params);
  }

  private async callLLMProvider(
    apiKey: string,
    systemPrompt: string,
    userPrompt: string
  ): Promise<string | null> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      throw new Error(`LLM provider returned status ${response.status}`);
    }

    const data: any = await response.json();
    return data.choices?.[0]?.message?.content || null;
  }

  public generateDeterministicFallback(params: {
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
  }): AIGuidanceOutput {
    const { courseTitle, readiness, items, rootCauses } = params;

    const criticalGaps = items
      .filter((i) => i.rawGap > 0 && (i.priorityLevel === 'CRITICAL' || i.criticality === 'CORE'))
      .map((i) => `${i.code}: ${i.name} (Requires Level ${i.requiredLevel}, Current: Level ${i.currentLevel})`);

    const strengths = items
      .filter((i) => i.rawGap === 0 && i.currentLevel > 0)
      .map((i) => `${i.code}: ${i.name} (Level ${i.currentLevel} Confirmed)`);

    const rootCauseList = rootCauses.map(
      (rc) => `${rc.code}: ${rc.name} (Impacting: ${rc.impactedCompetencies.join(', ')})`
    );

    // Formulate structured learning path addressing root causes first
    const pathItems: Array<{
      stepNumber: number;
      competencyName: string;
      action: string;
      estimatedHours: number;
      rationale: string;
    }> = [];

    let stepCounter = 1;

    // Phase 1: Address Root Causes
    for (const rc of rootCauses) {
      pathItems.push({
        stepNumber: stepCounter++,
        competencyName: `${rc.code} - ${rc.name}`,
        action: `Complete foundational conceptual review and diagnostic lab exercises in ${rc.name}.`,
        estimatedHours: 12,
        rationale: `Direct root cause deficiency blocking ${rc.impactedCompetencies.length} downstream operational competencies.`,
      });
    }

    // Phase 2: Address Remaining High Priority Gaps
    const remainingHighGaps = items
      .filter(
        (i) =>
          i.rawGap > 0 &&
          !rootCauses.some((rc) => rc.competencyId === i.competencyId) &&
          (i.priorityLevel === 'CRITICAL' || i.priorityLevel === 'HIGH')
      )
      .sort((a, b) => b.priorityScore - a.priorityScore);

    for (const gap of remainingHighGaps) {
      pathItems.push({
        stepNumber: stepCounter++,
        competencyName: `${gap.code} - ${gap.name}`,
        action: `Undertake structured simulation modules and guided case studies targeting Level ${gap.requiredLevel} proficiency.`,
        estimatedHours: 8,
        rationale: `High-priority requirement (${gap.criticality}) with gap severity of ${gap.gapSeverity}%.`,
      });
    }

    // Default step if no gaps
    if (pathItems.length === 0) {
      pathItems.push({
        stepNumber: 1,
        competencyName: courseTitle || 'Advanced Meteorological Competency',
        action: 'Maintain active operational competency through scheduled retrieval challenges and peer mentoring.',
        estimatedHours: 4,
        rationale: 'All prerequisite competencies verified at or above target levels.',
      });
    }

    let statusExplanation = '';
    switch (readiness.readinessStatus) {
      case 'FULLY_READY':
        statusExplanation =
          'Learner possesses robust competencies meeting or exceeding all prerequisites. Ready for full operational deployment or course commencement.';
        break;
      case 'GENERALLY_READY':
        statusExplanation =
          'Learner satisfies all essential core competencies with minor non-critical gaps that can be developed concurrently with training.';
        break;
      case 'CONDITIONAL':
        statusExplanation =
          'Learner has demonstrated baseline competence but exhibits specific prerequisite deficiencies in critical or core domains. Targeted remediation required.';
        break;
      case 'NOT_READY':
        statusExplanation =
          'Significant gaps identified across fundamental prerequisite competencies. Learner must complete prerequisite coursework prior to enrollment.';
        break;
    }

    return {
      executiveSummary: `Skill gap diagnostic completed for ${courseTitle || 'IMD Operational Competency Framework'}. Overall calculated readiness is ${readiness.overallReadiness}%, with core competency readiness at ${readiness.coreReadiness}%. Diagnostic status: ${readiness.readinessStatus}.`,
      readinessAssessment: {
        status: readiness.readinessStatus,
        readinessScore: readiness.overallReadiness,
        explanation: statusExplanation,
      },
      keyFindings: {
        criticalGaps: criticalGaps.length > 0 ? criticalGaps : ['No critical or core gaps detected.'],
        rootCauses: rootCauseList.length > 0 ? rootCauseList : ['No upstream prerequisite failures.'],
        strengths: strengths.length > 0 ? strengths : ['Baseline domain assessments pending.'],
      },
      actionableLearningPath: pathItems,
      mentorshipAndReviewAdvice:
        readiness.readinessStatus === 'NOT_READY' || readiness.readinessStatus === 'CONDITIONAL'
          ? 'Assign an IMD senior scientist/meteorologist mentor for weekly check-ins during prerequisite remediation phase.'
          : 'Eligible for self-paced progression with periodic milestone assessments.',
      disclaimer:
        'Official assessment metrics and readiness scores are computed deterministically from verified platform evidence. AI provides pedagogical interpretation and learning path sequencing.',
    };
  }
}
