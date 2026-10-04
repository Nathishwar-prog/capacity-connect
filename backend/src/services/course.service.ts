import { Course, CourseStatus, Role } from '@prisma/client';
import { ICourseRepository } from '../repositories/course.repository';
import { CreateCourseDto, UpdateCourseDto, CourseListParamsDto } from '../dto/course.dto';
import { IUserRepository } from '../repositories/user.repository';
import {
    BadRequestError,
    ConflictError,
    ForbiddenError,
    NotFoundError
} from '../errors/app-error';

export interface UserContext {
    userId: string;
    role: Role;
    permissions: string[];
}

export class CourseService {
    private courseRepository: ICourseRepository;
    private userRepository: IUserRepository;

    constructor(courseRepository: ICourseRepository, userRepository: IUserRepository) {
        this.courseRepository = courseRepository;
        this.userRepository = userRepository;
    }


    public async getCourseById(id: string, userCtx: UserContext): Promise<any> {
        let course = await this.courseRepository.findById(id);
        if (!course) {
            course = await this.courseRepository.findBySlug(id);
        }
        if (!course) {
            throw new NotFoundError('Course not found');
        }

        const user = await this.userRepository.findById(userCtx.userId);
        if (!user || user.organizationId !== course.organizationId) {
            throw new ForbiddenError('You do not have access to this organization course');
        }

        // Trainees should only see PUBLISHED courses unless they have higher permissions
        if (userCtx.role === Role.TRAINEE && course.status !== CourseStatus.PUBLISHED) {
            throw new ForbiddenError('You do not have access to unpublished courses');
        }

        return course;
    }

    public async listCourses(params: CourseListParamsDto, userCtx: UserContext) {
        const user = await this.userRepository.findById(userCtx.userId);
        if (!user) throw new ForbiddenError('User context invalid');

        // Force organization isolation
        const safeParams = { ...params, organizationId: user.organizationId };

        // Trainees only see PUBLISHED
        if (userCtx.role === Role.TRAINEE) {
            safeParams.status = CourseStatus.PUBLISHED;
        }

        // Trainers only see their own courses mostly? Actually project says "May see their own courses and any additional courses explicitly allowed". 
        // We will let them list organization courses if the controller lets them, but status filters might apply.

        return this.courseRepository.findAll(safeParams);
    }

    public async createCourse(dto: CreateCourseDto, userCtx: UserContext): Promise<Course> {
        const user = await this.userRepository.findById(userCtx.userId);
        if (!user) throw new ForbiddenError('User not found');

        if (user.role === Role.TRAINEE) {
            throw new ForbiddenError('Trainees cannot create courses');
        }

        if (user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN) {
            throw new ForbiddenError('Admins cannot create courses. Only trainers are permitted to author training curricula.');
        }

        // Enforce ownership and org
        if (dto.organizationId !== user.organizationId) {
            throw new ForbiddenError('Cannot create course outside your organization');
        }

        if (userCtx.role === Role.TRAINER && dto.trainerId !== userCtx.userId) {
            throw new ForbiddenError('Trainers can only create courses for themselves');
        }

        const slugExists = await this.courseRepository.checkSlugExists(dto.slug);
        if (slugExists) {
            throw new ConflictError('Course with this slug already exists');
        }

        const prerequisites = dto.prerequisites || [];
        if (prerequisites.length > 0) {
            await this.validatePrerequisites(prerequisites, user.organizationId);
        }

        const createdCourse = await this.courseRepository.create(dto);

        if (prerequisites.length > 0) {
            await this.courseRepository.updatePrerequisites(createdCourse.id, prerequisites);
        }

        await this.logAudit({
            organizationId: user.organizationId,
            userId: userCtx.userId,
            action: 'COURSE_CREATED',
            entityType: 'COURSE',
            entityId: createdCourse.id,
            newValues: { title: createdCourse.title, status: createdCourse.status },
        });

        return createdCourse;
    }

