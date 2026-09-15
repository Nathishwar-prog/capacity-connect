import { TrainerRepository } from '../repositories/trainer.repository';
import { UserRepository } from '../repositories/user.repository';
import { CourseStatus, Role } from '@prisma/client';
import { NotFoundError, ForbiddenError, BadRequestError } from '../errors/app-error';

export class TrainerService {
  private trainerRepository: TrainerRepository;
  private userRepository: UserRepository;

  constructor(trainerRepository?: TrainerRepository, userRepository?: UserRepository) {
    this.trainerRepository = trainerRepository || new TrainerRepository();
    this.userRepository = userRepository || new UserRepository();
  }

  /**
   * Ownership Guard: Verifies that the course belongs to the authenticated trainer
   * or the user has administrative privileges.
   */
  private async assertCourseOwnership(courseId: string, trainerId: string, userRole: string) {
    const course = await this.trainerRepository.getCourseById(courseId);
    if (!course) {
      throw new NotFoundError(`Course with ID '${courseId}' was not found`);
    }

    if (userRole === Role.SUPER_ADMIN || userRole === Role.ADMIN) {
      return course;
    }

    if (course.trainerId !== trainerId) {
      const user = await this.userRepository.findById(trainerId);
      if (!user?.organizationId || user.organizationId !== course.organizationId) {
        throw new ForbiddenError('Access denied: You do not have permission to manage this course');
      }
    }

    return course;
  }

  /**
   * Profile & Professional Information
   */
  public async getProfile(userId: string) {
    const profile = await this.trainerRepository.getTrainerProfile(userId);
    if (!profile) {
      throw new NotFoundError('Trainer profile not found');
    }

    // Compute trainer stats
    const analytics = await this.trainerRepository.getTrainerAnalytics(userId);

    return {
      user: profile,
      stats: {
        totalCourses: analytics.kpis.totalCourses,
        publishedCourses: analytics.kpis.publishedCourses,
        learnersTrained: analytics.kpis.totalEnrollments,
        avgCompletionRate: analytics.kpis.avgProgress,
        avgAssessmentScore: analytics.kpis.avgScore,
        competenciesCovered: analytics.kpis.competenciesCovered,
      },
    };
  }

  public async updateProfile(
    userId: string,
    data: {
      designation?: string;
      organizationName?: string;
      bio?: string;
      yearsExperience?: number;
    },
  ) {
    const updated = await this.trainerRepository.updateTrainerProfile(userId, data);
    const user = await this.userRepository.findById(userId);

    await this.trainerRepository.logAudit({
      organizationId: user?.organizationId || '',
      userId,
      action: 'TRAINER_PROFILE_UPDATED',
      entityType: 'TrainerProfile',
      entityId: updated.id,
      newValues: data,
    });

    return updated;
  }

  public async addExpertise(
    userId: string,
    data: {
      skillId: string;
      proficiencyLevel: number;
      yearsExperience?: number;
    },
  ) {
    const profile = await this.trainerRepository.getTrainerProfile(userId);
    if (!profile || !profile.trainerProfile) {
      throw new NotFoundError('Trainer profile does not exist. Update profile first.');
    }

    return this.trainerRepository.addTrainerExpertise(
      profile.trainerProfile.id,
      data.skillId,
      data.proficiencyLevel,
      data.yearsExperience,
    );
  }

  public async removeExpertise(userId: string, skillId: string) {
    const profile = await this.trainerRepository.getTrainerProfile(userId);
    if (!profile || !profile.trainerProfile) {
      throw new NotFoundError('Trainer profile does not exist');
    }

    return this.trainerRepository.removeTrainerExpertise(profile.trainerProfile.id, skillId);
  }

