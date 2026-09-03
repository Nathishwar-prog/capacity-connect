import { prisma } from '../database/client';
import { Role, UserStatus, EnrollmentStatus, AttemptStatus } from '@prisma/client';

export class DashboardService {
  /**
   * Aggregate domain dashboard data for authenticated Trainee
   */
  public async getTraineeDashboard(userId: string) {
    // 1. Fetch user enrollments (Active & Completed)
    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            category: true,
            difficulty: true,
            durationMinutes: true,
          },
        },
      },
      orderBy: { enrolledAt: 'desc' },
      take: 6,
    });

    const activeEnrollments = enrollments.filter(
      (e) => e.status === EnrollmentStatus.ENROLLED || e.status === EnrollmentStatus.IN_PROGRESS,
    );
    const completedCount = await prisma.enrollment.count({
      where: { userId, status: EnrollmentStatus.COMPLETED },
    });

    // 2. Fetch upcoming or recent assessment attempts
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
      take: 5,
    });

    const pendingAssessmentsCount = attempts.filter(
      (a) => a.status === AttemptStatus.IN_PROGRESS,
    ).length;

    // 3. Fetch user competencies
    const competencies = await prisma.userCompetency.findMany({
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

    // 4. Fetch recommendations for user
    const recommendations = await prisma.recommendation.findMany({
      where: { userId, status: 'ACTIVE' },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            difficulty: true,
          },
        },
        resource: {
          select: {
            id: true,
            title: true,
            resourceType: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 4,
    });

    // 5. Recent Activity from AuditLog
    const recentActivity = await prisma.auditLog.findMany({
      where: { userId },
      select: {
        id: true,
        action: true,
        entityType: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return {
      metrics: {
        inProgressCourses: activeEnrollments.length,
        completedCourses: completedCount,
        pendingAssessments: pendingAssessmentsCount,
        competenciesTracked: competencies.length,
      },
      activeCourses: activeEnrollments.map((e) => ({
        id: e.id,
        courseId: e.courseId,
        title: e.course.title,
        slug: e.course.slug,
        category: e.course.category,
        difficulty: e.course.difficulty,
        progressPercentage: e.progressPercentage,
        enrolledAt: e.enrolledAt.toISOString(),
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
      competencies: competencies.map((c) => ({
        id: c.id,
        name: c.competency.name,
        code: c.competency.code,
        category: c.competency.category,
        currentLevel: c.currentLevel,
      })),
      recommendations: recommendations.map((r) => ({
        id: r.id,
        type: r.recommendationType,
        reason: r.reason,
        courseTitle: r.course?.title || null,
        resourceTitle: r.resource?.title || null,
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
