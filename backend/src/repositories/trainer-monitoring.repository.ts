import { prisma } from '../database/client';
import { EnrollmentStatus, AttemptStatus, Prisma } from '@prisma/client';
import { TraineeMonitoringQuery, AssessmentMonitoringQuery } from '../dto/trainer-monitoring.dto';

export class TrainerMonitoringRepository {
    /**
     * Finds course IDs authorized for the user.
     * If isGlobalAccess (ADMIN/SUPER_ADMIN), returns all non-deleted course IDs.
     * Otherwise returns course IDs authored by trainerId == userId.
     */
    public async findAuthorizedCourseIds(userId: string, isGlobalAccess: boolean): Promise<string[]> {
        if (isGlobalAccess) {
            const courses = await prisma.course.findMany({
                where: { deletedAt: null },
                select: { id: true },
            });
            return courses.map((c) => c.id);
        }

        const courses = await prisma.course.findMany({
            where: {
                trainerId: userId,
                deletedAt: null,
            },
            select: { id: true },
        });
        return courses.map((c) => c.id);
    }

    /**
     * Verifies if a course is authorized for a trainer.
     */
    public async isCourseAuthorized(courseId: string, userId: string, isGlobalAccess: boolean): Promise<boolean> {
        if (isGlobalAccess) {
            const course = await prisma.course.findFirst({
                where: { id: courseId, deletedAt: null },
                select: { id: true },
            });
            return !!course;
        }

        const course = await prisma.course.findFirst({
            where: { id: courseId, trainerId: userId, deletedAt: null },
            select: { id: true },
        });
        return !!course;
    }

    /**
     * Aggregates high-level monitoring metrics across authorized courses.
     */
    public async getOverviewMetrics(authorizedCourseIds: string[]) {
        if (authorizedCourseIds.length === 0) {
            return {
                totalAuthorizedCourses: 0,
                totalEnrolledTrainees: 0,
                totalAssessments: 0,
                averageProgressPercentage: 0,
                completionRate: 0,
                totalAttempts: 0,
                totalPassedAttempts: 0,
                passRate: 0,
            };
        }

        const [
            totalAuthorizedCourses,
            totalEnrolledTrainees,
            totalAssessments,
            enrollmentsAgg,
            completedEnrollmentsCount,
            attemptsCount,
            passedAttemptsCount,
        ] = await Promise.all([
            prisma.course.count({ where: { id: { in: authorizedCourseIds }, deletedAt: null } }),
            prisma.enrollment.count({ where: { courseId: { in: authorizedCourseIds } } }),
            prisma.assessment.count({ where: { courseId: { in: authorizedCourseIds } } }),
            prisma.enrollment.aggregate({
                where: { courseId: { in: authorizedCourseIds } },
                _avg: { progressPercentage: true },
            }),
            prisma.enrollment.count({
                where: { courseId: { in: authorizedCourseIds }, status: EnrollmentStatus.COMPLETED },
            }),
            prisma.assessmentAttempt.count({
                where: { assessment: { courseId: { in: authorizedCourseIds } } },
            }),
            prisma.assessmentAttempt.count({
                where: { assessment: { courseId: { in: authorizedCourseIds } }, passed: true },
            }),
        ]);

        const averageProgressPercentage = enrollmentsAgg._avg.progressPercentage || 0;
        const completionRate = totalEnrolledTrainees > 0 ? (completedEnrollmentsCount / totalEnrolledTrainees) * 100 : 0;
        const passRate = attemptsCount > 0 ? (passedAttemptsCount / attemptsCount) * 100 : 0;

        return {
            totalAuthorizedCourses,
            totalEnrolledTrainees,
            totalAssessments,
            averageProgressPercentage: Math.round(averageProgressPercentage * 100) / 100,
            completionRate: Math.round(completionRate * 100) / 100,
            totalAttempts: attemptsCount,
            totalPassedAttempts: passedAttemptsCount,
            passRate: Math.round(passRate * 100) / 100,
        };
    }