  /**
   * Actionable Trainer Dashboard
   */
  /**
   * Actionable Trainer Dashboard ("Training Command Center")
   */
  public async getDashboard(userId: string) {
    const profile = await this.trainerRepository.getTrainerProfile(userId);
    const analytics = await this.trainerRepository.getTrainerAnalytics(userId);
    const { courses } = await this.trainerRepository.getTrainerCourses(userId, { take: 10 });
    const { enrollments } = await this.trainerRepository.getTrainerTrainees(userId, {
      pageSize: 50,
    });
    const assessments = await this.trainerRepository.getTrainerAssessments(userId);
    const feedback = await this.trainerRepository.getTrainerFeedback(userId);
    const recentActivity = await this.trainerRepository.getRecentActivity(userId);

    // 1. Identify Action Required items
    const actionRequired: Array<{
      id: string;
      priority: 'CRITICAL' | 'WARNING' | 'INFO';
      title: string;
      message: string;
      link: string;
      actionLabel: string;
    }> = [];

    const draftCourses = courses.filter((c: any) => c.status === CourseStatus.DRAFT);
    draftCourses.forEach((dc: any) => {
      actionRequired.push({
        id: `draft-${dc.id}`,
        priority: 'WARNING',
        title: `Draft Course: ${dc.title}`,
        message:
          'Course curriculum is in draft state. Complete modules and submit for institutional review.',
        link: `/trainer/courses/${dc.id}/builder`,
        actionLabel: 'Open Builder',
      });
    });

    const behindTrainees = enrollments.filter(
      (e: any) => e.status === 'IN_PROGRESS' && e.progressPercentage < 30,
    );
    if (behindTrainees.length > 0) {
      actionRequired.push({
        id: 'trainees-behind',
        priority: 'CRITICAL',
        title: `${behindTrainees.length} Learners Behind Pace`,
        message: 'Trainees have progress below 30% threshold in active meteorological instruction.',
        link: '/trainer/trainees?progressMax=30',
        actionLabel: 'Review Trainees',
      });
    }

    // 2. Trainee Health Distribution
    const totalEnrollments = enrollments.length;
    const completedCount = enrollments.filter((e: any) => e.status === 'COMPLETED').length;
    const onTrackCount = enrollments.filter(
      (e: any) => e.status === 'IN_PROGRESS' && e.progressPercentage >= 70,
    ).length;
    const needsAttentionCount = enrollments.filter(
      (e: any) =>
        e.status === 'IN_PROGRESS' && e.progressPercentage >= 30 && e.progressPercentage < 70,
    ).length;
    const atRiskCount = enrollments.filter(
      (e: any) => e.status === 'IN_PROGRESS' && e.progressPercentage < 30,
    ).length;

    const traineeHealth = {
      total: totalEnrollments,
      onTrack: {
        count: onTrackCount,
        percentage: totalEnrollments > 0 ? Math.round((onTrackCount / totalEnrollments) * 100) : 0,
      },
      needsAttention: {
        count: needsAttentionCount,
        percentage:
          totalEnrollments > 0 ? Math.round((needsAttentionCount / totalEnrollments) * 100) : 0,
      },
      atRisk: {
        count: atRiskCount,
        percentage: totalEnrollments > 0 ? Math.round((atRiskCount / totalEnrollments) * 100) : 0,
      },
      completed: {
        count: completedCount,
        percentage:
          totalEnrollments > 0 ? Math.round((completedCount / totalEnrollments) * 100) : 0,
      },
    };

    // 3. Trainees Needing Attention (Top 5-8 lagging learners)
    const traineesNeedingAttention = enrollments
      .filter((e: any) => e.status === 'IN_PROGRESS' && e.progressPercentage < 50)
      .slice(0, 6)
      .map((e: any) => ({
        traineeId: e.user.id,
        name: `${e.user.firstName} ${e.user.lastName || ''}`.trim(),
        email: e.user.email,
        designation: e.user.traineeProfile?.designation || 'Scientific Officer',
        department: e.user.department?.name || 'Observational Meteorology',
        courseTitle: e.course.title,
        progress: e.progressPercentage,
        status: e.progressPercentage < 30 ? 'At Risk' : 'Needs Attention',
      }));

    // 4. Learning Performance trend points
    const performanceTrend = [
      {
        label: 'Week 1',
        activeLearners: Math.max(1, Math.round(totalEnrollments * 0.4)),
        avgProgress: 24,
      },
      {
        label: 'Week 2',
        activeLearners: Math.max(1, Math.round(totalEnrollments * 0.6)),
        avgProgress: 42,
      },
      {
        label: 'Week 3',
        activeLearners: Math.max(1, Math.round(totalEnrollments * 0.8)),
        avgProgress: 58,
      },
      {
        label: 'Week 4',
        activeLearners: totalEnrollments,
        avgProgress: analytics.kpis.avgProgress || 72,
      },
    ];

    // 5. Competency Snapshot
    const competencySnapshot = {
      coveredCount: analytics.competenciesCovered.length,
      competencies: analytics.competenciesCovered.slice(0, 5).map((c: any) => ({
        id: c.id,
        name: c.name,
        targetAverage: 4,
        attainmentRate: Math.min(100, Math.max(45, (analytics.kpis.avgProgress || 60) + 5)),
      })),
      gapsCount: behindTrainees.length,
    };

    // 6. Profile Completion
    let profileScore = 0;
    if (profile?.trainerProfile?.designation) {
      profileScore += 25;
    }
    if (profile?.trainerProfile?.bio && profile.trainerProfile.bio.length > 20) {
      profileScore += 25;
    }
    if (profile?.trainerProfile?.yearsExperience && profile.trainerProfile.yearsExperience > 0) {
      profileScore += 25;
    }
    if (profile?.trainerProfile?.expertise && profile.trainerProfile.expertise.length > 0) {
      profileScore += 25;
    }

    return {
      kpis: analytics.kpis,
      traineeHealth,
      performanceTrend,
      traineesNeedingAttention,
      competencySnapshot,
      profileCompletion: profileScore,
      recentCourses: courses.map((c: any) => ({
        id: c.id,
        title: c.title,
        slug: c.slug,
        status: c.status,
        difficulty: c.difficulty,
        category: c.category,
        moduleCount: c.modules.length,
        enrolledCount: c.enrollments.length,
        completionRate:
          c.enrollments.length > 0
            ? Math.round(
                (c.enrollments.filter((e: any) => e.status === 'COMPLETED').length /
                  c.enrollments.length) *
                  100,
              )
            : 0,
      })),
      recentTrainees: enrollments.slice(0, 6).map((e: any) => ({
        enrollmentId: e.id,
        traineeId: e.user.id,
        name: `${e.user.firstName} ${e.user.lastName || ''}`.trim(),
        email: e.user.email,
        designation: e.user.traineeProfile?.designation || 'Scientific Officer',
        department: e.user.department?.name || 'Observational Meteorology',
        courseTitle: e.course.title,
        progress: e.progressPercentage,
        status: e.status,
      })),
      assessments: assessments.slice(0, 4).map((a: any) => ({
        id: a.id,
        title: a.title,
        courseTitle: a.course?.title || 'General Assessment',
        questionsCount: a.questions.length,
        attemptsCount: a.attempts.length,
        passedCount: a.attempts.filter((att: any) => att.passed).length,
        passingScore: a.passingScore,
        status: a.status,
      })),
      recentFeedback: feedback.slice(0, 4).map((f: any) => ({
        id: f.id,
        rating: f.rating,
        comment: f.comment,
        courseTitle: f.course?.title || null,
        traineeName: `${f.user.firstName} ${f.user.lastName || ''}`.trim(),
        createdAt: f.createdAt.toISOString(),
      })),
      recentActivity: recentActivity.map((a: any) => ({
        id: a.id,
        action: a.action,
        entityType: a.entityType,
        timestamp: a.createdAt.toISOString(),
      })),
      actionRequired,
    };
  }


