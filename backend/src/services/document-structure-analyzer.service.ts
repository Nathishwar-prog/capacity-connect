import logger from '../logger/winston.logger';
import { NormalizedBlock, NormalizedDocument } from '../types/normalized-document';
import {
  CourseCandidate,
  CandidateModule,
  CandidateLesson,
  CandidateGlossaryItem,
  CandidateReferenceItem,
  CandidateValidationIssue,
} from '../types/course-candidate';

export class CourseStructureAnalyzer {
  private readonly parserVersion = '2.0.0-multi-signal';
  private readonly analysisVersion = '2026.09';

  /**
   * Analyze normalized document blocks and build CourseCandidate structure
   */
  public analyze(doc: NormalizedDocument): CourseCandidate {
    logger.info(`Starting multi-signal structure analysis for document: ${doc.document.id}`);

    const blocks = doc.blocks;

    // 1. Detect Course Title and Course Metadata
    const courseMeta = this.extractCourseMetadata(blocks, doc.document.title);

    // 2. Detect & Parse Table of Contents (TOC) with duplicate suppression
    const { tocEntries, nonTocBlocks } = this.extractAndFilterTOC(blocks);

    // 3. Segment Course-Level Global Sections (Overview, Outcomes, Prerequisites, Appendices)
    const { globalSections, contentBlocks } = this.partitionGlobalSections(nonTocBlocks);

    // Update course metadata with extracted global sections
    if (globalSections.overview) courseMeta.overview = globalSections.overview;
    if (globalSections.learningOutcomes.length > 0) courseMeta.learningOutcomes = globalSections.learningOutcomes;
    if (globalSections.targetAudience.length > 0) courseMeta.targetAudience = globalSections.targetAudience;
    if (globalSections.prerequisites.length > 0) courseMeta.prerequisites = globalSections.prerequisites;
    if (globalSections.duration) courseMeta.duration = globalSections.duration;
    if (globalSections.facilitatorNotes.length > 0) courseMeta.facilitatorNotes = globalSections.facilitatorNotes;
    if (globalSections.courseStructureNotes) courseMeta.courseStructureNotes = globalSections.courseStructureNotes;
    if (globalSections.domainNotes) courseMeta.domainNotes = globalSections.domainNotes;

    // 4. Segment Modules and Lessons deterministically using multi-signal classification
    const { modules, issues, warnings } = this.segmentModulesAndLessons(contentBlocks, doc.document.id);

    // 5. Cross-validate Detailed Structure against TOC
    const totalDetailedLessons = modules.reduce((acc, m) => acc + m.lessons.length, 0);
    const tocLessonCount = tocEntries.filter((e) => e.isLesson).length;
    const tocModuleCount = tocEntries.filter((e) => e.isModule).length;

    let tocVerified = false;
    if (tocEntries.length > 0) {
      if (tocLessonCount === totalDetailedLessons && tocModuleCount === modules.length) {
        tocVerified = true;
        logger.info(`TOC Cross-Validation PASSED: ${totalDetailedLessons} lessons and ${modules.length} modules match exactly.`);
      } else {
        warnings.push(
          `TOC mismatch: Table of Contents lists ${tocModuleCount} modules & ${tocLessonCount} lessons, but detailed content parser identified ${modules.length} modules & ${totalDetailedLessons} lessons.`
        );
        issues.push({
          type: 'TOC_COUNT_MISMATCH',
          location: 'Table of Contents vs Content Body',
          message: `Expected ${tocLessonCount} lessons from TOC, parsed ${totalDetailedLessons} lessons from content.`,
          severity: 'WARNING',
        });
      }
    } else {
      tocVerified = true; // No TOC present in document
    }

    // 6. Calculate Confidence Scores
    const moduleConfidence = modules.length > 0 ? 0.99 : 0.5;
    const lessonConfidence = totalDetailedLessons > 0 ? (tocVerified ? 0.98 : 0.88) : 0.5;
    const contentConfidence = modules.every((m) => m.lessons.every((l) => l.content.length > 0)) ? 0.97 : 0.82;
    const overallConfidence = Number(((moduleConfidence * 0.35 + lessonConfidence * 0.45 + contentConfidence * 0.2)).toFixed(2));

    const candidate: CourseCandidate = {
      course: {
        title: courseMeta.title,
        description: courseMeta.overview || courseMeta.title,
        duration: courseMeta.duration || '6 Months',
        targetAudience: courseMeta.targetAudience,
        prerequisites: courseMeta.prerequisites,
        learningOutcomes: courseMeta.learningOutcomes,
        assessment: {
          notes: globalSections.assessmentNotes,
        },
        certification: {
          notes: globalSections.certificationNotes,
        },
        facilitatorNotes: courseMeta.facilitatorNotes,
        courseStructureNotes: courseMeta.courseStructureNotes,
        domainNotes: courseMeta.domainNotes,
        category: this.inferCategory(courseMeta.title),
        difficulty: 'INTERMEDIATE',
      },
      modules,
      glossary: globalSections.glossary,
      references: globalSections.references,
      validation: {
        valid: issues.every((i) => i.severity !== 'ERROR'),
        tocVerified,
        expectedLessons: tocLessonCount > 0 ? tocLessonCount : totalDetailedLessons,
        actualLessons: totalDetailedLessons,
        expectedModules: tocModuleCount > 0 ? tocModuleCount : modules.length,
        actualModules: modules.length,
        issues,
        warnings,
        corrections: [],
      },
      confidence: {
        overallConfidence,
        moduleConfidence,
        lessonConfidence,
        contentConfidence,
        extractionConfidence: 0.99,
      },
      provenance: {
        documentId: doc.document.id,
        parserVersion: this.parserVersion,
        ocrEngine: doc.document.ocrEngineUsed || null,
        analysisVersion: this.analysisVersion,
        createdAt: new Date().toISOString(),
      },
    };

    logger.info(
      `Structure analysis completed: ${candidate.modules.length} modules, ${totalDetailedLessons} lessons, confidence=${overallConfidence}`
    );

    return candidate;
  }

