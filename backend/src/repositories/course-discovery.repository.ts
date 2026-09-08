import prisma from '../database/client';
import { CourseDifficulty, CourseStatus, Prisma, Enrollment } from '@prisma/client';
import { CourseQueryInput } from '../validators/course-discovery.validator';

export class CourseDiscoveryRepository {
  public async findCourses(query: CourseQueryInput, currentUserId?: string) {
    const { search, category, difficulty, trainerId, page, limit, sortBy } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.CourseWhereInput = {
      deletedAt: null,
      status: CourseStatus.PUBLISHED,
    };

    if (category && category !== 'ALL') {
      where.category = category;
    }

    if (difficulty) {
      where.difficulty = difficulty;
    }

    if (trainerId && trainerId !== 'ALL') {
      where.trainerId = trainerId;
    }

    if (search && search.trim()) {
      const term = search.trim();
      where.OR = [
        { title: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
        { category: { contains: term, mode: 'insensitive' } },
        {
          trainer: {
            OR: [
              { firstName: { contains: term, mode: 'insensitive' } },
              { lastName: { contains: term, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    let orderBy: Prisma.CourseOrderByWithRelationInput = { createdAt: 'desc' };
    if (sortBy === 'title') {
      orderBy = { title: 'asc' };
    } else if (sortBy === 'duration') {
      orderBy = { durationMinutes: 'asc' };
    }

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          trainer: {
            include: { trainerProfile: true },
          },
          modules: {
            include: {
              _count: { select: { lessons: true } },
            },
          },
          enrollments: currentUserId
            ? {
                where: { userId: currentUserId },
              }
            : false,
        },
      }),
      prisma.course.count({ where }),
    ]);

    return { courses, total };
  }

  public async findCourseById(courseId: string, currentUserId?: string) {
    return prisma.course.findFirst({
      where: {
        id: courseId,
        deletedAt: null,
      },
      include: {
        trainer: {
          include: { trainerProfile: true },
        },
        modules: {
          orderBy: { orderIndex: 'asc' },
          include: {
            lessons: {
              orderBy: { orderIndex: 'asc' },
            },
          },
        },
        prerequisites: {
          include: {
            prerequisiteCourse: true,
          },
        },
        courseCompetencies: {
          include: {
            competency: true,
          },
        },
        enrollments: currentUserId
          ? {
              where: { userId: currentUserId },
            }
          : false,
      },
    });
  }

  public async findEnrollment(userId: string, courseId: string): Promise<Enrollment | null> {
    return prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });
  }

  public async createEnrollment(userId: string, courseId: string): Promise<Enrollment> {
    return prisma.enrollment.create({
      data: {
        userId,
        courseId,
        progressPercentage: 0,
      },
      include: {
        course: true,
      },
    });
  }

  public async getFilterMetadata() {
    const [categoriesRaw, trainersRaw] = await Promise.all([
      prisma.course.findMany({
        where: { deletedAt: null, status: CourseStatus.PUBLISHED },
        select: { category: true },
        distinct: ['category'],
      }),
      prisma.user.findMany({
        where: {
          taughtCourses: {
            some: { deletedAt: null, status: CourseStatus.PUBLISHED },
          },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          trainerProfile: {
            select: { designation: true, organizationName: true },
          },
        },
      }),
    ]);

    const categories = categoriesRaw.map((c) => c.category);
    const difficulties = Object.values(CourseDifficulty);

    const trainers = trainersRaw.map((t) => ({
      id: t.id,
      name: `${t.firstName} ${t.lastName || ''}`.trim(),
      designation: t.trainerProfile?.designation || null,
      organizationName: t.trainerProfile?.organizationName || null,
      avatarUrl: t.avatarUrl,
    }));

    return { categories, difficulties, trainers };
  }
}
