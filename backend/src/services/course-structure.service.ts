import { Role, CourseStatus, Course, EnrollmentStatus, PrismaClient, AssessmentStatus, AttemptStatus } from '@prisma/client';
import { prisma as defaultPrisma } from '../database/client';
import { learningEventService } from '../modules/revision/services/learning-event.service';
import { ICourseModuleRepository } from '../repositories/course-module.repository';
import { ILessonRepository } from '../repositories/lesson.repository';
import { ICourseRepository } from '../repositories/course.repository';
import { IUserRepository } from '../repositories/user.repository';
import {
    CreateModuleDto,
    UpdateModuleDto,
    ReorderModulesDto,
    CreateLessonDto,
    UpdateLessonDto,
    ReorderLessonsDto,
} from '../dto/course-structure.dto';
import {
    BadRequestError,
    ForbiddenError,
    NotFoundError,
    ConflictError,
} from '../errors/app-error';

export interface UserContext {
    userId: string;
    role: Role;
    permissions: string[];
}

export class CourseStructureService {
    private prisma: PrismaClient;

    constructor(
        private moduleRepository: ICourseModuleRepository,
        private lessonRepository: ILessonRepository,
        private courseRepository: ICourseRepository,
        private userRepository: IUserRepository,
        prismaClient?: PrismaClient,
    ) {
        this.prisma = prismaClient || defaultPrisma;
    }

    // ── Helper: Validate Course Access & Ownership ──────────────────────────────

    public async validateCourseAccess(
        courseId: string,
        userCtx: UserContext,
        requireWrite: boolean = false,
    ): Promise<Course> {
        const course = await this.courseRepository.findById(courseId);
        if (!course) {
            throw new NotFoundError('Course not found');
        }

        const user = await this.userRepository.findById(userCtx.userId);
        if (!user || user.organizationId !== course.organizationId) {
            throw new ForbiddenError('You do not have access to this organization course');
        }

        // Write restriction rules
        if (requireWrite) {
            if (userCtx.role === Role.ADMIN || userCtx.role === Role.SUPER_ADMIN) {
                throw new ForbiddenError('Admins cannot create or modify course structure. Admin responsibility is review and publishing.');
            }
            if (userCtx.role === Role.TRAINEE) {
                throw new ForbiddenError('Trainees cannot modify course structure');
            }
            if (userCtx.role === Role.TRAINER) {
                if (course.trainerId !== userCtx.userId) {
                    throw new ForbiddenError('Trainers can only modify their own courses');
                }

                const restrictedStatuses: CourseStatus[] = [
                    CourseStatus.SUBMITTED,
                    CourseStatus.PENDING_APPROVAL,
                    CourseStatus.UNDER_REVIEW,
                    CourseStatus.APPROVED,
                    CourseStatus.PUBLISHED,
                    CourseStatus.ARCHIVED,
                ];
                if (restrictedStatuses.includes(course.status)) {
                    throw new ConflictError(`Cannot modify course structure while course is in ${course.status} state`);
                }
            }
        }

        // Trainee read rules
        if (userCtx.role === Role.TRAINEE && course.status !== CourseStatus.PUBLISHED) {
            throw new ForbiddenError('You do not have access to unpublished courses');
        }

        return course;
    }

    // ── Helper: Validate Module & Lesson Hierarchy ─────────────────────────────

    public async validateModuleHierarchy(courseId: string, moduleId: string) {
        const module = await this.moduleRepository.findById(moduleId);
        if (!module) {
            throw new NotFoundError('Module not found');
        }

        if (module.courseId !== courseId) {
            throw new BadRequestError('Module does not belong to the specified course');
        }

        return module;
    }

    public async validateLessonHierarchy(courseId: string, moduleId: string, lessonId: string) {
        await this.validateModuleHierarchy(courseId, moduleId);

        const lesson = await this.lessonRepository.findById(lessonId);
        if (!lesson) {
            throw new NotFoundError('Lesson not found');
        }

        if (lesson.moduleId !== moduleId) {
            throw new BadRequestError('Lesson does not belong to the specified module');
        }

        return lesson;
    }