    /**
     * Retrieves summary of authorized courses for trainer overview
     */
    public async getAuthorizedCoursesSummary(authorizedCourseIds: string[]) {
        if (authorizedCourseIds.length === 0) return [];

        const courses = await prisma.course.findMany({
            where: { id: { in: authorizedCourseIds }, deletedAt: null },
            select: {
                id: true,
                title: true,
                slug: true,
                status: true,
                category: true,
                difficulty: true,
                _count: {
                    select: {
                        enrollments: true,
                        assessments: true,
                        modules: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return courses.map((c) => ({
            id: c.id,
            title: c.title,
            slug: c.slug,
            status: c.status,
            category: c.category,
            difficulty: c.difficulty,
            enrolledTraineesCount: c._count.enrollments,
            assessmentsCount: c._count.assessments,
            modulesCount: c._count.modules,
        }));
    }

    /**
     * Retrieves paginated list of trainees with enrollment, progress, and assessment summary.
     */
    public async findTraineesMonitoring(authorizedCourseIds: string[], query: TraineeMonitoringQuery) {
        if (authorizedCourseIds.length === 0) {
            return { data: [], totalItems: 0, page: query.page, limit: query.limit, totalPages: 0 };
        }

        const { courseId, status, completionStatus, search, page, limit, sortBy, sortOrder } = query;

        // Build course constraint
        const filterCourseIds = courseId
            ? authorizedCourseIds.filter((id) => id === courseId)
            : authorizedCourseIds;

        if (filterCourseIds.length === 0) {
            return { data: [], totalItems: 0, page, limit, totalPages: 0 };
        }

        // Build Prisma where clause
        const where: Prisma.EnrollmentWhereInput = {
            courseId: { in: filterCourseIds },
        };

        if (status) {
            where.status = status;
        }

        if (completionStatus) {
            if (completionStatus === 'completed') {
                where.status = EnrollmentStatus.COMPLETED;
            } else if (completionStatus === 'in_progress') {
                where.status = EnrollmentStatus.IN_PROGRESS;
            } else if (completionStatus === 'not_started') {
                where.status = EnrollmentStatus.ENROLLED;
            }
        }

        if (search) {
            where.user = {
                OR: [
                    { firstName: { contains: search, mode: 'insensitive' } },
                    { lastName: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                ],
            };
        }

        const totalItems = await prisma.enrollment.count({ where });
        const totalPages = Math.ceil(totalItems / limit);
        const skip = (page - 1) * limit;

        // Sorting
        let orderBy: Prisma.EnrollmentOrderByWithRelationInput = { enrolledAt: sortOrder };
        if (sortBy === 'progressPercentage') {
            orderBy = { progressPercentage: sortOrder };
        } else if (sortBy === 'completedAt') {
            orderBy = { completedAt: sortOrder };
        } else if (sortBy === 'firstName' || sortBy === 'lastName') {
            orderBy = { user: { [sortBy]: sortOrder } };
        }

        const enrollments = await prisma.enrollment.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        avatarUrl: true,
                        department: { select: { id: true, name: true, code: true } },
                    },
                },
                course: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        category: true,
                        modules: {
                            select: {
                                _count: { select: { lessons: true } },
                            },
                        },
                    },
                },
                lessonProgress: {
                    select: { completed: true },
                },
            },
            orderBy,
            skip,
            take: limit,
        });

        // Calculate lesson counts and assessment stats for each trainee enrollment
        const data = await Promise.all(
            enrollments.map(async (e) => {
                const totalLessons = e.course.modules.reduce((acc, m) => acc + m._count.lessons, 0);
                const completedLessons = e.lessonProgress.filter((lp) => lp.completed).length;

                // Fetch assessment attempts for this user in this course
                const attempts = await prisma.assessmentAttempt.findMany({
                    where: {
                        userId: e.userId,
                        assessment: { courseId: e.courseId },
                    },
                    select: {
                        id: true,
                        score: true,
                        percentage: true,
                        passed: true,
                        status: true,
                    },
                });

                const submittedAttempts = attempts.filter((a) => a.status === AttemptStatus.SUBMITTED);
                const totalAttemptsCount = attempts.length;
                const passedAttemptsCount = attempts.filter((a) => a.passed === true).length;
                const scores = submittedAttempts.map((a) => a.score).filter((s): s is number => s !== null);
                const avgScore = scores.length > 0 ? scores.reduce((sum, s) => sum + s, 0) / scores.length : null;

                return {
                    trainee: {
                        id: e.user.id,
                        firstName: e.user.firstName,
                        lastName: e.user.lastName,
                        email: e.user.email,
                        avatarUrl: e.user.avatarUrl,
                        department: e.user.department ? e.user.department.name : null,
                    },
                    course: {
                        id: e.course.id,
                        title: e.course.title,
                        slug: e.course.slug,
                        category: e.course.category,
                    },
                    enrollment: {
                        id: e.id,
                        status: e.status,
                        progressPercentage: e.progressPercentage,
                        enrolledAt: e.enrolledAt.toISOString(),
                        startedAt: e.startedAt ? e.startedAt.toISOString() : null,
                        completedAt: e.completedAt ? e.completedAt.toISOString() : null,
                        lastAccessedAt: e.lastAccessedAt ? e.lastAccessedAt.toISOString() : null,
                    },
                    progress: {
                        percentage: e.progressPercentage,
                        completedLessons,
                        totalLessons,
                    },
                    assessmentSummary: {
                        totalAttempts: totalAttemptsCount,
                        submittedAttempts: submittedAttempts.length,
                        passedAttempts: passedAttemptsCount,
                        averageScore: avgScore !== null ? Math.round(avgScore * 100) / 100 : null,
                    },
                    completion: {
                        isCompleted: e.status === EnrollmentStatus.COMPLETED,
                        completedAt: e.completedAt ? e.completedAt.toISOString() : null,
                    },
                };
            }),
        );

