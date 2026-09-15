import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { CourseStatus, ImportJobStatus, LessonContentType, QuestionType, Role } from '@prisma/client';
import 'multer';
import prisma from '../database/client';
import logger from '../logger/winston.logger';
import { BadRequestError, ForbiddenError, NotFoundError } from '../errors/app-error';
import { documentParserService, ParsedCourseHierarchy } from './document-parser.service';
import { UserContext } from './course.service';

export class CourseImportService {
    /**
     * Create ingestion job from uploaded file and kick off async pipeline
     */
    public async createImportJob(
        file: Express.Multer.File,
        trainerId: string
    ): Promise<{ jobId: string; documentId: string; status: ImportJobStatus }> {
        return this.createJob(file, trainerId);
    }

    public async createJob(
        file: Express.Multer.File,
        trainerId: string
    ): Promise<{ jobId: string; documentId: string; status: ImportJobStatus }> {
        const ext = path.extname(file.originalname).toLowerCase();
        const fileType: 'DOCX' | 'PDF' = ext === '.docx' || ext === '.doc' ? 'DOCX' : 'PDF';

        // Calculate checksum
        const fileBuffer = fs.readFileSync(file.path);
        const checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');

        // Create CourseDocument record
        const courseDoc = await prisma.courseDocument.create({
            data: {
                fileName: file.originalname,
                fileType,
                storageKey: file.path,
                fileSize: BigInt(file.size),
                checksum,
                uploadedBy: trainerId,
            },
        });

        // Create CourseImportJob record
        const importJob = await prisma.courseImportJob.create({
            data: {
                courseDocumentId: courseDoc.id,
                trainerId,
                status: ImportJobStatus.UPLOADED,
                progress: 10.0,
            },
        });

        logger.info(`Created course import job ${importJob.id} for document ${courseDoc.id}`);

        // Kick off async parsing in background
        this.processJobAsync(importJob.id, file.path, fileType, courseDoc.id, file.originalname).catch(
            (err) => {
                logger.error(`Error in background processing job ${importJob.id}: ${err.message}`, { err });
            }
        );

        return {
            jobId: importJob.id,
            documentId: courseDoc.id,
            status: ImportJobStatus.UPLOADED,
        };
    }

    /**
     * Asynchronous pipeline execution
     */
    public async processJobAsync(
        jobId: string,
        filePath: string,
        fileType: 'DOCX' | 'PDF',
        documentId: string,
        fileName: string
    ): Promise<void> {
        try {
            await prisma.courseImportJob.update({
                where: { id: jobId },
                data: { status: ImportJobStatus.PARSING, progress: 25.0, startedAt: new Date() },
            });

            const buffer = fs.readFileSync(filePath);
            const parsedData = await documentParserService.parseDocument(buffer, fileType, documentId, fileName);

            await prisma.courseImportJob.update({
                where: { id: jobId },
                data: { status: ImportJobStatus.ANALYZING, progress: 65.0 },
            });

            await prisma.courseImportJob.update({
                where: { id: jobId },
                data: { status: ImportJobStatus.VALIDATING, progress: 85.0 },
            });

            await prisma.courseImportJob.update({
                where: { id: jobId },
                data: {
                    status: ImportJobStatus.READY_FOR_REVIEW,
                    progress: 100.0,
                    confidenceScore: parsedData.overallConfidence,
                    parsedData: parsedData as any,
                },
            });

            logger.info(`Course import job ${jobId} is READY_FOR_REVIEW with confidence ${parsedData.overallConfidence.toFixed(2)}`);
        } catch (err: any) {
            logger.error(`Failed to parse document for job ${jobId}: ${err.message}`);
            await prisma.courseImportJob.update({
                where: { id: jobId },
                data: {
                    status: 'FAILED' as any,
                    error: err.message || 'Failed to extract content from uploaded document',
                },
            });
        }
    }

