import { BlockProvenance } from './normalized-document';

export interface CandidateKnowledgeCheck {
  id?: string;
  question: string;
  answer: string;
  options?: Array<{ optionText: string; isCorrect: boolean; orderIndex: number }>;
  explanation?: string;
  marks?: number;
  confidence?: number;
  provenance?: BlockProvenance;
}

export interface CandidateLesson {
  id?: string;
  order: number;
  title: string;
  subtitle: string;
  learningObjectives: string[];
  content: Array<{
    type: string;
    text: string;
    html?: string;
    level?: number;
    provenance?: BlockProvenance;
  }>;
  knowledgeCheck?: CandidateKnowledgeCheck;
  resources: any[];
  competencies: any[];
  keyTakeaways?: string[];
  durationMinutes?: number;
  provenance?: BlockProvenance;
  needsReview?: boolean;
}

export interface CandidateModule {
  id?: string;
  order: number;
  title: string;
  overview: string;
  learningOutcomes: string[];
  lessons: CandidateLesson[];
  keyTakeaways: string[];
  provenance?: BlockProvenance;
}

export interface CandidateCourseMetadata {
  title: string;
  description: string;
  duration: string;
  targetAudience: string[];
  prerequisites: string[];
  learningOutcomes: string[];
  assessment: Record<string, any>;
  certification: Record<string, any>;
  facilitatorNotes?: string[];
  courseStructureNotes?: string;
  domainNotes?: string;
  category?: string;
  difficulty?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
}

export interface CandidateGlossaryItem {
  term: string;
  definition: string;
}

export interface CandidateReferenceItem {
  title: string;
  citation?: string;
  url?: string;
  notes?: string;
}

export interface CandidateValidationIssue {
  type: string;
  location: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'ERROR';
}

export interface CandidateValidationResult {
  valid: boolean;
  tocVerified: boolean;
  expectedLessons: number;
  actualLessons: number;
  expectedModules: number;
  actualModules: number;
  issues: CandidateValidationIssue[];
  warnings: string[];
  corrections: string[];
}

export interface CandidateConfidenceScores {
  overallConfidence: number;
  moduleConfidence: number;
  lessonConfidence: number;
  contentConfidence: number;
  ocrConfidence?: number;
  extractionConfidence: number;
}

export interface CandidateProvenance {
  documentId: string;
  parserVersion: string;
  ocrEngine?: string | null;
  ocrVersion?: string | null;
  analysisVersion: string;
  llmModel?: string | null;
  promptVersion?: string | null;
  createdAt: string;
}

export interface CourseCandidate {
  course: CandidateCourseMetadata;
  modules: CandidateModule[];
  glossary: CandidateGlossaryItem[];
  references: CandidateReferenceItem[];
  validation: CandidateValidationResult;
  confidence: CandidateConfidenceScores;
  provenance: CandidateProvenance;
}