    public async updateCourse(id: string, dto: UpdateCourseDto, userCtx: UserContext): Promise<Course> {
        const course = await this.courseRepository.findById(id);
        if (!course) throw new NotFoundError('Course not found');

        const user = await this.userRepository.findById(userCtx.userId);
        if (!user) throw new ForbiddenError('User not found');

        if (user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN) {
            throw new ForbiddenError('Admins cannot modify course content. Admin responsibility is review and publishing.');
        }

        if (course.organizationId !== user.organizationId) {
            throw new ForbiddenError('Cannot modify course outside your organization');
        }

        if (userCtx.role === Role.TRAINER && course.trainerId !== userCtx.userId) {
            throw new ForbiddenError('Trainers can only modify their own courses');
        }

        // Check status - only DRAFT and REJECTED courses can be updated
        const restrictedStatuses: CourseStatus[] = [
            CourseStatus.SUBMITTED,
            CourseStatus.PENDING_APPROVAL,
            CourseStatus.UNDER_REVIEW,
            CourseStatus.APPROVED,
            CourseStatus.PUBLISHED,
            CourseStatus.ARCHIVED,
        ];
        if (restrictedStatuses.includes(course.status)) {
            throw new ConflictError(`Cannot update course while in ${course.status} state. If rejected, you may edit and resubmit.`);
        }

        if (dto.prerequisites) {
            await this.validatePrerequisites(dto.prerequisites, user.organizationId, id);
        }

        const updatedCourse = await this.courseRepository.update(id, dto);

        if (dto.prerequisites) {
            await this.courseRepository.updatePrerequisites(id, dto.prerequisites);
        }

        return updatedCourse;
    }

    public async submitCourse(id: string, userCtx: UserContext): Promise<Course> {
        const course = await this.getCourseById(id, userCtx);

        if (userCtx.role === Role.ADMIN || userCtx.role === Role.SUPER_ADMIN) {
            throw new ForbiddenError('Admins cannot submit courses. Only trainers can submit courses for review.');
        }

        if (userCtx.role === Role.TRAINER && course.trainerId !== userCtx.userId) {
            throw new ForbiddenError('Trainers can only submit their own courses');
        }

        if (course.status !== CourseStatus.DRAFT && course.status !== CourseStatus.REJECTED) {
            throw new ConflictError('Only draft or rejected courses can be submitted');
        }

        // Validate course before submission
        const validation = await this.validateCourse(id, userCtx);
        if (!validation.isValid) {
            throw new BadRequestError(`Cannot submit course with validation errors: ${validation.errors.join('; ')}`);
        }

        const updated = await this.courseRepository.updateStatus(id, CourseStatus.SUBMITTED, {
            submittedAt: new Date(),
        });

        await this.logAudit({
            organizationId: course.organizationId,
            userId: userCtx.userId,
            action: 'COURSE_SUBMITTED',
            entityType: 'COURSE',
            entityId: id,
            oldValues: { status: course.status },
            newValues: { status: CourseStatus.SUBMITTED },
        });

        return updated;
    }

    public async setUnderReview(id: string, userCtx: UserContext): Promise<Course> {
        const course = await this.getCourseById(id, userCtx);

        if (userCtx.role !== Role.ADMIN && userCtx.role !== Role.SUPER_ADMIN) {
            throw new ForbiddenError('Only Admins can mark courses as under review');
        }

        if (course.status !== CourseStatus.SUBMITTED && course.status !== CourseStatus.PENDING_APPROVAL) {
            return course;
        }

        return this.courseRepository.updateStatus(id, CourseStatus.UNDER_REVIEW);
    }

    public async approveCourse(id: string, userCtx: UserContext): Promise<Course> {
        const course = await this.getCourseById(id, userCtx);

        if (userCtx.role !== Role.ADMIN && userCtx.role !== Role.SUPER_ADMIN) {
            throw new ForbiddenError('Only Admins can approve courses');
        }

        const validApprovalStatuses: CourseStatus[] = [
            CourseStatus.SUBMITTED,
            CourseStatus.PENDING_APPROVAL,
            CourseStatus.UNDER_REVIEW,
        ];
        if (!validApprovalStatuses.includes(course.status)) {
            throw new ConflictError(`Course with status ${course.status} cannot be approved. It must be SUBMITTED or UNDER_REVIEW.`);
        }

        // Completeness validation check
        const validation = await this.validateCourse(id, userCtx);
        if (!validation.isValid) {
            throw new BadRequestError(`Course cannot be approved due to validation errors: ${validation.errors.join('; ')}`);
        }

        const updated = await this.courseRepository.updateStatus(id, CourseStatus.APPROVED, {
            approvedAt: new Date(),
            approvedById: userCtx.userId,
        });

        // Send Notification to Trainer
        try {
            const { NotificationService } = await import('./notification.service');
            const notifService = new NotificationService();
            await notifService.createNotification({
                userId: course.trainerId,
                title: 'Course Approved',
                message: `Your course "${course.title}" has been approved by curriculum administration and is now eligible for publication.`,
                type: 'COURSE' as any,
                entityType: 'COURSE',
                entityId: id,
            });
        } catch (err) {
            console.error('Failed to dispatch course approval notification:', err);
        }

        await this.logAudit({
            organizationId: course.organizationId,
            userId: userCtx.userId,
            action: 'COURSE_APPROVED',
            entityType: 'COURSE',
            entityId: id,
            oldValues: { status: course.status },
            newValues: { status: CourseStatus.APPROVED },
        });

        return updated;
    }

