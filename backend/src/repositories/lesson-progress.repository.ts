import { PrismaClient, LessonProgress } from '@prisma/client';

export interface ILessonProgressRepository {
    upsert(userId: string, lessonId: string, enrollmentId: string, completed: boolean, progressPercentage?: number): Promise<LessonProgress>;
    findByUserAndLesson(userId: string, lessonId: string): Promise<LessonProgress | null>;
    findByEnrollment(enrollmentId: string): Promise<LessonProgress[]>;
}

export class LessonProgressRepository implements ILessonProgressRepository {
    constructor(private prisma: PrismaClient) { }

    async upsert(userId: string, lessonId: string, enrollmentId: string, completed: boolean, progressPercentage = completed ? 100 : 0): Promise<LessonProgress> {
        const now = new Date();

        return this.prisma.lessonProgress.upsert({
            where: {
                userId_lessonId: {
                    userId,
                    lessonId,
                },
            },
            create: {
                userId,
                lessonId,
                enrollmentId,
                completed,
                progressPercentage,
                startedAt: now,
                completedAt: completed ? now : null,
                lastAccessedAt: now,
            },
            update: {
                completed,
                progressPercentage,
                ...(completed ? { completedAt: now } : {}),
                lastAccessedAt: now,
            },
        });
    }

    async findByUserAndLesson(userId: string, lessonId: string): Promise<LessonProgress | null> {
        return this.prisma.lessonProgress.findUnique({
            where: {
                userId_lessonId: {
                    userId,
                    lessonId,
                },
            },
        });
    }

    async findByEnrollment(enrollmentId: string): Promise<LessonProgress[]> {
        return this.prisma.lessonProgress.findMany({
            where: { enrollmentId },
            include: {
                lesson: true,
            },
        });
    }
}
