import { EnrollmentService, UserContext } from '../services/enrollment.service';
import { IEnrollmentRepository } from '../repositories/enrollment.repository';
import { ILessonProgressRepository } from '../repositories/lesson-progress.repository';
import { ICourseRepository } from '../repositories/course.repository';
import { IUserRepository } from '../repositories/user.repository';
import { EnrollmentStatus, CourseStatus, Role, UserStatus, LessonContentType } from '@prisma/client';
import {
    BadRequestError,
    ForbiddenError,
    ConflictError,
} from '../errors/app-error';

describe('EnrollmentService (M3 Development 3: Enrollment & Progress Management)', () => {
    let enrollmentService: EnrollmentService;
    let mockEnrollmentRepo: jest.Mocked<IEnrollmentRepository>;
    let mockLessonProgressRepo: jest.Mocked<ILessonProgressRepository>;
    let mockCourseRepo: jest.Mocked<ICourseRepository>;
    let mockUserRepo: jest.Mocked<IUserRepository>;

    // Canonical Seed Users (Section 39 Specification Compliance)
    const canonicalTrainee1 = {
        id: 'trainee-user-1',
        email: 'user@enterprise.com',
        firstName: 'Jane',
        lastName: 'Doe',
        role: Role.TRAINEE,
        status: UserStatus.APPROVED,
        organizationId: 'org-moes-1',
        departmentId: 'dept-tech',
        createdAt: new Date(),
        updatedAt: new Date(),
        passwordHash: 'hashed-pass',
        phone: null,
        avatarUrl: null,
        emailVerified: true,
    };

    const canonicalTrainee2 = {
        id: 'trainee-user-2',
        email: 'mark.trainee@enterprise.com',
        firstName: 'Mark',
        lastName: 'Zucker',
        role: Role.TRAINEE,
        status: UserStatus.APPROVED,
        organizationId: 'org-moes-1',
        departmentId: 'dept-tech',
        createdAt: new Date(),
        updatedAt: new Date(),
        passwordHash: 'hashed-pass',
        phone: null,
        avatarUrl: null,
        emailVerified: true,
    };

    const canonicalTrainer = {
        id: 'trainer-user-1',
        email: 'alex.trainer@enterprise.com',
        firstName: 'Alex',
        lastName: 'Rivers',
        role: Role.TRAINER,
        status: UserStatus.APPROVED,
        organizationId: 'org-moes-1',
        departmentId: 'dept-train',
        createdAt: new Date(),
        updatedAt: new Date(),
        passwordHash: 'hashed-pass',
        phone: null,
        avatarUrl: null,
        emailVerified: true,
    };

    const canonicalAdmin = {
        id: 'admin-user-1',
        email: 'admin@enterprise.com',
        firstName: 'Sarah',
        lastName: 'Connor',
        role: Role.ADMIN,
        status: UserStatus.APPROVED,
        organizationId: 'org-moes-1',
        departmentId: 'dept-hr',
        createdAt: new Date(),
        updatedAt: new Date(),
        passwordHash: 'hashed-pass',
        phone: null,
        avatarUrl: null,
        emailVerified: true,
    };

    const publishedCourse = {
        id: 'course-meteorology-101',
        organizationId: 'org-moes-1',
        trainerId: 'trainer-user-1',
        title: 'Operational Meteorology & Weather Early Warning',
        slug: 'op-meteorology-101',
        description: 'Comprehensive operational weather forecasting course for MoES/IMD trainees.',
        category: 'Meteorology',
        difficulty: 'BEGINNER' as any,
        durationMinutes: 120,
        status: CourseStatus.PUBLISHED,
        publishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        thumbnailUrl: null,
    };

    const draftCourse = {
        ...publishedCourse,
        id: 'course-draft-999',
        title: 'Draft Climate Dynamics',
        status: CourseStatus.DRAFT,
    };

    const foreignOrgCourse = {
        ...publishedCourse,
        id: 'course-foreign-888',
        organizationId: 'org-external-2',
    };

    const mockLesson1 = {
        id: 'lesson-101',
        title: 'Atmospheric Dynamics Intro',
        contentType: LessonContentType.VIDEO,
        durationMinutes: 30,
        orderIndex: 1,
        isPreview: true,
        moduleId: 'module-1',
        contentUrl: 'https://cdn.capacityconnect.io/video1.mp4',
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const mockLesson2 = {
        id: 'lesson-102',
        title: 'Satellite Weather Data Interpretation',
        contentType: 'PPT' as any,
        durationMinutes: 45,
        orderIndex: 2,
        isPreview: false,
        moduleId: 'module-1',
        contentUrl: 'https://cdn.capacityconnect.io/presentation.ppt',
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const activeEnrollment = {
        id: 'enrollment-1',
        userId: 'trainee-user-1',
        courseId: 'course-meteorology-101',
        status: EnrollmentStatus.ENROLLED,
        progressPercentage: 0,
        enrolledAt: new Date(),
        startedAt: null,
        completedAt: null,
        lastAccessedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        course: publishedCourse,
    };

    beforeEach(() => {
        mockEnrollmentRepo = {
            create: jest.fn(),
            findById: jest.fn(),
            findByUserAndCourse: jest.fn(),
            findByUser: jest.fn(),
            updateProgress: jest.fn(),
            updateStatus: jest.fn(),
            delete: jest.fn(),
            countCompletedLessons: jest.fn(),
            getTotalLessonsForCourse: jest.fn(),
        };

        mockLessonProgressRepo = {
            upsert: jest.fn(),
            findByUserAndLesson: jest.fn(),
            findByEnrollment: jest.fn(),
        };

        mockCourseRepo = {
            findById: jest.fn(),
            findBySlug: jest.fn(),
            findAll: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            updateStatus: jest.fn(),
            archive: jest.fn(),
            updatePrerequisites: jest.fn(),
            getPrerequisites: jest.fn(),
            checkSlugExists: jest.fn(),
        };

        mockUserRepo = {
            findById: jest.fn(),
            findByEmail: jest.fn(),
            findAll: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            saveRefreshToken: jest.fn(),
            findRefreshToken: jest.fn(),
            revokeRefreshToken: jest.fn(),
            revokeUserRefreshTokens: jest.fn(),
        };

        enrollmentService = new EnrollmentService(
            mockEnrollmentRepo,
            mockLessonProgressRepo,
            mockCourseRepo,
            mockUserRepo
        );
    });

    describe('1. Course Enrollment Flow', () => {
        it('TC-ENR-001: Trainee should successfully enroll in a PUBLISHED course within the same organization', async () => {
            mockUserRepo.findById.mockResolvedValue(canonicalTrainee1 as any);
            mockCourseRepo.findById.mockResolvedValue(publishedCourse as any);
            mockEnrollmentRepo.findByUserAndCourse.mockResolvedValue(null);
            mockEnrollmentRepo.create.mockResolvedValue(activeEnrollment as any);

            const userCtx: UserContext = { userId: canonicalTrainee1.id, role: Role.TRAINEE };
            const result = await enrollmentService.enrollInCourse(canonicalTrainee1.id, publishedCourse.id, userCtx);

            expect(result).toEqual(activeEnrollment);
            expect(mockEnrollmentRepo.create).toHaveBeenCalledWith(canonicalTrainee1.id, publishedCourse.id);
        });

        it('TC-ENR-002: Should throw BadRequestError when attempting to enroll in a DRAFT course', async () => {
            mockUserRepo.findById.mockResolvedValue(canonicalTrainee1 as any);
            mockCourseRepo.findById.mockResolvedValue(draftCourse as any);

            const userCtx: UserContext = { userId: canonicalTrainee1.id, role: Role.TRAINEE };

            await expect(
                enrollmentService.enrollInCourse(canonicalTrainee1.id, draftCourse.id, userCtx)
            ).rejects.toThrow(BadRequestError);
        });

        it('TC-ENR-003: Should throw ForbiddenError when user and course belong to different organizations', async () => {
            mockUserRepo.findById.mockResolvedValue(canonicalTrainee1 as any);
            mockCourseRepo.findById.mockResolvedValue(foreignOrgCourse as any);

            const userCtx: UserContext = { userId: canonicalTrainee1.id, role: Role.TRAINEE };

            await expect(
                enrollmentService.enrollInCourse(canonicalTrainee1.id, foreignOrgCourse.id, userCtx)
            ).rejects.toThrow(ForbiddenError);
        });

        it('TC-ENR-004: Should throw ConflictError when user is already actively enrolled', async () => {
            mockUserRepo.findById.mockResolvedValue(canonicalTrainee1 as any);
            mockCourseRepo.findById.mockResolvedValue(publishedCourse as any);
            mockEnrollmentRepo.findByUserAndCourse.mockResolvedValue(activeEnrollment as any);

            const userCtx: UserContext = { userId: canonicalTrainee1.id, role: Role.TRAINEE };

            await expect(
                enrollmentService.enrollInCourse(canonicalTrainee1.id, publishedCourse.id, userCtx)
            ).rejects.toThrow(ConflictError);
        });

        it('TC-ENR-005: Re-enrolling in a previously DROPPED course should update status to ENROLLED', async () => {
            const droppedEnrollment = { ...activeEnrollment, status: EnrollmentStatus.DROPPED };
            mockUserRepo.findById.mockResolvedValue(canonicalTrainee1 as any);
            mockCourseRepo.findById.mockResolvedValue(publishedCourse as any);
            mockEnrollmentRepo.findByUserAndCourse.mockResolvedValue(droppedEnrollment as any);
            mockEnrollmentRepo.updateStatus.mockResolvedValue({ ...activeEnrollment, status: EnrollmentStatus.ENROLLED } as any);

            const userCtx: UserContext = { userId: canonicalTrainee1.id, role: Role.TRAINEE };
            const result = await enrollmentService.enrollInCourse(canonicalTrainee1.id, publishedCourse.id, userCtx);

            expect(result.status).toBe(EnrollmentStatus.ENROLLED);
            expect(mockEnrollmentRepo.updateStatus).toHaveBeenCalledWith(droppedEnrollment.id, EnrollmentStatus.ENROLLED);
        });
    });

    describe('2. User Enrollments Listing', () => {
        it('TC-ENR-010: Trainee should fetch their own enrolled courses list', async () => {
            mockUserRepo.findById.mockResolvedValue(canonicalTrainee1 as any);
            mockEnrollmentRepo.findByUser.mockResolvedValue({ enrollments: [activeEnrollment], total: 1 });

            const userCtx: UserContext = { userId: canonicalTrainee1.id, role: Role.TRAINEE };
            const result = await enrollmentService.getMyEnrollments(canonicalTrainee1.id, undefined, 0, 20, userCtx);

            expect(result.enrollments).toHaveLength(1);
            expect(result.total).toBe(1);
        });

        it('TC-ENR-011: Non-admin trying to view another trainee enrollments should throw ForbiddenError', async () => {
            const userCtx: UserContext = { userId: canonicalTrainee2.id, role: Role.TRAINEE };

            await expect(
                enrollmentService.getMyEnrollments(canonicalTrainee1.id, undefined, 0, 20, userCtx)
            ).rejects.toThrow(ForbiddenError);
        });
    });

    describe('3. Enrollment Details & IDOR Ownership Checks', () => {
        it('TC-ENR-020: Trainee should be able to view their own enrollment details', async () => {
            mockEnrollmentRepo.findById.mockResolvedValue(activeEnrollment as any);
            mockUserRepo.findById.mockResolvedValue(canonicalTrainee1 as any);

            const userCtx: UserContext = { userId: canonicalTrainee1.id, role: Role.TRAINEE };
            const result = await enrollmentService.getEnrollmentById(activeEnrollment.id, userCtx);

            expect(result).toEqual(activeEnrollment);
        });

        it('TC-ENR-021: Trainee 2 attempting to view Trainee 1 enrollment should throw ForbiddenError (IDOR)', async () => {
            mockEnrollmentRepo.findById.mockResolvedValue(activeEnrollment as any);

            const userCtx: UserContext = { userId: canonicalTrainee2.id, role: Role.TRAINEE };

            await expect(
                enrollmentService.getEnrollmentById(activeEnrollment.id, userCtx)
            ).rejects.toThrow(ForbiddenError);
        });

        it('TC-ENR-022: Course Trainer should be allowed to view Trainee enrollment details', async () => {
            mockEnrollmentRepo.findById.mockResolvedValue(activeEnrollment as any);
            mockUserRepo.findById.mockResolvedValue(canonicalTrainer as any);

            const userCtx: UserContext = { userId: canonicalTrainer.id, role: Role.TRAINER };
            const result = await enrollmentService.getEnrollmentById(activeEnrollment.id, userCtx);

            expect(result).toEqual(activeEnrollment);
        });

        it('TC-ENR-023: Admin should be allowed to view any enrollment details within the organization', async () => {
            mockEnrollmentRepo.findById.mockResolvedValue(activeEnrollment as any);
            mockUserRepo.findById.mockResolvedValue(canonicalAdmin as any);

            const userCtx: UserContext = { userId: canonicalAdmin.id, role: Role.ADMIN };
            const result = await enrollmentService.getEnrollmentById(activeEnrollment.id, userCtx);

            expect(result).toEqual(activeEnrollment);
        });
    });

    describe('4. Lesson Progress & Auto Progress Calculation', () => {
        it('TC-ENR-030: Completing first lesson should update progress and set status to IN_PROGRESS', async () => {
            mockEnrollmentRepo.findById.mockResolvedValue(activeEnrollment as any);
            mockEnrollmentRepo.getTotalLessonsForCourse.mockResolvedValue(2);
            mockEnrollmentRepo.countCompletedLessons.mockResolvedValue(1);
            mockEnrollmentRepo.updateProgress.mockResolvedValue({
                ...activeEnrollment,
                status: EnrollmentStatus.IN_PROGRESS,
                progressPercentage: 50,
            } as any);

            const userCtx: UserContext = { userId: canonicalTrainee1.id, role: Role.TRAINEE };
            const result = await enrollmentService.updateLessonProgress(activeEnrollment.id, mockLesson1.id, true, userCtx);

            expect(result.progressPercentage).toBe(50);
            expect(result.completedLessonsCount).toBe(1);
            expect(result.totalLessonsCount).toBe(2);
            expect(mockEnrollmentRepo.updateProgress).toHaveBeenCalledWith(
                activeEnrollment.id,
                50,
                EnrollmentStatus.IN_PROGRESS,
                null
            );
        });

        it('TC-ENR-031: Completing all lessons should set status to COMPLETED and record completedAt', async () => {
            mockEnrollmentRepo.findById.mockResolvedValue(activeEnrollment as any);
            mockEnrollmentRepo.getTotalLessonsForCourse.mockResolvedValue(2);
            mockEnrollmentRepo.countCompletedLessons.mockResolvedValue(2);
            mockEnrollmentRepo.updateProgress.mockResolvedValue({
                ...activeEnrollment,
                status: EnrollmentStatus.COMPLETED,
                progressPercentage: 100,
                completedAt: new Date(),
            } as any);

            const userCtx: UserContext = { userId: canonicalTrainee1.id, role: Role.TRAINEE };
            const result = await enrollmentService.updateLessonProgress(activeEnrollment.id, mockLesson2.id, true, userCtx);

            expect(result.progressPercentage).toBe(100);
            expect(result.completedLessonsCount).toBe(2);
            expect(mockEnrollmentRepo.updateProgress).toHaveBeenCalledWith(
                activeEnrollment.id,
                100,
                EnrollmentStatus.COMPLETED,
                expect.any(Date)
            );
        });

        it('TC-ENR-032: Trainee 2 attempting to update Trainee 1 lesson progress should throw ForbiddenError', async () => {
            mockEnrollmentRepo.findById.mockResolvedValue(activeEnrollment as any);

            const userCtx: UserContext = { userId: canonicalTrainee2.id, role: Role.TRAINEE };

            await expect(
                enrollmentService.updateLessonProgress(activeEnrollment.id, mockLesson1.id, true, userCtx)
            ).rejects.toThrow(ForbiddenError);
        });

        it('TC-ENR-033: Updating progress for a DROPPED enrollment should throw BadRequestError', async () => {
            const droppedEnrollment = { ...activeEnrollment, status: EnrollmentStatus.DROPPED };
            mockEnrollmentRepo.findById.mockResolvedValue(droppedEnrollment as any);

            const userCtx: UserContext = { userId: canonicalTrainee1.id, role: Role.TRAINEE };

            await expect(
                enrollmentService.updateLessonProgress(droppedEnrollment.id, mockLesson1.id, true, userCtx)
            ).rejects.toThrow(BadRequestError);
        });
    });

    describe('5. Drop Enrollment Flow', () => {
        it('TC-ENR-040: Trainee should successfully drop their active enrollment', async () => {
            mockEnrollmentRepo.findById.mockResolvedValue(activeEnrollment as any);
            mockEnrollmentRepo.updateStatus.mockResolvedValue({ ...activeEnrollment, status: EnrollmentStatus.DROPPED } as any);

            const userCtx: UserContext = { userId: canonicalTrainee1.id, role: Role.TRAINEE };
            const result = await enrollmentService.dropEnrollment(activeEnrollment.id, userCtx);

            expect(result.status).toBe(EnrollmentStatus.DROPPED);
            expect(mockEnrollmentRepo.updateStatus).toHaveBeenCalledWith(activeEnrollment.id, EnrollmentStatus.DROPPED);
        });

        it('TC-ENR-041: Attempting to drop a COMPLETED course enrollment should throw BadRequestError', async () => {
            const completedEnrollment = { ...activeEnrollment, status: EnrollmentStatus.COMPLETED };
            mockEnrollmentRepo.findById.mockResolvedValue(completedEnrollment as any);

            const userCtx: UserContext = { userId: canonicalTrainee1.id, role: Role.TRAINEE };

            await expect(
                enrollmentService.dropEnrollment(completedEnrollment.id, userCtx)
            ).rejects.toThrow(BadRequestError);
        });

        it('TC-ENR-042: Trainee 2 attempting to drop Trainee 1 enrollment should throw ForbiddenError', async () => {
            mockEnrollmentRepo.findById.mockResolvedValue(activeEnrollment as any);

            const userCtx: UserContext = { userId: canonicalTrainee2.id, role: Role.TRAINEE };

            await expect(
                enrollmentService.dropEnrollment(activeEnrollment.id, userCtx)
            ).rejects.toThrow(ForbiddenError);
        });
    });
});