    public async rejectCourse(id: string, reasonOrCtx: string | UserContext, maybeCtx?: UserContext): Promise<Course> {
        let rejectionReason: string;
        let userCtx: UserContext;

        if (typeof reasonOrCtx === 'string') {
            rejectionReason = reasonOrCtx;
            userCtx = maybeCtx!;
        } else {
            userCtx = reasonOrCtx;
            rejectionReason = 'Course requires revision prior to curriculum approval.';
        }

        const course = await this.getCourseById(id, userCtx);

        if (userCtx.role !== Role.ADMIN && userCtx.role !== Role.SUPER_ADMIN) {
            throw new ForbiddenError('Only Admins can reject courses');
        }

        const validRejectionStatuses: CourseStatus[] = [
            CourseStatus.SUBMITTED,
            CourseStatus.PENDING_APPROVAL,
            CourseStatus.UNDER_REVIEW,
            CourseStatus.APPROVED,
        ];
        if (!validRejectionStatuses.includes(course.status)) {
            throw new ConflictError(`Course with status ${course.status} cannot be rejected.`);
        }

        if (!rejectionReason || rejectionReason.trim().length === 0) {
            throw new BadRequestError('A rejection reason must be provided explaining what needs revision.');
        }

        const updated = await this.courseRepository.updateStatus(id, CourseStatus.REJECTED, {
            rejectionReason: rejectionReason.trim(),
            rejectedAt: new Date(),
            rejectedById: userCtx.userId,
        });

        // Send Notification to Trainer
        try {
            const { NotificationService } = await import('./notification.service');
            const notifService = new NotificationService();
            await notifService.createNotification({
                userId: course.trainerId,
                title: 'Course Revision Required (Rejected)',
                message: `Your course "${course.title}" was not approved during review. Administrator feedback: "${rejectionReason.trim()}". Please revise and resubmit.`,
                type: 'COURSE' as any,
                entityType: 'COURSE',
                entityId: id,
            });
        } catch (err) {
            console.error('Failed to dispatch course rejection notification:', err);
        }

        await this.logAudit({
            organizationId: course.organizationId,
            userId: userCtx.userId,
            action: 'COURSE_REJECTED',
            entityType: 'COURSE',
            entityId: id,
            oldValues: { status: course.status },
            newValues: { status: CourseStatus.REJECTED, rejectionReason: rejectionReason.trim() },
        });

        return updated;
    }

