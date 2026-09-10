import { Role, CourseStatus, Course } from '@prisma/client';
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
    constructor(
        private moduleRepository: ICourseModuleRepository,
        private lessonRepository: ILessonRepository,
        private courseRepository: ICourseRepository,
        private userRepository: IUserRepository,
    ) { }

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

        // Trainee rules
        if (userCtx.role === Role.TRAINEE) {
            if (requireWrite) {
                throw new ForbiddenError('Trainees cannot modify course structure');
            }
            if (course.status !== CourseStatus.PUBLISHED) {
                throw new ForbiddenError('You do not have access to unpublished courses');
            }
        }

        // Trainer write rules
        if (requireWrite && userCtx.role === Role.TRAINER) {
            if (course.trainerId !== userCtx.userId) {
                throw new ForbiddenError('Trainers can only modify their own courses');
            }

            const restrictedStatuses: CourseStatus[] = [
                CourseStatus.PENDING_APPROVAL,
                CourseStatus.PUBLISHED,
                CourseStatus.ARCHIVED,
            ];
            if (restrictedStatuses.includes(course.status)) {
                throw new ConflictError(`Cannot modify course structure while course is in ${course.status} state`);
            }
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
}

export default CourseStructureService;
