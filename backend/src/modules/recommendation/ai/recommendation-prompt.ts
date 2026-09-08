/**
 * Recommendation AI Prompt Builder
 * 
 * Constructs zero-PII prompt payloads for pedagogical explanation generation.
 * Strips all personal identifiers, exposing only scientific domain context,
 * deterministic reason codes, and rank positions.
 */

import { RecommendationSurface } from '../recommendation.types';

export interface CoursePromptInfo {
  courseId: string;
  title: string;
  category: string;
  level: string;
  rankPosition: number;
  reasonCodes: string[];
  candidateSource: string;
}

export class RecommendationPromptBuilder {
  public static buildSystemPrompt(): string {
    return `You are the Lead Pedagogical Advisor and Senior Curriculum Specialist for the Ministry of Earth Sciences (MoES) and India Meteorological Department (IMD) Capacity Connect Platform.

YOUR MANDATE:
1. Provide concise, clear, and scientifically rigorous rationales for why each recommended course was suggested to the learner.
2. Formulate a coherent, milestone-driven learning progression explaining how these courses synergistically advance the learner's operational capabilities (e.g. Synoptic Analysis, Numerical Weather Prediction, Doppler Weather Radar, Ocean State Forecasting).
3. STRICT CONSTRAINT: You are a qualitative pedagogical narrator. You MUST NOT modify rankings, recalculate scores, or add/remove courses. All recommendations and rankings provided in the user prompt are FIXED GROUND TRUTH.
4. Output MUST be valid JSON strictly adhering to the schema. No markdown formatting outside JSON.`;
  }

  public static buildUserPrompt(params: {
    surface: RecommendationSurface;
    learnerDepartment?: string;
    items: CoursePromptInfo[];
  }): string {
    const { surface, learnerDepartment, items } = params;

    const anonymizedPayload = {
      learningContext: {
        surface,
        institutionalDepartment: learnerDepartment || 'Earth System Sciences & Meteorology',
      },
      recommendedSequence: items.map(item => ({
        courseId: item.courseId,
        title: item.title,
        category: item.category,
        level: item.level,
        rankPosition: item.rankPosition,
        candidateSource: item.candidateSource,
        reasonCodes: item.reasonCodes,
      })),
    };

    return `Explain the following deterministically ranked recommendation batch for a MoES/IMD scientific learner:

${JSON.stringify(anonymizedPayload, null, 2)}

Respond with JSON adhering to this schema:
{
  "summaryRationale": "<Overall narrative explaining how this curated batch supports operational competency>",
  "targetedMilestone": "<Core milestone achieved upon completing this sequence>",
  "learningPathSequence": ["<Course 1 Title>", "<Course 2 Title>", ...],
  "items": [
    {
      "courseId": "<courseId>",
      "headline": "<Punchy headline, e.g., 'Remediates Critical Radar Interpretation Gap'>",
      "whyRecommended": "<Detailed pedagogical reason based on reasonCodes and domain>",
      "competencyOutcome": "<Specific skill or operational capability gained>",
      "pedagogicalAdvice": "<How to approach this course, e.g. review synoptic charts first>"
    }
  ]
}`;
  }
}