    public async validateCourse(id: string, userCtx: UserContext): Promise<{
        healthScore: number;
        isValid: boolean;
        errors: string[];
        warnings: string[];
    }> {
        const course = await this.courseRepository.findById(id);
        if (!course) throw new NotFoundError('Course not found');

        const user = await this.userRepository.findById(userCtx.userId);
        if (!user || user.organizationId !== course.organizationId) {
            throw new ForbiddenError('You do not have access to this organization course');
        }

        let fullCourse: any = null;
        try {
            fullCourse = await (await import('../database/client')).default.course.findUnique({
                where: { id },
                include: {
                    modules: {
                        include: {
                            lessons: {
                                include: {
                                    lessonTopics: { include: { topic: true } },
                                },
                            },
                        },
                        orderBy: { orderIndex: 'asc' },
                    },
                    assessments: {
                        include: {
                            questions: {
                                include: { options: true },
                            },
                        },
                    },
                    learningTopics: true,
                    courseCompetencies: { include: { competency: true } },
                },
            });
        } catch {
            // fallback
        }

        if (!fullCourse) {
            fullCourse = course;
        }

        if (!fullCourse) throw new NotFoundError('Course not found');

        fullCourse.modules = fullCourse.modules || [];
        fullCourse.assessments = fullCourse.assessments || [];
        fullCourse.learningTopics = fullCourse.learningTopics || [];

        const errors: string[] = [];
        const warnings: string[] = [];

        // Structural Checks
        if (!fullCourse.title || fullCourse.title.trim().length < 3) {
            errors.push('Course title is required and must be at least 3 characters.');
        }

        if (!fullCourse.category) {
            errors.push('Course category is required.');
        }

        if (fullCourse.modules.length === 0) {
            errors.push('Course must have at least one module.');
        } else {
            fullCourse.modules.forEach((mod: any, mIdx: number) => {
                if (mod.lessons.length === 0) {
                    errors.push(`Module ${mIdx + 1} ("${mod.title}") contains no lessons.`);
                } else {
                    mod.lessons.forEach((les: any, lIdx: number) => {
                        const hasContent = les.content && les.content.length > 10;
                        const hasObjectives = Array.isArray(les.learningObjectives) && (les.learningObjectives as any).length > 0;
                        if (!hasContent && !hasObjectives) {
                            warnings.push(
                                `Lesson ${mIdx + 1}.${lIdx + 1} ("${les.title}") has no content or learning objectives.`
                            );
                        }
                    });
                }
            });
        }

        // Assessment Checks
        if (fullCourse.assessments.length > 0) {
            fullCourse.assessments.forEach((ass: any) => {
                ass.questions.forEach((q: any, qIdx: number) => {
                    if (q.options.length < 2) {
                        errors.push(`Assessment question #${qIdx + 1} must have at least 2 options.`);
                    }
                    const correctCount = q.options.filter((o: any) => o.isCorrect).length;
                    if (correctCount === 0) {
                        errors.push(`Assessment question #${qIdx + 1} has no correct answer selected.`);
                    }
                });
            });
        }

        // Recommended Warnings
        if (!fullCourse.overview) {
            warnings.push('Course overview / description is missing.');
        }
        if (!fullCourse.targetAudience) {
            warnings.push('Target audience is not specified.');
        }
        if (fullCourse.learningTopics.length === 0) {
            warnings.push('No learning topics or competencies are mapped to this course.');
        }

        // Calculate health score (0 - 100)
        let score = 100;
        score -= errors.length * 25;
        score -= warnings.length * 8;
        const healthScore = Math.max(10, Math.min(100, score));

        return {
            healthScore,
            isValid: errors.length === 0,
            errors,
            warnings,
        };
    }

    public async publishCourse(id: string, userCtx: UserContext): Promise<Course> {
        const course = await this.getCourseById(id, userCtx);

        const isAdmin = userCtx.role === Role.ADMIN || userCtx.role === Role.SUPER_ADMIN;
        if (!isAdmin) {
            throw new ForbiddenError('Only administrators can publish courses. Trainers must submit courses for admin review.');
        }

        // A course must be APPROVED before it can be published
        if (course.status !== CourseStatus.APPROVED) {
            throw new ConflictError(`Cannot publish course with status '${course.status}'. A course must be approved by an administrator before it can be published.`);
        }

        // Run pre-flight health check
        const validation = await this.validateCourse(id, userCtx);
        if (!validation.isValid) {
            throw new BadRequestError(
                `Cannot publish course due to validation errors: ${validation.errors.join('; ')}`
            );
        }

        const updated = await this.courseRepository.updateStatus(id, CourseStatus.PUBLISHED, {
            publishedAt: new Date(),
            publishedById: userCtx.userId,
        });

        // Send Notification to Trainer
        try {
            const { NotificationService } = await import('./notification.service');
            const notifService = new NotificationService();
            await notifService.createNotification({
                userId: course.trainerId,
                title: 'Course Published',
                message: `Your course "${course.title}" has been published by curriculum administration and is now active in the Trainee Course Catalog.`,
                type: 'COURSE' as any,
                entityType: 'COURSE',
                entityId: id,
            });
        } catch (err) {
            console.error('Failed to dispatch course publication notification:', err);
        }

        await this.logAudit({
            organizationId: course.organizationId,
            userId: userCtx.userId,
            action: 'COURSE_PUBLISHED',
            entityType: 'COURSE',
            entityId: id,
            oldValues: { status: course.status },
            newValues: { status: CourseStatus.PUBLISHED },
        });

        return updated;
    }

