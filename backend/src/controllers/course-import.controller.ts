import { Request, Response } from 'express';
import { CourseImportService } from '../services/course-import.service';
import { CourseValidationService } from '../services/course-validation.service';
import { ResponseHelper } from '../errors/response.helper';
import { BadRequestError, ForbiddenError } from '../errors/app-error';
import prisma from '../database/client';
import { CourseStatus } from '@prisma/client';

export class CourseImportController {
    private importService: CourseImportService;
    private validationService: CourseValidationService;

    constructor() {
        this.importService = new CourseImportService();
        this.validationService = new CourseValidationService();
    }

    /**
     * POST /api/v1/courses/import
     * Upload DOCX or PDF and initiate parsing job
     */
    public importDocument = async (req: Request, res: Response): Promise<Response> => {
        const user = req.user as any;
        if (!user || (user.role !== 'TRAINER' && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
            throw new ForbiddenError('Only trainers and administrators can import courses.');
        }

        if (!req.file) {
            throw new BadRequestError('No file provided. Please upload a DOCX or PDF document.');
        }

        const result = await this.importService.createImportJob(req.file, user.id);
        return ResponseHelper.created(res, result, 'Document uploaded successfully. Parsing in progress.');
    };

    /**
     * GET /api/v1/courses/import/:jobId
     * Check processing progress
     */
    public getJobStatus = async (req: Request, res: Response): Promise<Response> => {
        const user = req.user as any;
        const { jobId } = req.params;
        const status = await this.importService.getJobStatus(jobId, user?.id);
        return ResponseHelper.success({
            res,
            message: 'Import job status retrieved',
            data: status,
        });
    };

    /**
     * GET /api/v1/courses/import/:jobId/preview
     * Get extracted preview data
     */
    public getJobPreview = async (req: Request, res: Response): Promise<Response> => {
        const user = req.user as any;
        const { jobId } = req.params;
        const preview = await this.importService.getJobPreview(jobId, user?.id);
        return ResponseHelper.success({
            res,
            message: 'Import preview generated successfully',
            data: preview,
        });
    };

    /**
     * POST /api/v1/courses/import/:jobId/approve
     * Commit approved course to database
     */
    public approveJob = async (req: Request, res: Response): Promise<Response> => {
        const user = req.user as any;
        if (!user || (user.role !== 'TRAINER' && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
            throw new ForbiddenError('Unauthorized to approve course import.');
        }

        const { jobId } = req.params;
        const customApprovedData = req.body?.approvedStructure;

        const result = await this.importService.approveJob(
            jobId,
            user.id,
            user.organizationId,
            customApprovedData
        );

        return ResponseHelper.created(res, result, 'Course created and persisted successfully.');
    };

    /**
     * GET /api/v1/courses/:id/validate
     * Run Course Health validation engine
     */
    public validateCourse = async (req: Request, res: Response): Promise<Response> => {
        const { id } = req.params;
        const result = await this.validationService.validateCourse(id);
        return ResponseHelper.success({
            res,
            message: 'Course validation completed',
            data: result,
        });
    };

    /**
     * POST /api/v1/courses/:id/publish
     * Safe publishing with pre-flight check
     */
    public publishCourse = async (req: Request, res: Response): Promise<Response> => {
        const { id } = req.params;

        const validation = await this.validationService.validateCourse(id);
        if (!validation.isPublishable) {
            return res.status(400).json({
                success: false,
                message: 'Course cannot be published until all critical errors are resolved.',
                data: validation,
            });
        }

        const published = await prisma.course.update({
            where: { id },
            data: {
                status: CourseStatus.PUBLISHED,
                publishedAt: new Date(),
                version: { increment: 1 },
            },
        });

        return ResponseHelper.success({
            res,
            message: 'Course published successfully and is now available to learners.',
            data: published,
        });
    };

    /**
     * PATCH /api/v1/courses/:id/draft
     * Autosave / Save Draft endpoint
     */
    public saveDraft = async (req: Request, res: Response): Promise<Response> => {
        const { id } = req.params;
        const {
            title,
            description,
            overview,
            targetAudience,
            category,
            difficulty,
            durationMinutes,
            modules,
        } = req.body;

        const updated = await prisma.$transaction(async (tx) => {
            // Update course details
            const course = await tx.course.update({
                where: { id },
                data: {
                    title: title || undefined,
                    description: description || undefined,
                    overview: overview !== undefined ? overview : undefined,
                    targetAudience: targetAudience !== undefined ? targetAudience : undefined,
                    category: category || undefined,
                    difficulty: difficulty || undefined,
                    durationMinutes: durationMinutes !== undefined ? Number(durationMinutes) : undefined,
                },
            });

            // Update modules and lessons if provided
            if (Array.isArray(modules)) {
                for (let mIdx = 0; mIdx < modules.length; mIdx++) {
                    const mod = modules[mIdx];
                    if (mod.id && !mod.id.startsWith('temp-')) {
                        await tx.courseModule.update({
                            where: { id: mod.id },
                            data: {
                                title: mod.title,
                                description: mod.description || null,
                                orderIndex: mIdx + 1,
                            },
                        });
                    }

                    if (Array.isArray(mod.lessons)) {
                        for (let lIdx = 0; lIdx < mod.lessons.length; lIdx++) {
                            const lesson = mod.lessons[lIdx];
                            if (lesson.id && !lesson.id.startsWith('temp-')) {
                                await tx.lesson.update({
                                    where: { id: lesson.id },
                                    data: {
                                        title: lesson.title,
                                        description: lesson.description || null,
                                        content: typeof lesson.content === 'string'
                                            ? lesson.content
                                            : JSON.stringify(lesson.contentBlocks || lesson.content || []),
                                        durationMinutes: lesson.durationMinutes || undefined,
                                        orderIndex: lIdx + 1,
                                        learningObjectives: lesson.learningObjectives !== undefined
                                            ? lesson.learningObjectives
                                            : undefined,
                                        keyTakeaways: lesson.keyTakeaways !== undefined
                                            ? lesson.keyTakeaways
                                            : undefined,
                                    },
                                });
                            }
                        }
                    }
                }
            }

            return course;
        });

        return ResponseHelper.success({
            res,
            message: 'Course draft saved successfully',
            data: updated,
        });
    };

    /**
     * GET /api/v1/courses/:id/topics-competencies
     * Retrieve topic-competency mappings for builder
     */
    public getTopicsAndCompetencies = async (req: Request, res: Response): Promise<Response> => {
        const { id } = req.params;

        const topics = await prisma.learningTopic.findMany({
            where: { courseId: id },
            include: {
                competencyMappings: {
                    include: {
                        competency: true,
                    },
                },
                lessonMappings: {
                    include: {
                        lesson: true,
                    },
                },
                prerequisites: {
                    include: {
                        prerequisiteTopic: true,
                    },
                },
            },
            orderBy: { orderIndex: 'asc' },
        });

        const competencies = await prisma.competency.findMany({
            select: { id: true, code: true, name: true, category: true },
        });

        return ResponseHelper.success({
            res,
            message: 'Topics and competencies retrieved',
            data: { topics, availableCompetencies: competencies },
        });
    };

    /**
     * PUT /api/v1/courses/:id/topics-competencies
     * Update topic-competency mapping
     */
    public updateTopicCompetencyMapping = async (req: Request, res: Response): Promise<Response> => {
        const { topicId, competencyId, action, importance } = req.body;

        if (!topicId) {
            throw new BadRequestError('topicId is required');
        }

        if (action === 'ADD' && competencyId) {
            await prisma.learningTopicCompetency.upsert({
                where: {
                    topicId_competencyId: { topicId, competencyId },
                },
                update: { weight: 1.0 },
                create: { topicId, competencyId, weight: 1.0 },
            });
        } else if (action === 'REMOVE' && competencyId) {
            await prisma.learningTopicCompetency.deleteMany({
                where: { topicId, competencyId },
            });
        }

        if (importance !== undefined) {
            await prisma.learningTopic.update({
                where: { id: topicId },
                data: { importance: Number(importance) },
            });
        }

        return ResponseHelper.success({
            res,
            message: 'Topic mapping updated successfully',
            data: null,
        });
    };
}

export default CourseImportController;