    // ── Module Operations ──────────────────────────────────────────────────────

    public async createModule(courseId: string, dto: CreateModuleDto, userCtx: UserContext) {
        await this.validateCourseAccess(courseId, userCtx, true);
        return this.moduleRepository.create(courseId, dto);
    }

    public async listModules(courseId: string, userCtx: UserContext) {
        await this.validateCourseAccess(courseId, userCtx, false);
        return this.moduleRepository.findByCourseId(courseId);
    }

    public async getModule(courseId: string, moduleId: string, userCtx: UserContext) {
        await this.validateCourseAccess(courseId, userCtx, false);
        return this.validateModuleHierarchy(courseId, moduleId);
    }

    public async updateModule(courseId: string, moduleId: string, dto: UpdateModuleDto, userCtx: UserContext) {
        await this.validateCourseAccess(courseId, userCtx, true);
        await this.validateModuleHierarchy(courseId, moduleId);
        return this.moduleRepository.update(moduleId, dto);
    }

    public async deleteModule(courseId: string, moduleId: string, userCtx: UserContext) {
        await this.validateCourseAccess(courseId, userCtx, true);
        await this.validateModuleHierarchy(courseId, moduleId);
        return this.moduleRepository.delete(moduleId);
    }

    public async reorderModules(courseId: string, dto: ReorderModulesDto, userCtx: UserContext) {
        await this.validateCourseAccess(courseId, userCtx, true);

        const existingModules = await this.moduleRepository.findByCourseId(courseId);
        const existingIds = new Set(existingModules.map(m => m.id));

        const requestIds = dto.moduleOrders.map(item => item.id);
        const orderIndexes = dto.moduleOrders.map(item => item.orderIndex);

        // Check duplicates in request IDs or orderIndexes
        if (new Set(requestIds).size !== requestIds.length) {
            throw new BadRequestError('Duplicate module IDs in reorder request');
        }

        if (new Set(orderIndexes).size !== orderIndexes.length) {
            throw new BadRequestError('Duplicate order positions in reorder request');
        }

        // Verify all request IDs belong to this course
        for (const id of requestIds) {
            if (!existingIds.has(id)) {
                throw new BadRequestError(`Module ${id} does not belong to course ${courseId}`);
            }
        }

        await this.moduleRepository.reorderModules(courseId, dto.moduleOrders);
        return this.moduleRepository.findByCourseId(courseId);
    }

    // ── Lesson Operations ──────────────────────────────────────────────────────

    public async createLesson(courseId: string, moduleId: string, dto: CreateLessonDto, userCtx: UserContext) {
        await this.validateCourseAccess(courseId, userCtx, true);
        await this.validateModuleHierarchy(courseId, moduleId);
        return this.lessonRepository.create(moduleId, dto);
    }

    public async listLessons(courseId: string, moduleId: string, userCtx: UserContext) {
        await this.validateCourseAccess(courseId, userCtx, false);
        await this.validateModuleHierarchy(courseId, moduleId);
        return this.lessonRepository.findByModuleId(moduleId);
    }

    public async getLesson(courseId: string, moduleId: string, lessonId: string, userCtx: UserContext) {
        await this.validateCourseAccess(courseId, userCtx, false);
        const lesson = await this.validateLessonHierarchy(courseId, moduleId, lessonId);
        const resources = await this.lessonRepository.getLessonResources(lessonId);
        return {
            ...lesson,
            resources,
        };
    }

    public async updateLesson(courseId: string, moduleId: string, lessonId: string, dto: UpdateLessonDto, userCtx: UserContext) {
        await this.validateCourseAccess(courseId, userCtx, true);
        await this.validateLessonHierarchy(courseId, moduleId, lessonId);
        return this.lessonRepository.update(lessonId, dto);
    }

    public async deleteLesson(courseId: string, moduleId: string, lessonId: string, userCtx: UserContext) {
        await this.validateCourseAccess(courseId, userCtx, true);
        await this.validateLessonHierarchy(courseId, moduleId, lessonId);
        return this.lessonRepository.delete(lessonId);
    }