    public async unpublishCourse(id: string, userCtx: UserContext): Promise<Course> {
        const course = await this.getCourseById(id, userCtx);

        const isAdmin = userCtx.role === Role.ADMIN || userCtx.role === Role.SUPER_ADMIN;
        if (!isAdmin) {
            throw new ForbiddenError('Only administrators can unpublish courses.');
        }

        if (course.status !== CourseStatus.PUBLISHED) {
            throw new ConflictError('Only published courses can be unpublished');
        }

        const updated = await this.courseRepository.updateStatus(id, CourseStatus.UNPUBLISHED, {
            unpublishedAt: new Date(),
            unpublishedById: userCtx.userId,
        });

        await this.logAudit({
            organizationId: course.organizationId,
            userId: userCtx.userId,
            action: 'COURSE_UNPUBLISHED',
            entityType: 'COURSE',
            entityId: id,
            oldValues: { status: CourseStatus.PUBLISHED },
            newValues: { status: CourseStatus.UNPUBLISHED },
        });

        return updated;
    }

    public async duplicateCourse(id: string, userCtx: UserContext): Promise<Course> {
        const course = await this.getCourseById(id, userCtx);

        if (userCtx.role === Role.ADMIN || userCtx.role === Role.SUPER_ADMIN) {
            throw new ForbiddenError('Admins cannot duplicate or author courses.');
        }

        const isOwnerTrainer = userCtx.role === Role.TRAINER && course.trainerId === userCtx.userId;
        if (!isOwnerTrainer) {
            throw new ForbiddenError('Trainers can only duplicate their own courses');
        }

        const prismaClient = (await import('../database/client')).default;
        const fullCourse = await prismaClient.course.findUnique({
            where: { id },
            include: {
                modules: {
                    include: { lessons: true },
                    orderBy: { orderIndex: 'asc' },
                },
                courseCompetencies: true,
            },
        });

        if (!fullCourse) throw new NotFoundError('Course not found');

        const baseSlug = `${fullCourse.slug}-copy-${Date.now()}`;
        const newTitle = `Copy of ${fullCourse.title}`;

        const clonedCourse = await prismaClient.$transaction(async (tx) => {
            const created = await tx.course.create({
                data: {
                    organizationId: fullCourse.organizationId,
                    trainerId: userCtx.userId,
                    title: newTitle,
                    slug: baseSlug,
                    description: fullCourse.description,
                    thumbnailUrl: fullCourse.thumbnailUrl,
                    category: fullCourse.category,
                    difficulty: fullCourse.difficulty,
                    durationMinutes: fullCourse.durationMinutes,
                    status: CourseStatus.DRAFT,
                    overview: fullCourse.overview,
                    targetAudience: fullCourse.targetAudience,
                    learningOutcomes: fullCourse.learningOutcomes || undefined,
                    prerequisitesText: fullCourse.prerequisitesText,
                    glossary: fullCourse.glossary || undefined,
                    references: fullCourse.references || undefined,
                },
            });

            for (const mod of fullCourse.modules) {
                const createdMod = await tx.courseModule.create({
                    data: {
                        courseId: created.id,
                        title: mod.title,
                        description: mod.description,
                        orderIndex: mod.orderIndex,
                    },
                });

                for (const lesson of mod.lessons) {
                    await tx.lesson.create({
                        data: {
                            moduleId: createdMod.id,
                            title: lesson.title,
                            description: lesson.description,
                            contentType: lesson.contentType,
                            content: lesson.content,
                            resourceUrl: lesson.resourceUrl,
                            durationMinutes: lesson.durationMinutes,
                            orderIndex: lesson.orderIndex,
                            isPreview: lesson.isPreview,
                            learningObjectives: lesson.learningObjectives || undefined,
                            keyTakeaways: lesson.keyTakeaways || undefined,
                        },
                    });
                }
            }

            for (const cc of fullCourse.courseCompetencies) {
                await tx.courseCompetency.create({
                    data: {
                        courseId: created.id,
                        competencyId: cc.competencyId,
                        targetLevel: cc.targetLevel,
                    },
                });
            }

            return created;
        });

        return clonedCourse;
    }

    public async deleteCourse(id: string, userCtx: UserContext): Promise<{ message: string; archived: boolean }> {
        const course = await this.getCourseById(id, userCtx);

        const isOwnerTrainer = userCtx.role === Role.TRAINER && course.trainerId === userCtx.userId;
        const isAdmin = userCtx.role === Role.ADMIN || userCtx.role === Role.SUPER_ADMIN;

        if (!isOwnerTrainer && !isAdmin) {
            throw new ForbiddenError('You do not have permission to delete this course');
        }

        const prismaClient = (await import('../database/client')).default;
        const enrollmentCount = await prismaClient.enrollment.count({
            where: { courseId: id },
        });

        if (enrollmentCount > 0) {
            await prismaClient.course.update({
                where: { id },
                data: {
                    status: CourseStatus.ARCHIVED,
                    deletedAt: new Date(),
                },
            });
            return {
                message: `Course has ${enrollmentCount} historical/active enrollment(s) and was safely archived to preserve trainee records.`,
                archived: true,
            };
        }

        await prismaClient.course.delete({
            where: { id },
        });

        return {
            message: 'Course deleted successfully.',
            archived: false,
        };
    }

