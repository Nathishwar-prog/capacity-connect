import { PrismaClient, Enrollment, EnrollmentStatus, Prisma } from '@prisma/client';

export interface IEnrollmentRepository {
    create(userId: string, courseId: string): Promise<Enrollment>;
    findById(id: string): Promise<any | null>;
    findByUserAndCourse(userId: string, courseId: string): Promise<Enrollment | null>;
    findByUser(userId: string, status?: EnrollmentStatus, skip?: number, take?: number): Promise<{ enrollments: any[]; total: number }>;
    updateProgress(id: string, progressPercentage: number, status?: EnrollmentStatus, completedAt?: Date | null): Promise<Enrollment>;
    updateStatus(id: string, status: EnrollmentStatus): Promise<Enrollment>;
    delete(id: string): Promise<Enrollment>;
    countCompletedLessons(enrollmentId: string): Promise<number>;
    getTotalLessonsForCourse(courseId: string): Promise<number>;
}

export class EnrollmentRepository implements IEnrollmentRepository {
    constructor(private prisma: PrismaClient) { }

    async create(userId: string, courseId: string): Promise<Enrollment> {
        return this.prisma.enrollment.create({
            data: {
                userId,
                courseId,
                status: EnrollmentStatus.ENROLLED,
                progressPercentage: 0,
                enrolledAt: new Date(),
            },
        });
    }

    async findById(id: string): Promise<any | null> {
        return this.prisma.enrollment.findUnique({
            where: { id },
            include: {
                course: {
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
                        modules: {
                            orderBy: { orderIndex: 'asc' },
                            include: {
                                lessons: {
                                    orderBy: { orderIndex: 'asc' },
                                },
                            },
                        },
                    },
                },
                lessonProgress: true,
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        organizationId: true,
                    },
                },
            },
        });
    }

    async findByUserAndCourse(userId: string, courseId: string): Promise<Enrollment | null> {
        return this.prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId,
                    courseId,
                },
            },
        });
    }

    async findByUser(userId: string, status?: EnrollmentStatus, skip = 0, take = 20): Promise<{ enrollments: any[]; total: number }> {
        const where: Prisma.EnrollmentWhereInput = {
            userId,
            ...(status ? { status } : {}),
        };

        const [enrollments, total] = await Promise.all([
            this.prisma.enrollment.findMany({
                where,
                skip,
                take,
                orderBy: { updatedAt: 'desc' },
                include: {
                    course: {
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
                            trainer: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    email: true,
                                },
                            },
                            modules: {
                                orderBy: { orderIndex: 'asc' },
                                include: {
                                    lessons: {
                                        orderBy: { orderIndex: 'asc' },
                                        select: {
                                            id: true,
                                            title: true,
                                            contentType: true,
                                            durationMinutes: true,
                                            orderIndex: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            }),
            this.prisma.enrollment.count({ where }),
        ]);

        return { enrollments, total };
    }

    async updateProgress(id: string, progressPercentage: number, status?: EnrollmentStatus, completedAt?: Date | null): Promise<Enrollment> {
        const data: Prisma.EnrollmentUpdateInput = {
            progressPercentage,
            ...(status ? { status } : {}),
            ...(status === EnrollmentStatus.IN_PROGRESS && !completedAt ? { startedAt: new Date() } : {}),
            ...(completedAt !== undefined ? { completedAt } : {}),
            lastAccessedAt: new Date(),
        };

        return this.prisma.enrollment.update({
            where: { id },
            data,
        });
    }

    async updateStatus(id: string, status: EnrollmentStatus): Promise<Enrollment> {
        return this.prisma.enrollment.update({
            where: { id },
            data: {
                status,
                ...(status === EnrollmentStatus.COMPLETED ? { completedAt: new Date() } : {}),
                lastAccessedAt: new Date(),
            },
        });
    }

    async delete(id: string): Promise<Enrollment> {
        return this.prisma.enrollment.delete({
            where: { id },
        });
    }

    async countCompletedLessons(enrollmentId: string): Promise<number> {
        return this.prisma.lessonProgress.count({
            where: {
                enrollmentId,
                completed: true,
            },
        });
    }

    async getTotalLessonsForCourse(courseId: string): Promise<number> {
        return this.prisma.lesson.count({
            where: {
                module: {
                    courseId,
                },
            },
        });
    }
}