  /**
   * Extract Course Title, Organization, and Duration from pre-TOC blocks
   */
  private extractCourseMetadata(blocks: NormalizedBlock[], fallbackTitle?: string) {
    let title = fallbackTitle || 'Forecasters Training Course';
    let duration = '6 Months';
    let overview = '';

    for (let i = 0; i < Math.min(blocks.length, 10); i++) {
      const b = blocks[i];
      const text = b.text.trim();

      // Duration detection (e.g. "6 Months", "12 Weeks")
      if (/^\d+\s+(?:months?|weeks?|days?|hours?)$/i.test(text)) {
        duration = text;
        continue;
      }

      // Title detection: first prominent block before Overview / TOC
      if (
        i <= 3 &&
        text.length > 5 &&
        text.length < 80 &&
        !/^(course overview|table of contents|contents|module)/i.test(text)
      ) {
        if (/forecaster/i.test(text) || (b.metadata?.isBold && !title.includes('Forecasters'))) {
          title = text;
        }
      }
    }

    return {
      title,
      duration,
      overview,
      targetAudience: [] as string[],
      prerequisites: [] as string[],
      learningOutcomes: [] as string[],
      facilitatorNotes: [] as string[],
      courseStructureNotes: '',
      domainNotes: '',
    };
  }

  /**
   * Identify Table of Contents and filter its blocks from generating content
   */
  private extractAndFilterTOC(blocks: NormalizedBlock[]): {
    tocEntries: Array<{ title: string; isModule: boolean; isLesson: boolean; page?: number }>;
    nonTocBlocks: NormalizedBlock[];
  } {
    const tocEntries: Array<{ title: string; isModule: boolean; isLesson: boolean; page?: number }> = [];
    const nonTocBlocks: NormalizedBlock[] = [];

    let insideTOC = false;

    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];
      const text = b.text.trim();

      // Check for TOC header start
      if (/^(table of contents|contents|course outline)$/i.test(text) && b.type === 'heading') {
        insideTOC = true;
        continue;
      }