    public async saveDraft(id: string, draftData: any, userCtx: UserContext): Promise<any> {
        const course = await this.getCourseById(id, userCtx);

        if (userCtx.role === Role.ADMIN || userCtx.role === Role.SUPER_ADMIN) {
            throw new ForbiddenError('Admins cannot edit course drafts. Only the authoring trainer can edit courses.');
        }

        const isOwnerTrainer = userCtx.role === Role.TRAINER && course.trainerId === userCtx.userId;
        if (!isOwnerTrainer) {
            throw new ForbiddenError('Trainers can only edit their own courses');
        }

        if (course.status !== CourseStatus.DRAFT && course.status !== CourseStatus.REJECTED) {
            throw new ConflictError(`Cannot edit course while in ${course.status} state. A course under review or approved cannot be modified.`);
        }

        const prismaClient = (await import('../database/client')).default;

        // Atomic update of course metadata
        await prismaClient.course.update({
            where: { id },
            data: {
                title: draftData.title !== undefined ? draftData.title : undefined,
                description: draftData.description !== undefined ? draftData.description : undefined,
                overview: draftData.overview !== undefined ? draftData.overview : undefined,
                targetAudience: draftData.targetAudience !== undefined ? draftData.targetAudience : undefined,
                learningOutcomes: draftData.learningOutcomes !== undefined ? draftData.learningOutcomes : undefined,
                prerequisitesText: draftData.prerequisitesText !== undefined ? draftData.prerequisitesText : undefined,
                glossary: draftData.glossary !== undefined ? draftData.glossary : undefined,
                references: draftData.references !== undefined ? draftData.references : undefined,
                category: draftData.category !== undefined ? draftData.category : undefined,
                difficulty: draftData.difficulty !== undefined ? draftData.difficulty : undefined,
                durationMinutes: draftData.durationMinutes !== undefined ? draftData.durationMinutes : undefined,
            },
        });

        // If modules array is provided, sync modules and lessons
        if (Array.isArray(draftData.modules)) {
            await prismaClient.$transaction(async (tx) => {
                const existingModules = await tx.courseModule.findMany({
                    where: { courseId: id },
                    include: { lessons: true },
                });

                const incomingModuleIds = new Set<string>();
                const incomingLessonIds = new Set<string>();

                for (let mIdx = 0; mIdx < draftData.modules.length; mIdx++) {
                    const mod = draftData.modules[mIdx];
                    let moduleId = mod.id;
                    const isNewModule = !moduleId || moduleId.startsWith('mod-') || moduleId.startsWith('new-');

                    if (isNewModule) {
                        const createdMod = await tx.courseModule.create({
                            data: {
                                courseId: id,
                                title: mod.title || `Module ${mIdx + 1}`,
                                description: mod.description || '',
                                orderIndex: mod.orderIndex !== undefined ? Number(mod.orderIndex) : mIdx + 1,
                            },
                        });
                        moduleId = createdMod.id;
                    } else {
                        await tx.courseModule.update({
                            where: { id: moduleId },
                            data: {
                                title: mod.title || `Module ${mIdx + 1}`,
                                description: mod.description || '',
                                orderIndex: mod.orderIndex !== undefined ? Number(mod.orderIndex) : mIdx + 1,
                            },
                        });
                    }
                    incomingModuleIds.add(moduleId);

                    if (Array.isArray(mod.lessons)) {
                        for (let lIdx = 0; lIdx < mod.lessons.length; lIdx++) {
                            const les = mod.lessons[lIdx];
                            let lessonId = les.id;
                            const isNewLesson = !lessonId || lessonId.startsWith('les-') || lessonId.startsWith('new-');

                            const contentString = les.contentBlocks !== undefined
                                ? JSON.stringify(les.contentBlocks)
                                : (typeof les.content === 'string' ? les.content : '');

                            if (isNewLesson) {
                                const createdLesson = await tx.lesson.create({
                                    data: {
                                        moduleId,
                                        title: les.title || `Lesson ${lIdx + 1}`,
                                        description: les.description || '',
                                        durationMinutes: Number(les.durationMinutes) || 20,
                                        orderIndex: les.orderIndex !== undefined ? Number(les.orderIndex) : lIdx + 1,
                                        content: contentString,
                                        learningObjectives: Array.isArray(les.learningObjectives) ? les.learningObjectives : [],
                                        keyTakeaways: Array.isArray(les.keyTakeaways) ? les.keyTakeaways : [],
                                        isPreview: Boolean(les.isPreview),
                                    },
                                });
                                lessonId = createdLesson.id;
                            } else {
                                await tx.lesson.update({
                                    where: { id: lessonId },
                                    data: {
                                        moduleId,
                                        title: les.title || `Lesson ${lIdx + 1}`,
                                        description: les.description || '',
                                        durationMinutes: Number(les.durationMinutes) || 20,
                                        orderIndex: les.orderIndex !== undefined ? Number(les.orderIndex) : lIdx + 1,
                                        content: contentString,
                                        learningObjectives: Array.isArray(les.learningObjectives) ? les.learningObjectives : [],
                                        keyTakeaways: Array.isArray(les.keyTakeaways) ? les.keyTakeaways : [],
                                        isPreview: Boolean(les.isPreview),
                                    },
                                });
                            }
                            incomingLessonIds.add(lessonId);
                        }
                    }
                }

                // Delete lessons removed in UI
                if (incomingLessonIds.size > 0) {
                    for (const em of existingModules) {
                        for (const el of em.lessons) {
                            if (!incomingLessonIds.has(el.id)) {
                                await tx.lesson.delete({ where: { id: el.id } });
                            }
                        }
                    }
                }

                // Delete modules removed in UI
                if (incomingModuleIds.size > 0) {
                    for (const em of existingModules) {
                        if (!incomingModuleIds.has(em.id)) {
                            await tx.courseModule.delete({ where: { id: em.id } });
                        }
                    }
                }
            }, { timeout: 30000, maxWait: 10000 });
        }

        return prismaClient.course.findUnique({
            where: { id },
            include: {
                modules: {
                    include: {
                        lessons: {
                            orderBy: { orderIndex: 'asc' },
                        },
                    },
                    orderBy: { orderIndex: 'asc' },
                },
            },
        });
    }

