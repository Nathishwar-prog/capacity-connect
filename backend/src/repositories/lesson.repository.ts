import prisma from '../database/client';
import { Lesson, CourseModule, Course } from '@prisma/client';
import { CreateLessonDto, UpdateLessonDto, LessonOrderInput } from '../dto/course-structure.dto';

export interface ILessonRepository {
    findById(id: string): Promise<(Lesson & { module?: CourseModule & { course?: Course }; lessonResources?: any[] }) | null>;
    findByModuleId(moduleId: string): Promise<Lesson[]>;
    create(moduleId: string, data: CreateLessonDto): Promise<Lesson>;
    update(id: string, data: UpdateLessonDto): Promise<Lesson>;
    delete(id: string): Promise<Lesson>;
    reorderLessons(moduleId: string, lessonOrders: LessonOrderInput[]): Promise<void>;
    getNextOrderIndex(moduleId: string): Promise<number>;
    attachResource(lessonId: string, resourceId: string): Promise<any>;
    detachResource(lessonId: string, resourceId: string): Promise<any>;
    getLessonResources(lessonId: string): Promise<any[]>;
}

export class LessonRepository implements ILessonRepository {
    public async findById(id: string): Promise<(Lesson & { module?: CourseModule & { course?: Course }; lessonResources?: any[] }) | null> {
        return prisma.lesson.findUnique({
            where: { id },
            include: {
                module: {
                    include: {
                        course: true,
                    },
                },
                lessonResources: {
                    include: {
                        resource: true,
                    },
                },
            },
        });
    }

    public async findByModuleId(moduleId: string): Promise<Lesson[]> {
        return prisma.lesson.findMany({
            where: { moduleId },
            orderBy: { orderIndex: 'asc' },
        });
    }

    public async getNextOrderIndex(moduleId: string): Promise<number> {
        const lastLesson = await prisma.lesson.findFirst({
            where: { moduleId },
            orderBy: { orderIndex: 'desc' },
            select: { orderIndex: true },
        });
        return lastLesson ? lastLesson.orderIndex + 1 : 0;
    }

    public async create(moduleId: string, data: CreateLessonDto): Promise<Lesson> {
        const orderIndex = data.orderIndex !== undefined
            ? data.orderIndex
            : await this.getNextOrderIndex(moduleId);

        return prisma.lesson.create({
            data: {
                moduleId,
                title: data.title,
                description: data.description || null,
                contentType: data.contentType || 'VIDEO',
                content: data.content || null,
                resourceUrl: data.resourceUrl || null,
                durationMinutes: data.durationMinutes !== undefined ? data.durationMinutes : null,
                orderIndex,
                isPreview: data.isPreview !== undefined ? data.isPreview : false,
            },
        });
    }

    public async update(id: string, data: UpdateLessonDto): Promise<Lesson> {
        const updateData: any = {};
        if (data.title !== undefined) updateData.title = data.title;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.contentType !== undefined) updateData.contentType = data.contentType;
        if (data.content !== undefined) updateData.content = data.content;
        if (data.resourceUrl !== undefined) updateData.resourceUrl = data.resourceUrl;
        if (data.durationMinutes !== undefined) updateData.durationMinutes = data.durationMinutes;
        if (data.orderIndex !== undefined) updateData.orderIndex = data.orderIndex;
        if (data.isPreview !== undefined) updateData.isPreview = data.isPreview;

        return prisma.lesson.update({
            where: { id },
            data: updateData,
        });
    }

    public async delete(id: string): Promise<Lesson> {
        return prisma.lesson.delete({
            where: { id },
        });
    }

    public async reorderLessons(_moduleId: string, lessonOrders: LessonOrderInput[]): Promise<void> {
        await prisma.$transaction(async (tx) => {
            for (const item of lessonOrders) {
                await tx.lesson.update({
                    where: { id: item.id },
                    data: { orderIndex: item.orderIndex },
                });
            }
        });
    }

    public async attachResource(lessonId: string, resourceId: string): Promise<any> {
        return prisma.lessonResource.create({
            data: {
                lessonId,
                resourceId,
            },
            include: {
                resource: true,
            },
        });
    }

    public async detachResource(lessonId: string, resourceId: string): Promise<any> {
        return prisma.lessonResource.delete({
            where: {
                lessonId_resourceId: {
                    lessonId,
                    resourceId,
                },
            },
        });
    }

    public async getLessonResources(lessonId: string): Promise<any[]> {
        const result = await prisma.lessonResource.findMany({
            where: { lessonId },
            include: { resource: true },
        });
        return result.map(lr => lr.resource);
    }
}

export default LessonRepository;
