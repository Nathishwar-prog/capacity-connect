import prisma from '../database/client';
import { CourseStatus, AttemptStatus, Prisma, Role } from '@prisma/client';

export class TrainerRepository {
  /**
   * Fetch full trainer profile including institutional relations, skills, and qualifications
   */
  public async getTrainerProfile(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatarUrl: true,
        role: true,
        status: true,
        organizationId: true,
        departmentId: true,
        organization: { select: { id: true, name: true, code: true } },
        department: { select: { id: true, name: true, code: true } },
        trainerProfile: {
          include: {
            expertise: {
              include: {
                skill: true,
              },
            },
          },
        },
        qualifications: {
          orderBy: { startDate: 'desc' },
        },
        workExperiences: {
          orderBy: { startDate: 'desc' },
        },
        certificates: {
          orderBy: { issueDate: 'desc' },
        },
      },
    });
  }

  /**
   * Update trainer profile fields
   */
  public async updateTrainerProfile(
    userId: string,
    data: {
      designation?: string;
      organizationName?: string;
      bio?: string;
      yearsExperience?: number;
    },
  ) {
    return prisma.trainerProfile.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        designation: data.designation || 'Instructor',
        organizationName: data.organizationName || 'Capacity Connect Institute',
        bio: data.bio || '',
        yearsExperience: data.yearsExperience || 0,
      },
      include: {
        expertise: {
          include: { skill: true },
        },
      },
    });
  }

  /**
   * Add or update trainer expertise skill
   */
  public async addTrainerExpertise(
    trainerProfileId: string,
    skillId: string,
    proficiencyLevel: number,
    yearsExperience?: number,
  ) {
    return prisma.trainerExpertise.upsert({
      where: {
        trainerId_skillId: {
          trainerId: trainerProfileId,
          skillId,
        },
      },
      update: {
        proficiencyLevel,
        yearsExperience,
      },
      create: {
        trainerId: trainerProfileId,
        skillId,
        proficiencyLevel,
        yearsExperience,
      },
      include: { skill: true },
    });
  }

  /**
   * Remove trainer expertise skill
   */
  public async removeTrainerExpertise(trainerProfileId: string, skillId: string) {
    return prisma.trainerExpertise.delete({
      where: {
        trainerId_skillId: {
          trainerId: trainerProfileId,
          skillId,
        },
      },
    });
  }

  /**
   * List courses authored by trainer with pagination and filters
   */
  public async getTrainerCourses(
    trainerId: string,
    filters: {
      status?: CourseStatus;
      search?: string;
      skip?: number;
      take?: number;
    },
    userRole?: string,
    organizationId?: string,
  ) {
    const isAdmin = userRole === Role.ADMIN || userRole === Role.SUPER_ADMIN;

    // Course scope:
    // - Super Admin: all platform courses
    // - Admin: all courses in organization (or all if org not set)
    // - Trainer: courses authored by trainer OR belonging to trainer's organization
    const baseFilter: Prisma.CourseWhereInput = isAdmin
      ? organizationId && userRole !== Role.SUPER_ADMIN
        ? { organizationId }
        : {}
      : organizationId
      ? {
          OR: [
            { trainerId },
            { organizationId },
          ],
        }
      : { trainerId };

    const whereClause: Prisma.CourseWhereInput = {
      ...baseFilter,
      ...(filters.status && { status: filters.status }),
      ...(filters.search && {
        OR: [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
          { category: { contains: filters.search, mode: 'insensitive' } },
        ],
      }),
    };

    const skip = filters.skip !== undefined && filters.skip !== null ? Number(filters.skip) || 0 : 0;
    const take = filters.take !== undefined && filters.take !== null ? Number(filters.take) || 10 : 10;

    const [total, courses] = await Promise.all([
      prisma.course.count({ where: whereClause }),
      prisma.course.findMany({
        where: whereClause,
        include: {
          modules: {
            select: {
              id: true,
              title: true,
              lessons: { select: { id: true, title: true } },
            },
          },
          enrollments: {
            select: {
              id: true,
              status: true,
              progressPercentage: true,
            },
          },
          courseCompetencies: {
            include: { competency: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take,
      }),
    ]);

    return { total, courses };
  }

  /**
   * Get single course by ID for builder/viewing with full tree
   */
  public async getCourseById(courseId: string) {
    return prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          orderBy: { orderIndex: 'asc' },
          include: {
            lessons: {
              orderBy: { orderIndex: 'asc' },
            },
          },
        },
        courseCompetencies: {
          include: {
            competency: {
              include: { levels: { orderBy: { level: 'asc' } } },
            },
          },
        },
        prerequisites: {
          include: {
            prerequisiteCourse: {
              select: { id: true, title: true, slug: true, difficulty: true },
            },
          },
        },
        assessments: {
          select: {
            id: true,
            title: true,
            subject: true,
            status: true,
            durationMinutes: true,
            passingScore: true,
          },
        },
        enrollments: {
          select: { id: true, status: true, progressPercentage: true },
        },
      },
    });
  }

  /**
   * Create initial course draft
   */
  public async createCourse(data: Prisma.CourseCreateInput) {
    return prisma.course.create({ data });
  }

  /**
   * Update course metadata
   */
  public async updateCourse(courseId: string, data: Prisma.CourseUpdateInput) {
    return prisma.course.update({
      where: { id: courseId },
      data,
    });
  }

  /**
   * Delete or archive course
   */
  public async deleteCourse(courseId: string) {
    return prisma.course.delete({
      where: { id: courseId },
    });
  }

  /**
   * Unpublish course (revert status to DRAFT)
   */
  public async unpublishCourse(courseId: string) {
    return prisma.course.update({
      where: { id: courseId },
      data: {
        status: CourseStatus.DRAFT,
      },
    });
  }

  /**
   * Duplicate course
   */
  public async duplicateCourse(courseId: string, trainerId: string) {
    const fullCourse = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          include: { lessons: true },
          orderBy: { orderIndex: 'asc' },
        },
        courseCompetencies: true,
      },
    });

    if (!fullCourse) return null;

    const baseSlug = `${fullCourse.slug}-copy-${Date.now()}`;
    const newTitle = `Copy of ${fullCourse.title}`;

    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const created = await tx.course.create({
        data: {
          organizationId: fullCourse.organizationId,
          trainerId,
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
  }

  /**
   * Safe deletion: archive/soft-delete if enrollments exist, otherwise delete
   */
  public async deleteCourseSafely(courseId: string) {
    const enrollmentCount = await prisma.enrollment.count({
      where: { courseId },
    });

    if (enrollmentCount > 0) {
      await prisma.course.update({
        where: { id: courseId },
        data: {
          status: CourseStatus.ARCHIVED,
          deletedAt: new Date(),
        },
      });
      return {
        archived: true,
        message: `Course has ${enrollmentCount} enrollment(s) and was safely archived to preserve learning records.`,
      };
    }

    await prisma.course.delete({
      where: { id: courseId },
    });

    return {
      archived: false,
      message: 'Course draft deleted successfully.',
    };
  }

  /**
   * Module Management
   */
  public async createModule(data: Prisma.CourseModuleCreateInput) {
    return prisma.courseModule.create({ data });
  }

  public async updateModule(moduleId: string, data: Prisma.CourseModuleUpdateInput) {
    return prisma.courseModule.update({
      where: { id: moduleId },
      data,
    });
  }

  public async deleteModule(moduleId: string) {
    return prisma.courseModule.delete({
      where: { id: moduleId },
    });
  }

  public async getModuleById(moduleId: string) {
    return prisma.courseModule.findUnique({
      where: { id: moduleId },
      include: { course: true, lessons: true },
    });
  }

  /**
   * Lesson Management
   */
  public async createLesson(data: Prisma.LessonCreateInput) {
    return prisma.lesson.create({ data });
  }

  public async updateLesson(lessonId: string, data: Prisma.LessonUpdateInput) {
    return prisma.lesson.update({
      where: { id: lessonId },
      data,
    });
  }

  public async deleteLesson(lessonId: string) {
    return prisma.lesson.delete({
      where: { id: lessonId },
    });
  }

  public async getLessonById(lessonId: string) {
    return prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { module: { include: { course: true } } },
    });
  }

  /**
   * Reorder course modules and lessons transactionally
   */
  public async reorderCourse(
    courseId: string,
    modules: Array<{
      id: string;
      orderIndex: number;
      lessons?: Array<{ id: string; orderIndex: number }>;
    }>,
  ) {
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      for (const mod of modules) {
        await tx.courseModule.update({
          where: { id: mod.id, courseId },
          data: { orderIndex: mod.orderIndex },
        });

        if (mod.lessons && mod.lessons.length > 0) {
          for (const l of mod.lessons) {
            await tx.lesson.update({
              where: { id: l.id, moduleId: mod.id },
              data: { orderIndex: l.orderIndex },
            });
          }
        }
      }
    });
  }

  /**
   * Course-Competency Mapping
   */
  public async mapCourseCompetency(courseId: string, competencyId: string, targetLevel: number) {
    return prisma.courseCompetency.upsert({
      where: {
        courseId_competencyId: {
          courseId,
          competencyId,
        },
      },
      update: { targetLevel },
      create: {
        courseId,
        competencyId,
        targetLevel,
      },
      include: { competency: true },
    });
  }

  public async unmapCourseCompetency(courseId: string, competencyId: string) {
    return prisma.courseCompetency.delete({
      where: {
        courseId_competencyId: {
          courseId,
          competencyId,
        },
      },
    });
  }

  /**
   * Course Prerequisites
   */
  public async addCoursePrerequisite(courseId: string, prerequisiteCourseId: string) {
    return prisma.coursePrerequisite.create({
      data: {
        courseId,
        prerequisiteCourseId,
      },
      include: { prerequisiteCourse: true },
    });
  }

  public async removeCoursePrerequisite(courseId: string, prerequisiteCourseId: string) {
    return prisma.coursePrerequisite.delete({
      where: {
        courseId_prerequisiteCourseId: {
          courseId,
          prerequisiteCourseId,
        },
      },
    });
  }

  /**
   * Trainee Monitoring: Get list of trainees enrolled in trainer's courses
   */
  public async getTrainerTrainees(
    trainerId: string,
    filters: {
      page?: number;
      pageSize?: number;
      search?: string;
      courseId?: string;
      status?: string;
      progressMin?: number;
      progressMax?: number;
    },
  ) {
    // 1. Get courses taught by trainer
    const trainerCourses = await prisma.course.findMany({
      where: { trainerId },
      select: { id: true },
    });
    const courseIds = trainerCourses.map((c: { id: string }) => c.id);

    if (courseIds.length === 0) {
      return { total: 0, enrollments: [] };
    }

    const targetCourseIds = filters.courseId ? [filters.courseId] : courseIds;

    // 2. Fetch distinct trainees enrolled in these courses
    const enrollmentsWhere: Prisma.EnrollmentWhereInput = {
      courseId: { in: targetCourseIds },
      ...(filters.progressMin !== undefined && {
        progressPercentage: { gte: filters.progressMin },
      }),
      ...(filters.progressMax !== undefined && {
        progressPercentage: { lte: filters.progressMax },
      }),
      ...(filters.search && {
        user: {
          OR: [
            { firstName: { contains: filters.search, mode: 'insensitive' } },
            { lastName: { contains: filters.search, mode: 'insensitive' } },
            { email: { contains: filters.search, mode: 'insensitive' } },
          ],
        },
      }),
    };

    const skip = ((filters.page || 1) - 1) * (filters.pageSize || 10);
    const take = filters.pageSize || 10;

    const [total, enrollments] = await Promise.all([
      prisma.enrollment.count({ where: enrollmentsWhere }),
      prisma.enrollment.findMany({
        where: enrollmentsWhere,
        include: {
          user: {
            include: {
              traineeProfile: true,
              department: true,
              userSkills: { include: { skill: true } },
              userCompetencies: { include: { competency: true } },
              skillGaps: { include: { competency: true } },
            },
          },
          course: {
            select: { id: true, title: true, slug: true, difficulty: true },
          },
          lessonProgress: {
            select: { id: true, completed: true, lessonId: true },
          },
        },
        orderBy: { enrolledAt: 'desc' },
        skip,
        take,
      }),
    ]);

    return { total, enrollments };
  }

  /**
   * Trainee Monitoring: Deep dive into individual trainee
   */
  public async getTraineeDetail(trainerId: string, traineeId: string) {
    // 1. Verify trainee is enrolled in at least one course taught by trainer
    const trainerCourses = await prisma.course.findMany({
      where: { trainerId },
      select: { id: true },
    });
    const courseIds = trainerCourses.map((c: { id: string }) => c.id);

    const relevantEnrollments = await prisma.enrollment.findMany({
      where: {
        userId: traineeId,
        courseId: { in: courseIds },
      },
      include: {
        course: {
          include: {
            modules: {
              include: {
                lessons: {
                  include: {
                    lessonProgress: {
                      where: { userId: traineeId },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (relevantEnrollments.length === 0) {
      return null;
    }

    // 2. Fetch trainee profile and competencies
    const trainee = await prisma.user.findUnique({
      where: { id: traineeId },
      include: {
        traineeProfile: true,
        department: true,
        organization: true,
        userSkills: { include: { skill: true } },
        userCompetencies: {
          include: {
            competency: {
              include: { levels: true },
            },
          },
        },
        skillGaps: {
          include: { competency: true },
          orderBy: { gapLevel: 'desc' },
        },
        assessmentAttempts: {
          where: {
            assessment: { courseId: { in: courseIds } },
          },
          include: {
            assessment: {
              select: { id: true, title: true, subject: true, passingScore: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    // 3. Adaptive Revision Engine data scoped to trainer's courses
    const courseTopics = await prisma.learningTopic.findMany({
      where: { courseId: { in: courseIds } },
      select: { id: true },
    });
    const topicIds = courseTopics.map((t: { id: string }) => t.id);

    const topicCompetencies = topicIds.length > 0
      ? await prisma.userTopicCompetency.findMany({
          where: {
            userId: traineeId,
            topicId: { in: topicIds },
          },
          include: {
            topic: { select: { id: true, name: true, courseId: true } },
          },
          orderBy: { priorityScore: 'desc' },
        })
      : [];

    const learningEvents = topicIds.length > 0
      ? await prisma.learningEvent.findMany({
          where: {
            userId: traineeId,
            OR: [
              { courseId: { in: courseIds } },
              { topicId: { in: topicIds } },
            ],
          },
          include: {
            topic: { select: { id: true, name: true } },
          },
          orderBy: { occurredAt: 'desc' },
          take: 20,
        })
      : [];

    const revisionSessions = await prisma.revisionSession.findMany({
      where: {
        userId: traineeId,
        courseId: { in: courseIds },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return {
      trainee,
      enrollments: relevantEnrollments,
      topicCompetencies,
      learningEvents,
      revisionSessions,
    };
  }

  /**
   * Course-Level Analytics for Trainer
   */
  public async getCourseAnalytics(courseId: string) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          include: {
            lessons: {
              include: {
                lessonProgress: true,
              },
            },
          },
          orderBy: { orderIndex: 'asc' },
        },
        assessments: {
          include: {
            attempts: true,
          },
        },
        courseCompetencies: {
          include: {
            competency: true,
          },
        },
        learningTopics: {
          include: {
            competencyMappings: {
              include: { competency: true },
            },
          },
        },
        enrollments: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                department: { select: { name: true } },
              },
            },
          },
          orderBy: { enrolledAt: 'desc' },
        },
      },
    });

    if (!course) return null;

    const totalEnrollments = course.enrollments.length;
    const completedCount = course.enrollments.filter((e: any) => e.status === 'COMPLETED').length;
    const inProgressCount = course.enrollments.filter((e: any) => e.status === 'IN_PROGRESS').length;
    const enrolledCount = course.enrollments.filter((e: any) => e.status === 'ENROLLED').length;
    const completionRate = totalEnrollments > 0 ? Math.round((completedCount / totalEnrollments) * 100) : 0;
    const avgProgress = totalEnrollments > 0
      ? Math.round(course.enrollments.reduce((acc: number, e: any) => acc + e.progressPercentage, 0) / totalEnrollments)
      : 0;

    // Assessment calculations
    const allAttempts = course.assessments
      .flatMap((a: any) => a.attempts)
      .filter((att: any) => att.status === AttemptStatus.SUBMITTED && att.percentage !== null);

    const totalAttempts = allAttempts.length;
    const passedAttempts = allAttempts.filter((att: any) => att.passed).length;
    const passRate = totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 0;
    const avgScore = totalAttempts > 0
      ? Math.round(allAttempts.reduce((acc: number, curr: any) => acc + (curr.percentage || 0), 0) / totalAttempts)
      : 0;

    // Module breakdown
    const moduleBreakdown = course.modules.map((m: any) => {
      const lessonIds = m.lessons.map((l: any) => l.id);
      const totalLessonProgress = m.lessons.flatMap((l: any) => l.lessonProgress);
      const completedProgress = totalLessonProgress.filter((lp: any) => lp.completed).length;
      const expectedTotal = lessonIds.length * Math.max(1, totalEnrollments);
      const moduleCompletionRate = expectedTotal > 0 ? Math.round((completedProgress / expectedTotal) * 100) : 0;

      return {
        id: m.id,
        title: m.title,
        orderIndex: m.orderIndex,
        lessonCount: m.lessons.length,
        completionRate: Math.min(100, moduleCompletionRate),
      };
    });

    // Topic retention and revision insights
    const topicIds = course.learningTopics.map((t: any) => t.id);
    const userTopicCompetencies = topicIds.length > 0
      ? await prisma.userTopicCompetency.findMany({
          where: { topicId: { in: topicIds } },
          include: { topic: true },
        })
      : [];

    const avgCompetencyScore = userTopicCompetencies.length > 0
      ? Math.round(userTopicCompetencies.reduce((acc: number, curr: any) => acc + curr.competencyScore, 0) / userTopicCompetencies.length)
      : 75;

    const avgForgettingRisk = userTopicCompetencies.length > 0
      ? Math.round(userTopicCompetencies.reduce((acc: number, curr: any) => acc + curr.forgettingRisk, 0) / userTopicCompetencies.length * 100)
      : 20;

    const priorityTopics = userTopicCompetencies
      .filter((utc: any) => utc.priorityScore > 60 || utc.forgettingRisk > 0.4)
      .slice(0, 5)
      .map((utc: any) => ({
        topicId: utc.topicId,
        title: utc.topic.name,
        competencyScore: Math.round(utc.competencyScore),
        forgettingRisk: Math.round(utc.forgettingRisk * 100),
        priorityScore: Math.round(utc.priorityScore),
      }));

    return {
      course: {
        id: course.id,
        title: course.title,
        slug: course.slug,
        status: course.status,
        difficulty: course.difficulty,
        category: course.category,
        durationMinutes: course.durationMinutes,
        publishedAt: course.publishedAt?.toISOString() || null,
        updatedAt: course.updatedAt.toISOString(),
      },
      kpis: {
        totalEnrollments,
        activeLearners: inProgressCount + enrolledCount,
        completedLearners: completedCount,
        completionRate,
        averageProgress: avgProgress,
        totalAttempts,
        passRate,
        averageScore: avgScore,
        competencyAttainment: avgCompetencyScore,
        averageForgettingRisk: avgForgettingRisk,
      },
      moduleBreakdown,
      competencies: course.courseCompetencies.map((cc: any) => ({
        id: cc.competency.id,
        name: cc.competency.name,
        targetLevel: cc.targetLevel,
      })),
      priorityTopics,
      enrolledTrainees: course.enrollments.slice(0, 50).map((e: any) => ({
        enrollmentId: e.id,
        traineeId: e.user.id,
        name: `${e.user.firstName} ${e.user.lastName || ''}`.trim(),
        email: e.user.email,
        department: e.user.department?.name || 'Observational Meteorology',
        progress: e.progressPercentage,
        status: e.status,
        enrolledAt: e.enrolledAt.toISOString(),
        lastAccessedAt: e.lastAccessedAt?.toISOString() || null,
      })),
    };
  }

  /**
   * Assessment Management
   */
  public async getTrainerAssessments(trainerId: string) {
    return prisma.assessment.findMany({
      where: { trainerId },
      include: {
        course: { select: { id: true, title: true, slug: true } },
        questions: { select: { id: true } },
        attempts: { select: { id: true, score: true, passed: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  public async getAssessmentById(assessmentId: string) {
    return prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        course: { select: { id: true, title: true, slug: true } },
        questions: {
          orderBy: { orderIndex: 'asc' },
          include: {
            options: { orderBy: { orderIndex: 'asc' } },
          },
        },
        attempts: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  public async createAssessment(data: Prisma.AssessmentCreateInput) {
    return prisma.assessment.create({
      data,
      include: {
        questions: { include: { options: true } },
      },
    });
  }

  public async getAssessmentAttempts(assessmentId: string) {
    return prisma.assessmentAttempt.findMany({
      where: { assessmentId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            department: true,
          },
        },
        answers: true,
        competencyResults: { include: { competency: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Trainer Analytics Aggregations
   */
  public async getTrainerAnalytics(trainerId: string) {
    // Fetch all trainer courses
    const courses = await prisma.course.findMany({
      where: { trainerId },
      include: {
        enrollments: true,
        assessments: {
          include: {
            attempts: true,
          },
        },
        courseCompetencies: {
          include: { competency: true },
        },
      },
    });

    const totalCourses = courses.length;
    const publishedCourses = courses.filter(
      (c: { status: CourseStatus }) => c.status === CourseStatus.PUBLISHED,
    ).length;
    const draftCourses = courses.filter(
      (c: { status: CourseStatus }) => c.status === CourseStatus.DRAFT,
    ).length;
    const pendingCourses = courses.filter(
      (c: { status: CourseStatus }) => c.status === CourseStatus.PENDING_APPROVAL,
    ).length;

    const allEnrollments = courses.flatMap((c: { enrollments: any[] }) => c.enrollments);
    const totalEnrollments = allEnrollments.length;
    const completedLearners = allEnrollments.filter(
      (e: { status: string }) => e.status === 'COMPLETED',
    ).length;
    const inProgressLearners = allEnrollments.filter(
      (e: { status: string }) => e.status === 'IN_PROGRESS',
    ).length;

    const avgProgress =
      totalEnrollments > 0
        ? Math.round(
            allEnrollments.reduce(
              (acc: number, curr: { progressPercentage: number }) => acc + curr.progressPercentage,
              0,
            ) / totalEnrollments,
          )
        : 0;

    const allAttempts = courses
      .flatMap((c: { assessments: any[] }) => c.assessments)
      .flatMap((a: { attempts: any[] }) => a.attempts)
      .filter(
        (att: { status: AttemptStatus; percentage: number | null }) =>
          att.status === AttemptStatus.SUBMITTED && att.percentage !== null,
      );

    const avgScore =
      allAttempts.length > 0
        ? Math.round(
            allAttempts.reduce(
              (acc: number, curr: { percentage: number | null }) => acc + (curr.percentage || 0),
              0,
            ) / allAttempts.length,
          )
        : 0;

    // Course performance breakdown
    const coursePerformance = courses.map((c: any) => ({
      id: c.id,
      title: c.title,
      slug: c.slug,
      status: c.status,
      difficulty: c.difficulty,
      enrolledCount: c.enrollments.length,
      completionRate:
        c.enrollments.length > 0
          ? Math.round(
              (c.enrollments.filter((e: any) => e.status === 'COMPLETED').length /
                c.enrollments.length) *
                100,
            )
          : 0,
      averageProgress:
        c.enrollments.length > 0
          ? Math.round(
              c.enrollments.reduce((sum: number, e: any) => sum + e.progressPercentage, 0) /
                c.enrollments.length,
            )
          : 0,
    }));

    // Competencies covered
    const competencySet = new Map<string, string>();
    courses.forEach((c: any) => {
      c.courseCompetencies.forEach((cc: any) => {
        competencySet.set(cc.competency.id, cc.competency.name);
      });
    });

    return {
      kpis: {
        totalCourses,
        publishedCourses,
        draftCourses,
        pendingCourses,
        totalEnrollments,
        activeLearners: inProgressLearners,
        completedLearners,
        avgProgress,
        avgScore,
        competenciesCovered: competencySet.size,
      },
      coursePerformance,
      competenciesCovered: Array.from(competencySet.entries()).map(([id, name]) => ({
        id,
        name,
      })),
    };
  }

  /**
   * Feedback received for trainer's courses
   */
  public async getTrainerFeedback(trainerId: string) {
    return prisma.feedback.findMany({
      where: { trainerId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        course: { select: { id: true, title: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Audit log writer for trainer operations
   */
  public async logAudit(data: {
    organizationId: string;
    userId: string;
    action: string;
    entityType: string;
    entityId?: string;
    oldValues?: any;
    newValues?: any;
  }) {
    return prisma.auditLog.create({ data });
  }

  /**
   * Fetch recent activity log for trainer
   */
  public async getRecentActivity(userId: string) {
    return prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 6,
    });
  }
}