    public async getTopicsAndCompetencies(id: string, userCtx: UserContext): Promise<any> {
        await this.getCourseById(id, userCtx);
        const prismaClient = (await import('../database/client')).default;

        const [courseTopics, competencyGroups, courseCompetencies, allCompetencies] = await Promise.all([
            prismaClient.learningTopic.findMany({
                where: { courseId: id },
                include: {
                    competencyMappings: { include: { competency: true } },
                    prerequisites: { include: { prerequisiteTopic: true } },
                    lessonMappings: { include: { lesson: true } },
                },
                orderBy: { orderIndex: 'asc' },
            }),
            prismaClient.competencyGroup.findMany({
                where: { courseId: id },
                orderBy: { orderIndex: 'asc' },
            }),
            prismaClient.courseCompetency.findMany({
                where: { courseId: id },
                include: { competency: true },
            }),
            prismaClient.competency.findMany({
                orderBy: { name: 'asc' },
            }),
        ]);

        return {
            courseId: id,
            topics: courseTopics,
            competencyGroups,
            courseCompetencies,
            availableCompetencies: allCompetencies,
        };
    }

    public async updateTopicsAndCompetencies(id: string, data: any, userCtx: UserContext): Promise<any> {
        const course = await this.getCourseById(id, userCtx);

        const isOwnerTrainer = userCtx.role === Role.TRAINER && course.trainerId === userCtx.userId;
        const isAdmin = userCtx.role === Role.ADMIN || userCtx.role === Role.SUPER_ADMIN;

        if (!isOwnerTrainer && !isAdmin) {
            throw new ForbiddenError('You do not have permission to update topics');
        }

        const prismaClient = (await import('../database/client')).default;

        // Upsert/update topics and mappings
        if (Array.isArray(data.topics)) {
            for (const t of data.topics) {
                if (t.id) {
                    await prismaClient.learningTopic.update({
                        where: { id: t.id },
                        data: {
                            name: t.name,
                            importance: t.importance,
                            difficulty: t.difficulty,
                            estimatedMinutes: t.estimatedMinutes,
                        },
                    });

                    if (t.matchedCompetencyId) {
                        await prismaClient.learningTopicCompetency.upsert({
                            where: {
                                topicId_competencyId: {
                                    topicId: t.id,
                                    competencyId: t.matchedCompetencyId,
                                },
                            },
                            update: { weight: t.weight || 1.0 },
                            create: {
                                topicId: t.id,
                                competencyId: t.matchedCompetencyId,
                                weight: t.weight || 1.0,
                            },
                        });
                    }
                }
            }
        }

        return this.getTopicsAndCompetencies(id, userCtx);
    }