    /**
     * Polling job status
     */
    public async getJobStatus(jobId: string, trainerId?: string) {
        const job = await prisma.courseImportJob.findUnique({
            where: { id: jobId },
            include: { document: true },
        });

        if (!job) {
            throw new NotFoundError(`Import job not found: ${jobId}`);
        }

        if (trainerId && job.trainerId !== trainerId) {
            // Check if admin
            const user = await prisma.user.findUnique({ where: { id: trainerId } });
            if (user?.role !== Role.ADMIN && user?.role !== Role.SUPER_ADMIN) {
                throw new ForbiddenError('You do not have access to this import job');
            }
        }

        return {
            id: job.id,
            status: job.status,
            progress: job.progress,
            error: job.error,
            confidenceScore: job.confidenceScore,
            courseId: job.courseId,
            document: {
                id: job.document.id,
                fileName: job.document.fileName,
                fileType: job.document.fileType,
                fileSize: job.document.fileSize ? Number(job.document.fileSize) : 0,
                uploadedAt: job.document.uploadedAt,
            },
            startedAt: job.startedAt,
            completedAt: job.completedAt,
        };
    }

    /**
     * Detailed preview for review screen
     */
    public async getJobPreview(jobId: string, trainerId?: string) {
        const job = await prisma.courseImportJob.findUnique({
            where: { id: jobId },
            include: { document: true },
        });

        if (!job) {
            throw new NotFoundError(`Import job not found: ${jobId}`);
        }

        if (trainerId && job.trainerId !== trainerId) {
            const user = await prisma.user.findUnique({ where: { id: trainerId } });
            if (user?.role !== Role.ADMIN && user?.role !== Role.SUPER_ADMIN) {
                throw new ForbiddenError('You do not have access to this import job');
            }
        }

        if (job.status !== ImportJobStatus.READY_FOR_REVIEW && job.status !== ImportJobStatus.COMPLETED) {
            return {
                status: job.status,
                progress: job.progress,
                isReady: false,
                error: job.error,
            };
        }

        const parsed = (job.parsedData || {}) as unknown as ParsedCourseHierarchy;

        const totalModules = parsed.modules?.length || 0;
        const totalLessons = parsed.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0;
        const totalKnowledgeChecks =
            parsed.modules?.reduce(
                (acc, m) => acc + (m.lessons?.reduce((lAcc, l) => lAcc + (l.knowledgeChecks?.length || 0), 0) || 0),
                0
            ) || 0;
        const totalTopics = parsed.globalTopics?.length || 0;
        const totalCompetencies = parsed.globalTopics?.filter((t) => t.matchedCompetencyId).length || 0;
        const totalGlossaryTerms = parsed.specialSections?.glossary?.length || 0;
        const totalReferences = parsed.specialSections?.references?.length || 0;
        const overallConfidence = parsed.overallConfidence || 0.95;

        const summaryData = parsed.summary || {
            totalModules,
            totalLessons,
            totalTopics,
            totalCompetencyMappings: totalCompetencies,
            totalKnowledgeChecks,
            totalGlossaryTerms,
            totalReferences,
            overallConfidence,
        };

        const courseData = parsed.course || {
            title: parsed.title || 'Imported Course',
            category: parsed.category || 'Synoptic Meteorology & Weather Forecasting',
            difficulty: parsed.difficulty || 'INTERMEDIATE',
            overview: parsed.specialSections?.overview,
            targetAudience: parsed.specialSections?.targetAudience,
            learningOutcomes: parsed.specialSections?.learningOutcomes,
            prerequisitesText: parsed.specialSections?.prerequisitesText,
        };

        return {
            status: job.status,
            progress: job.progress,
            isReady: true,
            jobId: job.id,
            courseId: job.courseId,
            document: {
                id: job.document.id,
                fileName: job.document.fileName,
                fileType: job.document.fileType,
                fileSize: job.document.fileSize ? Number(job.document.fileSize) : 0,
            },
            // Full structured payload for frontend consumption
            ...parsed,
            course: courseData,
            summary: summaryData,
            modules: parsed.modules || [],
            topics: parsed.globalTopics || [],
            specialSections: parsed.specialSections || {},
            preview: parsed,
            metrics: {
                totalModules,
                totalLessons,
                totalTopics,
                totalCompetencyMappings: totalCompetencies,
                totalKnowledgeChecks,
                totalGlossaryTerms,
                totalReferences,
                overallConfidence,
                warningsCount: parsed.warnings?.length || 0,
                reviewItemsCount: parsed.reviewItemsCount || 0,
            },
        };
    }