    public async reorderLessons(courseId: string, moduleId: string, dto: ReorderLessonsDto, userCtx: UserContext) {
        await this.validateCourseAccess(courseId, userCtx, true);
        await this.validateModuleHierarchy(courseId, moduleId);

        const existingLessons = await this.lessonRepository.findByModuleId(moduleId);
        const existingIds = new Set(existingLessons.map(l => l.id));

        const requestIds = dto.lessonOrders.map(item => item.id);
        const orderIndexes = dto.lessonOrders.map(item => item.orderIndex);

        if (new Set(requestIds).size !== requestIds.length) {
            throw new BadRequestError('Duplicate lesson IDs in reorder request');
        }

        if (new Set(orderIndexes).size !== orderIndexes.length) {
            throw new BadRequestError('Duplicate order positions in reorder request');
        }

        for (const id of requestIds) {
            if (!existingIds.has(id)) {
                throw new BadRequestError(`Lesson ${id} does not belong to module ${moduleId}`);
            }
        }

        await this.lessonRepository.reorderLessons(moduleId, dto.lessonOrders);
        return this.lessonRepository.findByModuleId(moduleId);
    }

    // ── Complete Structure ─────────────────────────────────────────────────────

    public async getCourseStructure(courseId: string, userCtx: UserContext) {
        await this.validateCourseAccess(courseId, userCtx, false);

        const rawStructure = await this.moduleRepository.getCourseStructure(courseId);
        if (!rawStructure) {
            throw new NotFoundError('Course not found');
        }

        const modules = (rawStructure.modules || []).map((m: any) => {
            const lessons = (m.lessons || []).map((l: any) => {
                const resources = (l.lessonResources || []).map((lr: any) => lr.resource);
                return {
                    id: l.id,
                    title: l.title,
                    description: l.description,
                    contentType: l.contentType,
                    content: l.content,
                    resourceUrl: l.resourceUrl,
                    durationMinutes: l.durationMinutes,
                    orderIndex: l.orderIndex,
                    isPreview: l.isPreview,
                    learningObjectives: l.learningObjectives,
                    keyTakeaways: l.keyTakeaways,
                    sourceProvenance: l.sourceProvenance,
                    resources,
                };
            });

            // Calculate total module duration from lessons if not set on module
            const totalDuration = lessons.reduce((sum: number, les: any) => sum + (les.durationMinutes || 0), 0);

            return {
                id: m.id,
                title: m.title,
                description: m.description,
                orderIndex: m.orderIndex,
                durationMinutes: totalDuration,
                lessons,
            };
        });

        return {
            id: rawStructure.id,
            title: rawStructure.title,
            slug: rawStructure.slug,
            description: rawStructure.description,
            overview: rawStructure.overview,
            targetAudience: rawStructure.targetAudience,
            learningOutcomes: rawStructure.learningOutcomes,
            prerequisitesText: rawStructure.prerequisitesText,
            glossary: rawStructure.glossary,
            references: rawStructure.references,
            category: rawStructure.category,
            difficulty: rawStructure.difficulty,
            status: rawStructure.status,
            durationMinutes: rawStructure.durationMinutes,
            course: {
                id: rawStructure.id,
                title: rawStructure.title,
                slug: rawStructure.slug,
                description: rawStructure.description,
                overview: rawStructure.overview,
                targetAudience: rawStructure.targetAudience,
                learningOutcomes: rawStructure.learningOutcomes,
                category: rawStructure.category,
                difficulty: rawStructure.difficulty,
                status: rawStructure.status,
                durationMinutes: rawStructure.durationMinutes,
            },
            modules,
        };
    }

    // ── Resource Association ───────────────────────────────────────────────────