    public async archiveCourse(id: string, userCtx: UserContext): Promise<Course> {
        const course = await this.getCourseById(id, userCtx);

        if (userCtx.role === Role.TRAINER && course.trainerId !== userCtx.userId) {
            throw new ForbiddenError('Trainers can only archive their own courses');
        }

        if (course.status === CourseStatus.ARCHIVED) {
            throw new ConflictError('Course is already archived');
        }

        return this.courseRepository.archive(id);
    }

    public async getAdminStats(userCtx: UserContext) {
        if (userCtx.role !== Role.ADMIN && userCtx.role !== Role.SUPER_ADMIN) {
            throw new ForbiddenError('Only administrators can access curriculum statistics');
        }
        const user = await this.userRepository.findById(userCtx.userId);
        if (this.courseRepository.getAdminStats) {
            return this.courseRepository.getAdminStats(user?.organizationId);
        }
        return { totalCourses: 0, pendingReview: 0, approved: 0, published: 0, rejected: 0, unpublished: 0, draft: 0 };
    }

    public async getCourseForReview(id: string, userCtx: UserContext): Promise<any> {
        if (userCtx.role !== Role.ADMIN && userCtx.role !== Role.SUPER_ADMIN && userCtx.role !== Role.TRAINER) {
            throw new ForbiddenError('Access denied to course review console');
        }

        const course = await this.courseRepository.findById(id);
        if (!course) throw new NotFoundError('Course not found');

        const user = await this.userRepository.findById(userCtx.userId);
        if (!user || user.organizationId !== course.organizationId) {
            throw new ForbiddenError('You do not have access to this organization course');
        }

        if (userCtx.role === Role.TRAINER && course.trainerId !== userCtx.userId) {
            throw new ForbiddenError('Trainers can only review their own courses');
        }

        // If Admin is opening a SUBMITTED or PENDING_APPROVAL course, mark as UNDER_REVIEW
        if ((userCtx.role === Role.ADMIN || userCtx.role === Role.SUPER_ADMIN) &&
            (course.status === CourseStatus.SUBMITTED || course.status === CourseStatus.PENDING_APPROVAL)) {
            await this.courseRepository.updateStatus(id, CourseStatus.UNDER_REVIEW);
            course.status = CourseStatus.UNDER_REVIEW;
        }

        const validation = await this.validateCourse(id, userCtx);

        return {
            course,
            validation,
        };
    }

    private async logAudit(data: {
        organizationId?: string | null;
        userId?: string | null;
        action: string;
        entityType: string;
        entityId?: string | null;
        oldValues?: any;
        newValues?: any;
    }) {
        try {
            const prismaClient = (await import('../database/client')).default;
            await prismaClient.auditLog.create({
                data: {
                    organizationId: data.organizationId,
                    userId: data.userId,
                    action: data.action,
                    entityType: data.entityType,
                    entityId: data.entityId,
                    oldValues: data.oldValues,
                    newValues: data.newValues,
                },
            });
        } catch (err) {
            console.error('AuditLog creation notice:', err);
        }
    }

    private async validatePrerequisites(prerequisiteIds: string[], organizationId: string, currentCourseId?: string) {
        if (new Set(prerequisiteIds).size !== prerequisiteIds.length) {
            throw new BadRequestError('Duplicate prerequisites are not allowed');
        }

        for (const prereqId of prerequisiteIds) {
            if (prereqId === currentCourseId) {
                throw new BadRequestError('Course cannot be a prerequisite of itself');
            }

            const prereqCourse = await this.courseRepository.findById(prereqId);
            if (!prereqCourse) {
                throw new BadRequestError(`Prerequisite course not found: ${prereqId}`);
            }

            if (prereqCourse.organizationId !== organizationId) {
                throw new ForbiddenError(`Cross-organization prerequisite is not allowed: ${prereqId}`);
            }
        }
        // More complex circular detection can be done here.
    }
}

export default CourseService;