    /**
     * Approve and commit parsed course hierarchy to database atomically
     */
    public async approveJob(
        jobId: string,
        userCtxOrId: UserContext | string,
        orgIdOrEdits?: string | Partial<ParsedCourseHierarchy>,
        customEditsParam?: Partial<ParsedCourseHierarchy>
    ) {
        const userId = typeof userCtxOrId === 'string' ? userCtxOrId : userCtxOrId.userId;
        const customEdits = (typeof orgIdOrEdits === 'object' ? orgIdOrEdits : customEditsParam) || {};

        const job = await prisma.courseImportJob.findUnique({
            where: { id: jobId },
            include: { document: true },
        });

        if (!job) {
            throw new NotFoundError(`Import job not found: ${jobId}`);
        }

        if (job.status !== ImportJobStatus.READY_FOR_REVIEW) {
            throw new BadRequestError(`Cannot approve job in status '${job.status}'. Expected 'READY_FOR_REVIEW'.`);
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new ForbiddenError('User not found');

        const baseParsed = (job.parsedData || {}) as unknown as ParsedCourseHierarchy;
        const parsed: ParsedCourseHierarchy = {
            ...baseParsed,
            ...(customEdits || {}),
        };

        // Generate clean unique slug
        const rawSlug = (parsed.title || 'Course')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');
        const uniqueSuffix = crypto.randomBytes(3).toString('hex');
        const slug = `${rawSlug.slice(0, 50)}-${uniqueSuffix}`;

        logger.info(`Starting atomic course creation transaction for job ${jobId}, title="${parsed.title}"`);

        // Transactional commit
        const createdCourse = await prisma.$transaction(async (tx) => {
            // 1. Create Course
            const course = await tx.course.create({
                data: {
                    organizationId: user.organizationId,
                    trainerId: userId,
                    title: parsed.title || 'Imported Course',
                    slug,
                    description: parsed.specialSections?.overview || parsed.title || 'Comprehensive course syllabus',
                    category: parsed.category || 'Meteorology',
                    difficulty: parsed.difficulty || 'INTERMEDIATE',
                    durationMinutes: parsed.modules.reduce(
                        (acc, m) => acc + m.lessons.reduce((lAcc, l) => lAcc + (l.durationMinutes || 20), 0),
                        0
                    ),
                    status: CourseStatus.DRAFT,
                    overview: parsed.specialSections?.overview,
                    targetAudience: parsed.specialSections?.targetAudience,
                    learningOutcomes: parsed.specialSections?.learningOutcomes ? (parsed.specialSections.learningOutcomes as any) : undefined,
                    prerequisitesText: parsed.specialSections?.prerequisitesText,
                    glossary: parsed.specialSections?.glossary ? (parsed.specialSections.glossary as any) : undefined,
                    references: parsed.specialSections?.references ? (parsed.specialSections.references as any) : undefined,
                },
            });

            // 2. Link Document and Job
            await tx.courseDocument.update({
                where: { id: job.courseDocumentId },
                data: { courseId: course.id },
            });

            await tx.courseImportJob.update({
                where: { id: jobId },
                data: {
                    status: ImportJobStatus.COMPLETED,
                    courseId: course.id,
                    completedAt: new Date(),
                },
            });

            // 3. Create Default CompetencyGroup
            const compGroup = await tx.competencyGroup.create({
                data: {
                    courseId: course.id,
                    name: `${course.title} Competencies`,
                    description: 'Automated competency group generated from course builder import',
                    importance: 1.0,
                    orderIndex: 0,
                },
            });

            // 4. Create LearningTopics
            const topicIdByCode = new Map<string, string>();
            const linkedCompetencyIds = new Set<string>();
            const topicCompetencyCreates: Array<{ topicId: string; competencyId: string; weight: number }> = [];
            const courseCompetencyCreates: Array<{ courseId: string; competencyId: string; targetLevel: number; importance: number; weight: number }> = [];

            if (parsed.globalTopics && parsed.globalTopics.length > 0) {
                for (let i = 0; i < parsed.globalTopics.length; i++) {
                    const top = parsed.globalTopics[i];
                    const uniqueCode = `${top.code.slice(0, 40)}-${course.id.slice(0, 6)}-${i}`;
                    const createdTopic = await tx.learningTopic.create({
                        data: {
                            courseId: course.id,
                            groupId: compGroup.id,
                            name: top.name,
                            code: uniqueCode,
                            description: top.description,
                            importance: top.importance || 1.0,
                            difficulty: top.difficulty || 0.5,
                            estimatedMinutes: top.estimatedMinutes || 20,
                            orderIndex: i,
                        },
                    });

                    topicIdByCode.set(top.code, createdTopic.id);

                    // Collect Competency links
                    if (top.matchedCompetencyId) {
                        topicCompetencyCreates.push({
                            topicId: createdTopic.id,
                            competencyId: top.matchedCompetencyId,
                            weight: 1.0,
                        });

                        if (!linkedCompetencyIds.has(top.matchedCompetencyId)) {
                            linkedCompetencyIds.add(top.matchedCompetencyId);
                            courseCompetencyCreates.push({
                                courseId: course.id,
                                competencyId: top.matchedCompetencyId,
                                targetLevel: 2,
                                importance: 1.0,
                                weight: 1.0,
                            });
                        }
                    }
                }

                // Batch insert competency relations
                if (topicCompetencyCreates.length > 0) {
                    await tx.learningTopicCompetency.createMany({
                        data: topicCompetencyCreates,
                        skipDuplicates: true,
                    });
                }
                if (courseCompetencyCreates.length > 0) {
                    await tx.courseCompetency.createMany({
                        data: courseCompetencyCreates,
                        skipDuplicates: true,
                    });
                }
            }

            // 5. Create Topic Prerequisites
            if (parsed.topicPrerequisites && parsed.topicPrerequisites.length > 0) {
                const prereqCreates: Array<{ prerequisiteTopicId: string; dependentTopicId: string; edgeWeight: number }> = [];
                for (const prereq of parsed.topicPrerequisites) {
                    const fromId = topicIdByCode.get(prereq.fromTopicCode);
                    const toId = topicIdByCode.get(prereq.toTopicCode);

                    if (fromId && toId && fromId !== toId) {
                        prereqCreates.push({
                            prerequisiteTopicId: fromId,
                            dependentTopicId: toId,
                            edgeWeight: 1.0,
                        });
                    }
                }
                if (prereqCreates.length > 0) {
                    await tx.topicPrerequisite.createMany({
                        data: prereqCreates,
                        skipDuplicates: true,
                    });
                }
            }

            // 6. Create Modules & Lessons
            const allKnowledgeChecks: Array<{
                questionText: string;
                questionType: QuestionType;
                marks: number;
                explanation?: string;
                options: Array<{ optionText: string; isCorrect: boolean; orderIndex: number }>;
                topicCode?: string;
            }> = [];
            const lessonTopicsToCreate: Array<{ lessonId: string; topicId: string }> = [];

            for (let mIdx = 0; mIdx < parsed.modules.length; mIdx++) {
                const mod = parsed.modules[mIdx];
                const createdModule = await tx.courseModule.create({
                    data: {
                        courseId: course.id,
                        title: mod.title,
                        description: mod.description,
                        orderIndex: mIdx,
                    },
                });

                for (let lIdx = 0; lIdx < mod.lessons.length; lIdx++) {
                    const les = mod.lessons[lIdx];
                    const createdLesson = await tx.lesson.create({
                        data: {
                            moduleId: createdModule.id,
                            title: les.title,
                            description: les.description,
                            contentType: LessonContentType.DOCUMENT,
                            durationMinutes: les.durationMinutes || 20,
                            orderIndex: lIdx,
                            learningObjectives: les.learningObjectives as any,
                            keyTakeaways: les.keyTakeaways as any,
                            sourceProvenance: les.provenance as any,
                            content: JSON.stringify(les.contentBlocks || []),
                        },
                    });

                    // Collect Lesson to LearningTopics
                    if (les.suggestedTopics && les.suggestedTopics.length > 0) {
                        for (const top of les.suggestedTopics) {
                            const topicId = topicIdByCode.get(top.code);
                            if (topicId) {
                                lessonTopicsToCreate.push({
                                    lessonId: createdLesson.id,
                                    topicId,
                                });
                            }
                        }
                    }

                    // Collect knowledge checks for assessment
                    if (les.knowledgeChecks && les.knowledgeChecks.length > 0) {
                        for (const kc of les.knowledgeChecks) {
                            allKnowledgeChecks.push({
                                questionText: kc.questionText,
                                questionType: kc.questionType as QuestionType,
                                marks: kc.marks || 1.0,
                                explanation: kc.explanation,
                                options: kc.options,
                                topicCode: les.suggestedTopics?.[0]?.code,
                            });
                        }
                    }
                }
            }

            // Batch insert lesson topics
            if (lessonTopicsToCreate.length > 0) {
                await tx.lessonTopic.createMany({
                    data: lessonTopicsToCreate,
                    skipDuplicates: true,
                });
            }

            // 7. Create Assessment if Knowledge Checks exist
            if (allKnowledgeChecks.length > 0) {
                const assessment = await tx.assessment.create({
                    data: {
                        courseId: course.id,
                        trainerId: userId,
                        title: `${course.title} - Knowledge Checks`,
                        description: 'Automated knowledge checks extracted from course documents.',
                        subject: course.category,
                        durationMinutes: Math.min(60, allKnowledgeChecks.length * 2),
                        passingScore: 60.0,
                        status: 'DRAFT',
                    },
                });

                for (let qIdx = 0; qIdx < allKnowledgeChecks.length; qIdx++) {
                    const q = allKnowledgeChecks[qIdx];
                    const question = await tx.assessmentQuestion.create({
                        data: {
                            assessmentId: assessment.id,
                            questionText: q.questionText,
                            questionType: q.questionType,
                            marks: q.marks,
                            orderIndex: qIdx,
                            explanation: q.explanation,
                            options: {
                                create: q.options.map((opt) => ({
                                    optionText: opt.optionText,
                                    isCorrect: opt.isCorrect,
                                    orderIndex: opt.orderIndex,
                                })),
                            },
                        },
                    });

                    if (q.topicCode) {
                        const topicId = topicIdByCode.get(q.topicCode);
                        if (topicId) {
                            await tx.assessmentQuestionTopic.create({
                                data: {
                                    questionId: question.id,
                                    topicId,
                                    weight: 1.0,
                                },
                            }).catch(() => {});
                        }
                    }
                }
            }

            return course;
        }, {
            timeout: 300000,
            maxWait: 60000,
        });

        logger.info(`Successfully approved and created course ${createdCourse.id} from job ${jobId}`);
        return createdCourse;
    }
}

export const courseImportService = new CourseImportService();
export default courseImportService;
