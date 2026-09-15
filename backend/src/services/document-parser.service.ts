import fs from 'fs';
import path from 'path';
import mammoth from 'mammoth';
import * as pdfParseModule from 'pdf-parse';
import prisma from '../database/client';
import logger from '../logger/winston.logger';
import { documentExtractorService } from './document-extractor.service';
import { courseStructureAnalyzer } from './document-structure-analyzer.service';
import { llmValidationService } from './llm-validation.service';
import { CourseCandidate } from '../types/course-candidate';

export interface ContentBlockProvenance {
    sourceDocumentId?: string;
    sourceSection?: string;
    sourceParagraph?: number;
    sourcePage?: number;
    confidence: number;
}

export type ContentBlockType =
    | 'paragraph'
    | 'heading'
    | 'bullet_list'
    | 'numbered_list'
    | 'callout'
    | 'example'
    | 'table'
    | 'quote'
    | 'code'
    | 'divider';

export interface ContentBlock {
    id: string;
    type: ContentBlockType;
    content: any; // string, string[] for lists, or { headers: string[], rows: string[][] } for tables
    metadata?: {
        level?: number;
        variant?: 'info' | 'warning' | 'tip';
        caption?: string;
        language?: string;
        headers?: string[];
        rows?: string[][];
    };
    provenance?: ContentBlockProvenance;
}

export interface ExtractedQuestionOption {
    id: string;
    optionText: string;
    isCorrect: boolean;
    orderIndex: number;
}

export interface ExtractedKnowledgeCheck {
    id: string;
    questionText: string;
    questionType: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE';
    options: ExtractedQuestionOption[];
    explanation?: string;
    marks: number;
    needsReview?: boolean;
    confidence: number;
    provenance?: ContentBlockProvenance;
}

export interface ExtractedTopicMapping {
    name: string;
    code: string;
    description?: string;
    importance: number;
    difficulty: number;
    estimatedMinutes: number;
    matchedCompetencyId?: string;
    matchedCompetencyName?: string;
    confidence: number;
    status: 'HIGH' | 'REVIEW_RECOMMENDED' | 'NEEDS_REVIEW';
    prerequisites?: string[];
}

export interface ExtractedLesson {
    id: string;
    title: string;
    orderIndex: number;
    durationMinutes: number;
    description?: string;
    learningObjectives: string[];
    contentBlocks: ContentBlock[];
    keyTakeaways: string[];
    knowledgeChecks: ExtractedKnowledgeCheck[];
    suggestedTopics: ExtractedTopicMapping[];
    provenance?: ContentBlockProvenance;
    sourceProvenance?: ContentBlockProvenance;
    needsReview?: boolean;
    status: 'READY' | 'NEEDS_REVIEW';
}

export interface ExtractedModule {
    id: string;
    title: string;
    orderIndex: number;
    description?: string;
    lessons: ExtractedLesson[];
    provenance?: ContentBlockProvenance;
}

export interface CourseSpecialSections {
    overview?: string;
    targetAudience?: string;
    learningOutcomes?: string[];
    prerequisitesText?: string;
    glossary?: Array<{ term: string; definition: string }>;
    references?: Array<{ title: string; url?: string; notes?: string }>;
}

export interface ParsedCourseHierarchy {
    title: string;
    course: {
        title: string;
        category?: string;
        difficulty?: string;
    };
    category?: string;
    difficulty?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
    specialSections: CourseSpecialSections;
    modules: ExtractedModule[];
    detectedTOC: Array<{ title: string; level: number; page?: number }>;
    globalTopics: ExtractedTopicMapping[];
    topicPrerequisites: Array<{ fromTopicCode: string; toTopicCode: string }>;
    overallConfidence: number;
    summary: {
        totalModules: number;
        totalLessons: number;
        totalTopics: number;
        totalCompetencyMappings: number;
        totalKnowledgeChecks: number;
        totalGlossaryTerms: number;
        totalReferences: number;
        overallConfidence: number;
    };
    warnings: string[];
    reviewItemsCount: number;
    candidate?: CourseCandidate;
}

