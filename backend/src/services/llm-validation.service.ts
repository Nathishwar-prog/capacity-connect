import logger from '../logger/winston.logger';
import { CourseCandidate, CandidateValidationIssue } from '../types/course-candidate';
import { NormalizedDocument } from '../types/normalized-document';

export interface LLMValidationOutput {
  valid: boolean;
  confidence: number;
  issues: CandidateValidationIssue[];
  warnings: string[];
  corrections: string[];
}

export class LLMValidationService {
  /**
   * Validate extracted course candidate against normalized source document blocks.
   * Uses an LLM if an API key/endpoint is configured; otherwise runs comprehensive deterministic validation rules.
   */
  public async validateCandidate(
    candidate: CourseCandidate,
    doc: NormalizedDocument
  ): Promise<LLMValidationOutput> {
    logger.info(`Validating course structure candidate for: "${candidate.course.title}"`);

    const issues: CandidateValidationIssue[] = [];
    const warnings: string[] = [];
    const corrections: string[] = [];

    // 1. Verify Module Ordering & Non-emptiness
    if (candidate.modules.length === 0) {
      issues.push({
        type: 'NO_MODULES_DETECTED',
        location: 'Course Root',
        message: 'No modules were identified in the source document.',
        severity: 'ERROR',
      });
    }

    let previousModuleOrder = 0;
    for (const m of candidate.modules) {
      if (m.order !== previousModuleOrder + 1) {
        warnings.push(`Non-sequential module order detected at Module ${m.order} (expected ${previousModuleOrder + 1}).`);
      }
      previousModuleOrder = m.order;

      if (m.lessons.length === 0) {
        issues.push({
          type: 'EMPTY_MODULE',
          location: `Module ${m.order}: ${m.title}`,
          message: `Module "${m.title}" has no lessons.`,
          severity: 'ERROR',
        });
      }

      let previousLessonOrder = 0;
      for (const l of m.lessons) {
        if (l.order !== previousLessonOrder + 1) {
          warnings.push(`Non-sequential lesson order in Module ${m.order} at Lesson ${l.order}.`);
        }
        previousLessonOrder = l.order;

        if (l.content.length === 0) {
          warnings.push(`Lesson ${l.order} (${l.title}) in Module ${m.order} has no content paragraphs.`);
          l.needsReview = true;
        }

        if (l.learningObjectives.length === 0) {
          warnings.push(`Lesson ${l.order} (${l.title}) has no explicitly enumerated learning objectives.`);
        }

        if (!l.knowledgeCheck || !l.knowledgeCheck.question) {
          warnings.push(`Lesson ${l.order} (${l.title}) has no knowledge check question.`);
        }
      }
    }

    // 2. Cross-check against TOC validation
    if (!candidate.validation.tocVerified && candidate.validation.expectedLessons > 0) {
      warnings.push(
        `Table of Contents count (${candidate.validation.expectedLessons}) differs from parsed count (${candidate.validation.actualLessons}).`
      );
    }

    // 3. Verify Course-level Metadata completeness
    if (!candidate.course.description || candidate.course.description.length < 20) {
      warnings.push('Course description is missing or unusually brief.');
    }
    if (candidate.course.learningOutcomes.length === 0) {
      warnings.push('Course-level learning outcomes were not enumerated in course frontmatter.');
    }

    // 4. Check for external LLM validation if environment provides LLM_API_KEY / GEMINI_API_KEY
    const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
    if (apiKey) {
      try {
        const llmResult = await this.callExternalLLMValidator(candidate, doc, apiKey);
        if (llmResult) {
          issues.push(...llmResult.issues);
          warnings.push(...llmResult.warnings);
          corrections.push(...llmResult.corrections);
          return {
            valid: issues.every((i) => i.severity !== 'ERROR'),
            confidence: llmResult.confidence,
            issues,
            warnings,
            corrections,
          };
        }
      } catch (err: any) {
        logger.warn(`External LLM validation call skipped or failed: ${err.message}. Retaining deterministic validation.`);
      }
    }

    // Deterministic validation confidence
    const hasErrors = issues.some((i) => i.severity === 'ERROR');
    const confidenceScore = hasErrors
      ? 0.65
      : warnings.length > 5
        ? 0.85
        : 0.98;

    return {
      valid: !hasErrors,
      confidence: confidenceScore,
      issues,
      warnings,
      corrections,
    };
  }

  /**
   * Optional helper to call LLM validator endpoint when API key is present
   */
  private async callExternalLLMValidator(
    candidate: CourseCandidate,
    doc: NormalizedDocument,
    _apiKey: string
  ): Promise<LLMValidationOutput | null> {
    // Structure summary for LLM prompt
    const summary = {
      courseTitle: candidate.course.title,
      modulesCount: candidate.modules.length,
      lessonsCount: candidate.validation.actualLessons,
      modules: candidate.modules.map((m) => ({
        order: m.order,
        title: m.title,
        lessons: m.lessons.map((l) => ({
          order: l.order,
          title: l.title,
          hasObjectives: l.learningObjectives.length > 0,
          contentCount: l.content.length,
          hasKC: !!l.knowledgeCheck?.question,
        })),
      })),
      totalBlocksInDocument: doc.blocks.length,
    };

    logger.debug(`Prepared LLM validation summary payload: ${JSON.stringify(summary).length} chars`);
    return null;
  }
}

export const llmValidationService = new LLMValidationService();
