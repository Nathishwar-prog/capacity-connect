import { prisma } from '../database/client';
import { Role, UserStatus, EnrollmentStatus, AttemptStatus } from '@prisma/client';

export class DashboardService {
  /**
   * Aggregate domain dashboard data for authenticated Trainee
   */
  public async getTraineeDashboard(userId: string) {
    // 0. User Profile & Cadre details
    const user: any = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        department: { select: { id: true, name: true, code: true } },
        traineeProfile: true,
      },
    });

    // 1. Fetch user enrollments (Active & Completed) with curriculum tree
    const enrollments: any[] = await prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            trainer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                trainerProfile: {
                  select: { designation: true, bio: true },
                },
              },
            },
            modules: {
              include: {
                lessons: {
                  select: { id: true, title: true, contentType: true, durationMinutes: true, orderIndex: true },
                  orderBy: { orderIndex: 'asc' },
                },
              },
              orderBy: { orderIndex: 'asc' },
            },
          },
        },
      },
      orderBy: { enrolledAt: 'desc' },
    });

    const activeEnrollments = enrollments.filter(
      (e: any) => e.status === EnrollmentStatus.ENROLLED || e.status === EnrollmentStatus.IN_PROGRESS,
    );
    const completedCount = enrollments.filter(
      (e: any) => e.status === EnrollmentStatus.COMPLETED,
    ).length;

    // User's lesson progress
    const lessonProgress = await prisma.lessonProgress.findMany({
      where: { userId },
      select: { lessonId: true, completed: true, lastAccessedAt: true },
    });
    const completedLessonIdSet = new Set(
      lessonProgress.filter((lp: any) => lp.completed).map((lp: any) => lp.lessonId),
    );

    // 2. Primary Hero Course: Continue Learning
    let continueLearning: any = null;
    if (activeEnrollments.length > 0) {
      const primaryEnrollment = activeEnrollments[0];
      const allLessons = primaryEnrollment.course.modules.flatMap((m: any) =>
        m.lessons.map((l: any) => ({ ...l, moduleTitle: m.title })),
      );
      const nextIncompleteLesson = allLessons.find((l: any) => !completedLessonIdSet.has(l.id)) || allLessons[0];

      continueLearning = {
        enrollmentId: primaryEnrollment.id,
        courseId: primaryEnrollment.courseId,
        courseTitle: primaryEnrollment.course.title,
        slug: primaryEnrollment.course.slug,
        category: primaryEnrollment.course.category,
        difficulty: primaryEnrollment.course.difficulty,
        progressPercentage: primaryEnrollment.progressPercentage,
        currentModuleTitle: nextIncompleteLesson?.moduleTitle || primaryEnrollment.course.modules[0]?.title || 'Core Foundations',
        currentLessonTitle: nextIncompleteLesson?.title || 'Introduction to Subject',
        currentLessonType: nextIncompleteLesson?.contentType || 'ARTICLE',
        lastActivityDate: primaryEnrollment.lastAccessedAt ? primaryEnrollment.lastAccessedAt.toISOString() : primaryEnrollment.enrolledAt.toISOString(),
      };
    }

    // 3. Up Next sequential activities (next 3 incomplete lessons/quizzes)
    const upNext: Array<{
      id: string;
      title: string;
      type: string;
      durationMinutes: number;
      courseTitle: string;
      courseId: string;
    }> = [];

    for (const e of activeEnrollments) {
      for (const m of e.course.modules) {
        for (const l of m.lessons) {
          if (!completedLessonIdSet.has(l.id) && upNext.length < 3) {
            upNext.push({
              id: l.id,
              title: l.title,
              type: l.contentType === 'QUIZ' ? 'Quiz' : 'Lesson',
              durationMinutes: l.durationMinutes || 15,
              courseTitle: e.course.title,
              courseId: e.courseId,
            });
          }
        }
      }
    }

    // 4. Calculate overall progress %
    const totalProgress = activeEnrollments.reduce((sum: number, e: any) => sum + e.progressPercentage, 0);
    const avgProgress = activeEnrollments.length > 0 ? Math.round(totalProgress / activeEnrollments.length) : 0;

    // 5. Fetch assessments
    const attempts = await prisma.assessmentAttempt.findMany({
      where: { userId },
      include: {
        assessment: {
          select: {
            id: true,
            title: true,
            assessmentType: true,
            passingScore: true,
            durationMinutes: true,
          },
        },
      },
      orderBy: { startedAt: 'desc' },
      take: 6,
    });

    const pendingAssessmentsCount = attempts.filter(
      (a: any) => a.status === AttemptStatus.IN_PROGRESS,
    ).length;

    // 6. User Competencies & Gaps
    const userCompetencies = await prisma.userCompetency.findMany({
      where: { userId },
      include: {
        competency: {
          select: {
            id: true,
            name: true,
            code: true,
            category: true,
          },
        },
      },
      take: 6,
    });

    const skillGaps = await prisma.skillGap.findMany({
      where: { userId, status: 'OPEN' },
      include: {
        competency: {
          select: { id: true, name: true, code: true, category: true },
        },
      },
      orderBy: { priority: 'desc' },
      take: 4,
    });

    // 7. Learning Resources (Video, PDF, MCQ)
    const resources = await prisma.resource.findMany({
      take: 4,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        resourceType: true,
        url: true,
        fileSize: true,
      },
    });

    // 8. Achievements
    const achievements = await prisma.achievement.findMany({
      where: { userId },
      orderBy: { awardedAt: 'desc' },
      take: 4,
    });

    // 9. Recommendations
    const recommendations = await prisma.recommendation.findMany({
      where: { userId, status: 'ACTIVE' },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            difficulty: true,
            category: true,
            durationMinutes: true,
          },
        },
      },
      take: 3,
    });

    // 10. Assigned Primary Trainer Connection
    const primaryTrainer = activeEnrollments[0]?.course?.trainer || null;

    // 11. Recent Activity from AuditLog
    const recentActivity = await prisma.auditLog.findMany({
      where: { userId },
      select: {
        id: true,
        action: true,
        entityType: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 6,
    });

    // Profile completion calculation
    let profileScore = 40;
    if (user?.traineeProfile?.designation) profileScore += 30;
    if (user?.department) profileScore += 30;

    return {
      user: {
        id: user?.id,
        name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
        email: user?.email,
        department: user?.department?.name || 'Observational Meteorology',
        designation: user?.traineeProfile?.designation || 'Scientific Officer',
        profileCompletion: Math.min(100, profileScore),
      },
      continueLearning,
      metrics: {
        enrolledCourses: enrollments.length,
        inProgressCourses: activeEnrollments.length,
        completedCourses: completedCount,
        overallProgress: avgProgress,
        pendingAssessments: pendingAssessmentsCount,
        competenciesTracked: userCompetencies.length,
        skillGapsCount: skillGaps.length,
      },
      activeCourses: activeEnrollments.map((e: any) => {
        const allLessons = e.course.modules.flatMap((m: any) => m.lessons);
        const completedLessons = allLessons.filter((l: any) => completedLessonIdSet.has(l.id)).length;
        return {
          id: e.id,
          courseId: e.courseId,
          title: e.course.title,
          slug: e.course.slug,
          category: e.course.category,
          difficulty: e.course.difficulty,
          progressPercentage: e.progressPercentage,
          enrolledAt: e.enrolledAt.toISOString(),
          trainerName: e.course.instructor
            ? `${e.course.instructor.firstName} ${e.course.instructor.lastName || ''}`.trim()
            : 'Senior MoES Scientist',
          moduleCount: e.course.modules.length,
          completedLessonsCount: completedLessons,
          totalLessonsCount: allLessons.length,
        };
      }),
      upNext,
      competencies: userCompetencies.map((c: any) => ({
        id: c.id,
        name: c.competency.name,
        code: c.competency.code,
        category: c.competency.category,
        currentLevel: c.currentLevel,
        requiredLevel: 4,
        progressPercentage: Math.min(100, Math.round((c.currentLevel / 5) * 100)),
      })),
      skillGaps: skillGaps.map((g: any) => ({
        id: g.id,
        competencyName: g.competency.name,
        category: g.competency.category,
        currentLevel: g.currentLevel,
        requiredLevel: g.requiredLevel,
        gapLevel: g.gapLevel,
        priority: g.priority,
      })),
      assessments: attempts.map((a) => ({
        id: a.id,
        assessmentId: a.assessmentId,
        title: a.assessment.title,
        type: a.assessment.assessmentType,
        status: a.status,
        score: a.score,
        passingScore: a.assessment.passingScore,
        durationMinutes: a.assessment.durationMinutes,
        startedAt: a.startedAt.toISOString(),
      })),
      resources: resources.map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        type: r.resourceType,
        url: r.url,
      })),
      recommendations: recommendations.map((r) => ({
        id: r.id,
        type: r.recommendationType,
        reason: r.reason || 'Matched to your current capacity development curriculum',
        courseTitle: r.course?.title || 'Atmospheric Sciences Workshop',
        slug: r.course?.slug || 'atmospheric-sciences',
        difficulty: r.course?.difficulty || 'INTERMEDIATE',
        category: r.course?.category || 'Synoptic Meteorology',
      })),
      trainer: primaryTrainer
        ? {
            id: primaryTrainer.id,
            name: `${primaryTrainer.firstName} ${primaryTrainer.lastName || ''}`.trim(),
            designation: primaryTrainer.trainerProfile?.designation || 'Lead Scientist',
            bio: primaryTrainer.trainerProfile?.bio || 'Senior expert in observational and synoptic meteorology.',
          }
        : null,
      achievements: achievements.map((ach) => ({
        id: ach.id,
        title: ach.title,
        description: ach.description,
        type: ach.type,
        awardedAt: ach.awardedAt.toISOString(),
      })),
      recentActivity: recentActivity.map((a) => ({
        id: a.id,
        action: a.action,
        entityType: a.entityType,
        timestamp: a.createdAt.toISOString(),
      })),
    };
  }

  /**
   * Aggregate domain dashboard data for authenticated Trainer
   */
  public async getTrainerDashboard(userId: string) {
    // 1. Trainer courses authored/instructed
    const courses = await prisma.course.findMany({
      where: { trainerId: userId },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        difficulty: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 6,
    });

    const courseIds = courses.map((c) => c.id);

    // Total enrolled trainees across all courses taught by trainer
    const totalTraineesEnrolled = await prisma.enrollment.count({
      where: { courseId: { in: courseIds } },
    });

    // Pending evaluations / submitted assessment attempts on trainer courses
    const pendingEvaluationsCount = await prisma.assessmentAttempt.count({
      where: {
        status: AttemptStatus.SUBMITTED,
        assessment: { courseId: { in: courseIds } },
      },
    });

    // Recent feedback received
    const recentFeedback = await prisma.feedback.findMany({
      where: { trainerId: userId },
      include: {
        user: {
          select: { firstName: true, lastName: true },
        },
        course: {
          select: { title: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return {
      metrics: {
        activeCourses: courses.filter((c) => c.status === 'PUBLISHED').length,
        totalTrainees: totalTraineesEnrolled,
        pendingEvaluations: pendingEvaluationsCount,
        feedbackCount: recentFeedback.length,
      },
      courses: courses.map((c) => ({
        id: c.id,
        title: c.title,
        slug: c.slug,
        status: c.status,
        difficulty: c.difficulty,
      })),
      recentFeedback: recentFeedback.map((f) => ({
        id: f.id,
        rating: f.rating,
        comment: f.comment,
        courseTitle: f.course?.title || null,
        traineeName: `${f.user.firstName} ${f.user.lastName || ''}`.trim(),
        createdAt: f.createdAt.toISOString(),
      })),
    };
  }

  /**
   * Aggregate governance & capacity metrics for Admin / Super Admin
   */
  public async getAdminDashboard(organizationId?: string) {
    const orgFilter = organizationId ? { organizationId } : {};

    // 1. User distribution counts
    const [totalUsers, traineeCount, trainerCount, adminCount, pendingApprovalCount] =
      await Promise.all([
        prisma.user.count({ where: orgFilter }),
        prisma.user.count({ where: { ...orgFilter, role: Role.TRAINEE } }),
        prisma.user.count({ where: { ...orgFilter, role: Role.TRAINER } }),
        prisma.user.count({
          where: { ...orgFilter, role: { in: [Role.ADMIN, Role.SUPER_ADMIN] } },
        }),
        prisma.user.count({ where: { ...orgFilter, status: UserStatus.PENDING } }),
      ]);

    // 2. Courses & Competencies summary
    const [totalCourses, publishedCourses, totalCompetencies] = await Promise.all([
      prisma.course.count({ where: orgFilter }),
      prisma.course.count({ where: { ...orgFilter, status: 'PUBLISHED' } }),
      prisma.competency.count(),
    ]);

    // 3. Recent Administrative Audit Logs
    const recentAuditLogs = await prisma.auditLog.findMany({
      where: orgFilter,
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 8,
    });

    return {
      metrics: {
        totalUsers,
        trainees: traineeCount,
        trainers: trainerCount,
        administrators: adminCount,
        pendingApprovals: pendingApprovalCount,
        totalCourses,
        publishedCourses,
        totalCompetencies,
      },
      recentActivity: recentAuditLogs.map((log) => ({
        id: log.id,
        action: log.action,
        entityType: log.entityType,
        userName: log.user ? `${log.user.firstName} ${log.user.lastName || ''}`.trim() : 'System',
        userEmail: log.user?.email || null,
        userRole: log.user?.role || null,
        createdAt: log.createdAt.toISOString(),
      })),
    };
  }
}

export default DashboardService;
