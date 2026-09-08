import { PrismaClient, EnrollmentStatus } from '@prisma/client';
import prisma from '../database/prisma.client';

export class LearningExperienceRepository {
  private prisma: PrismaClient;

  constructor(client: PrismaClient = prisma) {
    this.prisma = client;
  }

  /**
   * Find trainee enrollment for a specific course
   */
  public async findEnrollment(userId: string, courseId: string) {
    return this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
      include: {
        course: {
          include: {
            trainer: {
              include: {
                trainerProfile: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Find complete course hierarchy with modules and lessons
   */
  public async findCourseHierarchy(courseId: string) {
    return this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        trainer: {
          include: {
            trainerProfile: true,
          },
        },
        modules: {
          orderBy: { orderIndex: 'asc' },
          include: {
            lessons: {
              orderBy: { orderIndex: 'asc' },
            },
          },
        },
      },
    });
  }

  /**
   * Find all lesson progress records for a user in a course
   */
  public async findUserLessonProgressForCourse(userId: string, courseId: string) {
    return this.prisma.lessonProgress.findMany({
      where: {
        userId,
        enrollment: {
          courseId,
        },
      },
    });
  }

  /**
   * Find single lesson with its parent module and course
   */
  public async findLessonDetails(lessonId: string) {
    return this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          include: {
            course: true,
          },
        },
      },
    });
  }

  /**
   * Find single lesson progress for user
   */
  public async findLessonProgress(userId: string, lessonId: string) {
    return this.prisma.lessonProgress.findUnique({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
    });
  }

  /**
   * Get all lessons belonging to a course in sequential order across modules
   */
  public async findOrderedLessonsForCourse(courseId: string) {
    const modules = await this.prisma.courseModule.findMany({
      where: { courseId },
      orderBy: { orderIndex: 'asc' },
      include: {
        lessons: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    return modules.flatMap((m) => m.lessons);
  }

  /**
   * Mark a lesson as completed (upsert lesson progress)
   */
  public async upsertLessonProgress(
    userId: string,
    lessonId: string,
    enrollmentId: string,
    completed: boolean,
  ) {
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
        progressPercentage: completed ? 100 : 0,
        startedAt: now,
        completedAt: completed ? now : null,
        lastAccessedAt: now,
      },
      update: {
        completed,
        progressPercentage: completed ? 100 : 0,
        completedAt: completed ? now : undefined,
        lastAccessedAt: now,
      },
    });
  }

  /**
   * Update enrollment overall progress percentage and status
   */
  public async updateEnrollmentProgress(
    enrollmentId: string,
    progressPercentage: number,
    status: EnrollmentStatus,
  ) {
    return this.prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        progressPercentage,
        status,
        lastAccessedAt: new Date(),
        startedAt: status === EnrollmentStatus.IN_PROGRESS ? new Date() : undefined,
        completedAt: status === EnrollmentStatus.COMPLETED ? new Date() : null,
      },
    });
  }
}
