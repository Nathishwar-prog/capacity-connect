import { TrainerMonitoringService } from '../services/trainer-monitoring.service';
import { TrainerMonitoringRepository } from '../repositories/trainer-monitoring.repository';
import { Role, EnrollmentStatus, AttemptStatus } from '@prisma/client';
import { ForbiddenError, NotFoundError } from '../errors/app-error';

describe('TrainerMonitoringService (M3 Development 6: Trainer Monitoring APIs)', () => {
    let service: TrainerMonitoringService;
    let mockRepository: jest.Mocked<TrainerMonitoringRepository>;

    // Canonical Seed Users
    const canonicalTrainer1 = {
        id: 'trainer-alex-101',
        email: 'alex.trainer@enterprise.com',
        role: Role.TRAINER,
    };

    const canonicalTrainer2 = {
        id: 'trainer-elena-102',
        email: 'elena.trainer@enterprise.com',
        role: Role.TRAINER,
    };

    const canonicalAdmin = {
        id: 'admin-sarah-201',
        email: 'admin@enterprise.com',
        role: Role.ADMIN,
    };

    const canonicalTrainee = {
        id: 'trainee-jane-301',
        email: 'user@enterprise.com',
        role: Role.TRAINEE,
    };

    // Mock Authorized Courses
    const course1 = 'course-python-101';
    const course2 = 'course-python-102';
    const unauthorizedCourse = 'course-database-999';

    beforeEach(() => {
        mockRepository = {
            findAuthorizedCourseIds: jest.fn(),
            isCourseAuthorized: jest.fn(),
            getOverviewMetrics: jest.fn(),
            getAuthorizedCoursesSummary: jest.fn(),
            findTraineesMonitoring: jest.fn(),
            getCourseMonitoring: jest.fn(),
            getTraineeCourseDetail: jest.fn(),
            findAssessmentMonitoring: jest.fn(),
        } as unknown as jest.Mocked<TrainerMonitoringRepository>;

        service = new TrainerMonitoringService(mockRepository);
    });

    describe('1. Role Authorization & Monitoring Overview', () => {
        it('TC-TM-001: Trainer should successfully retrieve monitoring overview for authorized courses', async () => {
            mockRepository.findAuthorizedCourseIds.mockResolvedValue([course1, course2]);
            mockRepository.getOverviewMetrics.mockResolvedValue({
                totalAuthorizedCourses: 2,
                totalEnrolledTrainees: 15,
                totalAssessments: 4,
                averageProgressPercentage: 65.5,
                completionRate: 40.0,
                totalAttempts: 20,
                totalPassedAttempts: 16,
                passRate: 80.0,
            });
            mockRepository.getAuthorizedCoursesSummary.mockResolvedValue([
                {
                    id: course1,
                    title: 'Python Fundamentals',
                    slug: 'python-fundamentals',
                    status: 'PUBLISHED' as any,
                    category: 'Software Engineering',
                    difficulty: 'BEGINNER' as any,
                    enrolledTraineesCount: 10,
                    assessmentsCount: 2,
                    modulesCount: 3,
                },
            ]);

            const result = await service.getMonitoringOverview(canonicalTrainer1.id, canonicalTrainer1.role);

            expect(result.metrics.totalAuthorizedCourses).toBe(2);
            expect(result.metrics.passRate).toBe(80.0);
            expect(result.courses).toHaveLength(1);
            expect(mockRepository.findAuthorizedCourseIds).toHaveBeenCalledWith(canonicalTrainer1.id, false);
        });

        it('TC-TM-002: Admin should retrieve monitoring overview with global access flag enabled', async () => {
            mockRepository.findAuthorizedCourseIds.mockResolvedValue([course1, course2, unauthorizedCourse]);
            mockRepository.getOverviewMetrics.mockResolvedValue({
                totalAuthorizedCourses: 3,
                totalEnrolledTrainees: 50,
                totalAssessments: 10,
                averageProgressPercentage: 72.0,
                completionRate: 55.0,
                totalAttempts: 60,
                totalPassedAttempts: 50,
                passRate: 83.33,
            });
            mockRepository.getAuthorizedCoursesSummary.mockResolvedValue([]);

            const result = await service.getMonitoringOverview(canonicalAdmin.id, canonicalAdmin.role);

            expect(result.metrics.totalAuthorizedCourses).toBe(3);
            expect(mockRepository.findAuthorizedCourseIds).toHaveBeenCalledWith(canonicalAdmin.id, true);
        });

        it('TC-TM-003: Trainee attempting to access monitoring overview should throw ForbiddenError', async () => {
            await expect(
                service.getMonitoringOverview(canonicalTrainee.id, canonicalTrainee.role),
            ).rejects.toThrow(ForbiddenError);
        });
    });

    describe('2. Trainees Monitoring & IDOR Ownership Constraints', () => {
        it('TC-TM-010: Trainer should retrieve paginated list of trainees monitoring', async () => {
            mockRepository.findAuthorizedCourseIds.mockResolvedValue([course1]);
            mockRepository.findTraineesMonitoring.mockResolvedValue({
                data: [
                    {
                        trainee: { id: canonicalTrainee.id, firstName: 'Jane', lastName: 'Doe', email: 'user@enterprise.com', avatarUrl: null, department: 'Tech' },
                        course: { id: course1, title: 'Python Fundamentals', slug: 'python-fundamentals', category: 'Software Engineering' },
                        enrollment: { id: 'enr-1', status: EnrollmentStatus.IN_PROGRESS, progressPercentage: 50, enrolledAt: '2026-01-01T00:00:00.000Z', startedAt: '2026-01-01T00:00:00.000Z', completedAt: null, lastAccessedAt: null },
                        progress: { percentage: 50, completedLessons: 1, totalLessons: 2 },
                        assessmentSummary: { totalAttempts: 1, submittedAttempts: 1, passedAttempts: 1, averageScore: 100 },
                        completion: { isCompleted: false, completedAt: null },
                    },
                ],
                pagination: { page: 1, limit: 10, totalItems: 1, totalPages: 1 },
            });

            const query = { page: 1, limit: 10, sortBy: 'enrolledAt' as const, sortOrder: 'desc' as const };
            const result = await service.getTraineesMonitoring(canonicalTrainer1.id, canonicalTrainer1.role, query);

            expect(result.data).toHaveLength(1);
            expect(result.data[0].trainee.email).toBe('user@enterprise.com');
            expect(result.data[0].assessmentSummary.averageScore).toBe(100);
        });

        it('TC-TM-011: Filtering trainees by authorized courseId should succeed', async () => {
            mockRepository.findAuthorizedCourseIds.mockResolvedValue([course1]);
            mockRepository.isCourseAuthorized.mockResolvedValue(true);
            mockRepository.findTraineesMonitoring.mockResolvedValue({
                data: [],
                pagination: { page: 1, limit: 10, totalItems: 0, totalPages: 0 },
            });

            const query = { courseId: course1, page: 1, limit: 10, sortBy: 'enrolledAt' as const, sortOrder: 'desc' as const };
            await service.getTraineesMonitoring(canonicalTrainer1.id, canonicalTrainer1.role, query);

            expect(mockRepository.isCourseAuthorized).toHaveBeenCalledWith(course1, canonicalTrainer1.id, false);
        });

        it('TC-TM-012: Filtering trainees by unauthorized courseId should throw ForbiddenError (IDOR)', async () => {
            mockRepository.findAuthorizedCourseIds.mockResolvedValue([course1]);
            mockRepository.isCourseAuthorized.mockResolvedValue(false);

            const query = { courseId: unauthorizedCourse, page: 1, limit: 10, sortBy: 'enrolledAt' as const, sortOrder: 'desc' as const };

            await expect(
                service.getTraineesMonitoring(canonicalTrainer1.id, canonicalTrainer1.role, query),
            ).rejects.toThrow(ForbiddenError);
        });
    });

    describe('3. Course Level Monitoring Details', () => {
        it('TC-TM-020: Trainer should get course monitoring for an authorized course', async () => {
            mockRepository.isCourseAuthorized.mockResolvedValue(true);
            mockRepository.getCourseMonitoring.mockResolvedValue({
                course: {
                    id: course1,
                    title: 'Python Fundamentals',
                    slug: 'python-fundamentals',
                    description: 'Desc',
                    category: 'Software Engineering',
                    difficulty: 'BEGINNER' as any,
                    status: 'PUBLISHED' as any,
                    publishedAt: '2026-01-01T00:00:00.000Z',
                    createdAt: '2026-01-01T00:00:00.000Z',
                    totalModules: 2,
                    totalLessons: 4,
                    assessments: [],
                },
                trainees: [],
                pagination: { page: 1, limit: 10, totalItems: 0, totalPages: 0 },
            });

            const query = { page: 1, limit: 10, sortBy: 'enrolledAt' as const, sortOrder: 'desc' as const };
            const result = await service.getCourseMonitoring(canonicalTrainer1.id, canonicalTrainer1.role, course1, query);

            expect(result.course.id).toBe(course1);
            expect(result.course.totalLessons).toBe(4);
        });

        it('TC-TM-021: Trainer 2 trying to monitor Trainer 1 course should throw ForbiddenError (IDOR)', async () => {
            mockRepository.isCourseAuthorized.mockResolvedValue(false);

            const query = { page: 1, limit: 10, sortBy: 'enrolledAt' as const, sortOrder: 'desc' as const };

            await expect(
                service.getCourseMonitoring(canonicalTrainer2.id, canonicalTrainer2.role, course1, query),
            ).rejects.toThrow(ForbiddenError);
        });

        it('TC-TM-022: Non-existent courseId should throw NotFoundError', async () => {
            mockRepository.isCourseAuthorized.mockResolvedValue(true);
            mockRepository.getCourseMonitoring.mockResolvedValue(null);

            const query = { page: 1, limit: 10, sortBy: 'enrolledAt' as const, sortOrder: 'desc' as const };

            await expect(
                service.getCourseMonitoring(canonicalAdmin.id, canonicalAdmin.role, 'non-existent-id', query),
            ).rejects.toThrow(NotFoundError);
        });
    });

    describe('4. Detailed Trainee Monitoring in Course', () => {
        it('TC-TM-030: Trainer should retrieve detailed trainee progress & assessment participation', async () => {
            mockRepository.isCourseAuthorized.mockResolvedValue(true);
            mockRepository.getTraineeCourseDetail.mockResolvedValue({
                trainee: { id: canonicalTrainee.id, firstName: 'Jane', lastName: 'Doe', email: 'user@enterprise.com', phone: null, avatarUrl: null, department: 'Tech' },
                course: { id: course1, title: 'Python Fundamentals', slug: 'python-fundamentals', category: 'Software', difficulty: 'BEGINNER' as any },
                enrollment: { id: 'enr-1', status: EnrollmentStatus.IN_PROGRESS, progressPercentage: 50, enrolledAt: '2026-01-01T00:00:00.000Z', startedAt: '2026-01-01T00:00:00.000Z', completedAt: null, lastAccessedAt: null },
                progress: { percentage: 50, completedLessons: 1, totalLessons: 2, lessonProgress: [] },
                assessmentParticipation: [
                    { attemptId: 'att-1', assessmentId: 'ass-1', assessmentTitle: 'Test 1', assessmentType: 'MCQ' as any, passingScore: 70, status: AttemptStatus.SUBMITTED, score: 90, percentage: 90, passed: true, startedAt: '2026-01-01T00:00:00.000Z', submittedAt: '2026-01-01T00:30:00.000Z' },
                ],
                completion: { isCompleted: false, completedAt: null },
            });

            const result = await service.getTraineeCourseMonitoringDetails(
                canonicalTrainer1.id,
                canonicalTrainer1.role,
                course1,
                canonicalTrainee.id,
            );

            expect(result.trainee.id).toBe(canonicalTrainee.id);
            expect(result.assessmentParticipation).toHaveLength(1);
            expect(result.assessmentParticipation[0].passed).toBe(true);
        });

        it('TC-TM-031: Viewing non-enrolled trainee should throw NotFoundError', async () => {
            mockRepository.isCourseAuthorized.mockResolvedValue(true);
            mockRepository.getTraineeCourseDetail.mockResolvedValue(null);

            await expect(
                service.getTraineeCourseMonitoringDetails(
                    canonicalTrainer1.id,
                    canonicalTrainer1.role,
                    course1,
                    'non-enrolled-user-id',
                ),
            ).rejects.toThrow(NotFoundError);
        });
    });

    describe('5. Assessment Monitoring & Pass/Fail Calculations', () => {
        it('TC-TM-040: Trainer should retrieve assessment attempts monitoring across courses', async () => {
            mockRepository.findAuthorizedCourseIds.mockResolvedValue([course1]);
            mockRepository.findAssessmentMonitoring.mockResolvedValue({
                data: [
                    {
                        attemptId: 'att-101',
                        assessment: { id: 'ass-1', title: 'Python Cert Test', passingScore: 70, courseId: course1, courseTitle: 'Python Fundamentals' },
                        trainee: { id: canonicalTrainee.id, firstName: 'Jane', lastName: 'Doe', email: 'user@enterprise.com' },
                        status: AttemptStatus.SUBMITTED,
                        score: 85,
                        percentage: 85,
                        passed: true,
                        passFail: 'PASS',
                        startedAt: '2026-01-01T00:00:00.000Z',
                        submittedAt: '2026-01-01T00:30:00.000Z',
                    },
                ],
                pagination: { page: 1, limit: 10, totalItems: 1, totalPages: 1 },
            });

            const query = { page: 1, limit: 10, sortBy: 'submittedAt' as const, sortOrder: 'desc' as const };
            const result = await service.getAssessmentMonitoring(canonicalTrainer1.id, canonicalTrainer1.role, query);

            expect(result.data).toHaveLength(1);
            expect(result.data[0].passFail).toBe('PASS');
            expect(result.data[0].score).toBe(85);
        });

        it('TC-TM-041: Trainer attempting to view assessment monitoring for unauthorized course should throw ForbiddenError', async () => {
            mockRepository.findAuthorizedCourseIds.mockResolvedValue([course1]);
            mockRepository.isCourseAuthorized.mockResolvedValue(false);

            const query = { courseId: unauthorizedCourse, page: 1, limit: 10, sortBy: 'submittedAt' as const, sortOrder: 'desc' as const };

            await expect(
                service.getAssessmentMonitoring(canonicalTrainer1.id, canonicalTrainer1.role, query),
            ).rejects.toThrow(ForbiddenError);
        });
    });
});