      if (insideTOC) {
        // End condition: when the actual detailed Module 1 starts
        // Notice Module 1 heading in content starts detailed sections
        const isDetailedModuleStart =
          b.type === 'heading' &&
          b.level === 1 &&
          /^(?:module\s+1|module\s+i|1\.)[:\s]/i.test(text) &&
          !/\.{2,}|\s{3,}\d+$/.test(text);

        if (isDetailedModuleStart) {
          insideTOC = false;
          nonTocBlocks.push(b);
          continue;
        }

        // Parse TOC line items
        // Example: "Module 1: Advanced Atmospheric Dynamics & NWP" or "Lesson 1: Circulation Theorems ... 6"
        const isMod = /^(?:module\s+\d+|module\s+[ivx]+)/i.test(text);
        const isLes = /^(?:lesson\s+\d+|\d+\.\s+[a-z]|\d+\.\d+)/i.test(text);

        const pageMatch = text.match(/(?:\.{2,}|\s{3,}|\s+)(\d+)$/);
        const page = pageMatch ? parseInt(pageMatch[1], 10) : undefined;
        const cleanTitle = text.replace(/(?:\.{2,}|\s{3,}|\s+)\d+$/, '').trim();

        if (isMod || isLes) {
          tocEntries.push({
            title: cleanTitle,
            isModule: isMod,
            isLesson: isLes,
            page,
          });
        }
        // Suppress this block from nonTocBlocks!
        continue;
      }