export class DocumentParserService {
    /**
     * Parse DOCX or PDF document into a rich, structured course hierarchy
     */
    public async parseDocument(
        fileBufferOrPath: Buffer | string,
        fileType: 'DOCX' | 'PDF',
        sourceDocumentId?: string,
        originalFileName?: string
    ): Promise<ParsedCourseHierarchy> {
        let fileBuffer: Buffer;
        if (typeof fileBufferOrPath === 'string') {
            fileBuffer = fs.readFileSync(fileBufferOrPath);
            if (!originalFileName) {
                originalFileName = path.basename(fileBufferOrPath);
            }
        } else {
            fileBuffer = fileBufferOrPath;
        }

        logger.info(`Starting document parsing: type=${fileType}, documentId=${sourceDocumentId}`);

        // 1. Multi-Stage Document Extraction & Block Normalization (with native check & OCR gating)
        const normalizedDoc = await documentExtractorService.extract(
            fileBuffer,
            fileType,
            sourceDocumentId || 'doc',
            originalFileName
        );

        // 2. Deterministic Multi-Signal Structure Analysis & TOC Deduplication
        const candidate = courseStructureAnalyzer.analyze(normalizedDoc);

        // 3. LLM Structured Validation (validates boundaries & integrity)
        const validationResult = await llmValidationService.validateCandidate(candidate, normalizedDoc);

        // Merge validation results
        candidate.validation.valid = validationResult.valid;
        candidate.confidence.overallConfidence = validationResult.confidence;
        if (validationResult.warnings.length > 0) {
            candidate.validation.warnings = Array.from(
                new Set([...candidate.validation.warnings, ...validationResult.warnings])
            );
        }

        // 4. Map Candidate to ParsedCourseHierarchy
        const specialSections: CourseSpecialSections = {
            overview: candidate.course.description,
            targetAudience: candidate.course.targetAudience.join('\n'),
            learningOutcomes: candidate.course.learningOutcomes,
            prerequisitesText: candidate.course.prerequisites.join('\n'),
            glossary: candidate.glossary,
            references: candidate.references.map((r) => ({ title: r.title, notes: r.citation })),
        };

        const modules: ExtractedModule[] = candidate.modules.map((m) => {
            const lessons: ExtractedLesson[] = m.lessons.map((l) => {
                const contentBlocks: ContentBlock[] = l.content.map((c, idx) => ({
                    id: `blk-${m.order}-${l.order}-${idx + 1}`,
                    type: (c.type === 'heading' ? 'heading' : c.type === 'list' ? 'bullet_list' : 'paragraph') as any,
                    content: c.text,
                    provenance: c.provenance,
                }));

                const knowledgeChecks: ExtractedKnowledgeCheck[] = [];
                if (l.knowledgeCheck && l.knowledgeCheck.question) {
                    knowledgeChecks.push({
                        id: `kc-${m.order}-${l.order}`,
                        questionText: l.knowledgeCheck.question,
                        questionType: 'SINGLE_CHOICE',
                        options: [
                            {
                                id: 'opt-A',
                                optionText: l.knowledgeCheck.answer,
                                isCorrect: true,
                                orderIndex: 0,
                            },
                        ],
                        explanation: l.knowledgeCheck.answer,
                        marks: 1.0,
                        confidence: 0.95,
                        provenance: l.knowledgeCheck.provenance,
                    });
                }

                return {
                    id: `les-${m.order}-${l.order}`,
                    title: l.title,
                    subtitle: l.subtitle,
                    orderIndex: l.order - 1,
                    durationMinutes: l.durationMinutes || 45,
                    description:
                        contentBlocks[0]?.content
                            ? String(contentBlocks[0].content).substring(0, 150) + '...'
                            : undefined,
                    learningObjectives: l.learningObjectives,
                    contentBlocks,
                    keyTakeaways: m.keyTakeaways,
                    knowledgeChecks,
                    suggestedTopics: [],
                    provenance: l.provenance,
                    sourceProvenance: l.provenance,
                    needsReview: l.needsReview,
                    status: l.needsReview ? 'NEEDS_REVIEW' : 'READY',
                };
            });

            return {
                id: `mod-${m.order}`,
                title: m.title,
                orderIndex: m.order - 1,
                description: m.overview,
                lessons,
                provenance: m.provenance,
            };
        });

        // 5. Semantic Topic Extraction & Competency Mapping
        const { globalTopics, topicPrerequisites } = await this.extractAndMapTopics(modules, specialSections);

        const totalLessons = modules.reduce((acc, m) => acc + m.lessons.length, 0);
        const totalKnowledgeChecks = modules.reduce(
            (acc, m) => acc + m.lessons.reduce((lAcc, l) => lAcc + l.knowledgeChecks.length, 0),
            0
        );
        const category = candidate.course.category || this.inferCategory(candidate.course.title, globalTopics);
        const overallConfidence = candidate.confidence.overallConfidence;

        logger.info(
            `Parsed course hierarchy successfully: modules=${modules.length}, lessons=${totalLessons}, confidence=${overallConfidence.toFixed(2)}`
        );

        return {
            title: candidate.course.title,
            course: {
                title: candidate.course.title,
                category,
                difficulty: 'INTERMEDIATE',
            },
            category,
            difficulty: 'INTERMEDIATE',
            specialSections,
            modules,
            detectedTOC: candidate.validation.expectedLessons > 0 ? [{ title: 'Table of Contents', level: 1 }] : [],
            globalTopics,
            topicPrerequisites,
            overallConfidence,
            summary: {
                totalModules: modules.length,
                totalLessons,
                totalTopics: globalTopics.length,
                totalCompetencyMappings: globalTopics.filter((t) => t.matchedCompetencyId).length,
                totalKnowledgeChecks,
                totalGlossaryTerms: specialSections.glossary?.length || 0,
                totalReferences: specialSections.references?.length || 0,
                overallConfidence,
            },
            warnings: candidate.validation.warnings,
            reviewItemsCount: candidate.validation.warnings.length,
            candidate,
        };
    }

    /**
     * Deterministic DOCX parser using Mammoth
     */
    public async parseDocx(
        buffer: Buffer
    ): Promise<Array<{ title: string; level: number; text: string; page?: number; html?: string }>> {
        const htmlResult = await mammoth.convertToHtml({ buffer });
        const html = htmlResult.value;

        // Split HTML by major heading tags (h1, h2) so h3 intra-lesson headings remain within content
        const headingRegex = /<h([1-2])[^>]*>(.*?)<\/h\1>/gi;
        const sections: Array<{ title: string; level: number; text: string; page?: number; html?: string }> = [];

        let lastIndex = 0;
        let match: RegExpExecArray | null;
        let currentHeading: { title: string; level: number } | null = null;
        let pIndex = 1;

        while ((match = headingRegex.exec(html)) !== null) {
            const level = parseInt(match[1], 10);
            const rawTitle = match[2].replace(/<[^>]+>/g, '').trim();

            if (currentHeading) {
                const chunkHtml = html.substring(lastIndex, match.index).trim();
                const plainText = this.stripHtml(chunkHtml);
                // Always push the heading section even if chunkHtml is empty
                // (e.g. A Module heading immediately followed by a Lesson heading)
                sections.push({
                    title: currentHeading.title,
                    level: currentHeading.level,
                    text: plainText,
                    html: chunkHtml,
                    page: Math.ceil(pIndex / 4),
                });
                pIndex++;
            } else if (match.index > 0) {
                // Content before the first heading
                const introHtml = html.substring(0, match.index).trim();
                const introText = this.stripHtml(introHtml);
                if (introText.length > 0) {
                    const firstLine = introText.split('\n')[0].trim();
                    const titleCandidate = (firstLine.length > 3 && firstLine.length < 100) ? firstLine : 'Course Overview';
                    sections.push({
                        title: titleCandidate,
                        level: 1,
                        text: introText,
                        html: introHtml,
                        page: 1,
                    });
                }
            }

            currentHeading = { title: rawTitle, level };
            lastIndex = match.index + match[0].length;
        }

        // Add the final section after the last heading
        if (currentHeading) {
            const tailHtml = html.substring(lastIndex).trim();
            const tailText = this.stripHtml(tailHtml);
            sections.push({
                title: currentHeading.title,
                level: currentHeading.level,
                text: tailText,
                html: tailHtml,
                page: Math.ceil(pIndex / 4),
            });
        }

        // If no HTML headings were detected, fallback to raw text parsing
        if (sections.length === 0) {
            const rawTextResult = await mammoth.extractRawText({ buffer });
            return this.parsePlainTextSections(rawTextResult.value);
        }

        return sections;
    }

