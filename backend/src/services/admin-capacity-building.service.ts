import { prisma } from '../database/client';
import {
  Role,
  UserStatus,
  CourseStatus,
  EnrollmentStatus,
  ResourceStatus,
  ResourceType,
  Prisma,
} from '@prisma/client';

export interface TraineeFilterOptions {
  search?: string;
  departmentId?: string;
  status?: string;
  courseId?: string;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'progress' | 'lastActive' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface TrainerFilterOptions {
  search?: string;
  departmentId?: string;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'trainees' | 'courses' | 'rating';
  sortOrder?: 'asc' | 'desc';
}

export interface ResourceFilterOptions {
  search?: string;
  resourceType?: string;
  status?: string;
  courseId?: string;
  page?: number;
  limit?: number;
}

export class AdminCapacityBuildingService {
  /**
   * 1. High-level Capacity Building Cross-Module Overview
   * 100% Real Database Queries via Prisma
   */
  public async getOverview() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const [
      totalTrainees,
      newTraineesThisMonth,
      totalTrainers,
      activeTrainers,
      totalCourses,
      publishedCourses,
      pendingCourses,
      totalEnrollments,
      completedEnrollments,
      inProgressEnrollments,
      enrollmentProgressAgg,
      totalResources,
      publishedResources,
      pendingResources,
      resourceTypeGroups,
      recentAuditLogs,
      topCoursesRaw,
      trainersWithCourses,
      inactiveTraineesCount,
    ] = await Promise.all([
      // Trainees
      prisma.user.count({ where: { role: Role.TRAINEE, deletedAt: null } }),
      prisma.user.count({
        where: {
          role: Role.TRAINEE,
          createdAt: { gte: startOfMonth },
          deletedAt: null,
        },
      }),
      // Trainers
      prisma.user.count({ where: { role: Role.TRAINER, deletedAt: null } }),
      prisma.user.count({
        where: {
          role: Role.TRAINER,
          status: UserStatus.APPROVED,
          deletedAt: null,
        },
      }),
      // Courses
      prisma.course.count({ where: { deletedAt: null } }),
      prisma.course.count({
        where: { status: CourseStatus.PUBLISHED, deletedAt: null },
      }),
      prisma.course.count({
        where: {
          status: {
            in: [
              CourseStatus.PENDING_APPROVAL,
              CourseStatus.SUBMITTED,
              CourseStatus.UNDER_REVIEW,
            ],
          },
          deletedAt: null,
        },
      }),
      // Enrollments
      prisma.enrollment.count(),
      prisma.enrollment.count({
        where: { status: EnrollmentStatus.COMPLETED },
      }),
      prisma.enrollment.count({
        where: { status: EnrollmentStatus.IN_PROGRESS },
      }),
      prisma.enrollment.aggregate({
        _avg: { progressPercentage: true },
      }),
      // Resources
      prisma.resource.count({ where: { deletedAt: null } }),
      prisma.resource.count({
        where: { status: ResourceStatus.PUBLISHED, deletedAt: null },
      }),
      prisma.resource.count({
        where: { status: ResourceStatus.PENDING_APPROVAL, deletedAt: null },
      }),
      prisma.resource.groupBy({
        by: ['resourceType'],
        _count: { id: true },
        where: { deletedAt: null },
      }),
      // Recent Audit Logs
      prisma.auditLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
        },
      }),
      // Top Courses
      prisma.course.findMany({
        take: 5,
        where: { status: CourseStatus.PUBLISHED, deletedAt: null },
        include: {
          trainer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          _count: {
            select: { enrollments: true },
          },
          enrollments: {
            select: {
              status: true,
              progressPercentage: true,
            },
          },
        },
        orderBy: {
          enrollments: {
            _count: 'desc',
          },
        },
      }),
      // Trainers with their courses for workload calculation
      prisma.user.findMany({
        where: { role: Role.TRAINER, deletedAt: null },
        include: {
          taughtCourses: {
            where: { deletedAt: null },
            include: {
              enrollments: {
                select: { userId: true, status: true },
              },
            },
          },
        },
      }),
      // Inactive Trainees (no login in 14 days and no enrollment activity in 14 days)
      prisma.user.count({
        where: {
          role: Role.TRAINEE,
          deletedAt: null,
          OR: [
            { lastLoginAt: { lt: fourteenDaysAgo } },
            { lastLoginAt: null, createdAt: { lt: fourteenDaysAgo } },
          ],
        },
      }),
    ]);

    // Active trainees: trainees with login or active enrollment update in last 30 days
    const activeTrainees = await prisma.user.count({
      where: {
        role: Role.TRAINEE,
        deletedAt: null,
        OR: [
          { lastLoginAt: { gte: thirtyDaysAgo } },
          {
            enrollments: {
              some: { updatedAt: { gte: thirtyDaysAgo } },
            },
          },
        ],
      },
    });

    // Calculate High Workload Trainers (> 50 distinct trainees enrolled across courses)
    let highWorkloadTrainersCount = 0;
    for (const tr of trainersWithCourses) {
      const distinctLearnerIds = new Set<string>();
      for (const course of tr.taughtCourses) {
        for (const enr of course.enrollments) {
          distinctLearnerIds.add(enr.userId);
        }
      }
      if (distinctLearnerIds.size > 50) {
        highWorkloadTrainersCount++;
      }
    }

    // Format top courses
    const formattedTopCourses = topCoursesRaw.map((course) => {
      const enrCount = course._count.enrollments;
      const completedCount = course.enrollments.filter(
        (e) => e.status === EnrollmentStatus.COMPLETED,
      ).length;
      const avgProgress =
        enrCount > 0
          ? Math.round(
              course.enrollments.reduce((acc, e) => acc + e.progressPercentage, 0) /
                enrCount,
            )
          : 0;

      return {
        id: course.id,
        title: course.title,
        category: course.category,
        difficulty: course.difficulty,
        trainer: course.trainer
          ? `${course.trainer.firstName} ${course.trainer.lastName || ''}`.trim()
          : 'Instructor',
        enrolledCount: enrCount,
        completedCount,
        averageProgress: avgProgress,
      };
    });

    // Format Attention Required alerts
    const attentionRequired = [
      {
        id: 'pending-reviews',
        level: pendingCourses > 0 ? 'CRITICAL' : 'NORMAL',
        title: `${pendingCourses} courses awaiting review & approval`,
        count: pendingCourses,
        actionUrl: '/admin/courses?status=PENDING_APPROVAL',
        actionLabel: 'Review Curricula',
      },
      {
        id: 'high-workload',
        level: highWorkloadTrainersCount > 0 ? 'WARNING' : 'NORMAL',
        title: `${highWorkloadTrainersCount} trainers have high learner workload (>50 trainees)`,
        count: highWorkloadTrainersCount,
        actionUrl: '/admin/capacity-building/trainers',
        actionLabel: 'Balance Workload',
      },
      {
        id: 'inactive-trainees',
        level: inactiveTraineesCount > 0 ? 'WARNING' : 'NORMAL',
        title: `${inactiveTraineesCount} trainees inactive for 14+ days`,
        count: inactiveTraineesCount,
        actionUrl: '/admin/capacity-building/trainees',
        actionLabel: 'View Inactive Cohort',
      },
      {
        id: 'pending-resources',
        level: pendingResources > 0 ? 'INFO' : 'NORMAL',
        title: `${pendingResources} learning resources pending verification`,
        count: pendingResources,
        actionUrl: '/admin/capacity-building/learning-resources',
        actionLabel: 'Review Assets',
      },
    ];

    const notStartedEnrollments =
      totalEnrollments - completedEnrollments - inProgressEnrollments;

    return {
      kpi: {
        totalTrainees,
        activeTrainees,
        newTraineesThisMonth,
        totalTrainers,
        activeTrainers,
        totalCourses,
        publishedCourses,
        pendingCourses,
        totalEnrollments,
        completedEnrollments,
        inProgressEnrollments,
        notStartedEnrollments: Math.max(0, notStartedEnrollments),
        averageCompletionRate: Math.round(
          enrollmentProgressAgg._avg.progressPercentage || 0,
        ),
        totalResources,
        publishedResources,
        pendingResources,
      },
      resourceTypeDistribution: resourceTypeGroups.map((g) => ({
        type: g.resourceType,
        count: g._count.id,
      })),
      topCourses: formattedTopCourses,
      attentionRequired,
      recentActivity: recentAuditLogs.map((log) => ({
        id: log.id,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        user: log.user
          ? {
              name: `${log.user.firstName} ${log.user.lastName || ''}`.trim(),
              email: log.user.email,
              role: log.user.role,
            }
          : null,
        createdAt: log.createdAt,
      })),
    };
  }

  /**
   * 2. Trainees Cohort List with Server-side Filters & Real Metrics
   */
  public async getTrainees(filters: TraineeFilterOptions) {
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filters.limit) || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      role: Role.TRAINEE,
      deletedAt: null,
    };

    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim();
      where.OR = [
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { department: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }

    if (filters.departmentId && filters.departmentId !== 'ALL') {
      where.departmentId = filters.departmentId;
    }

    if (filters.status && filters.status !== 'ALL') {
      where.status = filters.status as UserStatus;
    }

    if (filters.courseId && filters.courseId !== 'ALL') {
      where.enrollments = {
        some: { courseId: filters.courseId },
      };
    }

    const [total, trainees, departments, cohortKpis] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          department: {
            select: { id: true, name: true, code: true },
          },
          traineeProfile: {
            select: {
              designation: true,
              profileCompletion: true,
              profileCompleted: true,
              availableHoursPerWeek: true,
              targetRole: {
                select: { id: true, name: true },
              },
            },
          },
          enrollments: {
            select: {
              id: true,
              status: true,
              progressPercentage: true,
              lastAccessedAt: true,
              updatedAt: true,
            },
          },
          userTopicCompetencies: {
            select: {
              competencyScore: true,
            },
          },
        },
      }),
      prisma.department.findMany({
        select: { id: true, name: true, code: true },
        orderBy: { name: 'asc' },
      }),
      this.getTraineeCohortKPIs(),
    ]);

    // Map each trainee with exact computed real database metrics
    const mappedTrainees = (trainees as any[]).map((trainee) => {
      const enrCount = trainee.enrollments?.length || 0;
      const completedCount = (trainee.enrollments || []).filter(
        (e: any) => e.status === EnrollmentStatus.COMPLETED,
      ).length;
      const inProgressCount = (trainee.enrollments || []).filter(
        (e: any) => e.status === EnrollmentStatus.IN_PROGRESS,
      ).length;

      const avgProgress =
        enrCount > 0
          ? Math.round(
              trainee.enrollments.reduce((sum: number, e: any) => sum + e.progressPercentage, 0) /
                enrCount,
            )
          : 0;

      // Calculate competency score from real userTopicCompetency records
      let competencyScore: number | null = null;
      if (trainee.userTopicCompetencies && trainee.userTopicCompetencies.length > 0) {
        const sum = trainee.userTopicCompetencies.reduce(
          (acc: number, c: any) => acc + c.competencyScore,
          0,
        );
        competencyScore = Math.round(sum / trainee.userTopicCompetencies.length);
      }

      // Compute last active date
      const dates: Date[] = [];
      if (trainee.lastLoginAt) dates.push(new Date(trainee.lastLoginAt));
      for (const e of (trainee.enrollments || [])) {
        if (e.lastAccessedAt) dates.push(new Date(e.lastAccessedAt));
        if (e.updatedAt) dates.push(new Date(e.updatedAt));
      }
      const lastActive =
        dates.length > 0
          ? new Date(Math.max(...dates.map((d: Date) => d.getTime())))
          : trainee.createdAt;

      return {
        id: trainee.id,
        name: `${trainee.firstName} ${trainee.lastName || ''}`.trim(),
        email: trainee.email,
        phone: trainee.phone,
        avatarUrl: trainee.avatarUrl,
        status: trainee.status,
        department: trainee.department?.name || 'Unassigned Department',
        departmentId: trainee.department?.id || null,
        designation: trainee.traineeProfile?.designation || 'Staff Learner',
        targetRole: trainee.traineeProfile?.targetRole?.name || 'General Meteorologist',
        profileCompletion: trainee.traineeProfile?.profileCompletion || 0,
        enrolledCoursesCount: enrCount,
        completedCoursesCount: completedCount,
        inProgressCoursesCount: inProgressCount,
        averageProgress: avgProgress,
        competencyScore,
        lastActive,
        createdAt: trainee.createdAt,
      };
    });

    return {
      trainees: mappedTrainees,
      departments,
      kpis: cohortKpis,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  private async getTraineeCohortKPIs() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [totalTrainees, newThisMonth, totalEnrollments, avgProgressAgg] =
      await Promise.all([
        prisma.user.count({ where: { role: Role.TRAINEE, deletedAt: null } }),
        prisma.user.count({
          where: {
            role: Role.TRAINEE,
            createdAt: { gte: startOfMonth },
            deletedAt: null,
          },
        }),
        prisma.enrollment.count({
          where: { user: { role: Role.TRAINEE, deletedAt: null } },
        }),
        prisma.enrollment.aggregate({
          _avg: { progressPercentage: true },
          where: { user: { role: Role.TRAINEE, deletedAt: null } },
        }),
      ]);

    const activeTrainees = await prisma.user.count({
      where: {
        role: Role.TRAINEE,
        deletedAt: null,
        OR: [
          { lastLoginAt: { gte: thirtyDaysAgo } },
          { enrollments: { some: { updatedAt: { gte: thirtyDaysAgo } } } },
        ],
      },
    });

    return {
      totalTrainees,
      activeTrainees,
      newThisMonth,
      totalEnrollments,
      averageProgress: Math.round(avgProgressAgg._avg.progressPercentage || 0),
    };
  }

  /**
   * 3. Trainee Detail View by ID with Full Learning History & Competencies
   */
  public async getTraineeById(id: string) {
    const user: any = await prisma.user.findFirst({
      where: { id, role: Role.TRAINEE, deletedAt: null },
      include: {
        department: true,
        organization: { select: { id: true, name: true, code: true } },
        traineeProfile: {
          include: {
            targetRole: true,
          },
        },
        userSkills: {
          include: { skill: true },
        },
        qualifications: {
          orderBy: { createdAt: 'desc' },
        },
        enrollments: {
          include: {
            course: {
              include: {
                trainer: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
                _count: { select: { modules: true } },
              },
            },
          },
          orderBy: { enrolledAt: 'desc' },
        },
        assessmentAttempts: {
          include: {
            assessment: {
              select: {
                id: true,
                title: true,
                subject: true,
                passingScore: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        userTopicCompetencies: {
          include: {
            topic: {
              select: {
                id: true,
                name: true,
                code: true,
                course: { select: { id: true, title: true } },
              },
            },
          },
          orderBy: { competencyScore: 'desc' },
        },
        skillGaps: {
          include: {
            competency: { select: { id: true, name: true, category: true } },
          },
          orderBy: { priority: 'asc' },
        },
        revisionSessions: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        learningEvents: {
          take: 25,
          orderBy: { occurredAt: 'desc' },
          include: {
            topic: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    // Summary calculations
    const totalEnrolled = user.enrollments.length;
    const completedCourses = user.enrollments.filter(
      (e: any) => e.status === EnrollmentStatus.COMPLETED,
    );
    const inProgressCourses = user.enrollments.filter(
      (e: any) => e.status === EnrollmentStatus.IN_PROGRESS,
    );
    const avgProgress =
      totalEnrolled > 0
        ? Math.round(
            user.enrollments.reduce((sum: number, e: any) => sum + e.progressPercentage, 0) /
              totalEnrolled,
          )
        : 0;

    const completedAssessmentsCount = user.assessmentAttempts.filter(
      (a: any) => a.status === 'SUBMITTED',
    ).length;

    return {
      profile: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        status: user.status,
        role: user.role,
        department: user.department?.name || 'Unassigned',
        organization: user.organization?.name || 'MoES / IMD',
        designation: user.traineeProfile?.designation || 'Staff Learner',
        targetRole: user.traineeProfile?.targetRole?.title || 'General Meteorologist',
        bio: user.traineeProfile?.bio || '',
        interests: user.traineeProfile?.interests || [],
        learningGoals: user.traineeProfile?.learningGoals || [],
        availableHoursPerWeek: user.traineeProfile?.availableHoursPerWeek || 5,
        profileCompletion: user.traineeProfile?.profileCompletion || 0,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      },
      learningSummary: {
        totalEnrolled,
        completedCount: completedCourses.length,
        inProgressCount: inProgressCourses.length,
        averageProgress: avgProgress,
        assessmentsAttempted: user.assessmentAttempts.length,
        assessmentsCompleted: completedAssessmentsCount,
        revisionSessionsCount: user.revisionSessions.length,
      },
      enrollments: (user.enrollments || []).map((enr: any) => ({
        id: enr.id,
        courseId: enr.course.id,
        courseTitle: enr.course.title,
        category: enr.course.category,
        difficulty: enr.course.difficulty,
        durationMinutes: enr.course.durationMinutes,
        modulesCount: enr.course._count?.modules || 0,
        trainerName: enr.course.trainer
          ? `${enr.course.trainer.firstName} ${enr.course.trainer.lastName || ''}`.trim()
          : 'Instructor',
        trainerEmail: enr.course.trainer?.email,
        status: enr.status,
        progressPercentage: enr.progressPercentage,
        enrolledAt: enr.enrolledAt,
        startedAt: enr.startedAt,
        completedAt: enr.completedAt,
        lastAccessedAt: enr.lastAccessedAt,
      })),
      competencyOverview: {
        topics: (user.userTopicCompetencies || []).map((utc: any) => ({
          id: utc.id,
          topicId: utc.topicId,
          topicName: utc.topic?.name || 'Topic',
          courseTitle: utc.topic?.course?.title,
          competencyScore: utc.competencyScore,
          confidenceScore: utc.confidenceScore,
          retention: utc.retention,
          forgettingRisk: utc.forgettingRisk,
          attemptCount: utc.attemptCount,
        })),
        skillGaps: (user.skillGaps || []).map((sg: any) => ({
          id: sg.id,
          skillName: sg.competency?.name || 'Competency Gap',
          category: sg.competency?.category || 'General',
          priority: sg.priority,
          status: sg.status,
        })),
      },
      assessmentHistory: (user.assessmentAttempts || []).map((att: any) => ({
        id: att.id,
        assessmentTitle: att.assessment?.title || 'Assessment',
        subject: att.assessment?.subject || 'Meteorology',
        score: att.score,
        passingScore: att.assessment?.passingScore || 60,
        passed: att.passed,
        status: att.status,
        createdAt: att.createdAt,
      })),
      activityTimeline: (user.learningEvents || []).map((evt: any) => ({
        id: evt.id,
        eventType: evt.eventType,
        source: evt.source,
        topicName: evt.topic?.name || 'Learning Topic',
        rawScore: evt.rawScore,
        occurredAt: evt.occurredAt,
      })),
    };
  }

  /**
   * 4. Trainers Faculty Directory & Workload Analytics
   */
  public async getTrainers(filters: TrainerFilterOptions) {
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filters.limit) || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      role: Role.TRAINER,
      deletedAt: null,
    };

    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim();
      where.OR = [
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { department: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }

    if (filters.departmentId && filters.departmentId !== 'ALL') {
      where.departmentId = filters.departmentId;
    }

    if (filters.status && filters.status !== 'ALL') {
      where.status = filters.status as UserStatus;
    }

    const [total, trainers, kpis, departments] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          department: { select: { id: true, name: true, code: true } },
          trainerProfile: {
            include: {
              expertise: {
                include: { skill: { select: { name: true, category: true } } },
              },
            },
          },
          taughtCourses: {
            where: { deletedAt: null },
            include: {
              enrollments: {
                select: { userId: true, status: true, progressPercentage: true },
              },
            },
          },
        },
      }),
      this.getTrainerKPIs(),
      prisma.department.findMany({
        select: { id: true, name: true, code: true },
        orderBy: { name: 'asc' },
      }),
    ]);

    const mappedTrainers = trainers.map((trainer) => {
      const courses = trainer.taughtCourses || [];
      const totalCourses = courses.length;
      const publishedCourses = courses.filter(
        (c) => c.status === CourseStatus.PUBLISHED,
      ).length;
      const pendingStatuses: CourseStatus[] = [
        CourseStatus.PENDING_APPROVAL,
        CourseStatus.SUBMITTED,
        CourseStatus.UNDER_REVIEW,
      ];
      const pendingCourses = courses.filter((c) =>
        pendingStatuses.includes(c.status),
      ).length;
      const draftCourses = courses.filter((c) => c.status === CourseStatus.DRAFT).length;

      // Unique trainees taught across all courses
      const distinctLearnerIds = new Set<string>();
      let allEnrollmentsCount = 0;
      let allCompletedCount = 0;

      courses.forEach((c) => {
        c.enrollments.forEach((e) => {
          distinctLearnerIds.add(e.userId);
          allEnrollmentsCount++;
          if (e.status === EnrollmentStatus.COMPLETED) {
            allCompletedCount++;
          }
        });
      });

      const uniqueTraineesCount = distinctLearnerIds.size;
      const completionRate =
        allEnrollmentsCount > 0
          ? Math.round((allCompletedCount / allEnrollmentsCount) * 100)
          : 0;

      // Workload Level
      let workloadLevel: 'LOW' | 'NORMAL' | 'HIGH' | 'OVERLOADED' = 'NORMAL';
      if (uniqueTraineesCount < 15) workloadLevel = 'LOW';
      else if (uniqueTraineesCount <= 50) workloadLevel = 'NORMAL';
      else if (uniqueTraineesCount <= 100) workloadLevel = 'HIGH';
      else workloadLevel = 'OVERLOADED';

      return {
        id: trainer.id,
        name: `${trainer.firstName} ${trainer.lastName || ''}`.trim(),
        email: trainer.email,
        phone: trainer.phone,
        avatarUrl: trainer.avatarUrl,
        status: trainer.status,
        department: trainer.department?.name || 'General Meteorological Faculty',
        designation: trainer.trainerProfile?.designation || 'Accredited Trainer',
        yearsExperience: trainer.trainerProfile?.yearsExperience || 0,
        averageRating: trainer.trainerProfile?.averageRating || 4.8,
        totalReviews: trainer.trainerProfile?.totalReviews || 0,
        expertise:
          trainer.trainerProfile?.expertise?.map((e) => e.skill.name) || [],
        totalCourses,
        publishedCourses,
        pendingCourses,
        draftCourses,
        uniqueTraineesCount,
        allEnrollmentsCount,
        completionRate,
        workloadLevel,
        createdAt: trainer.createdAt,
        lastLoginAt: trainer.lastLoginAt,
      };
    });

    return {
      trainers: mappedTrainers,
      departments,
      kpis,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  private async getTrainerKPIs() {
    const [
      totalTrainers,
      activeTrainers,
      totalCourses,
      publishedCourses,
      pendingCourses,
    ] = await Promise.all([
      prisma.user.count({ where: { role: Role.TRAINER, deletedAt: null } }),
      prisma.user.count({
        where: {
          role: Role.TRAINER,
          status: UserStatus.APPROVED,
          deletedAt: null,
        },
      }),
      prisma.course.count({ where: { deletedAt: null } }),
      prisma.course.count({
        where: { status: CourseStatus.PUBLISHED, deletedAt: null },
      }),
      prisma.course.count({
        where: {
          status: {
            in: [
              CourseStatus.PENDING_APPROVAL,
              CourseStatus.SUBMITTED,
              CourseStatus.UNDER_REVIEW,
            ],
          },
          deletedAt: null,
        },
      }),
    ]);

    // Calculate total assigned / taught trainees across all courses
    const allTrainerEnrollments = await prisma.enrollment.findMany({
      select: { userId: true },
      distinct: ['userId'],
    });

    const trainerRatings = await prisma.trainerProfile.aggregate({
      _avg: { averageRating: true },
    });

    return {
      totalTrainers,
      activeTrainers,
      totalCourses,
      publishedCourses,
      pendingCourses,
      totalAssignedTrainees: allTrainerEnrollments.length,
      averageCourseRating:
        Number((trainerRatings._avg.averageRating || 4.8).toFixed(1)),
    };
  }

  /**
   * 5. Trainer Detail View by ID with Portfolio & Learner Workload
   */
  public async getTrainerById(id: string) {
    const trainer: any = await prisma.user.findFirst({
      where: { id, role: Role.TRAINER, deletedAt: null },
      include: {
        department: true,
        organization: { select: { id: true, name: true } },
        trainerProfile: {
          include: {
            expertise: {
              include: { skill: true },
            },
          },
        },
        qualifications: { orderBy: { createdAt: 'desc' } },
        workExperiences: { orderBy: { startDate: 'desc' } },
        taughtCourses: {
          where: { deletedAt: null },
          include: {
            _count: { select: { modules: true, enrollments: true } },
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
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        createdAssessments: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        uploadedResources: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!trainer) {
      return null;
    }

    // Process learner list across trainer's portfolio
    const distinctLearnersMap = new Map<
      string,
      {
        id: string;
        name: string;
        email: string;
        department: string;
        courseTitle: string;
        progressPercentage: number;
        status: string;
        enrolledAt: Date;
      }
    >();

    let totalEnrollments = 0;
    let completedEnrollments = 0;

    for (const course of trainer.taughtCourses) {
      for (const enr of course.enrollments) {
        totalEnrollments++;
        if (enr.status === EnrollmentStatus.COMPLETED) {
          completedEnrollments++;
        }
        if (!distinctLearnersMap.has(enr.user.id)) {
          distinctLearnersMap.set(enr.user.id, {
            id: enr.user.id,
            name: `${enr.user.firstName} ${enr.user.lastName || ''}`.trim(),
            email: enr.user.email,
            department: enr.user.department?.name || 'Department',
            courseTitle: course.title,
            progressPercentage: enr.progressPercentage,
            status: enr.status,
            enrolledAt: enr.enrolledAt,
          });
        }
      }
    }

    const uniqueLearners = Array.from(distinctLearnersMap.values());
    const completionRate =
      totalEnrollments > 0
        ? Math.round((completedEnrollments / totalEnrollments) * 100)
        : 0;

    return {
      profile: {
        id: trainer.id,
        firstName: trainer.firstName,
        lastName: trainer.lastName,
        email: trainer.email,
        phone: trainer.phone,
        avatarUrl: trainer.avatarUrl,
        status: trainer.status,
        department: trainer.department?.name || 'General Faculty',
        organization: trainer.organization?.name || 'MoES / IMD',
        designation: trainer.trainerProfile?.designation || 'Senior Instructor',
        bio: trainer.trainerProfile?.bio || '',
        yearsExperience: trainer.trainerProfile?.yearsExperience || 0,
        averageRating: trainer.trainerProfile?.averageRating || 4.8,
        totalReviews: trainer.trainerProfile?.totalReviews || 0,
        isAvailable: trainer.trainerProfile?.isAvailable ?? true,
        createdAt: trainer.createdAt,
        lastLoginAt: trainer.lastLoginAt,
      },
      expertise:
        (trainer.trainerProfile?.expertise || []).map((e: any) => ({
          skillId: e.skill?.id,
          name: e.skill?.name,
          category: e.skill?.category,
          proficiencyLevel: e.proficiencyLevel,
        })),
      workloadMetrics: {
        totalCourses: trainer.taughtCourses?.length || 0,
        totalLearners: uniqueLearners.length,
        totalEnrollments,
        completedEnrollments,
        completionRate,
        assessmentsCreated: trainer.createdAssessments?.length || 0,
        resourcesUploaded: trainer.uploadedResources?.length || 0,
      },
      coursePortfolio: (trainer.taughtCourses || []).map((c: any) => {
        const enrolled = c._count?.enrollments || 0;
        const comp = (c.enrollments || []).filter(
          (e: any) => e.status === EnrollmentStatus.COMPLETED,
        ).length;
        return {
          id: c.id,
          title: c.title,
          category: c.category,
          difficulty: c.difficulty,
          status: c.status,
          modulesCount: c._count?.modules || 0,
          enrolledCount: enrolled,
          completedCount: comp,
          completionRate: enrolled > 0 ? Math.round((comp / enrolled) * 100) : 0,
          createdAt: c.createdAt,
          publishedAt: c.publishedAt,
        };
      }),
      assignedLearners: uniqueLearners,
    };
  }

  /**
   * 6. Learning Resources Listing with Filters & KPIs
   */
  public async getResources(filters: ResourceFilterOptions) {
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filters.limit) || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.ResourceWhereInput = {
      deletedAt: null,
    };

    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { fileName: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (filters.resourceType && filters.resourceType !== 'ALL') {
      where.resourceType = filters.resourceType as ResourceType;
    }

    if (filters.status && filters.status !== 'ALL') {
      where.status = filters.status as ResourceStatus;
    }

    if (filters.courseId && filters.courseId !== 'ALL') {
      where.courseResources = {
        some: { courseId: filters.courseId },
      };
    }

    const [total, resources, kpis] = await Promise.all([
      prisma.resource.count({ where }),
      prisma.resource.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          uploader: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
          courseResources: {
            include: {
              course: { select: { id: true, title: true } },
            },
          },
          lessonResources: {
            include: {
              lesson: { select: { id: true, title: true } },
            },
          },
        },
      }),
      this.getResourceKPIs(),
    ]);

    const mappedResources = resources.map((res) => {
      const attachedCourses = res.courseResources.map((cr) => ({
        id: cr.course.id,
        title: cr.course.title,
      }));
      const attachedLessons = res.lessonResources.map((lr) => ({
        id: lr.lesson.id,
        title: lr.lesson.title,
      }));

      return {
        id: res.id,
        title: res.title,
        description: res.description,
        resourceType: res.resourceType,
        storageKey: res.storageKey,
        url: res.url,
        fileName: res.fileName,
        mimeType: res.mimeType,
        fileSize: res.fileSize ? Number(res.fileSize) : null,
        status: res.status,
        uploader: res.uploader
          ? {
              name: `${res.uploader.firstName} ${res.uploader.lastName || ''}`.trim(),
              email: res.uploader.email,
              role: res.uploader.role,
            }
          : null,
        attachedCourses,
        attachedLessons,
        usageCount: attachedCourses.length + attachedLessons.length,
        createdAt: res.createdAt,
        updatedAt: res.updatedAt,
      };
    });

    return {
      resources: mappedResources,
      kpis,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  private async getResourceKPIs() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalResources, publishedResources, pendingReview, addedThisMonth, typeGroups] =
      await Promise.all([
        prisma.resource.count({ where: { deletedAt: null } }),
        prisma.resource.count({
          where: { status: ResourceStatus.PUBLISHED, deletedAt: null },
        }),
        prisma.resource.count({
          where: { status: ResourceStatus.PENDING_APPROVAL, deletedAt: null },
        }),
        prisma.resource.count({
          where: { createdAt: { gte: startOfMonth }, deletedAt: null },
        }),
        prisma.resource.groupBy({
          by: ['resourceType'],
          _count: { id: true },
          where: { deletedAt: null },
        }),
      ]);

    const typeCounts: Record<string, number> = {};
    for (const g of typeGroups) {
      typeCounts[g.resourceType] = g._count.id;
    }

    return {
      totalResources,
      publishedResources,
      pendingReview,
      addedThisMonth,
      typeCounts,
    };
  }

  /**
   * 7. Resource Detail View by ID
   */
  public async getResourceById(id: string) {
    const resource = await prisma.resource.findFirst({
      where: { id, deletedAt: null },
      include: {
        uploader: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            department: { select: { name: true } },
          },
        },
        organization: { select: { id: true, name: true } },
        courseResources: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                category: true,
                status: true,
              },
            },
          },
        },
        lessonResources: {
          include: {
            lesson: {
              select: {
                id: true,
                title: true,
                module: {
                  select: {
                    id: true,
                    title: true,
                    course: { select: { id: true, title: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!resource) {
      return null;
    }

    return {
      id: resource.id,
      title: resource.title,
      description: resource.description,
      resourceType: resource.resourceType,
      storageKey: resource.storageKey,
      url: resource.url,
      fileName: resource.fileName,
      mimeType: resource.mimeType,
      fileSize: resource.fileSize ? Number(resource.fileSize) : null,
      thumbnailUrl: resource.thumbnailUrl,
      status: resource.status,
      uploader: resource.uploader
        ? {
            id: resource.uploader.id,
            name: `${resource.uploader.firstName} ${resource.uploader.lastName || ''}`.trim(),
            email: resource.uploader.email,
            role: resource.uploader.role,
            department: resource.uploader.department?.name || 'Department',
          }
        : null,
      organizationName: resource.organization?.name || 'MoES / IMD',
      attachedCourses: resource.courseResources.map((cr) => ({
        id: cr.course.id,
        title: cr.course.title,
        category: cr.course.category,
        status: cr.course.status,
      })),
      attachedLessons: resource.lessonResources.map((lr) => ({
        id: lr.lesson.id,
        title: lr.lesson.title,
        moduleTitle: lr.lesson.module?.title,
        courseTitle: lr.lesson.module?.course?.title,
      })),
      usageCount:
        resource.courseResources.length + resource.lessonResources.length,
      createdAt: resource.createdAt,
      updatedAt: resource.updatedAt,
    };
  }
}