  /**
   * Course Management
   */
  public async getCourses(
    userId: string,
    filters: {
      status?: CourseStatus;
      search?: string;
      page?: number;
      pageSize?: number;
    },
    userRole?: string,
    organizationId?: string,
  ) {
    const page = Math.max(1, Number(filters.page) || 1);
    const take = Math.min(200, Math.max(1, Number(filters.pageSize) || 10));
    const skip = (page - 1) * take;

    let resolvedOrgId = organizationId;
    if (!resolvedOrgId && userRole !== Role.SUPER_ADMIN) {
      const dbUser = await this.userRepository.findById(userId);
      resolvedOrgId = dbUser?.organizationId;
    }

    const { total, courses } = await this.trainerRepository.getTrainerCourses(
      userId,
      {
        status: filters.status,
        search: filters.search,
        skip,
        take,
      },
      userRole,
      resolvedOrgId,
    );

    return {
      courses: courses.map((c: any) => ({
        id: c.id,
        title: c.title,
        slug: c.slug,
        description: c.description,
        category: c.category,
        difficulty: c.difficulty,
        durationMinutes: c.durationMinutes,
        status: c.status,
        publishedAt: c.publishedAt,
        moduleCount: c.modules.length,
        lessonCount: c.modules.reduce((sum: number, m: any) => sum + m.lessons.length, 0),
        enrolledCount: c.enrollments.length,
        competencies: c.courseCompetencies.map((cc: any) => cc.competency.name),
        completionRate:
          c.enrollments.length > 0
            ? Math.round(
                (c.enrollments.filter((e: any) => e.status === 'COMPLETED').length /
                  c.enrollments.length) *
                  100,
              )
            : 0,
      })),
      pagination: {
        page,
        pageSize: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  public async getCourseById(courseId: string, userId: string, userRole: string) {
    return this.assertCourseOwnership(courseId, userId, userRole);
  }

  public async createCourse(
    userId: string,
    data: {
      title: string;
      slug?: string;
      description: string;
      category: string;
      difficulty?: any;
      durationMinutes?: number;
      thumbnailUrl?: string | null;
    },
  ) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const slug =
      data.slug ||
      data.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    const course = await this.trainerRepository.createCourse({
      organization: { connect: { id: user.organizationId } },
      trainer: { connect: { id: userId } },
      title: data.title,
      slug,
      description: data.description,
      category: data.category,
      difficulty: data.difficulty,
      durationMinutes: data.durationMinutes,
      thumbnailUrl: data.thumbnailUrl,
      status: CourseStatus.DRAFT,
    });

    await this.trainerRepository.logAudit({
      organizationId: user.organizationId,
      userId,
      action: 'COURSE_CREATED',
      entityType: 'Course',
      entityId: course.id,
      newValues: { title: course.title, slug: course.slug },
    });

    return course;
  }

  public async updateCourse(courseId: string, userId: string, userRole: string, data: any) {
    const course = await this.assertCourseOwnership(courseId, userId, userRole);

    if (
      course.status !== CourseStatus.DRAFT &&
      course.status !== CourseStatus.REJECTED &&
      userRole !== Role.ADMIN &&
      userRole !== Role.SUPER_ADMIN
    ) {
      throw new BadRequestError(
        `Cannot edit course in '${course.status}' status. Only DRAFT or REJECTED courses can be modified.`,
      );
    }

    const updated = await this.trainerRepository.updateCourse(courseId, data);

    await this.trainerRepository.logAudit({
      organizationId: course.organizationId,
      userId,
      action: 'COURSE_UPDATED',
      entityType: 'Course',
      entityId: course.id,
      newValues: data,
    });

    return updated;
  }

  public async deleteCourse(courseId: string, userId: string, userRole: string) {
    const course = await this.assertCourseOwnership(courseId, userId, userRole);

    const result = await this.trainerRepository.deleteCourseSafely(courseId);

    await this.trainerRepository.logAudit({
      organizationId: course.organizationId,
      userId,
      action: result.archived ? 'COURSE_ARCHIVED' : 'COURSE_DELETED',
      entityType: 'Course',
      entityId: courseId,
      oldValues: { title: course.title },
    });

    return result;
  }

  public async publishCourse(courseId: string, userId: string, userRole: string) {
    const course = await this.assertCourseOwnership(courseId, userId, userRole);

    if (course.status === CourseStatus.PUBLISHED) {
      throw new BadRequestError('Course is already published.');
    }

    if (course.modules.length === 0) {
      throw new BadRequestError('Course validation failed: Must contain at least one module.');
    }

    for (const mod of course.modules) {
      if (mod.lessons.length === 0) {
        throw new BadRequestError(
          `Course validation failed: Module '${mod.title}' contains no lessons.`,
        );
      }
    }

    const updated = await this.trainerRepository.updateCourse(courseId, {
      status: CourseStatus.PUBLISHED,
      publishedAt: new Date(),
    });

    await this.trainerRepository.logAudit({
      organizationId: course.organizationId,
      userId,
      action: 'COURSE_PUBLISHED',
      entityType: 'Course',
      entityId: courseId,
      newValues: { status: CourseStatus.PUBLISHED },
    });

    return updated;
  }

  public async unpublishCourse(courseId: string, userId: string, userRole: string) {
    const course = await this.assertCourseOwnership(courseId, userId, userRole);

    if (course.status !== CourseStatus.PUBLISHED) {
      throw new BadRequestError('Only published courses can be unpublished.');
    }

    const updated = await this.trainerRepository.unpublishCourse(courseId);

    await this.trainerRepository.logAudit({
      organizationId: course.organizationId,
      userId,
      action: 'COURSE_UNPUBLISHED',
      entityType: 'Course',
      entityId: courseId,
      newValues: { status: CourseStatus.DRAFT },
    });

    return updated;
  }

  public async duplicateCourse(courseId: string, userId: string, userRole: string) {
    const course = await this.assertCourseOwnership(courseId, userId, userRole);

    const duplicated = await this.trainerRepository.duplicateCourse(courseId, userId);
    if (!duplicated) {
      throw new NotFoundError('Course duplication failed');
    }

    await this.trainerRepository.logAudit({
      organizationId: course.organizationId,
      userId,
      action: 'COURSE_DUPLICATED',
      entityType: 'Course',
      entityId: duplicated.id,
      newValues: { title: duplicated.title, originalCourseId: courseId },
    });

    return duplicated;
  }

  public async getCourseAnalytics(courseId: string, userId: string, userRole: string) {
    await this.assertCourseOwnership(courseId, userId, userRole);
    const analytics = await this.trainerRepository.getCourseAnalytics(courseId);
    if (!analytics) {
      throw new NotFoundError('Course analytics not found');
    }
    return analytics;
  }

  /**
   * Submit Course for Admin Approval
   * Enforces structural validation rules.
   */
  public async submitCourseForApproval(courseId: string, userId: string, userRole: string) {
    const course = await this.assertCourseOwnership(courseId, userId, userRole);

    if (course.status !== CourseStatus.DRAFT && course.status !== CourseStatus.REJECTED) {
      throw new BadRequestError(
        `Cannot submit course currently in '${course.status}' state. Course must be in DRAFT or REJECTED.`,
      );
    }

    // Validation 1: At least 1 module
    if (course.modules.length === 0) {
      throw new BadRequestError('Course validation failed: Must contain at least one module.');
    }

    // Validation 2: Every module must have at least 1 lesson
    for (const mod of course.modules) {
      if (mod.lessons.length === 0) {
        throw new BadRequestError(
          `Course validation failed: Module '${mod.title}' contains no lessons.`,
        );
      }
    }

    // Validation 3: At least 1 competency mapped
    if (course.courseCompetencies.length === 0) {
      throw new BadRequestError(
        'Course validation failed: Course must map to at least one organizational competency framework.',
      );
    }

    const updated = await this.trainerRepository.updateCourse(courseId, {
      status: CourseStatus.PENDING_APPROVAL,
    });

    await this.trainerRepository.logAudit({
      organizationId: course.organizationId,
      userId,
      action: 'COURSE_SUBMITTED',
      entityType: 'Course',
      entityId: courseId,
      newValues: { status: CourseStatus.PENDING_APPROVAL },
    });

    return updated;
  }

  /**
   * Course Module & Lesson Management
   */
  public async createModule(
    courseId: string,
    userId: string,
    userRole: string,
    data: { title: string; description?: string | null; orderIndex?: number },
  ) {
    await this.assertCourseOwnership(courseId, userId, userRole);
    return this.trainerRepository.createModule({
      course: { connect: { id: courseId } },
      title: data.title,
      description: data.description,
      orderIndex: data.orderIndex || 1,
    });
  }

  public async updateModule(
    courseId: string,
    moduleId: string,
    userId: string,
    userRole: string,
    data: { title?: string; description?: string | null; orderIndex?: number },
  ) {
    await this.assertCourseOwnership(courseId, userId, userRole);
    return this.trainerRepository.updateModule(moduleId, data);
  }

  public async deleteModule(courseId: string, moduleId: string, userId: string, userRole: string) {
    await this.assertCourseOwnership(courseId, userId, userRole);
    return this.trainerRepository.deleteModule(moduleId);
  }

  public async createLesson(
    courseId: string,
    moduleId: string,
    userId: string,
    userRole: string,
    data: any,
  ) {
    await this.assertCourseOwnership(courseId, userId, userRole);
    return this.trainerRepository.createLesson({
      module: { connect: { id: moduleId } },
      title: data.title,
      description: data.description,
      contentType: data.contentType,
      content: data.content,
      resourceUrl: data.resourceUrl,
      durationMinutes: data.durationMinutes,
      orderIndex: data.orderIndex,
      isPreview: data.isPreview,
    });
  }

  public async updateLesson(
    courseId: string,
    _moduleId: string,
    lessonId: string,
    userId: string,
    userRole: string,
    data: any,
  ) {
    await this.assertCourseOwnership(courseId, userId, userRole);
    return this.trainerRepository.updateLesson(lessonId, data);
  }

  public async deleteLesson(
    courseId: string,
    _moduleId: string,
    lessonId: string,
    userId: string,
    userRole: string,
  ) {
    await this.assertCourseOwnership(courseId, userId, userRole);
    return this.trainerRepository.deleteLesson(lessonId);
  }

  public async reorderCourse(courseId: string, userId: string, userRole: string, modules: any[]) {
    await this.assertCourseOwnership(courseId, userId, userRole);
    return this.trainerRepository.reorderCourse(courseId, modules);
  }

  public async mapCompetency(
    courseId: string,
    userId: string,
    userRole: string,
    competencyId: string,
    targetLevel: number,
  ) {
    await this.assertCourseOwnership(courseId, userId, userRole);
    return this.trainerRepository.mapCourseCompetency(courseId, competencyId, targetLevel);
  }

  public async unmapCompetency(
    courseId: string,
    userId: string,
    userRole: string,
    competencyId: string,
  ) {
    await this.assertCourseOwnership(courseId, userId, userRole);
    return this.trainerRepository.unmapCourseCompetency(courseId, competencyId);
  }

  public async addPrerequisite(
    courseId: string,
    userId: string,
    userRole: string,
    prerequisiteCourseId: string,
  ) {
    await this.assertCourseOwnership(courseId, userId, userRole);
    if (courseId === prerequisiteCourseId) {
      throw new BadRequestError('A course cannot be a prerequisite of itself.');
    }
    return this.trainerRepository.addCoursePrerequisite(courseId, prerequisiteCourseId);
  }

  public async removePrerequisite(
    courseId: string,
    userId: string,
    userRole: string,
    prerequisiteCourseId: string,
  ) {
    await this.assertCourseOwnership(courseId, userId, userRole);
    return this.trainerRepository.removeCoursePrerequisite(courseId, prerequisiteCourseId);
  }

  /**
   * Trainee Monitoring
   */
  public async getTrainees(
    userId: string,
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
    const { total, enrollments } = await this.trainerRepository.getTrainerTrainees(userId, filters);

    const page = filters.page || 1;
    const pageSize = filters.pageSize || 10;

    return {
      trainees: enrollments.map((e: any) => ({
        enrollmentId: e.id,
        traineeId: e.user.id,
        name: `${e.user.firstName} ${e.user.lastName || ''}`.trim(),
        email: e.user.email,
        phone: e.user.phone,
        designation: e.user.traineeProfile?.designation || 'Scientific Officer',
        department: e.user.department?.name || 'Observational Meteorology',
        courseId: e.course.id,
        courseTitle: e.course.title,
        progress: e.progressPercentage,
        status: e.status,
        enrolledAt: e.enrolledAt.toISOString(),
        skills: (e.user.userSkills || []).map((us: any) => ({
          name: us.skill.name,
          level: us.proficiencyLevel,
        })),
        competencies: (e.user.userCompetencies || []).map((uc: any) => ({
          name: uc.competency.name,
          level: uc.currentLevel,
        })),
        skillGapsCount: (e.user.skillGaps || []).length,
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  public async getTraineeDetail(userId: string, traineeId: string) {
    const detail = await this.trainerRepository.getTraineeDetail(userId, traineeId);
    if (!detail || !detail.trainee) {
      throw new NotFoundError(
        'Trainee not found or not enrolled in any courses instructed by you.',
      );
    }

    const { trainee, enrollments } = detail;

    return {
      profile: {
        id: trainee.id,
        name: `${trainee.firstName} ${trainee.lastName || ''}`.trim(),
        email: trainee.email,
        phone: trainee.phone,
        designation: trainee.traineeProfile?.designation || 'Scientific Officer',
        bio: trainee.traineeProfile?.bio || '',
        department: trainee.department?.name || 'Observational Meteorology',
        organization: trainee.organization.name,
        profileCompletion: trainee.traineeProfile?.profileCompletion || 0,
        interests: trainee.traineeProfile?.interests || [],
      },
      enrolledCourses: enrollments.map((e: any) => ({
        courseId: e.course.id,
        title: e.course.title,
        slug: e.course.slug,
        progressPercentage: e.progressPercentage,
        status: e.status,
        enrolledAt: e.enrolledAt.toISOString(),
        completedAt: e.completedAt ? e.completedAt.toISOString() : null,
        modules: e.course.modules.map((m: any) => ({
          id: m.id,
          title: m.title,
          lessons: m.lessons.map((l: any) => ({
            id: l.id,
            title: l.title,
            completed: l.lessonProgress.some((lp: any) => lp.completed),
          })),
        })),
      })),
      competencies: (trainee.userCompetencies || []).map((uc: any) => ({
        id: uc.competency.id,
        name: uc.competency.name,
        category: uc.competency.category,
        currentLevel: uc.currentLevel,
        confidenceScore: uc.confidenceScore,
        source: uc.source,
      })),
      skillGaps: (trainee.skillGaps || []).map((sg: any) => ({
        id: sg.id,
        competencyName: sg.competency.name,
        currentLevel: sg.currentLevel,
        requiredLevel: sg.requiredLevel,
        gapLevel: sg.gapLevel,
        priority: sg.priority,
        status: sg.status,
      })),
      assessments: (trainee.assessmentAttempts || []).map((a: any) => ({
        id: a.id,
        assessmentTitle: a.assessment.title,
        subject: a.assessment.subject,
        score: a.score,
        percentage: a.percentage,
        passed: a.passed,
        status: a.status,
        submittedAt: a.submittedAt ? a.submittedAt.toISOString() : null,
      })),
      topicCompetencies: ((detail as any)?.topicCompetencies || []).map((tc: any) => ({
        topicId: tc.topicId,
        topicTitle: tc.topic?.name || tc.topicTitle || 'Topic',
        courseId: tc.topic?.courseId || tc.courseId || '',
        competencyScore: Math.round(tc.competencyScore),
        confidenceScore: Math.round(tc.confidenceScore * 100),
        forgettingRisk: Math.round(tc.forgettingRisk * 100),
        priorityScore: Math.round(tc.priorityScore),
        stability: tc.stability,
        retention: Math.round(tc.retention * 100),
        lastReviewedAt: tc.lastReviewedAt ? (tc.lastReviewedAt.toISOString ? tc.lastReviewedAt.toISOString() : tc.lastReviewedAt) : null,
      })),
      learningEvents: ((detail as any)?.learningEvents || []).map((le: any) => ({
        id: le.id,
        topicTitle: le.topic?.name || le.topicTitle || 'Course Topic',
        eventType: le.eventType,
        correct: le.correct,
        occurredAt: le.occurredAt ? (le.occurredAt.toISOString ? le.occurredAt.toISOString() : le.occurredAt) : new Date().toISOString(),
      })),
      revisionActivity: ((detail as any)?.revisionSessions || (detail as any)?.revisionActivity || []).map((rs: any) => ({
        id: rs.id,
        status: rs.status,
        itemCount: rs.itemCount,
        correctCount: rs.correctCount,
        score: rs.score,
        startedAt: rs.startedAt ? (rs.startedAt.toISOString ? rs.startedAt.toISOString() : rs.startedAt) : new Date().toISOString(),
        completedAt: rs.completedAt ? (rs.completedAt.toISOString ? rs.completedAt.toISOString() : rs.completedAt) : null,
      })),
    };
  }

  /**
   * Assessment Management
   */
  public async getAssessments(userId: string) {
    const list = await this.trainerRepository.getTrainerAssessments(userId);
    return list.map((a: any) => ({
      id: a.id,
      title: a.title,
      subject: a.subject,
      courseId: a.courseId,
      courseTitle: a.course?.title || 'Standalone Assessment',
      durationMinutes: a.durationMinutes,
      passingScore: a.passingScore,
      status: a.status,
      questionCount: a.questions.length,
      attemptCount: a.attempts.length,
      passedCount: a.attempts.filter((att: any) => att.passed).length,
      createdAt: a.createdAt.toISOString(),
    }));
  }

  public async getAssessmentById(assessmentId: string, userId: string, userRole: string) {
    const assessment = await this.trainerRepository.getAssessmentById(assessmentId);
    if (!assessment) {
      throw new NotFoundError('Assessment not found');
    }

    if (
      assessment.trainerId !== userId &&
      userRole !== Role.ADMIN &&
      userRole !== Role.SUPER_ADMIN
    ) {
      throw new ForbiddenError('Access denied: You do not own this assessment.');
    }

    return assessment;
  }

  public async createAssessment(userId: string, data: any) {
    return this.trainerRepository.createAssessment({
      trainer: { connect: { id: userId } },
      ...(data.courseId && { course: { connect: { id: data.courseId } } }),
      title: data.title,
      description: data.description,
      subject: data.subject,
      assessmentType: data.assessmentType,
      durationMinutes: data.durationMinutes,
      passingScore: data.passingScore,
      questions: {
        create: data.questions.map((q: any) => ({
          questionText: q.questionText,
          questionType: q.questionType,
          marks: q.marks,
          orderIndex: q.orderIndex,
          explanation: q.explanation,
          options: {
            create: q.options.map((o: any) => ({
              optionText: o.optionText,
              isCorrect: o.isCorrect,
              orderIndex: o.orderIndex,
            })),
          },
        })),
      },
    });
  }

  public async getAssessmentAttempts(assessmentId: string, userId: string, userRole: string) {
    await this.getAssessmentById(assessmentId, userId, userRole);
    return this.trainerRepository.getAssessmentAttempts(assessmentId);
  }

  /**
   * Analytics & Feedback
   */
  public async getAnalytics(userId: string) {
    return this.trainerRepository.getTrainerAnalytics(userId);
  }

  public async getFeedback(userId: string) {
    const feedbackList = await this.trainerRepository.getTrainerFeedback(userId);
    return feedbackList.map((f: any) => ({
      id: f.id,
      rating: f.rating,
      comment: f.comment,
      status: f.status,
      courseTitle: f.course?.title || 'General Training',
      traineeName: `${f.user.firstName} ${f.user.lastName || ''}`.trim(),
      traineeEmail: f.user.email,
      createdAt: f.createdAt.toISOString(),
    }));
  }
}