        return {
            data,
            pagination: {
                page,
                limit,
                totalItems,
                totalPages,
            },
        };
    }

    /**
     * Retrieves full course monitoring overview and enrolled trainees list.
     */
    public async getCourseMonitoring(courseId: string, query: TraineeMonitoringQuery) {
        const course = await prisma.course.findFirst({
            where: { id: courseId, deletedAt: null },
            select: {
                id: true,
                title: true,
                slug: true,
                description: true,
                category: true,
                difficulty: true,
                status: true,
                publishedAt: true,
                createdAt: true,
                modules: {
                    select: {
                        id: true,
                        title: true,
                        _count: { select: { lessons: true } },
                    },
                },
                assessments: {
                    select: {
                        id: true,
                        title: true,
                        assessmentType: true,
                        passingScore: true,
                        status: true,
                    },
                },
            },
        });

        if (!course) return null;

        const totalLessons = course.modules.reduce((acc, m) => acc + m._count.lessons, 0);

        // Get trainee monitoring data for this courseId
        const traineesMonitoring = await this.findTraineesMonitoring([courseId], {
            ...query,
            courseId,
        });

        return {
            course: {
                id: course.id,
                title: course.title,
                slug: course.slug,
                description: course.description,
                category: course.category,
                difficulty: course.difficulty,
                status: course.status,
                publishedAt: course.publishedAt ? course.publishedAt.toISOString() : null,
                createdAt: course.createdAt.toISOString(),
                totalModules: course.modules.length,
                totalLessons,
                assessments: course.assessments.map((a) => ({
                    id: a.id,
                    title: a.title,
                    type: a.assessmentType,
                    passingScore: a.passingScore,
                    status: a.status,
                })),
            },
            trainees: traineesMonitoring.data,
            pagination: traineesMonitoring.pagination,
        };
    }

    /**
     * Retrieves detailed course monitoring record for a specific trainee.
     */
    public async getTraineeCourseDetail(courseId: string, traineeId: string) {
        const enrollment = await prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId: traineeId,
                    courseId,
                },
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        avatarUrl: true,
                        department: { select: { id: true, name: true, code: true } },
                    },
                },
                course: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        category: true,
                        difficulty: true,
                        modules: {
                            orderBy: { orderIndex: 'asc' },
                            select: {
                                id: true,
                                title: true,
                                orderIndex: true,
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
                lessonProgress: {
                    include: {
                        lesson: { select: { id: true, title: true } },
                    },
                },
            },
        });

        if (!enrollment) return null;

        // Fetch assessment attempts for this user in this course
        const attempts = await prisma.assessmentAttempt.findMany({
            where: {
                userId: traineeId,
                assessment: { courseId },
            },
            include: {
                assessment: {
                    select: {
                        id: true,
                        title: true,
                        assessmentType: true,
                        passingScore: true,
                    },
                },
            },
            orderBy: { startedAt: 'desc' },
        });

        const totalLessons = enrollment.course.modules.reduce((acc, m) => acc + m.lessons.length, 0);
        const completedLessons = enrollment.lessonProgress.filter((lp) => lp.completed).length;

        return {
            trainee: {
                id: enrollment.user.id,
                firstName: enrollment.user.firstName,
                lastName: enrollment.user.lastName,
                email: enrollment.user.email,
                phone: enrollment.user.phone,
                avatarUrl: enrollment.user.avatarUrl,
                department: enrollment.user.department ? enrollment.user.department.name : null,
            },
            course: {
                id: enrollment.course.id,
                title: enrollment.course.title,
                slug: enrollment.course.slug,
                category: enrollment.course.category,
                difficulty: enrollment.course.difficulty,
            },
            enrollment: {
                id: enrollment.id,
                status: enrollment.status,
                progressPercentage: enrollment.progressPercentage,
                enrolledAt: enrollment.enrolledAt.toISOString(),
                startedAt: enrollment.startedAt ? enrollment.startedAt.toISOString() : null,
                completedAt: enrollment.completedAt ? enrollment.completedAt.toISOString() : null,
                lastAccessedAt: enrollment.lastAccessedAt ? enrollment.lastAccessedAt.toISOString() : null,
            },
            progress: {
                percentage: enrollment.progressPercentage,
                completedLessons,
                totalLessons,
                lessonProgress: enrollment.lessonProgress.map((lp) => ({
                    lessonId: lp.lessonId,
                    lessonTitle: lp.lesson.title,
                    completed: lp.completed,
                    progressPercentage: lp.progressPercentage,
                    startedAt: lp.startedAt ? lp.startedAt.toISOString() : null,
                    completedAt: lp.completedAt ? lp.completedAt.toISOString() : null,
                })),
            },
            assessmentParticipation: attempts.map((a) => ({
                attemptId: a.id,
                assessmentId: a.assessmentId,
                assessmentTitle: a.assessment.title,
                assessmentType: a.assessment.assessmentType,
                passingScore: a.assessment.passingScore,
                status: a.status,
                score: a.score,
                percentage: a.percentage,
                passed: a.passed,
                startedAt: a.startedAt.toISOString(),
                submittedAt: a.submittedAt ? a.submittedAt.toISOString() : null,
            })),
            completion: {
                isCompleted: enrollment.status === EnrollmentStatus.COMPLETED,
                completedAt: enrollment.completedAt ? enrollment.completedAt.toISOString() : null,
            },
        };
    }

    /**
     * Retrieves assessment attempts & results monitoring across authorized courses.
     */
    public async findAssessmentMonitoring(authorizedCourseIds: string[], query: AssessmentMonitoringQuery) {
        if (authorizedCourseIds.length === 0) {
            return { data: [], totalItems: 0, page: query.page, limit: query.limit, totalPages: 0 };
        }

        const { courseId, assessmentId, attemptStatus, passed, search, page, limit, sortBy, sortOrder } = query;

        const filterCourseIds = courseId
            ? authorizedCourseIds.filter((id) => id === courseId)
            : authorizedCourseIds;

        if (filterCourseIds.length === 0) {
            return { data: [], totalItems: 0, page, limit, totalPages: 0 };
        }

        const where: Prisma.AssessmentAttemptWhereInput = {
            assessment: { courseId: { in: filterCourseIds } },
        };

        if (assessmentId) {
            where.assessmentId = assessmentId;
        }

        if (attemptStatus) {
            where.status = attemptStatus;
        }

        if (passed !== undefined) {
            where.passed = passed;
        }

        if (search) {
            where.user = {
                OR: [
                    { firstName: { contains: search, mode: 'insensitive' } },
                    { lastName: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                ],
            };
        }

        const totalItems = await prisma.assessmentAttempt.count({ where });
        const totalPages = Math.ceil(totalItems / limit);
        const skip = (page - 1) * limit;

        let orderBy: Prisma.AssessmentAttemptOrderByWithRelationInput = { startedAt: sortOrder };
        if (sortBy === 'submittedAt') {
            orderBy = { submittedAt: sortOrder };
        } else if (sortBy === 'score') {
            orderBy = { score: sortOrder };
        } else if (sortBy === 'percentage') {
            orderBy = { percentage: sortOrder };
        }

        const attempts = await prisma.assessmentAttempt.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                assessment: {
                    select: {
                        id: true,
                        title: true,
                        passingScore: true,
                        course: {
                            select: { id: true, title: true },
                        },
                    },
                },
            },
            orderBy,
            skip,
            take: limit,
        });

        const data = attempts.map((a) => ({
            attemptId: a.id,
            assessment: {
                id: a.assessment.id,
                title: a.assessment.title,
                passingScore: a.assessment.passingScore,
                courseId: a.assessment.course?.id || null,
                courseTitle: a.assessment.course?.title || null,
            },
            trainee: {
                id: a.user.id,
                firstName: a.user.firstName,
                lastName: a.user.lastName,
                email: a.user.email,
            },
            status: a.status,
            score: a.score,
            percentage: a.percentage,
            passed: a.passed,
            passFail: a.passed === true ? 'PASS' : a.passed === false ? 'FAIL' : 'PENDING',
            startedAt: a.startedAt.toISOString(),
            submittedAt: a.submittedAt ? a.submittedAt.toISOString() : null,
        }));

        return {
            data,
            pagination: {
                page,
                limit,
                totalItems,
                totalPages,
            },
        };
    }
}
