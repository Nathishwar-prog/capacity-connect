/**
 * AI Recommendation Explainer Layer
 * 
 * Provides natural language pedagogical narratives for recommended courses.
 * Calls LLM when API key is configured, with seamless deterministic fallback
 * rooted in official MoES / IMD operational competencies.
 */

import { RecommendationPromptBuilder, CoursePromptInfo } from './recommendation-prompt';
import { RecommendationBatchExplanationSchema, RecommendationBatchExplanation } from './recommendation.schema';
import { RecommendationSurface } from '../recommendation.types';
import logger from '../../../logger/winston.logger';

export class RecommendationExplainer {
  public async explainBatch(params: {
    surface: RecommendationSurface;
    learnerDepartment?: string;
    items: CoursePromptInfo[];
  }): Promise<RecommendationBatchExplanation> {
    const { items } = params;

    if (items.length === 0) {
      return {
        summaryRationale: 'No courses currently recommended for this profile.',
        targetedMilestone: 'Baseline Assessment',
        learningPathSequence: [],
        items: [],
      };
    }

    const systemPrompt = RecommendationPromptBuilder.buildSystemPrompt();
    const userPrompt = RecommendationPromptBuilder.buildUserPrompt(params);

    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      try {
        const rawContent = await this.callLLMProvider(apiKey, systemPrompt, userPrompt);
        if (rawContent) {
          const parsed = JSON.parse(rawContent);
          const validated = RecommendationBatchExplanationSchema.parse(parsed);
          return validated;
        }
      } catch (err: any) {
        logger.warn(
          `AI Recommendation explanation failed via LLM. Engaging deterministic fallback. Error: ${err.message}`
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
      throw new Error(`LLM provider returned status ${response.status}: ${await response.text()}`);
    }

    const data: any = await response.json();
    return data.choices?.[0]?.message?.content || null;
  }

  /**
   * Deterministic MoES / IMD Pedagogical Fallback Generator
   */
  public generateDeterministicFallback(params: {
    surface: RecommendationSurface;
    learnerDepartment?: string;
    items: CoursePromptInfo[];
  }): RecommendationBatchExplanation {
    const { surface, learnerDepartment, items } = params;

    const deptName = learnerDepartment || 'Earth System Sciences';
    const firstItem = items[0];

    const summaryRationale = `This ${surface.toLowerCase()} recommendation sequence is algorithmically curated to address current competency requirements in ${deptName}. Courses prioritize closing prerequisite gaps and strengthening operational workflow proficiency in line with MoES/IMD standards.`;

    const targetedMilestone = firstItem
      ? `Strengthen core capabilities in ${firstItem.category} and support operational mission readiness.`
      : 'Comprehensive Earth System Science Competency Elevation';

    const learningPathSequence = items.map(i => i.title);

    const explanationItems = items.map(item => {
      let headline = `Recommended for ${item.category}`;
      let why = `Selected based on algorithmic evaluation of learning history and domain requirements.`;
      let outcome = `Enhances practical competency in ${item.category} methods.`;
      let advice = 'Review foundational concepts before proceeding to practical exercises.';

      if (item.reasonCodes.includes('CLOSES_CRITICAL_GAP')) {
        headline = 'Urgent Remediation: Closes Critical Skill Gap';
        why = `Identified as a critical competency deficit in recent diagnostic assessments. Essential for foundational operational compliance.`;
        outcome = `Fulfills mandatory MoES/IMD prerequisite criteria for advanced operational tasks.`;
        advice = 'Focus on high-error topics identified in your skill gap diagnostic before taking assessments.';
      } else if (item.reasonCodes.includes('PREREQUISITE_COMPLETED')) {
        headline = 'Pathway Progression: Next Prerequisite Unlocked';
        why = `You have successfully completed the required prerequisite courses, unlocking this advanced module.`;
        outcome = `Transitions theoretical understanding into applied predictive capabilities.`;
        advice = 'Build directly upon your completed prerequisite notes and casework.';
      } else if (item.reasonCodes.includes('CONTINUES_LEARNING_PATH')) {
        headline = 'Active Pathway: Resume Coursework';
        why = `Directly continues your active learning path with strong synergy to recent modules.`;
        outcome = `Consolidates procedural workflows and operational efficiency.`;
        advice = 'Maintain momentum by completing remaining assignments and simulations.';
      } else if (item.reasonCodes.includes('EXPLORATION_HORIZON')) {
        headline = 'Strategic Horizon: Cross-Disciplinary Expansion';
        why = `Broadens your institutional perspective into emerging technologies and adjacent MoES fields.`;
        outcome = `Develops interdisciplinary analytical capabilities across Earth System modeling.`;
        advice = 'Explore how these concepts integrate with your primary departmental duties.';
      } else if (item.reasonCodes.includes('TRENDING_IN_DEPARTMENT')) {
        headline = 'Peer Standard: Highly Rated in Your Department';
        why = `Colleagues in ${deptName} have demonstrated high completion rates and positive learning impact in this module.`;
        outcome = `Aligns team competencies with standard operational forecasting protocols.`;
        advice = 'Engage with peer discussion threads and shared operational case studies.';
      }

      return {
        courseId: item.courseId,
        headline,
        whyRecommended: why,
        competencyOutcome: outcome,
        pedagogicalAdvice: advice,
      };
    });

    return {
      summaryRationale,
      targetedMilestone,
      learningPathSequence,
      items: explanationItems,
    };
  }
}
