import { CourseService, UserContext } from '../services/course.service';
import { ICourseRepository } from '../repositories/course.repository';
import { IUserRepository } from '../repositories/user.repository';
import { CourseStatus, CourseDifficulty, Role, UserStatus } from '@prisma/client';
import {
    ForbiddenError,
    NotFoundError,
    ConflictError,
    BadRequestError,
} from '../errors/app-error';

// ─── Helper Factories ────────────────────────────────────────────────────────

const makeUser = (overrides: Partial<any> = {}): any => ({
    id: 'user-1',
    organizationId: 'org-1',
    email: 'trainer@test.com',
    firstName: 'Test',
    lastName: 'Trainer',
    role: Role.TRAINER,
    status: UserStatus.APPROVED,
    emailVerified: true,
    passwordHash: 'hash',
    phone: null,
    avatarUrl: null,
    departmentId: null,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
});

const makeCourse = (overrides: Partial<any> = {}): any => ({
    id: 'course-1',
    organizationId: 'org-1',
    trainerId: 'user-1',
    title: 'Intro to Meteorology',
    slug: 'intro-to-meteorology',
    description: 'Learn basics of weather forecasting.',
    category: 'Atmospheric Sciences',
    difficulty: CourseDifficulty.BEGINNER,
    durationMinutes: 120,
    status: CourseStatus.DRAFT,
    thumbnailUrl: null,
    publishedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
});

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockCourseRepo: jest.Mocked<ICourseRepository> = {
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

const mockUserRepo: jest.Mocked<IUserRepository> = {
    findById: jest.fn(),
    findByEmail: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findAll: jest.fn(),
    findPaginatedUsers: jest.fn(),
    updateUserStatus: jest.fn(),
    updateUserRole: jest.fn(),
    saveRefreshToken: jest.fn(),
    findRefreshToken: jest.fn(),
    revokeRefreshToken: jest.fn(),
    revokeUserRefreshTokens: jest.fn(),
    createAuditLog: jest.fn(),
};

// ─── Test Suite ──────────────────────────────────────────────────────────────

describe('CourseService', () => {
    let service: CourseService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new CourseService(mockCourseRepo, mockUserRepo);
    });

    // ── createCourse ────────────────────────────────────────────────────────────

    describe('createCourse()', () => {
        const trainerCtx: UserContext = { userId: 'user-1', role: Role.TRAINER, permissions: [] };

        it('should allow a Trainer to create a course for themselves', async () => {
            const dto = {
                organizationId: 'org-1',
                trainerId: 'user-1',
                title: 'NWP Basics',
                slug: 'nwp-basics',
                description: 'Numerical Weather Prediction fundamentals.',
                category: 'Meteorology',
            };
            mockUserRepo.findById.mockResolvedValue(makeUser());
            mockCourseRepo.checkSlugExists.mockResolvedValue(false);
            mockCourseRepo.create.mockResolvedValue(makeCourse({ ...dto }));

            const result = await service.createCourse(dto, trainerCtx);

            expect(mockCourseRepo.create).toHaveBeenCalledTimes(1);
            expect(result.slug).toBe('nwp-basics');
        });

        it('should throw ForbiddenError if a Trainee tries to create a course', async () => {
            mockUserRepo.findById.mockResolvedValue(makeUser({ role: Role.TRAINEE }));
            const traineeCtx: UserContext = { userId: 'user-1', role: Role.TRAINEE, permissions: [] };

            await expect(
                service.createCourse(
                    { organizationId: 'org-1', trainerId: 'user-1', title: 'x', slug: 'x', description: 'y', category: 'z' },
                    traineeCtx,
                ),
            ).rejects.toThrow(ForbiddenError);
        });

        it('should throw ForbiddenError if Trainer tries to create a course for another trainer', async () => {
            mockUserRepo.findById.mockResolvedValue(makeUser());
            const dto = { organizationId: 'org-1', trainerId: 'user-DIFFERENT', title: 'x', slug: 'x', description: 'y', category: 'z' };

            await expect(service.createCourse(dto, trainerCtx)).rejects.toThrow(ForbiddenError);
        });

        it('should throw ConflictError if course slug already exists', async () => {
            mockUserRepo.findById.mockResolvedValue(makeUser());
            mockCourseRepo.checkSlugExists.mockResolvedValue(true);
            const dto = { organizationId: 'org-1', trainerId: 'user-1', title: 'x', slug: 'existing-slug', description: 'y', category: 'z' };

            await expect(service.createCourse(dto, trainerCtx)).rejects.toThrow(ConflictError);
        });
    });

    // ── getCourseById ────────────────────────────────────────────────────────────

    describe('getCourseById()', () => {
        it('should return a course when user is in the same organization', async () => {
            mockCourseRepo.findById.mockResolvedValue(makeCourse({ status: CourseStatus.PUBLISHED }));
            mockUserRepo.findById.mockResolvedValue(makeUser({ role: Role.ADMIN }));

            const adminCtx: UserContext = { userId: 'user-1', role: Role.ADMIN, permissions: [] };
            const result = await service.getCourseById('course-1', adminCtx);
            expect(result.id).toBe('course-1');
        });

        it('should throw NotFoundError if course does not exist', async () => {
            mockCourseRepo.findById.mockResolvedValue(null);
            mockUserRepo.findById.mockResolvedValue(makeUser());

            const ctx: UserContext = { userId: 'user-1', role: Role.TRAINER, permissions: [] };
            await expect(service.getCourseById('nonexistent', ctx)).rejects.toThrow(NotFoundError);
        });

        it('should throw ForbiddenError when Trainee accesses an unpublished course', async () => {
            mockCourseRepo.findById.mockResolvedValue(makeCourse({ status: CourseStatus.DRAFT }));
            mockUserRepo.findById.mockResolvedValue(makeUser({ role: Role.TRAINEE }));

            const ctx: UserContext = { userId: 'user-1', role: Role.TRAINEE, permissions: [] };
            await expect(service.getCourseById('course-1', ctx)).rejects.toThrow(ForbiddenError);
        });
    });

    // ── submitCourse ─────────────────────────────────────────────────────────────

    describe('submitCourse()', () => {
        const trainerCtx: UserContext = { userId: 'user-1', role: Role.TRAINER, permissions: [] };

        it('should submit a DRAFT course for approval', async () => {
            mockCourseRepo.findById.mockResolvedValue(makeCourse({ status: CourseStatus.DRAFT }));
            mockUserRepo.findById.mockResolvedValue(makeUser());
            mockCourseRepo.updateStatus.mockResolvedValue(makeCourse({ status: CourseStatus.PENDING_APPROVAL }));

            const result = await service.submitCourse('course-1', trainerCtx);
            expect(result.status).toBe(CourseStatus.PENDING_APPROVAL);
            expect(mockCourseRepo.updateStatus).toHaveBeenCalledWith('course-1', CourseStatus.PENDING_APPROVAL);
        });

        it('should submit a REJECTED course for re-approval', async () => {
            mockCourseRepo.findById.mockResolvedValue(makeCourse({ status: CourseStatus.REJECTED }));
            mockUserRepo.findById.mockResolvedValue(makeUser());
            mockCourseRepo.updateStatus.mockResolvedValue(makeCourse({ status: CourseStatus.PENDING_APPROVAL }));

            await service.submitCourse('course-1', trainerCtx);
            expect(mockCourseRepo.updateStatus).toHaveBeenCalledWith('course-1', CourseStatus.PENDING_APPROVAL);
        });

        it('should throw ConflictError if course is already PUBLISHED', async () => {
            mockCourseRepo.findById.mockResolvedValue(makeCourse({ status: CourseStatus.PUBLISHED }));
            mockUserRepo.findById.mockResolvedValue(makeUser());

            await expect(service.submitCourse('course-1', trainerCtx)).rejects.toThrow(ConflictError);
        });
    });

    // ── approveCourse ────────────────────────────────────────────────────────────

    describe('approveCourse()', () => {
        const adminCtx: UserContext = { userId: 'user-1', role: Role.ADMIN, permissions: [] };

        it('should allow Admin to approve a PENDING_APPROVAL course', async () => {
            mockCourseRepo.findById.mockResolvedValue(makeCourse({ status: CourseStatus.PENDING_APPROVAL }));
            mockUserRepo.findById.mockResolvedValue(makeUser({ role: Role.ADMIN }));
            mockCourseRepo.updateStatus.mockResolvedValue(makeCourse({ status: CourseStatus.PUBLISHED, publishedAt: new Date() }));

            const result = await service.approveCourse('course-1', adminCtx);
            expect(result.status).toBe(CourseStatus.PUBLISHED);
            expect(mockCourseRepo.updateStatus).toHaveBeenCalledWith('course-1', CourseStatus.PUBLISHED, expect.any(Date));
        });

        it('should throw ForbiddenError if a Trainer tries to approve', async () => {
            mockCourseRepo.findById.mockResolvedValue(makeCourse({ status: CourseStatus.PENDING_APPROVAL }));
            mockUserRepo.findById.mockResolvedValue(makeUser({ role: Role.TRAINER }));

            const trainerCtx: UserContext = { userId: 'user-1', role: Role.TRAINER, permissions: [] };
            await expect(service.approveCourse('course-1', trainerCtx)).rejects.toThrow(ForbiddenError);
        });

        it('should throw ConflictError if course is not PENDING_APPROVAL', async () => {
            mockCourseRepo.findById.mockResolvedValue(makeCourse({ status: CourseStatus.DRAFT }));
            mockUserRepo.findById.mockResolvedValue(makeUser({ role: Role.ADMIN }));

            await expect(service.approveCourse('course-1', adminCtx)).rejects.toThrow(ConflictError);
        });
    });

    // ── rejectCourse ─────────────────────────────────────────────────────────────

    describe('rejectCourse()', () => {
        const adminCtx: UserContext = { userId: 'user-1', role: Role.ADMIN, permissions: [] };

        it('should allow Admin to reject a PENDING_APPROVAL course', async () => {
            mockCourseRepo.findById.mockResolvedValue(makeCourse({ status: CourseStatus.PENDING_APPROVAL }));
            mockUserRepo.findById.mockResolvedValue(makeUser({ role: Role.ADMIN }));
            mockCourseRepo.updateStatus.mockResolvedValue(makeCourse({ status: CourseStatus.REJECTED }));

            const result = await service.rejectCourse('course-1', adminCtx);
            expect(result.status).toBe(CourseStatus.REJECTED);
            expect(mockCourseRepo.updateStatus).toHaveBeenCalledWith('course-1', CourseStatus.REJECTED);
        });

        it('should throw ForbiddenError if a Trainer tries to reject', async () => {
            mockCourseRepo.findById.mockResolvedValue(makeCourse({ status: CourseStatus.PENDING_APPROVAL }));
            mockUserRepo.findById.mockResolvedValue(makeUser({ role: Role.TRAINER }));

            const trainerCtx: UserContext = { userId: 'user-1', role: Role.TRAINER, permissions: [] };
            await expect(service.rejectCourse('course-1', trainerCtx)).rejects.toThrow(ForbiddenError);
        });
    });

    // ── archiveCourse ────────────────────────────────────────────────────────────

    describe('archiveCourse()', () => {
        const trainerCtx: UserContext = { userId: 'user-1', role: Role.TRAINER, permissions: [] };

        it('should allow a Trainer to archive their own course', async () => {
            mockCourseRepo.findById.mockResolvedValue(makeCourse({ status: CourseStatus.PUBLISHED }));
            mockUserRepo.findById.mockResolvedValue(makeUser());
            mockCourseRepo.archive.mockResolvedValue(makeCourse({ status: CourseStatus.ARCHIVED }));

            const result = await service.archiveCourse('course-1', trainerCtx);
            expect(result.status).toBe(CourseStatus.ARCHIVED);
        });

        it('should throw ForbiddenError if Trainer tries to archive another trainer\'s course', async () => {
            mockCourseRepo.findById.mockResolvedValue(makeCourse({ trainerId: 'user-OTHER' }));
            mockUserRepo.findById.mockResolvedValue(makeUser());

            await expect(service.archiveCourse('course-1', trainerCtx)).rejects.toThrow(ForbiddenError);
        });

        it('should throw ConflictError if course is already ARCHIVED', async () => {
            mockCourseRepo.findById.mockResolvedValue(makeCourse({ status: CourseStatus.ARCHIVED }));
            mockUserRepo.findById.mockResolvedValue(makeUser());

            await expect(service.archiveCourse('course-1', trainerCtx)).rejects.toThrow(ConflictError);
        });
    });

    // ── updateCourse ─────────────────────────────────────────────────────────────

    describe('updateCourse()', () => {
        const trainerCtx: UserContext = { userId: 'user-1', role: Role.TRAINER, permissions: [] };

        it('should allow Trainer to update their own DRAFT course', async () => {
            mockCourseRepo.findById.mockResolvedValue(makeCourse({ status: CourseStatus.DRAFT }));
            mockUserRepo.findById.mockResolvedValue(makeUser());
            mockCourseRepo.update.mockResolvedValue(makeCourse({ title: 'Updated Title', status: CourseStatus.DRAFT }));

            const result = await service.updateCourse('course-1', { title: 'Updated Title' }, trainerCtx);
            expect(result.title).toBe('Updated Title');
        });

        it('should throw ConflictError if course is in PENDING_APPROVAL state', async () => {
            mockCourseRepo.findById.mockResolvedValue(makeCourse({ status: CourseStatus.PENDING_APPROVAL }));
            mockUserRepo.findById.mockResolvedValue(makeUser());

            await expect(service.updateCourse('course-1', { title: 'x' }, trainerCtx)).rejects.toThrow(ConflictError);
        });

        it('should throw ForbiddenError if updating a course belonging to another trainer', async () => {
            mockCourseRepo.findById.mockResolvedValue(makeCourse({ status: CourseStatus.DRAFT, trainerId: 'user-OTHER' }));
            mockUserRepo.findById.mockResolvedValue(makeUser());

            await expect(service.updateCourse('course-1', { title: 'x' }, trainerCtx)).rejects.toThrow(ForbiddenError);
        });
    });

    // ── validatePrerequisites ─────────────────────────────────────────────────────

    describe('validatePrerequisites (via createCourse)', () => {
        const trainerCtx: UserContext = { userId: 'user-1', role: Role.TRAINER, permissions: [] };

        it('should throw BadRequestError for duplicate prerequisite IDs', async () => {
            mockUserRepo.findById.mockResolvedValue(makeUser());
            mockCourseRepo.checkSlugExists.mockResolvedValue(false);
            const dto = {
                organizationId: 'org-1',
                trainerId: 'user-1',
                title: 'x',
                slug: 'x',
                description: 'y',
                category: 'z',
                prerequisites: ['prereq-1', 'prereq-1'], // duplicate
            };

            await expect(service.createCourse(dto, trainerCtx)).rejects.toThrow(BadRequestError);
        });

        it('should throw BadRequestError if prerequisite course does not exist', async () => {
            mockUserRepo.findById.mockResolvedValue(makeUser());
            mockCourseRepo.checkSlugExists.mockResolvedValue(false);
            mockCourseRepo.findById.mockResolvedValue(null); // prereq not found
            const dto = {
                organizationId: 'org-1',
                trainerId: 'user-1',
                title: 'x',
                slug: 'x',
                description: 'y',
                category: 'z',
                prerequisites: ['nonexistent-prereq'],
            };

            await expect(service.createCourse(dto, trainerCtx)).rejects.toThrow(BadRequestError);
        });

        it('should throw ForbiddenError for a cross-organization prerequisite', async () => {
            mockUserRepo.findById.mockResolvedValue(makeUser({ organizationId: 'org-1' }));
            mockCourseRepo.checkSlugExists.mockResolvedValue(false);
            mockCourseRepo.findById.mockResolvedValue(makeCourse({ organizationId: 'org-OTHER' })); // different org
            const dto = {
                organizationId: 'org-1',
                trainerId: 'user-1',
                title: 'x',
                slug: 'x',
                description: 'y',
                category: 'z',
                prerequisites: ['cross-org-course'],
            };

            await expect(service.createCourse(dto, trainerCtx)).rejects.toThrow(ForbiddenError);
        });
    });
});
