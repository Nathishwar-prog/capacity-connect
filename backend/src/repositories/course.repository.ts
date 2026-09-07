import prisma from '../database/client';
import { Course, CourseStatus, CourseDifficulty } from '@prisma/client';
import { CreateCourseDto, UpdateCourseDto, CourseListParamsDto } from '../dto/course.dto';

export interface ICourseRepository {
    findById(id: string): Promise<(Course & { prerequisites?: { prerequisiteCourse: Course }[] }) | null>;
    findBySlug(slug: string): Promise<Course | null>;
    findAll(params: CourseListParamsDto): Promise<{ courses: Course[]; total: number }>;
    create(data: Omit<CreateCourseDto, 'prerequisites'>): Promise<Course>;
    update(id: string, data: Omit<UpdateCourseDto, 'prerequisites'>): Promise<Course>;
    updateStatus(id: string, status: CourseStatus, publishedAt?: Date | null): Promise<Course>;
    archive(id: string): Promise<Course>;
    updatePrerequisites(courseId: string, prerequisiteIds: string[]): Promise<void>;
    getPrerequisites(courseId: string): Promise<Course[]>;
    checkSlugExists(slug: string, excludeCourseId?: string): Promise<boolean>;
}

export class CourseRepository implements ICourseRepository {
    public async findById(id: string): Promise<(Course & { prerequisites?: { prerequisiteCourse: Course }[] }) | null> {
        return prisma.course.findUnique({
            where: { id },
            include: {
                prerequisites: {
                    include: {
                        prerequisiteCourse: true,
                    }
                }
            }
        });
    }

    public async findBySlug(slug: string): Promise<Course | null> {
        return prisma.course.findUnique({
            where: { slug },
        });
    }

    public async findAll(params: CourseListParamsDto): Promise<{ courses: Course[]; total: number }> {
        const { skip = 0, take = 20, organizationId, trainerId, category, difficulty, status, search } = params;

        const where: any = {
            deletedAt: null, // Exclude archived by default in listings? Wait, deletedAt is used for soft delete. We'll use status = ARCHIVED for archive. Let's exclude soft-deleted just in case.
        };

        if (organizationId) where.organizationId = organizationId;
        if (trainerId) where.trainerId = trainerId;
        if (category) where.category = category;
        if (difficulty) where.difficulty = difficulty;

        if (status) {
            if (Array.isArray(status)) {
                where.status = { in: status };
            } else {
                where.status = status;
            }
        }

        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [courses, total] = await Promise.all([
            prisma.course.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
                include: {
                    trainer: { select: { id: true, firstName: true, lastName: true, email: true } },
                    organization: { select: { id: true, name: true } },
                },
            }),
            prisma.course.count({ where }),
        ]);

        return { courses, total };
    }

    public async create(data: Omit<CreateCourseDto, 'prerequisites'>): Promise<Course> {
        return prisma.course.create({
            data: {
                organizationId: data.organizationId,
                trainerId: data.trainerId,
                title: data.title,
                slug: data.slug,
                description: data.description,
                thumbnailUrl: data.thumbnailUrl,
                category: data.category,
                difficulty: data.difficulty || CourseDifficulty.BEGINNER,
                durationMinutes: data.durationMinutes || 0,
                status: CourseStatus.DRAFT,
            },
        });
    }

    public async update(id: string, data: Omit<UpdateCourseDto, 'prerequisites'>): Promise<Course> {
        const updateData: any = {};
        if (data.title !== undefined) updateData.title = data.title;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.thumbnailUrl !== undefined) updateData.thumbnailUrl = data.thumbnailUrl;
        if (data.category !== undefined) updateData.category = data.category;
        if (data.difficulty !== undefined) updateData.difficulty = data.difficulty;
        if (data.durationMinutes !== undefined) updateData.durationMinutes = data.durationMinutes;

        return prisma.course.update({
            where: { id },
            data: updateData,
        });
    }

    public async updateStatus(id: string, status: CourseStatus, publishedAt?: Date | null): Promise<Course> {
        const updateData: any = { status };
        if (publishedAt !== undefined) {
            updateData.publishedAt = publishedAt;
        }

        return prisma.course.update({
            where: { id },
            data: updateData,
        });
    }

    public async archive(id: string): Promise<Course> {
        return prisma.course.update({
            where: { id },
            data: {
                status: CourseStatus.ARCHIVED,
            },
        });
    }

    public async updatePrerequisites(courseId: string, prerequisiteIds: string[]): Promise<void> {
        // We use a transaction to replace prerequisites
        await prisma.$transaction(async (tx) => {
            // Delete existing
            await tx.coursePrerequisite.deleteMany({
                where: { courseId },
            });

            // Insert new
            if (prerequisiteIds.length > 0) {
                await tx.coursePrerequisite.createMany({
                    data: prerequisiteIds.map(prereqId => ({
                        courseId,
                        prerequisiteCourseId: prereqId,
                    })),
                });
            }
        });
    }

    public async getPrerequisites(courseId: string): Promise<Course[]> {
        const prereqs = await prisma.coursePrerequisite.findMany({
            where: { courseId },
            include: { prerequisiteCourse: true },
        });
        return prereqs.map(p => p.prerequisiteCourse);
    }

    public async checkSlugExists(slug: string, excludeCourseId?: string): Promise<boolean> {
        const where: any = { slug };
        if (excludeCourseId) {
            where.id = { not: excludeCourseId };
        }
        const count = await prisma.course.count({ where });
        return count > 0;
    }
}

export default CourseRepository;