    /**
     * Deterministic PDF parser using pdf-parse
     */
    public async parsePdf(
        buffer: Buffer
    ): Promise<Array<{ title: string; level: number; text: string; page?: number; html?: string }>> {
        const PDFParseClass = (pdfParseModule as any).PDFParse || (pdfParseModule as any).default?.PDFParse;

        let fullText = '';
        let pageList: Array<{ text: string; num: number }> = [];

        if (PDFParseClass) {
            const parser = new PDFParseClass({ data: buffer });
            try {
                const result = await parser.getText();
                pageList = result.pages || [];
                fullText = pageList.map((p) => p.text).join('\n\n--- PAGE BREAK ---\n\n');
            } catch (err: any) {
                logger.warn(`PDFParse class failed, trying fallback function: ${err.message}`);
            }
        }

        if (pageList.length > 0) {
            return this.parsePageBasedPdfSections(pageList);
        }

        if (!fullText) {
            fullText = buffer.toString('utf-8');
        }

        // Fallback to plain text splitting
        return this.parsePlainTextSections(fullText);
    }

    private parsePageBasedPdfSections(
        pages: Array<{ text: string; num: number }>
    ): Array<{ title: string; level: number; text: string; page?: number }> {
        const sections: Array<{ title: string; level: number; text: string; page?: number }> = [];
        let currentSection: { title: string; level: number; text: string; page: number } | null = null;

        for (const page of pages) {
            const lines = page.text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                const headingMatch = this.detectHeadingInLine(line);

                if (headingMatch) {
                    if (currentSection) {
                        sections.push(currentSection);
                    }
                    currentSection = {
                        title: headingMatch.title,
                        level: headingMatch.level,
                        text: '',
                        page: page.num,
                    };
                } else {
                    if (!currentSection) {
                        currentSection = {
                            title: 'Course Overview',
                            level: 1,
                            text: line,
                            page: page.num,
                        };
                    } else {
                        currentSection.text += (currentSection.text ? '\n' : '') + line;
                    }
                }
            }
        }

        if (currentSection) {
            sections.push(currentSection);
        }

