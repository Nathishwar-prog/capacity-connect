import { ItemRole, RevisionMode } from '../types/revision.types';

export interface PromptContext {
  topicCode: string;
  topicName: string;
  groupName: string;
  revisionMode: RevisionMode;
  itemRole: ItemRole;
  errorTypes?: string[];
  prerequisiteOfTopicName?: string;
  difficultyLevel: number;
}

/**
 * Builds an anonymized prompt for the LLM.
 * No user IDs, names, or emails are included.
 * Enforces Ministry of Earth Sciences (MoES) / IMD meteorological scientific realism.
 */
export function buildRevisionPrompt(context: PromptContext): { systemPrompt: string; userPrompt: string } {
  const systemPrompt = `You are the Lead Senior Meteorological Instructor and Curriculum Specialist for the Ministry of Earth Sciences (MoES) and India Meteorological Department (IMD) training division.
Your objective is to generate rigorous, technically accurate, and pedagogically clear revision material for operational meteorologists, weather observers, and NWP scientists.

STRICT DOMAIN CONSTRAINTS:
1. All scenarios, examples, and questions MUST pertain to Meteorology, Atmospheric Dynamics, Radar Meteorology (DWR Doppler Weather Radar), Satellite Meteorology (INSAT-3D/3DR, Kalpana, Megha-Tropiques), Synoptic Analysis, or Numerical Weather Prediction (WRF, GFS-T1534).
2. NEVER use generic IT, web development, coding, or unrelated non-meteorological examples.
3. You must format your response strictly as valid JSON matching the requested schema. No markdown outside the JSON.`;

  const userPrompt = `Generate a targeted revision package for the following topic:
- Topic Code: ${context.topicCode}
- Topic Name: ${context.topicName}
- Competency Group: ${context.groupName}
- Revision Mode: ${context.revisionMode}
- Sequence Role: ${context.itemRole}
${context.prerequisiteOfTopicName ? `- Foundation for Advanced Topic: ${context.prerequisiteOfTopicName}` : ''}
${context.errorTypes && context.errorTypes.length > 0 ? `- Learner Common Misconceptions: ${context.errorTypes.join(', ')}` : ''}
- Target Difficulty Level: ${context.difficultyLevel}/5

JSON Structure Required:
{
  "conceptIntro": "Clear 2-3 sentence introduction grounding the meteorological phenomenon and operational importance.",
  "coreRuleRecap": "The fundamental atmospheric/physical law or formula (e.g. hydrostatic equation, Doppler velocity interpretation, geostrophic balance).",
  "commonTrapAvoided": "Common operational mistake or analytical trap to avoid during weather surveillance or forecasting.",
  "meteorologicalExamples": [
    "Specific operational Indian subcontinent case (e.g. Bay of Bengal monsoon depression, pre-monsoon Nor'wester squall line, western disturbance over NW Himalayas)"
  ],
  "practiceQuestions": [
    {
      "questionText": "Rigorous operational meteorological question",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctOptionIndex": 0,
      "explanation": "Detailed physical reasoning why the option is correct",
      "hint": "Guiding physical clue without giving away the direct answer",
      "difficultyLevel": ${context.difficultyLevel}
    }
  ],
  "retrievalCheck": {
    "prompt": "Direct recall prompt testing key diagnostic parameter or operational threshold",
    "targetCriteria": ["Key threshold criterion 1", "Key threshold criterion 2"],
    "expectedAnswerSummary": "Concise standard operational procedure answer"
  },
  "quickSummary": "One-paragraph key takeaway for immediate operational recall."
}`;

  return { systemPrompt, userPrompt };
}
