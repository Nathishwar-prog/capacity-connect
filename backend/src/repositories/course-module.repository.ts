import prisma from '../database/client';
import { CourseModule, Course } from '@prisma/client';
import { CreateModuleDto, UpdateModuleDto, ModuleOrderInput } from '../dto/course-structure.dto';

export interface ICourseModuleRepository {
    findById(id: string): Promise<(CourseModule & { course?: Course }) | null>;
    findByCourseId(courseId: string): Promise<CourseModule[]>;
    create(courseId: string, data: CreateModuleDto): Promise<CourseModule>;
    update(id: string, data: UpdateModuleDto): Promise<CourseModule>;
    delete(id: string): Promise<CourseModule>;
    reorderModules(courseId: string, moduleOrders: ModuleOrderInput[]): Promise<void>;
    getNextOrderIndex(courseId: string): Promise<number>;
    getCourseStructure(courseId: string): Promise<any>;
}

export class CourseModuleRepository implements ICourseModuleRepository {
    public async findById(id: string): Promise<(CourseModule & { course?: Course }) | null> {
        return prisma.courseModule.findUnique({
            where: { id },
            include: {
                course: true,
            },
        });
    }

    public async findByCourseId(courseId: string): Promise<CourseModule[]> {
        return prisma.courseModule.findMany({
            where: { courseId },
            orderBy: { orderIndex: 'asc' },
        });
    }

    public async getNextOrderIndex(courseId: string): Promise<number> {
        const lastModule = await prisma.courseModule.findFirst({
            where: { courseId },
            orderBy: { orderIndex: 'desc' },
            select: { orderIndex: true },
        });
        return lastModule ? lastModule.orderIndex + 1 : 0;
    }

    public async create(courseId: string, data: CreateModuleDto): Promise<CourseModule> {
        const orderIndex = data.orderIndex !== undefined
            ? data.orderIndex
            : await this.getNextOrderIndex(courseId);

        return prisma.courseModule.create({
            data: {
                courseId,
                title: data.title,
                description: data.description || null,
                orderIndex,
            },
        });
    }

    public async update(id: string, data: UpdateModuleDto): Promise<CourseModule> {
        const updateData: any = {};
        if (data.title !== undefined) updateData.title = data.title;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.orderIndex !== undefined) updateData.orderIndex = data.orderIndex;

        return prisma.courseModule.update({
            where: { id },
            data: updateData,
        });
    }

    public async delete(id: string): Promise<CourseModule> {
        return prisma.courseModule.delete({
            where: { id },
        });
    }

    public async reorderModules(_courseId: string, moduleOrders: ModuleOrderInput[]): Promise<void> {
        await prisma.$transaction(async (tx) => {
            for (const item of moduleOrders) {
                await tx.courseModule.update({
                    where: { id: item.id },
                    data: { orderIndex: item.orderIndex },
                });
            }
        });
    }

    public async getCourseStructure(courseId: string): Promise<any> {
        return prisma.course.findUnique({
            where: { id: courseId },
            include: {
                modules: {
                    orderBy: { orderIndex: 'asc' },
                    include: {
                        lessons: {
                            orderBy: { orderIndex: 'asc' },
                            include: {
                                lessonResources: {
                                    include: {
                                        resource: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
    }
}

export default CourseModuleRepository;