    public async attachResource(courseId: string, moduleId: string, lessonId: string, resourceId: string, userCtx: UserContext) {
        await this.validateCourseAccess(courseId, userCtx, true);
        await this.validateLessonHierarchy(courseId, moduleId, lessonId);

        try {
            return await this.lessonRepository.attachResource(lessonId, resourceId);
        } catch (err: any) {
            if (err.code === 'P2002' || err.message?.includes('Unique constraint')) {
                throw new ConflictError('Resource is already attached to this lesson');
            }
            if (err.code === 'P2003' || err.message?.includes('Foreign key constraint')) {
                throw new NotFoundError('Resource not found');
            }
            throw err;
        }
    }

    public async detachResource(courseId: string, moduleId: string, lessonId: string, resourceId: string, userCtx: UserContext) {
        await this.validateCourseAccess(courseId, userCtx, true);
        await this.validateLessonHierarchy(courseId, moduleId, lessonId);

        try {
            return await this.lessonRepository.detachResource(lessonId, resourceId);
        } catch (err: any) {
            if (err.code === 'P2025' || err.message?.includes('Record to delete does not exist')) {
                throw new NotFoundError('Resource attachment not found');
            }
            throw err;
        }
    }

    // ── Trainee Course Viewer Methods ──────────────────────────────────────────