      nonTocBlocks.push(b);
    }

    logger.info(`TOC Extractor identified ${tocEntries.length} entries. Suppressed duplicate TOC blocks from content.`);
    return { tocEntries, nonTocBlocks };
  }

  /**
   * Partition course-level global sections (Overview, Outcomes, Prerequisites, Appendices)
   * so they never get treated as course modules or lessons.
   */
  private partitionGlobalSections(blocks: NormalizedBlock[]) {
    const globalSections = {
      overview: '',
      learningOutcomes: [] as string[],
      targetAudience: [] as string[],
      prerequisites: [] as string[],
      duration: '',
      courseStructureNotes: '',
      assessmentNotes: '',
      certificationNotes: '',
      facilitatorNotes: [] as string[],
      glossary: [] as CandidateGlossaryItem[],
      references: [] as CandidateReferenceItem[],
      domainNotes: '',
    };

    const contentBlocks: NormalizedBlock[] = [];

    let currentGlobalSection: string | null = null;

    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];
      const text = b.text.trim();

      // Check if this block is a module heading (Modules 1..7)
      const isModuleHeading =
        b.type === 'heading' &&
        /^(?:module\s+\d+|module\s+[ivx]+|part\s+\d+|unit\s+\d+)[:\s.-]/i.test(text);

      if (isModuleHeading) {
        currentGlobalSection = null;
        contentBlocks.push(b);
        continue;
      }

      // Check if this is a global section header
      if (b.type === 'heading') {
        const lower = text.toLowerCase();
        if (/^(course overview|about this course|course description)$/i.test(lower)) {
          currentGlobalSection = 'OVERVIEW';
          continue;
        }
        if (/^(course-level learning outcomes|course learning outcomes|course outcomes)$/i.test(lower)) {
          currentGlobalSection = 'OUTCOMES';
          continue;
        }
        if (/^(course structure)$/i.test(lower)) {
          currentGlobalSection = 'STRUCTURE';
          continue;
        }
        if (/^(target audience & prerequisites|target audience|prerequisites)$/i.test(lower)) {
          currentGlobalSection = 'AUDIENCE_PREREQS';
          continue;
        }
        if (/^(assessment & certification|assessment and certification)$/i.test(lower)) {
          currentGlobalSection = 'ASSESSMENT';
          continue;
        }
        if (/^(facilitator notes|trainer notes|notes for facilitators)$/i.test(lower)) {
          currentGlobalSection = 'FACILITATOR_NOTES';
          continue;
        }
        if (/^(glossary of key terms|glossary|key terminology)$/i.test(lower)) {
          currentGlobalSection = 'GLOSSARY';
          continue;
        }
        if (/^(recommended references|references|bibliography)$/i.test(lower)) {
          currentGlobalSection = 'REFERENCES';
          continue;
        }
        if (/^(domain & content note|domain note|disclaimer)$/i.test(lower)) {
          currentGlobalSection = 'DOMAIN_NOTE';
          continue;
        }
      }

      // If we are inside a global section, capture its content
      if (currentGlobalSection) {
        if (currentGlobalSection === 'OVERVIEW') {
          globalSections.overview = (globalSections.overview ? globalSections.overview + '\n\n' : '') + text;
        } else if (currentGlobalSection === 'OUTCOMES') {
          const items = this.extractListItems(b);
          globalSections.learningOutcomes.push(...items);
        } else if (currentGlobalSection === 'STRUCTURE') {
          globalSections.courseStructureNotes =
            (globalSections.courseStructureNotes ? globalSections.courseStructureNotes + '\n\n' : '') + text;
        } else if (currentGlobalSection === 'AUDIENCE_PREREQS') {
          if (/prerequisite/i.test(text) || b.metadata?.bulletItems) {
            const items = this.extractListItems(b);
            globalSections.prerequisites.push(...items);
          } else {
            globalSections.targetAudience.push(text);
          }
        } else if (currentGlobalSection === 'ASSESSMENT') {
          const items = this.extractListItems(b);
          if (items.length > 0) {
            globalSections.assessmentNotes = items.join('\n');
          } else {
            globalSections.assessmentNotes = (globalSections.assessmentNotes ? globalSections.assessmentNotes + '\n' : '') + text;
          }
        } else if (currentGlobalSection === 'FACILITATOR_NOTES') {
          const items = this.extractListItems(b);
          globalSections.facilitatorNotes.push(...items);
        } else if (currentGlobalSection === 'GLOSSARY') {
          const glossaryEntries = this.parseGlossaryBlock(b);
          globalSections.glossary.push(...glossaryEntries);
        } else if (currentGlobalSection === 'REFERENCES') {
          const refEntries = this.parseReferencesBlock(b);
          globalSections.references.push(...refEntries);
        } else if (currentGlobalSection === 'DOMAIN_NOTE') {
          globalSections.domainNotes = (globalSections.domainNotes ? globalSections.domainNotes + '\n\n' : '') + text;
        }
        continue;
      }

      // If not in a global section and not pre-module metadata, it's module content
      contentBlocks.push(b);
    }

    return { globalSections, contentBlocks };
  }

  /**
   * Deterministic Segmentation of Modules and Lessons
   */
  private segmentModulesAndLessons(
    blocks: NormalizedBlock[],
    documentId: string
  ): {
    modules: CandidateModule[];
    issues: CandidateValidationIssue[];
    warnings: string[];
  } {
    const modules: CandidateModule[] = [];
    const issues: CandidateValidationIssue[] = [];
    const warnings: string[] = [];

    let currentModule: CandidateModule | null = null;
    let currentLesson: CandidateLesson | null = null;
    let currentLessonSection: 'OBJECTIVES' | 'CONTENT' | 'KNOWLEDGE_CHECK' | null = null;
    let insideModuleOutcomes = false;
    let insideModuleTakeaways = false;

    let moduleOrder = 0;
    let lessonOrderInModule = 0;

    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];
      const text = b.text.trim();

      // 1. Detect MODULE Heading
      // Pattern: "Module 1: Advanced Atmospheric Dynamics & NWP" or "Module 5: Ocean-Atmosphere Interaction"
      const moduleMatch = this.matchModuleHeading(b);
      if (moduleMatch) {
        moduleOrder++;
        lessonOrderInModule = 0;
        currentLesson = null;
        currentLessonSection = null;
        insideModuleOutcomes = false;
        insideModuleTakeaways = false;

        currentModule = {
          id: `mod_${moduleOrder}`,
          order: moduleOrder,
          title: moduleMatch.title,
          overview: '',
          learningOutcomes: [],
          lessons: [],
          keyTakeaways: [],
          provenance: {
            sourceDocumentId: documentId,
            sourcePage: b.page,
            pageStart: b.page,
            pageEnd: b.page,
            blockIds: [b.id],
            extractionMethod: b.provenance?.extractionMethod || 'native',
            confidence: 0.99,
          },
        };
        modules.push(currentModule);
        continue;
      }

      // If we don't have a module yet, skip pre-module noise
      if (!currentModule) {
        continue;
      }

      // Check for Lesson Heading first
      const lessonMatch = this.matchLessonHeading(b);
      if (lessonMatch) {
        insideModuleOutcomes = false;
        insideModuleTakeaways = false;

        lessonOrderInModule++;
        currentLessonSection = null;

        currentLesson = {
          id: `les_${currentModule.order}_${lessonOrderInModule}`,
          order: lessonOrderInModule,
          title: lessonMatch.title,
          subtitle: lessonMatch.subtitle || '',
          learningObjectives: [],
          content: [],
          resources: [],
          competencies: [],
          durationMinutes: 45,
          provenance: {
            sourceDocumentId: documentId,
            sourcePage: b.page,
            pageStart: b.page,
            pageEnd: b.page,
            blockIds: [b.id],
            extractionMethod: b.provenance?.extractionMethod || 'native',
            confidence: 0.98,
          },
        };

        // Check if next immediate block is a subtitle in parentheses
        if (!currentLesson.subtitle && i + 1 < blocks.length) {
          const nextB = blocks[i + 1];
          const nextText = nextB.text.trim();
          if (
            (nextB.metadata?.isItalic || /^\(.*?\)$/.test(nextText)) &&
            nextText.length > 5 &&
            nextText.length < 180 &&
            !nextText.toLowerCase().includes('learning objectives')
          ) {
            currentLesson.subtitle = nextText.replace(/^\(|\)$/g, '').trim();
            i++; // Consume subtitle block
          }
        }

        currentModule.lessons.push(currentLesson);
        continue;
      }

      // 2. Detect Module-Level Sections (Overview, Outcomes, Takeaways)
      if (/^(module overview|overview)[:\s]/i.test(text) || (b.metadata?.isItalic && text.length > 50 && currentModule.lessons.length === 0 && !currentModule.overview)) {
        insideModuleOutcomes = false;
        currentModule.overview = (currentModule.overview ? currentModule.overview + ' ' : '') + text.replace(/^(module overview|overview)[:\s]*/i, '').trim();
        continue;
      }

      if (/^(module learning outcomes|module outcomes|learning outcomes)[:\s]*$/i.test(text)) {
        insideModuleOutcomes = true;
        continue;
      }

      if (insideModuleOutcomes && currentModule.lessons.length === 0) {
        if (b.type === 'heading') {
          insideModuleOutcomes = false;
        } else {
          const outcomes = this.extractListItems(b);
          if (outcomes.length > 0) {
            currentModule.learningOutcomes.push(...outcomes);
            continue;
          }
        }
      }

      // Detect Module Key Takeaways (usually at end of module)
      if (/^(module key takeaways|key takeaways|module takeaways)[:\s]*$/i.test(text)) {
        insideModuleTakeaways = true;
        currentLesson = null;
        currentLessonSection = null;
        continue;
      }

      if (insideModuleTakeaways) {
        if (b.type === 'heading') {
          insideModuleTakeaways = false;
        } else {
          const takeaways = this.extractListItems(b);
          if (takeaways.length > 0) {
            currentModule.keyTakeaways.push(...takeaways);
            continue;
          }
        }
      }

      // 4. Inside Lesson Parsing
      if (currentLesson) {
        // Section classifier inside lesson
        const lower = text.toLowerCase();

        if (/^(learning objectives|lesson objectives|objectives)[:\s]*$/i.test(lower)) {
          currentLessonSection = 'OBJECTIVES';
          continue;
        }

        if (/^(content|lesson content|instructional content)[:\s]*$/i.test(lower)) {
          currentLessonSection = 'CONTENT';
          continue;
        }

        if (/^(knowledge check|self check|quiz|knowledge-check)[:\s]*$/i.test(lower)) {
          currentLessonSection = 'KNOWLEDGE_CHECK';
          continue;
        }

        // Capture content based on active section
        if (currentLessonSection === 'OBJECTIVES') {
          const objectives = this.extractListItems(b);
          if (objectives.length > 0) {
            currentLesson.learningObjectives.push(...objectives);
          } else if (text.length > 0) {
            currentLesson.learningObjectives.push(text);
          }
          continue;
        }

        if (currentLessonSection === 'KNOWLEDGE_CHECK') {
          this.parseKnowledgeCheckBlock(b, currentLesson);
          continue;
        }

        // Default or explicit CONTENT section
        // Check if block is a Knowledge check Q/A appearing without header
        if (/^Q[:\s]|^Question[:\s]/i.test(text)) {
          currentLessonSection = 'KNOWLEDGE_CHECK';
          this.parseKnowledgeCheckBlock(b, currentLesson);
          continue;
        }

        // Add to lesson content
        currentLesson.content.push({
          type: b.type,
          text,
          html: b.html,
          level: b.level,
          provenance: b.provenance,
        });
      }
    }

    // Validation checks
    for (const m of modules) {
      if (m.lessons.length === 0) {
        issues.push({
          type: 'EMPTY_MODULE',
          location: `Module ${m.order}: ${m.title}`,
          message: `Module "${m.title}" contains no parsed lessons.`,
          severity: 'ERROR',
        });
      }
      for (const l of m.lessons) {
        if (l.content.length === 0) {
          warnings.push(`Lesson "${l.title}" in Module "${m.title}" has no content paragraphs.`);
          l.needsReview = true;
        }
        if (!l.knowledgeCheck) {
          warnings.push(`Lesson "${l.title}" has no explicit knowledge check question.`);
        }
      }
    }

    return { modules, issues, warnings };
  }

  /**
   * Multi-signal Module Header Matching
   */
  private matchModuleHeading(b: NormalizedBlock): { order: number; title: string } | null {
    const text = b.text.trim();

    // Signal 1: Explicit "Module X: Title"
    const modRegex = /^(?:module|chapter|unit|part)\s+([0-9ivx]+)[:\s.-]+(.*)$/i;
    const match = text.match(modRegex);
    if (match) {
      const numStr = match[1];
      const rawTitle = match[2].trim();
      const order = this.parseNumericOrder(numStr);
      const title = this.cleanTitle(rawTitle);
      return { order, title: title || `Module ${order}` };
    }

    // Signal 2: Heading 1 with numbering (e.g. "1. Advanced Atmospheric Dynamics & NWP")
    if (b.type === 'heading' && b.level === 1) {
      const numPrefixMatch = text.match(/^(\d+)\.\s+([a-zA-Z].*)$/);
      if (numPrefixMatch && !text.includes('Lesson') && text.length < 90) {
        const order = parseInt(numPrefixMatch[1], 10);
        return { order, title: this.cleanTitle(numPrefixMatch[2]) };
      }
    }

    return null;
  }

  /**
   * Multi-signal Lesson Header Matching
   */
  private matchLessonHeading(b: NormalizedBlock): { order: number; title: string; subtitle?: string } | null {
    const text = b.text.trim();

    // Signal 1: Explicit "Lesson X: Title", "Section X: Title", "Lesson 1.1: Title"
    const lesRegex = /^(?:lesson|section)\s+([0-9ivx]+(?:\.[0-9]+)?)[:\s.-]+(.*)$/i;
    const match = text.match(lesRegex);
    if (match) {
      const numStr = match[1];
      let rawTitle = match[2].trim();
      const order = this.parseNumericOrder(numStr.split('.')[0]);

      // Check if subtitle is inline in parentheses: e.g. "Title (Subtitle)"
      let subtitle: string | undefined;
      const parenMatch = rawTitle.match(/^(.*?)\s*\((.*?)\)$/);
      if (parenMatch) {
        rawTitle = parenMatch[1].trim();
        subtitle = parenMatch[2].trim();
      }

      return {
        order,
        title: this.cleanTitle(rawTitle),
        subtitle,
      };
    }

    // Signal 2: Heading 2 with numbering (e.g. "1. Circulation Theorems and Pressure Systems")
    if (b.type === 'heading' && (b.level === 2 || b.metadata?.isBold)) {
      const numPrefixMatch = text.match(/^(\d+(?:\.\d+)?)\.?\s+([a-zA-Z].*)$/);
      if (numPrefixMatch && text.length < 120 && !/^(module|overview|takeaways|knowledge|objectives)/i.test(text)) {
        let rawTitle = numPrefixMatch[2].trim();
        let subtitle: string | undefined;
        const parenMatch = rawTitle.match(/^(.*?)\s*\((.*?)\)$/);
        if (parenMatch) {
          rawTitle = parenMatch[1].trim();
          subtitle = parenMatch[2].trim();
        }
        const order = parseInt(numPrefixMatch[1].split('.')[0], 10) || 1;
        return {
          order,
          title: this.cleanTitle(rawTitle),
          subtitle,
        };
      }
    }

    return null;
  }

  private parseKnowledgeCheckBlock(b: NormalizedBlock, lesson: CandidateLesson) {
    const text = b.text.trim();

    if (!lesson.knowledgeCheck) {
      lesson.knowledgeCheck = {
        question: '',
        answer: '',
        confidence: 0.95,
        provenance: b.provenance,
      };
    }

    // Check Question: e.g. "Q: Why does Kelvin's...?" or "1. What is...?"
    if (/^(?:q|question|\d+\.)[:\s]/i.test(text)) {
      const qText = text.replace(/^(?:q|question|\d+\.)[:\s]*/i, '').trim();
      lesson.knowledgeCheck.question = qText;
      return;
    }

    // Check Answer: e.g. "A: Because a front..." or "Answer: B"
    if (/^(?:a|answer)[:\s]/i.test(text)) {
      const aText = text.replace(/^(?:a|answer)[:\s]*/i, '').trim();
      lesson.knowledgeCheck.answer = aText;
      return;
    }

    // If question is empty and block doesn't start with A:, assume question
    if (!lesson.knowledgeCheck.question && text.length > 10) {
      lesson.knowledgeCheck.question = text;
    } else if (!lesson.knowledgeCheck.answer && text.length > 5) {
      lesson.knowledgeCheck.answer = text;
    }
  }

  private extractListItems(b: NormalizedBlock): string[] {
    if (b.metadata?.bulletItems && b.metadata.bulletItems.length > 0) {
      return b.metadata.bulletItems.map((item) => this.cleanListItem(item)).filter(Boolean);
    }

    // Fallback: split by lines starting with •, -, *, or 1.
    const lines = b.text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const items: string[] = [];

    for (const l of lines) {
      const clean = this.cleanListItem(l);
      if (clean) items.push(clean);
    }

    return items.length > 0 ? items : [b.text.trim()];
  }

  private parseGlossaryBlock(b: NormalizedBlock): CandidateGlossaryItem[] {
    const entries: CandidateGlossaryItem[] = [];
    const text = b.text.trim();

    // Pattern: "Term — Definition" or "Term: Definition"
    const regex = /^([A-Za-z0-9\s()'-]+?)\s*(?:—|-|:)\s*(.+)$/;
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

    for (const line of lines) {
      const match = line.match(regex);
      if (match) {
        entries.push({
          term: match[1].trim(),
          definition: match[2].trim(),
        });
      }
    }

    return entries;
  }

  private parseReferencesBlock(b: NormalizedBlock): CandidateReferenceItem[] {
    const entries: CandidateReferenceItem[] = [];
    const items = this.extractListItems(b);

    for (const it of items) {
      if (it.length > 5) {
        entries.push({
          title: it,
          citation: it,
        });
      }
    }

    return entries;
  }

  private cleanTitle(title: string): string {
    return title
      .replace(/^(?:module|lesson)\s+[0-9ivx]+[:\s.-]*/i, '')
      .replace(/^\d+\.?\s+/, '')
      .replace(/&amp;/g, '&')
      .trim();
  }

  private cleanListItem(item: string): string {
    return item.replace(/^[•*–-]\s*/, '').replace(/^\d+[\.)]\s*/, '').trim();
  }

  private parseNumericOrder(numStr: string): number {
    const n = parseInt(numStr, 10);
    if (!isNaN(n)) return n;
    // Roman numeral fallback
    const romanMap: Record<string, number> = { i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9, x: 10 };
    return romanMap[numStr.toLowerCase()] || 1;
  }

  private inferCategory(title: string): string {
    const lower = title.toLowerCase();
    if (lower.includes('forecaster') || lower.includes('meteorology') || lower.includes('synoptic')) {
      return 'Synoptic Meteorology & Operational Forecasting';
    }
    if (lower.includes('radar') || lower.includes('satellite') || lower.includes('remote sensing')) {
      return 'Remote Sensing & Observational Technology';
    }
    if (lower.includes('climate') || lower.includes('hydrology')) {
      return 'Climate Science & Hydrometeorology';
    }
    return 'Operational Meteorology';
  }
}

export const courseStructureAnalyzer = new CourseStructureAnalyzer();
export const DocumentStructureAnalyzerService = CourseStructureAnalyzer;
export default courseStructureAnalyzer;