        return sections;
    }

    private parsePlainTextSections(
        rawText: string
    ): Array<{ title: string; level: number; text: string; page?: number }> {
        const lines = rawText.split(/\r?\n/).map((l) => l.trim());
        const sections: Array<{ title: string; level: number; text: string; page?: number }> = [];
        let currentSection: { title: string; level: number; text: string; page?: number } | null = null;
        let lineCount = 0;

        for (const line of lines) {
            lineCount++;
            const pageEstimate = Math.max(1, Math.ceil(lineCount / 45));

            if (!line) continue;

            const headingMatch = this.detectHeadingInLine(line);
            if (headingMatch) {
                if (currentSection) {
                    sections.push(currentSection);
                }
                currentSection = {
                    title: headingMatch.title,
                    level: headingMatch.level,
                    text: '',
                    page: pageEstimate,
                };
            } else {
                if (!currentSection) {
                    currentSection = {
                        title: 'Course Overview',
                        level: 1,
                        text: line,
                        page: pageEstimate,
                    };
                } else {
                    currentSection.text += (currentSection.text ? '\n' : '') + line;
                }
            }
        }

        if (currentSection) {
            sections.push(currentSection);
        }

        return sections;
    }

    private detectHeadingInLine(line: string): { title: string; level: number } | null {
        const clean = line.trim();

        // Lines with dot leaders or ending in page numbers are TOC items, not new section headings
        if (/\.{2,}|\s{3,}(?:page\s*)?\d+$/i.test(clean)) {
            return null;
        }

        // Special section titles (Course Level)
        if (/^(?:table of contents|contents|course outline|syllabus outline)$/i.test(clean)) {
            return { title: clean, level: 1 };
        }
        if (/^(?:course overview|about this course|course description|learning outcomes|target audience|prerequisites|glossary|references|key terminology)$/i.test(clean)) {
            return { title: clean, level: 2 };
        }

        // Intra-lesson labels belong INSIDE a lesson, NOT as separate lesson headings!
        if (/^(?:objectives|learning objectives|key takeaways|summary|summary of key points|knowledge check|quiz|practice questions|assessment questions|check your understanding)$/i.test(clean)) {
            return null;
        }

        // Module level regex
        if (/^(?:module|chapter|unit|part)\s+([0-9ivx]+)[:\s.-]*(.*)$/i.test(clean)) {
            return { title: clean, level: 1 };
        }

        // Lesson level regex (e.g. "1.1 Atmospheric Circulation" or "Lesson 1: Introduction")
        if (/^(?:lesson\s+[0-9]+|\d+\.\d+|\d+\.)\s*[:.-]?\s*(.*)$/i.test(clean) && clean.length < 120) {
            return { title: clean, level: 2 };
        }

        // All uppercase short line (likely title/heading, but exclude labels like NOTE, EXAMPLE, TIP, WARNING)
        if (
            clean.length >= 4 &&
            clean.length <= 60 &&
            clean === clean.toUpperCase() &&
            !/[.;]$/.test(clean) &&
            !/^(?:NOTE|EXAMPLE|TIP|WARNING|CAUTION|ANSWER|QUESTION)/i.test(clean)
        ) {
            return { title: clean, level: 2 };
        }

        return null;
    }

    /**
     * Extract or infer course title
     */
    public extractCourseTitle(
        sections: Array<{ title: string; level: number; text: string }>,
        originalFileName?: string
    ): string {
        // Priority 1: Check section 0 title or text
        if (sections.length > 0) {
            const s0 = sections[0];
            if (
                s0.title &&
                !/^(table of contents|contents|course overview|module|chapter|unit|learning outcomes|target audience|prerequisites|glossary|references)/i.test(s0.title) &&
                s0.title.length < 100
            ) {
                return s0.title;
            }
            if (s0.text) {
                const firstLine = s0.text.split('\n')[0].trim();
                if (
                    firstLine.length > 4 &&
                    firstLine.length < 100 &&
                    !/^(table of contents|contents|course overview|syllabus|learning outcomes|target audience|prerequisites)/i.test(firstLine)
                ) {
                    return firstLine;
                }
            }
        }

        // Priority 2: Look for any section with a prominent course title before modules start
        for (const s of sections) {
            if (
                s.title &&
                !/^(table of contents|contents|course overview|module|chapter|unit|learning outcomes|target audience|prerequisites|glossary|references|key terminology|about this course)/i.test(s.title) &&
                s.title.length < 100
            ) {
                return s.title;
            }
        }

        // Priority 3: Fallback to cleaned filename
        if (originalFileName) {
            return originalFileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        }

        return 'Imported Capacity Building Course';
    }

    /**
     * Detect Table of Contents (TOC) and suppress it from duplicating course content
     */
    public detectAndFilterTOC(
        sections: Array<{ title: string; level: number; text: string; page?: number; html?: string }>
    ): {
        detectedTOC: Array<{ title: string; level: number; page?: number }>;
        filteredSections: Array<{ title: string; level: number; text: string; page?: number; html?: string }>;
    } {
        const detectedTOC: Array<{ title: string; level: number; page?: number }> = [];
        const filteredSections: Array<{ title: string; level: number; text: string; page?: number; html?: string }> = [];

        for (const sec of sections) {
            const isTOC = /^(table of contents|contents|course outline|syllabus outline)$/i.test(sec.title.trim());

            if (isTOC) {
                // Parse TOC items strictly as navigation metadata
                const lines = sec.text.split('\n').map((l) => l.trim()).filter(Boolean);
                for (const l of lines) {
                    const pageMatch = l.match(/(?:page|\.{2,}|\s+)(\d+)$/i);
                    const page = pageMatch ? parseInt(pageMatch[1], 10) : sec.page;
                    const cleanTitle = l.replace(/(?:page|\.{2,}|\s+)\d+$/i, '').trim();
                    if (cleanTitle) {
                        detectedTOC.push({
                            title: cleanTitle,
                            level: /^\d+\.\d+/.test(cleanTitle) ? 2 : 1,
                            page,
                        });
                    }
                }
                logger.info(`Suppressed Table of Contents from content generation. Extracted ${detectedTOC.length} TOC items.`);
                // Suppress this section from content!
                continue;
            }

            filteredSections.push(sec);
        }

        return { detectedTOC, filteredSections };
    }

    /**
     * Classify Special Sections (Overview, Target Audience, Outcomes, Prerequisites, Glossary, References)
     */
    public classifySpecialSections(
        sections: Array<{ title: string; level: number; text: string; page?: number; html?: string }>
    ): {
        specialSections: CourseSpecialSections;
        contentSections: Array<{ title: string; level: number; text: string; page?: number; html?: string }>;
    } {
        const specialSections: CourseSpecialSections = {};
        const contentSections: Array<{ title: string; level: number; text: string; page?: number; html?: string }> = [];

        for (const sec of sections) {
            const cleanTitle = sec.title.toLowerCase().trim();

            if (/(?:course overview|about this course|course description|introduction to course)/i.test(cleanTitle)) {
                specialSections.overview = (specialSections.overview ? specialSections.overview + '\n\n' : '') + sec.text;
                continue;
            }

            if (/(?:target audience|who should take this course|intended audience|who is this course for)/i.test(cleanTitle)) {
                specialSections.targetAudience = (specialSections.targetAudience ? specialSections.targetAudience + '\n\n' : '') + sec.text;
                continue;
            }

            if (/(?:learning outcomes|course objectives|what you will learn|expected outcomes)/i.test(cleanTitle)) {
                const outcomes = this.extractBulletPoints(sec.text);
                specialSections.learningOutcomes = [
                    ...(specialSections.learningOutcomes || []),
                    ...(outcomes.length > 0 ? outcomes : [sec.text]),
                ];
                continue;
            }

            if (/(?:prerequisites|prerequisite knowledge|entry requirements)/i.test(cleanTitle)) {
                specialSections.prerequisitesText = (specialSections.prerequisitesText ? specialSections.prerequisitesText + '\n\n' : '') + sec.text;
                continue;
            }

            if (/(?:glossary|key terminology|definitions)/i.test(cleanTitle)) {
                const glossaryItems = this.extractGlossaryItems(sec.text);
                specialSections.glossary = [
                    ...(specialSections.glossary || []),
                    ...glossaryItems,
                ];
                continue;
            }

            if (/(?:references|bibliography|further reading|recommended reading)/i.test(cleanTitle)) {
                const refItems = this.extractReferences(sec.text);
                specialSections.references = [
                    ...(specialSections.references || []),
                    ...refItems,
                ];
                continue;
            }

            contentSections.push(sec);
        }

        return { specialSections, contentSections };
    }

    /**
     * Segment content into Modules and Lessons
     */
    public segmentModulesAndLessons(
        sections: Array<{ title: string; level: number; text: string; page?: number; html?: string }>,
        sourceDocumentId?: string,
        courseTitle?: string
    ): {
        modules: ExtractedModule[];
        warnings: string[];
        reviewItemsCount: number;
    } {
        const modules: ExtractedModule[] = [];
        const warnings: string[] = [];
        let reviewItemsCount = 0;

        let currentModule: ExtractedModule | null = null;
        let pendingModuleSec: { title: string; text: string; page?: number; html?: string } | null = null;
        let moduleIndex = 0;
        let lessonIndexInModule = 0;

        const finalizePendingModule = () => {
            if (currentModule && currentModule.lessons.length === 0 && pendingModuleSec) {
                // If no sub-lessons were added to this module, turn the module body text into Lesson 1
                const lesson = this.parseLessonContent(
                    pendingModuleSec,
                    1,
                    currentModule.id,
                    sourceDocumentId
                );
                currentModule.lessons.push(lesson);
            }
        };

        for (const sec of sections) {
            // Ignore if section title is just the course title / subtitle
            if (
                courseTitle &&
                (sec.title.trim().toLowerCase() === courseTitle.trim().toLowerCase() ||
                    sec.title.trim().toLowerCase().includes(courseTitle.trim().toLowerCase()))
            ) {
                continue;
            }

            const isModuleHeading = /^(?:module|chapter|unit|part)\s+([0-9ivx]+)[:\s.-]*(.*)$/i.test(sec.title);

            if (isModuleHeading) {
                finalizePendingModule();

                moduleIndex++;
                lessonIndexInModule = 0;

                currentModule = {
                    id: `mod-${moduleIndex}`,
                    title: this.cleanHeadingTitle(sec.title),
                    orderIndex: moduleIndex - 1,
                    description: sec.text ? sec.text.substring(0, 300) : undefined,
                    lessons: [],
                    provenance: {
                        sourceDocumentId,
                        sourceSection: sec.title,
                        sourcePage: sec.page || 1,
                        confidence: 0.95,
                    },
                };
                modules.push(currentModule);
                pendingModuleSec = sec;
                continue;
            }

            // If no module has been created yet, create a default first module
            if (!currentModule) {
                moduleIndex++;
                lessonIndexInModule = 0;
                currentModule = {
                    id: `mod-${moduleIndex}`,
                    title: `Module ${moduleIndex}: Fundamentals`,
                    orderIndex: moduleIndex - 1,
                    description: sec.text ? sec.text.substring(0, 300) : undefined,
                    lessons: [],
                    provenance: {
                        sourceDocumentId,
                        sourceSection: sec.title,
                        sourcePage: sec.page || 1,
                        confidence: 0.95,
                    },
                };
                modules.push(currentModule);
            }

            // Parse lesson inside current module
            lessonIndexInModule++;
            const lesson = this.parseLessonContent(
                sec,
                lessonIndexInModule,
                currentModule.id,
                sourceDocumentId
            );

            if (lesson.needsReview) {
                reviewItemsCount++;
                warnings.push(
                    `Lesson "${lesson.title}" has elements flagged for review (e.g. knowledge checks or missing explicit answers).`
                );
            }

            currentModule.lessons.push(lesson);
        }

        finalizePendingModule();

        // If no modules were created, create one root module
        if (modules.length === 0) {
            const rootModule: ExtractedModule = {
                id: 'mod-1',
                title: 'Module 1: General Curriculum',
                orderIndex: 0,
                lessons: [
                    {
                        id: 'les-1-1',
                        title: 'Foundational Knowledge',
                        orderIndex: 0,
                        durationMinutes: 30,
                        learningObjectives: ['Understand key concepts and operational procedures'],
                        contentBlocks: [
                            {
                                id: 'block-1',
                                type: 'paragraph',
                                content: 'Course content extracted from uploaded document.',
                                provenance: { sourceDocumentId, confidence: 0.9 },
                            },
                        ],
                        keyTakeaways: ['Review operational standards'],
                        knowledgeChecks: [],
                        suggestedTopics: [],
                        status: 'READY',
                    },
                ],
            };
            modules.push(rootModule);
        }

        return { modules, warnings, reviewItemsCount };
    }

    /**
     * Parse structured content, objectives, takeaways, and knowledge checks inside a lesson
     */
    private parseLessonContent(
        sec: { title: string; text: string; page?: number; html?: string },
        orderIndex: number,
        moduleId: string,
        sourceDocumentId?: string
    ): ExtractedLesson {
        const lessonId = `les-${moduleId}-${orderIndex}`;
        const lessonTitle = this.cleanHeadingTitle(sec.title);
        const textLines = sec.text.split('\n').map((l) => l.trim()).filter(Boolean);

        const learningObjectives: string[] = [];
        const keyTakeaways: string[] = [];
        const contentBlocks: ContentBlock[] = [];
        const knowledgeChecks: ExtractedKnowledgeCheck[] = [];
        let needsReview = false;

        let mode: 'OBJECTIVES' | 'CONTENT' | 'TAKEAWAYS' | 'QUIZ' = 'CONTENT';
        let currentQuizQuestion: {
            text: string;
            options: Array<{ id: string; optionText: string; isCorrect: boolean; orderIndex: number }>;
            explanation?: string;
        } | null = null;

        for (let i = 0; i < textLines.length; i++) {
            const line = textLines[i];

            // Section Mode Detectors
            if (/^(?:objectives|learning objectives|by the end of this lesson):?$/i.test(line)) {
                mode = 'OBJECTIVES';
                continue;
            }
            if (/^(?:key takeaways|summary|summary of key points):?$/i.test(line)) {
                if (currentQuizQuestion) {
                    knowledgeChecks.push(this.finalizeKnowledgeCheck(currentQuizQuestion, sourceDocumentId, sec.page));
                    currentQuizQuestion = null;
                }
                mode = 'TAKEAWAYS';
                continue;
            }
            if (/^(?:knowledge check|quiz|practice questions|assessment questions|check your understanding):?$/i.test(line)) {
                mode = 'QUIZ';
                continue;
            }

            // Handle based on current mode
            if (mode === 'OBJECTIVES') {
                if (/^[•*-]|\d+\./.test(line)) {
                    learningObjectives.push(line.replace(/^[•*-]|\d+\.\s*/, '').trim());
                } else if (line.length > 5 && !line.includes(':')) {
                    learningObjectives.push(line);
                } else {
                    mode = 'CONTENT';
                }
            } else if (mode === 'TAKEAWAYS') {
                if (/^[•*-]|\d+\./.test(line)) {
                    keyTakeaways.push(line.replace(/^[•*-]|\d+\.\s*/, '').trim());
                } else if (line.length > 5 && !line.includes(':')) {
                    keyTakeaways.push(line);
                } else {
                    mode = 'CONTENT';
                }
            } else if (mode === 'QUIZ') {
                const questionMatch = line.match(/^(?:question\s*\d+|q\d+)[:.-]\s*(.*)$/i);
                if (questionMatch || (/^\d+\.\s+[A-Z]/.test(line) && !/^[A-D]\)/.test(line))) {
                    if (currentQuizQuestion) {
                        knowledgeChecks.push(this.finalizeKnowledgeCheck(currentQuizQuestion, sourceDocumentId, sec.page));
                    }
                    currentQuizQuestion = {
                        text: questionMatch ? questionMatch[1] : line.replace(/^\d+\.\s*/, ''),
                        options: [],
                    };
                    continue;
                }

                // Check option line
                const optionMatch = line.match(/^([A-D])[).]\s*(.*)$/i);
                if (optionMatch && currentQuizQuestion) {
                    const optionLetter = optionMatch[1].toUpperCase();
                    let optionText = optionMatch[2].trim();
                    let isCorrect = false;

                    // Detect explicit correct marks: *(Correct)*, [x], Answer: B
                    if (/\(correct\)|\[x\]|\*/i.test(optionText)) {
                        isCorrect = true;
                        optionText = optionText.replace(/\(correct\)|\[x\]|\*/gi, '').trim();
                    }

                    currentQuizQuestion.options.push({
                        id: `opt-${optionLetter}`,
                        optionText,
                        isCorrect,
                        orderIndex: currentQuizQuestion.options.length,
                    });
                    continue;
                }

                // Check explicit Answer line
                const answerMatch = line.match(/^(?:answer|correct answer)[:\s]*([A-D])/i);
                if (answerMatch && currentQuizQuestion) {
                    const correctLetter = answerMatch[1].toUpperCase();
                    const letterIndex = correctLetter.charCodeAt(0) - 65;
                    if (currentQuizQuestion.options[letterIndex]) {
                        currentQuizQuestion.options[letterIndex].isCorrect = true;
                    }
                    continue;
                }

                // Explanation
                if (/^(?:explanation|note)[:\s]*(.*)$/i.test(line) && currentQuizQuestion) {
                    currentQuizQuestion.explanation = line.replace(/^(?:explanation|note)[:\s]*/i, '');
                    continue;
                }
            }

            if (mode === 'CONTENT') {
                // Classify content blocks
                const block = this.classifyContentBlock(line, i, sourceDocumentId, sec.title, sec.page);
                if (block) {
                    contentBlocks.push(block);
                }
            }
        }

        if (currentQuizQuestion) {
            knowledgeChecks.push(this.finalizeKnowledgeCheck(currentQuizQuestion, sourceDocumentId, sec.page));
        }

        // Check for knowledge check review status
        for (const q of knowledgeChecks) {
            if (q.needsReview) {
                needsReview = true;
            }
        }

        // Default duration estimation: 5 min base + 2 min per 200 words
        const wordCount = sec.text.split(/\s+/).length;
        const durationMinutes = Math.max(10, Math.min(60, Math.round(5 + wordCount / 100)));

        return {
            id: lessonId,
            title: lessonTitle,
            orderIndex: orderIndex - 1,
            durationMinutes,
            description: contentBlocks.length > 0 && contentBlocks[0].type === 'paragraph'
                ? (contentBlocks[0].content as string).substring(0, 150) + '...'
                : undefined,
            learningObjectives:
                learningObjectives.length > 0
                    ? learningObjectives
                    : [`Master core principles of ${lessonTitle}`],
            contentBlocks:
                contentBlocks.length > 0
                    ? contentBlocks
                    : [
                          {
                              id: `blk-${lessonId}-1`,
                              type: 'paragraph',
                              content: sec.text || 'Comprehensive lecture materials for ' + lessonTitle,
                              provenance: { sourceDocumentId, sourcePage: sec.page, confidence: 0.9 },
                          },
                      ],
            keyTakeaways:
                keyTakeaways.length > 0
                    ? keyTakeaways
                    : [`Apply key methodologies taught in ${lessonTitle}`],
            knowledgeChecks,
            suggestedTopics: [],
            provenance: {
                sourceDocumentId,
                sourceSection: sec.title,
                sourcePage: sec.page || 1,
                confidence: 0.95,
            },
            sourceProvenance: {
                sourceDocumentId,
                sourceSection: sec.title,
                sourcePage: sec.page || 1,
                confidence: 0.95,
            },
            needsReview,
            status: needsReview ? 'NEEDS_REVIEW' : 'READY',
        };
    }

    private finalizeKnowledgeCheck(
        raw: {
            text: string;
            options: Array<{ id: string; optionText: string; isCorrect: boolean; orderIndex: number }>;
            explanation?: string;
        },
        sourceDocumentId?: string,
        page?: number
    ): ExtractedKnowledgeCheck {
        const hasCorrectAnswer = raw.options.some((o) => o.isCorrect);
        const needsReview = !hasCorrectAnswer;

        // If no explicit answer was indicated in source doc, default option 0 as placeholder but flag for review!
        if (!hasCorrectAnswer && raw.options.length > 0) {
            raw.options[0].isCorrect = true;
        }

        return {
            id: `kc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            questionText: raw.text,
            questionType: 'SINGLE_CHOICE',
            options: raw.options,
            explanation: raw.explanation || (needsReview ? 'Correct answer not explicitly marked in source document. Please verify before publishing.' : undefined),
            marks: 1.0,
            needsReview,
            confidence: needsReview ? 0.65 : 0.95,
            provenance: {
                sourceDocumentId,
                sourcePage: page,
                confidence: needsReview ? 0.65 : 0.95,
            },
        };
    }

    /**
     * Classify content block into rich type: paragraph, heading, callout, example, table, quote, bullet_list
     */
    private classifyContentBlock(
        text: string,
        index: number,
        sourceDocumentId?: string,
        section?: string,
        page?: number
    ): ContentBlock | null {
        if (!text || text.length < 2) return null;

        // Callout box
        if (/^(?:note|important|warning|tip|caution)[:\s]/i.test(text)) {
            const variant = /warning|caution/i.test(text) ? 'warning' : /tip/i.test(text) ? 'tip' : 'info';
            return {
                id: `blk-${index}`,
                type: 'callout',
                content: text.replace(/^(?:note|important|warning|tip|caution)[:\s]*/i, ''),
                metadata: { variant },
                provenance: { sourceDocumentId, sourceSection: section, sourcePage: page, confidence: 0.95 },
            };
        }

        // Example box
        if (/^(?:example|case study|operational application)[:\s]/i.test(text)) {
            return {
                id: `blk-${index}`,
                type: 'example',
                content: text.replace(/^(?:example|case study|operational application)[:\s]*/i, ''),
                metadata: { caption: 'Operational Example' },
                provenance: { sourceDocumentId, sourceSection: section, sourcePage: page, confidence: 0.95 },
            };
        }

        // Bullet list
        if (/^[•*-]\s+/.test(text)) {
            return {
                id: `blk-${index}`,
                type: 'bullet_list',
                content: [text.replace(/^[•*-]\s+/, '')],
                provenance: { sourceDocumentId, sourceSection: section, sourcePage: page, confidence: 0.95 },
            };
        }

        // Numbered list
        if (/^\d+\.\s+/.test(text)) {
            return {
                id: `blk-${index}`,
                type: 'numbered_list',
                content: [text.replace(/^\d+\.\s+/, '')],
                provenance: { sourceDocumentId, sourceSection: section, sourcePage: page, confidence: 0.95 },
            };
        }

        // Sub-heading
        if (text.length < 80 && !/[.;]$/.test(text) && (text === text.toUpperCase() || /^[A-Z][a-z0-9\s]+:$/.test(text))) {
            return {
                id: `blk-${index}`,
                type: 'heading',
                content: text.replace(/:$/, ''),
                metadata: { level: 3 },
                provenance: { sourceDocumentId, sourceSection: section, sourcePage: page, confidence: 0.92 },
            };
        }

        // Default paragraph
        return {
            id: `blk-${index}`,
            type: 'paragraph',
            content: text,
            provenance: { sourceDocumentId, sourceSection: section, sourcePage: page, confidence: 0.98 },
        };
    }

    /**
     * Semantic Topic Extraction & Competency Mapping
     */
    private async extractAndMapTopics(
        modules: ExtractedModule[],
        _specialSections: CourseSpecialSections
    ): Promise<{
        globalTopics: ExtractedTopicMapping[];
        topicPrerequisites: Array<{ fromTopicCode: string; toTopicCode: string }>;
    }> {
        // Query active competencies from DB to perform real semantic linking
        const existingCompetencies = await prisma.competency.findMany({
            select: { id: true, name: true, code: true, category: true, description: true },
        });

        const topicsMap = new Map<string, ExtractedTopicMapping>();
        const topicPrerequisites: Array<{ fromTopicCode: string; toTopicCode: string }> = [];

        // Keywords dictionary for scientific and capacity domains
        const domainKeywordRules: Array<{
            keywords: string[];
            topicName: string;
            code: string;
            category: string;
            difficulty: number;
        }> = [
            {
                keywords: ['radar', 'doppler', 'dwr', 'reflectivity', 'beam propagation', 'dual polarization'],
                topicName: 'Doppler Weather Radar & Velocity Interpretation',
                code: 'TOPIC-RADAR-DOPPLER',
                category: 'Observational Systems',
                difficulty: 0.7,
            },
            {
                keywords: ['synoptic', 'circulation', 'pressure systems', 'vorticity', 'cyclone', 'monsoon'],
                topicName: 'Synoptic Scale Weather Systems & Dynamics',
                code: 'TOPIC-SYNOPTIC-DYN',
                category: 'Meteorology',
                difficulty: 0.6,
            },
            {
                keywords: ['numerical weather prediction', 'nwp', 'wrf', 'atmospheric modeling', 'grid resolution'],
                topicName: 'Numerical Weather Prediction & Model Parameterization',
                code: 'TOPIC-NWP-MODEL',
                category: 'Atmospheric Sciences',
                difficulty: 0.8,
            },
            {
                keywords: ['satellite', 'insat', 'infrared', 'water vapor', 'remote sensing', 'visible channel'],
                topicName: 'Satellite Imagery Analysis & Remote Sensing',
                code: 'TOPIC-SAT-REMOTE',
                category: 'Remote Sensing',
                difficulty: 0.65,
            },
            {
                keywords: ['ocean', 'tsunami', 'wave height', 'sea surface temperature', 'incois'],
                topicName: 'Ocean State Forecasting & Coastal Dynamics',
                code: 'TOPIC-OCEAN-COAST',
                category: 'Ocean Sciences',
                difficulty: 0.75,
            },
            {
                keywords: ['seismology', 'earthquake', 'epicenter', 'tectonic', 'richter', 'fault plane'],
                topicName: 'Seismological Signal Processing & Hazard Assessment',
                code: 'TOPIC-SEISMOLOGY-SIG',
                category: 'Geophysics',
                difficulty: 0.85,
            },
            {
                keywords: ['climate', 'climate change', 'ipcc', 'long range forecast', 'anomalies'],
                topicName: 'Climate Variability & Long-Range Forecasting',
                code: 'TOPIC-CLIMATE-VAR',
                category: 'Climate Science',
                difficulty: 0.6,
            },
            {
                keywords: ['aws', 'instrumentation', 'barometer', 'anemometer', 'calibration', 'sensor'],
                topicName: 'Meteorological Sensors & Calibration Protocols',
                code: 'TOPIC-SENSOR-CALIB',
                category: 'Observational Systems',
                difficulty: 0.5,
            },
        ];

        // Gather all corpus text
        const corpus = modules
            .flatMap((m) => [
                m.title,
                ...m.lessons.flatMap((l) => [l.title, ...l.learningObjectives, ...l.keyTakeaways]),
            ])
            .join(' ')
            .toLowerCase();

        // 1. Identify matched topics from domain rules
        for (const rule of domainKeywordRules) {
            const matches = rule.keywords.filter((kw) => corpus.includes(kw));
            if (matches.length > 0) {
                // Find matching competency in DB
                const matchedComp = this.findBestMatchingCompetency(rule.topicName, rule.category, existingCompetencies);

                const confidence = matches.length >= 2 ? 0.95 : 0.82;

                topicsMap.set(rule.code, {
                    name: rule.topicName,
                    code: rule.code,
                    description: `Core competency topic covering ${matches.join(', ')}`,
                    importance: 1.0,
                    difficulty: rule.difficulty,
                    estimatedMinutes: 25,
                    matchedCompetencyId: matchedComp?.id,
                    matchedCompetencyName: matchedComp?.name,
                    confidence,
                    status: confidence >= 0.9 ? 'HIGH' : 'REVIEW_RECOMMENDED',
                });
            }
        }

        // 2. Also extract topics directly from lesson titles if not covered
        modules.forEach((mod, mIdx) => {
            mod.lessons.forEach((les, lIdx) => {
                const code = `TOPIC-${mod.id.toUpperCase()}-${lIdx + 1}`;
                if (!topicsMap.has(code)) {
                    const matchedComp = this.findBestMatchingCompetency(les.title, undefined, existingCompetencies);
                    const topicMapping: ExtractedTopicMapping = {
                        name: les.title,
                        code,
                        description: les.description || `Module lesson topic: ${les.title}`,
                        importance: 1.0,
                        difficulty: 0.5 + Math.min(0.4, (mIdx * 0.1)),
                        estimatedMinutes: les.durationMinutes || 20,
                        matchedCompetencyId: matchedComp?.id,
                        matchedCompetencyName: matchedComp?.name,
                        confidence: matchedComp ? 0.88 : 0.72,
                        status: matchedComp ? 'REVIEW_RECOMMENDED' : 'NEEDS_REVIEW',
                    };
                    topicsMap.set(code, topicMapping);
                    les.suggestedTopics.push(topicMapping);
                }
            });
        });

        const globalTopics = Array.from(topicsMap.values());

        // 3. Propose prerequisite DAG (foundational topics early in list lead into later topics)
        if (globalTopics.length >= 2) {
            for (let i = 0; i < globalTopics.length - 1; i++) {
                if (globalTopics[i].difficulty < globalTopics[i + 1].difficulty) {
                    topicPrerequisites.push({
                        fromTopicCode: globalTopics[i].code,
                        toTopicCode: globalTopics[i + 1].code,
                    });
                }
            }
        }

        return { globalTopics, topicPrerequisites };
    }

    private findBestMatchingCompetency(
        topicName: string,
        category?: string,
        competencies: Array<{ id: string; name: string; code: string; category: string | null; description: string | null }> = []
    ) {
        if (!competencies || competencies.length === 0) return undefined;

        const cleanTopic = topicName.toLowerCase();

        // 1. Direct category match
        if (category) {
            const catMatch = competencies.find(
                (c) => c.category && c.category.toLowerCase() === category.toLowerCase()
            );
            if (catMatch) return catMatch;
        }

        // 2. Keyword/substring match
        for (const comp of competencies) {
            const compName = comp.name.toLowerCase();
            const words = cleanTopic.split(/\s+/).filter((w) => w.length > 4);
            const matches = words.filter((w) => compName.includes(w));
            if (matches.length > 0) {
                return comp;
            }
        }

        return undefined;
    }

    public calculateOverallConfidence(modules: ExtractedModule[], reviewItemsCount: number): number {
        if (modules.length === 0) return 0.5;

        let totalScore = 0;
        let totalItems = 0;

        for (const m of modules) {
            totalScore += m.provenance?.confidence || 0.9;
            totalItems++;

            for (const l of m.lessons) {
                totalScore += l.provenance?.confidence || 0.9;
                totalItems++;

                for (const q of l.knowledgeChecks) {
                    totalScore += q.confidence;
                    totalItems++;
                }
            }
        }

        const avgScore = totalItems > 0 ? totalScore / totalItems : 0.85;
        const penalty = Math.min(0.2, reviewItemsCount * 0.03);
        return Math.max(0.6, Math.min(0.99, avgScore - penalty));
    }

    private cleanHeadingTitle(title: string): string {
        return title
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/<[^>]+>/g, '')
            .replace(/^(?:module|chapter|unit|part)\s+[0-9ivx]+[:\s.-]*/i, '')
            .replace(/^(?:lesson\s+[0-9]+|\d+\.\d+|\d+\.)\s*[:.-]?\s*/i, '')
            .trim();
    }

    private stripHtml(html: string): string {
        return html
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<\/p>/gi, '\n\n')
            .replace(/<\/li>/gi, '\n')
            .replace(/<[^>]+>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    }

    private extractBulletPoints(text: string): string[] {
        return text
            .split('\n')
            .map((l) => l.trim())
            .filter((l) => /^[•*-]|\d+\./.test(l))
            .map((l) => l.replace(/^[•*-]|\d+\.\s*/, '').trim())
            .filter((l) => l.length > 5);
    }

    private extractGlossaryItems(text: string): Array<{ term: string; definition: string }> {
        const items: Array<{ term: string; definition: string }> = [];
        const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

        for (const l of lines) {
            const match = l.match(/^([^:-]+)[:\-]\s*(.*)$/);
            if (match && match[1].length < 50 && match[2].length > 5) {
                items.push({
                    term: match[1].trim(),
                    definition: match[2].trim(),
                });
            }
        }

        return items;
    }

    private extractReferences(text: string): Array<{ title: string; url?: string; notes?: string }> {
        const items: Array<{ title: string; url?: string; notes?: string }> = [];
        const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

        for (const l of lines) {
            const urlMatch = l.match(/(https?:\/\/[^\s]+)/i);
            const title = l.replace(/(https?:\/\/[^\s]+)/i, '').trim();
            if (title.length > 3 || urlMatch) {
                items.push({
                    title: title || (urlMatch ? urlMatch[1] : 'Reference'),
                    url: urlMatch ? urlMatch[1] : undefined,
                });
            }
        }

        return items;
    }

    private inferCategory(title: string, topics: ExtractedTopicMapping[]): string {
        const fullText = (title + ' ' + topics.map((t) => t.name).join(' ')).toLowerCase();
        if (/radar|satellite|remote sensing|instrumentation|sensor/.test(fullText)) {
            return 'Observational Systems';
        }
        if (/ocean|coastal|tsunami|marine/.test(fullText)) {
            return 'Ocean Sciences';
        }
        if (/seismology|earthquake|geophysic/.test(fullText)) {
            return 'Geophysics';
        }
        if (/climate|monsoon|projections/.test(fullText)) {
            return 'Climate Science';
        }
        if (/nwp|model|prediction|dynamics/.test(fullText)) {
            return 'Atmospheric Sciences';
        }
        return 'Meteorology';
    }
}

export const documentParserService = new DocumentParserService();
export default documentParserService;