    /**
     * Get lightweight course outline + module hierarchy + learner progress summary
     * Fast initial payload without heavy lesson content blocks (<15KB)
     */
    public async getCourseOutline(courseId: string, userCtx: UserContext) {
        // Resolve course by UUID or slug
        const course = await this.prisma.course.findFirst({
            where: {
                OR: [{ id: courseId }, { slug: courseId }],
            },
            select: {
                id: true,
                title: true,
                slug: true,
                description: true,
                thumbnailUrl: true,
                category: true,
                difficulty: true,
                durationMinutes: true,
                status: true,
                organizationId: true,
                trainerId: true,
            },
        });

        if (!course) {
            throw new NotFoundError('Course not found');
        }

        // Authorization check:
        // Trainees must have an enrollment record in ENROLLED or IN_PROGRESS status
        let enrollment = await this.prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId: userCtx.userId,
                    courseId: course.id,
                },
            },
        });

        if (userCtx.role === Role.TRAINEE) {
            if (!enrollment || enrollment.status === EnrollmentStatus.DROPPED) {
                throw new ForbiddenError('You must be enrolled in this course to view the curriculum');
            }
        }

        // Fetch ordered modules and lightweight lesson metadata
        const modules = await this.prisma.courseModule.findMany({
            where: { courseId: course.id },
            orderBy: { orderIndex: 'asc' },
            include: {
                lessons: {
                    orderBy: { orderIndex: 'asc' },
                    select: {
                        id: true,
                        moduleId: true,
                        title: true,
                        description: true,
                        contentType: true,
                        durationMinutes: true,
                        orderIndex: true,
                        isPreview: true,
                        _count: {
                            select: { lessonResources: true },
                        },
                    },
                },
            },
        });

        // Query trainee completed lesson progress
        const completedLessons = await this.prisma.lessonProgress.findMany({
            where: {
                userId: userCtx.userId,
                completed: true,
                lesson: {
                    module: {
                        courseId: course.id,
                    },
                },
            },
            select: { lessonId: true },
        });

        const completedSet = new Set(completedLessons.map((p) => p.lessonId));

        // Query published assessments mapped to this course (Section 11, 12, 13)
        const assessments = this.prisma.assessment?.findMany
            ? await this.prisma.assessment.findMany({
                where: {
                    courseId: course.id,
                    status: AssessmentStatus.PUBLISHED,
                },
                select: {
                    id: true,
                    title: true,
                    description: true,
                    subject: true,
                    durationMinutes: true,
                    passingScore: true,
                    moduleId: true,
                    lessonId: true,
                    _count: {
                        select: { questions: true },
                    },
                },
                orderBy: { createdAt: 'asc' },
            })
            : [];

        // Query trainee's submitted attempts on these assessments
        const assessmentIds = assessments.map((a) => a.id);
        const traineeAttempts = (assessmentIds.length > 0 && this.prisma.assessmentAttempt?.findMany)
            ? await this.prisma.assessmentAttempt.findMany({
                where: {
                    userId: userCtx.userId,
                    assessmentId: { in: assessmentIds },
                    status: AttemptStatus.SUBMITTED,
                },
                orderBy: { submittedAt: 'desc' },
                select: {
                    id: true,
                    assessmentId: true,
                    score: true,
                    percentage: true,
                    passed: true,
                },
            })
            : [];

        // Build attempt map for latest attempt status
        const attemptMap = new Map<string, { id: string; score: number | null; percentage: number | null; passed: boolean | null }>();
        traineeAttempts.forEach((att) => {
            if (!attemptMap.has(att.assessmentId)) {
                attemptMap.set(att.assessmentId, att);
            }
        });

        // Set to track deduplicated assigned assessments (Section 13)
        const assignedAssessmentIds = new Set<string>();

        let totalLessonsCount = 0;
        const formattedModules = modules.map((mod, mIdx) => {
            const modLessons = mod.lessons || [];
            totalLessonsCount += modLessons.length;
            const completedCount = modLessons.filter((l) => completedSet.has(l.id)).length;
            const modDuration = modLessons.reduce((acc, l) => acc + (l.durationMinutes || 10), 0);

            // Deduplicate and filter assessments belonging to this module (or its lessons)
            const modAssessments = assessments
                .filter((a) => {
                    if (assignedAssessmentIds.has(a.id)) return false;
                    const matchesDirectModule = a.moduleId === mod.id;
                    const matchesModuleLesson = a.lessonId && modLessons.some((l) => l.id === a.lessonId);
                    // If course-level assessment without specific module, attach to first module
                    const matchesFallback = (!a.moduleId && !a.lessonId && mIdx === 0);
                    return matchesDirectModule || matchesModuleLesson || matchesFallback;
                })
                .map((a) => {
                    assignedAssessmentIds.add(a.id);
                    const att = attemptMap.get(a.id);
                    return {
                        id: a.id,
                        title: a.title,
                        description: a.description,
                        subject: a.subject,
                        durationMinutes: a.durationMinutes || 30,
                        passingScore: a.passingScore,
                        questionCount: a._count?.questions || 0,
                        moduleId: mod.id,
                        lessonId: a.lessonId || null,
                        isCompleted: Boolean(att),
                        passed: att?.passed ?? false,
                        score: att?.score ?? null,
                        percentage: att?.percentage ?? null,
                        attemptId: att?.id ?? null,
                    };
                });

            return {
                id: mod.id,
                title: mod.title,
                description: mod.description,
                orderIndex: mod.orderIndex ?? mIdx,
                durationMinutes: modDuration,
                completedCount,
                totalCount: modLessons.length,
                lessons: modLessons.map((l, lIdx) => ({
                    id: l.id,
                    moduleId: mod.id,
                    title: l.title,
                    description: l.description,
                    contentType: l.contentType,
                    durationMinutes: l.durationMinutes || 10,
                    orderIndex: l.orderIndex ?? lIdx,
                    isPreview: l.isPreview,
                    resourceCount: l._count?.lessonResources || 0,
                    isCompleted: completedSet.has(l.id),
                })),
                assessments: modAssessments,
            };
        });

        const completedLessonsCount = completedSet.size;
        const progressPercentage =
            totalLessonsCount > 0
                ? Math.min(100, Math.round((completedLessonsCount / totalLessonsCount) * 100))
                : 0;

        return {
            course: {
                id: course.id,
                title: course.title,
                slug: course.slug,
                description: course.description,
                thumbnailUrl: course.thumbnailUrl,
                category: course.category,
                difficulty: course.difficulty,
                durationMinutes: course.durationMinutes,
                status: course.status,
            },
            modules: formattedModules,
            progress: {
                enrollmentId: enrollment?.id || null,
                completedLessonIds: Array.from(completedSet),
                completedLessonsCount,
                totalLessonsCount,
                progressPercentage,
                status: enrollment?.status || (progressPercentage === 100 ? 'COMPLETED' : 'IN_PROGRESS'),
            },
        };
    }

    /**
     * Get detailed lesson content (loaded on demand / lazy loaded)
     */
    public async getLessonDetail(courseId: string, lessonId: string, userCtx: UserContext) {
        // Resolve course
        const course = await this.prisma.course.findFirst({
            where: {
                OR: [{ id: courseId }, { slug: courseId }],
            },
            select: { id: true, title: true, status: true },
        });

        if (!course) {
            throw new NotFoundError('Course not found');
        }

        // Authorization check for trainee
        if (userCtx.role === Role.TRAINEE) {
            const enrollment = await this.prisma.enrollment.findUnique({
                where: {
                    userId_courseId: {
                        userId: userCtx.userId,
                        courseId: course.id,
                    },
                },
            });

            if (!enrollment || enrollment.status === EnrollmentStatus.DROPPED) {
                throw new ForbiddenError('You are not enrolled in this course');
            }
        }

        // Query lesson with relationships
        const lesson = await this.prisma.lesson.findUnique({
            where: { id: lessonId },
            include: {
                module: {
                    select: {
                        id: true,
                        courseId: true,
                        title: true,
                        orderIndex: true,
                    },
                },
                lessonResources: {
                    include: {
                        resource: true,
                    },
                },
            },
        });

        if (!lesson || lesson.module.courseId !== course.id) {
            throw new NotFoundError('Lesson not found in this course');
        }

        // Query all lessons in the course to resolve adjacent navigation IDs
        const allLessonsInCourse = await this.prisma.lesson.findMany({
            where: { module: { courseId: course.id } },
            orderBy: [
                { module: { orderIndex: 'asc' } },
                { orderIndex: 'asc' },
            ],
            select: { id: true },
        });

        const currentIndex = allLessonsInCourse.findIndex((l) => l.id === lessonId);
        const prevLessonId = currentIndex > 0 ? allLessonsInCourse[currentIndex - 1].id : null;
        const nextLessonId =
            currentIndex >= 0 && currentIndex < allLessonsInCourse.length - 1
                ? allLessonsInCourse[currentIndex + 1].id
                : null;

        // Query lesson completion
        const progress = await this.prisma.lessonProgress.findUnique({
            where: {
                userId_lessonId: {
                    userId: userCtx.userId,
                    lessonId,
                },
            },
        });

        // Format attached resources
        const resources = (lesson.lessonResources || []).map((lr) => {
            const res = lr.resource;
            return {
                id: res.id,
                title: res.title,
                description: res.description,
                resourceType: res.resourceType,
                url: res.url,
                fileName: res.fileName,
                mimeType: res.mimeType,
                fileSize: res.fileSize ? Number(res.fileSize) : undefined,
                thumbnailUrl: res.thumbnailUrl,
            };
        });

        // Parse learning objectives and key takeaways safely
        let objectives: string[] = [];
        if (Array.isArray(lesson.learningObjectives)) {
            objectives = lesson.learningObjectives.map(String);
        }

        let takeaways: string[] = [];
        if (Array.isArray(lesson.keyTakeaways)) {
            takeaways = lesson.keyTakeaways.map(String);
        }

        return {
            id: lesson.id,
            moduleId: lesson.module.id,
            moduleTitle: lesson.module.title,
            courseId: course.id,
            courseTitle: course.title,
            title: lesson.title,
            description: lesson.description,
            contentType: lesson.contentType,
            content: lesson.content,
            resourceUrl: lesson.resourceUrl,
            durationMinutes: lesson.durationMinutes || 10,
            orderIndex: lesson.orderIndex,
            isPreview: lesson.isPreview,
            learningObjectives: objectives,
            keyTakeaways: takeaways,
            resources,
            isCompleted: Boolean(progress?.completed),
            prevLessonId,
            nextLessonId,
        };
    }

    /**
     * Idempotently mark a lesson as completed, recalculate course progress,
     * and emit learning event into the Adaptive Revision Engine.
     */
    public async completeLesson(courseId: string, lessonId: string, userCtx: UserContext) {
        // Resolve course
        const course = await this.prisma.course.findFirst({
            where: {
                OR: [{ id: courseId }, { slug: courseId }],
            },
            select: { id: true, title: true },
        });

        if (!course) {
            throw new NotFoundError('Course not found');
        }

        // Verify lesson exists in this course
        const lesson = await this.prisma.lesson.findUnique({
            where: { id: lessonId },
            include: { module: true },
        });

        if (!lesson || lesson.module.courseId !== course.id) {
            throw new NotFoundError('Lesson not found in this course');
        }

        // Check user enrollment
        let enrollment = await this.prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId: userCtx.userId,
                    courseId: course.id,
                },
            },
        });

        // If trainer/admin previewing without enrollment, return simulation response
        if (!enrollment) {
            if (userCtx.role !== Role.TRAINEE) {
                return {
                    success: true,
                    isCompleted: true,
                    progressPercentage: 100,
                    completedLessonsCount: 1,
                    totalLessonsCount: 1,
                    enrollmentStatus: 'IN_PROGRESS',
                    isPreview: true,
                };
            }
            throw new ForbiddenError('You are not enrolled in this course');
        }

        if (enrollment.status === EnrollmentStatus.DROPPED) {
            throw new BadRequestError('Cannot update progress for a dropped course enrollment');
        }

        const now = new Date();

        // 1. Idempotently upsert LessonProgress
        await this.prisma.lessonProgress.upsert({
            where: {
                userId_lessonId: {
                    userId: userCtx.userId,
                    lessonId,
                },
            },
            create: {
                userId: userCtx.userId,
                lessonId,
                enrollmentId: enrollment.id,
                completed: true,
                progressPercentage: 100,
                startedAt: now,
                completedAt: now,
                lastAccessedAt: now,
            },
            update: {
                completed: true,
                progressPercentage: 100,
                completedAt: now,
                lastAccessedAt: now,
            },
        });

        // 2. Count total lessons in the course
        const totalLessonsCount = await this.prisma.lesson.count({
            where: { module: { courseId: course.id } },
        });

        // 3. Count completed lessons in this enrollment
        const completedCount = await this.prisma.lessonProgress.count({
            where: {
                enrollmentId: enrollment.id,
                completed: true,
            },
        });

        const progressPercentage =
            totalLessonsCount > 0
                ? Math.min(100, Math.round((completedCount / totalLessonsCount) * 100))
                : 100;

        let status: EnrollmentStatus = enrollment.status;
        let completedAt: Date | null | undefined = undefined;

        if (totalLessonsCount > 0 && completedCount >= totalLessonsCount) {
            status = EnrollmentStatus.COMPLETED;
            completedAt = now;
        } else if (completedCount > 0 || progressPercentage > 0) {
            status = EnrollmentStatus.IN_PROGRESS;
        }

        // 4. Update Enrollment progress
        await this.prisma.enrollment.update({
            where: { id: enrollment.id },
            data: {
                progressPercentage,
                status,
                ...(completedAt ? { completedAt } : {}),
            },
        });

        // 5. Ingest Learning Event for Adaptive Revision Engine in background (non-blocking)
        void (async () => {
            try {
                const mappedTopic = await this.prisma.lessonTopic.findFirst({
                    where: { lessonId },
                    select: { topicId: true },
                });

                if (mappedTopic?.topicId) {
                    await learningEventService.ingestEvent({
                        userId: userCtx.userId,
                        topicId: mappedTopic.topicId,
                        eventType: 'LESSON_COMPLETED' as any,
                        score: 100,
                        maxScore: 100,
                        isCorrect: true,
                        timeSpentSeconds: (lesson.durationMinutes || 10) * 60,
                        courseId: course.id,
                        lessonId,
                        metadata: { source: 'LMS_TRAINEE_VIEWER' },
                    });
                }
            } catch (eventErr) {
                // Non-blocking: Logging failure so learner experience remains uninterrupted
                console.warn('[CourseStructureService] Non-critical adaptive learning event error:', eventErr);
            }
        })();

        return {
            success: true,
            isCompleted: true,
            progressPercentage,
            completedLessonsCount: completedCount,
            totalLessonsCount,
            enrollmentStatus: status,
        };
    }
}

export default CourseStructureService;
