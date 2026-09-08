import { CourseStructureService, UserContext } from '../services/course-structure.service';
import { ICourseModuleRepository } from '../repositories/course-module.repository';
import { ILessonRepository } from '../repositories/lesson.repository';
import { ICourseRepository } from '../repositories/course.repository';
import { IUserRepository } from '../repositories/user.repository';
import { CourseStatus, Role, LessonContentType, UserStatus } from '@prisma/client';
import { ForbiddenError, NotFoundError, ConflictError, BadRequestError } from '../errors/app-error';

// ─── Helper Factories ────────────────────────────────────────────────────────

const makeUser = (overrides: Partial<any> = {}): any => ({
  id: 'user-trainer-1',
  organizationId: 'org-1',
  email: 'trainer@test.com',
  firstName: 'Main',
  lastName: 'Trainer',
  role: Role.TRAINER,
  status: UserStatus.APPROVED,
  emailVerified: true,
  passwordHash: 'hash',
  ...overrides,
});

const makeCourse = (overrides: Partial<any> = {}): any => ({
  id: 'course-1',
  organizationId: 'org-1',
  trainerId: 'user-trainer-1',
  title: 'Meteorology 101',
  slug: 'meteorology-101',
  description: 'Fundamentals of Weather Science',
  category: 'Science',
  status: CourseStatus.DRAFT,
  durationMinutes: 120,
  ...overrides,
});

const makeModule = (overrides: Partial<any> = {}): any => ({
  id: 'module-1',
  courseId: 'course-1',
  title: 'Module 1: Atmosphere',
  description: 'Introduction to atmospheric layers',
  orderIndex: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const makeLesson = (overrides: Partial<any> = {}): any => ({
  id: 'lesson-1',
  moduleId: 'module-1',
  title: 'Lesson 1.1: Troposphere',
  description: 'Overview of troposphere layer',
  contentType: LessonContentType.VIDEO,
  content: null,
  resourceUrl: 'https://cdn.example.com/video1.mp4',
  durationMinutes: 30,
  orderIndex: 0,
  isPreview: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const makeResource = (overrides: Partial<any> = {}): any => ({
  id: 'resource-1',
  title: 'Troposphere Slides.pdf',
  resourceType: 'PDF',
  url: 'https://cdn.example.com/troposphere.pdf',
  ...overrides,
});

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockModuleRepo: jest.Mocked<ICourseModuleRepository> = {
  findById: jest.fn(),
  findByCourseId: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  reorderModules: jest.fn(),
  getNextOrderIndex: jest.fn(),
  getCourseStructure: jest.fn(),
};

const mockLessonRepo: jest.Mocked<ILessonRepository> = {
  findById: jest.fn(),
  findByModuleId: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  reorderLessons: jest.fn(),
  getNextOrderIndex: jest.fn(),
  attachResource: jest.fn(),
  detachResource: jest.fn(),
  getLessonResources: jest.fn(),
};

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

describe('CourseStructureService', () => {
  let service: CourseStructureService;
  const trainerCtx: UserContext = { userId: 'user-trainer-1', role: Role.TRAINER, permissions: [] };
  const otherTrainerCtx: UserContext = {
    userId: 'user-trainer-2',
    role: Role.TRAINER,
    permissions: [],
  };
  const adminCtx: UserContext = { userId: 'user-admin-1', role: Role.ADMIN, permissions: [] };
  const traineeCtx: UserContext = { userId: 'user-trainee-1', role: Role.TRAINEE, permissions: [] };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CourseStructureService(
      mockModuleRepo,
      mockLessonRepo,
      mockCourseRepo,
      mockUserRepo,
    );

    mockUserRepo.findById.mockImplementation(async (id: string) => {
      if (id === 'user-trainer-1') {
        return makeUser({ id: 'user-trainer-1', role: Role.TRAINER });
      }
      if (id === 'user-trainer-2') {
        return makeUser({ id: 'user-trainer-2', role: Role.TRAINER });
      }
      if (id === 'user-admin-1') {
        return makeUser({ id: 'user-admin-1', role: Role.ADMIN });
      }
      if (id === 'user-trainee-1') {
        return makeUser({ id: 'user-trainee-1', role: Role.TRAINEE });
      }
      if (id === 'user-diff-org') {
        return makeUser({ id: 'user-diff-org', organizationId: 'org-OTHER' });
      }
      return null;
    });

    mockCourseRepo.findById.mockResolvedValue(makeCourse());
  });

  // ── 1. MODULE OPERATIONS & REORDERING (TC-001 - TC-030) ────────────────────

  describe('Module CRUD Operations', () => {
    it('TC-001: should create a new module in a DRAFT course', async () => {
      mockModuleRepo.create.mockResolvedValue(makeModule());

      const dto = { title: 'Module 1: Atmosphere', description: 'Intro' };
      const result = await service.createModule('course-1', dto, trainerCtx);

      expect(result.title).toBe('Module 1: Atmosphere');
      expect(mockModuleRepo.create).toHaveBeenCalledWith('course-1', dto);
    });

    it('TC-002: should list all modules ordered by orderIndex', async () => {
      const modules = [
        makeModule({ orderIndex: 0 }),
        makeModule({ id: 'module-2', orderIndex: 1 }),
      ];
      mockModuleRepo.findByCourseId.mockResolvedValue(modules);

      const result = await service.listModules('course-1', trainerCtx);
      expect(result.length).toBe(2);
      expect(result[0].orderIndex).toBe(0);
    });

    it('TC-003: should update an existing module in a DRAFT course', async () => {
      mockModuleRepo.findById.mockResolvedValue(makeModule());
      mockModuleRepo.update.mockResolvedValue(makeModule({ title: 'Updated Module Title' }));

      const result = await service.updateModule(
        'course-1',
        'module-1',
        { title: 'Updated Module Title' },
        trainerCtx,
      );
      expect(result.title).toBe('Updated Module Title');
    });

    it('TC-004: should delete a module from a DRAFT course', async () => {
      mockModuleRepo.findById.mockResolvedValue(makeModule());
      mockModuleRepo.delete.mockResolvedValue(makeModule());

      const result = await service.deleteModule('course-1', 'module-1', trainerCtx);
      expect(result.id).toBe('module-1');
    });

    it('TC-005: should reorder modules deterministically', async () => {
      const m1 = makeModule({ id: 'module-1', orderIndex: 0 });
      const m2 = makeModule({ id: 'module-2', orderIndex: 1 });
      mockModuleRepo.findByCourseId.mockResolvedValue([m1, m2]);
      mockModuleRepo.reorderModules.mockResolvedValue(undefined);

      const reorderDto = {
        moduleOrders: [
          { id: 'module-1', orderIndex: 1 },
          { id: 'module-2', orderIndex: 0 },
        ],
      };

      await service.reorderModules('course-1', reorderDto, trainerCtx);
      expect(mockModuleRepo.reorderModules).toHaveBeenCalledWith(
        'course-1',
        reorderDto.moduleOrders,
      );
    });

    it('TC-006: should throw BadRequestError when reordering with duplicate module IDs', async () => {
      mockModuleRepo.findByCourseId.mockResolvedValue([makeModule({ id: 'module-1' })]);

      const reorderDto = {
        moduleOrders: [
          { id: 'module-1', orderIndex: 0 },
          { id: 'module-1', orderIndex: 1 },
        ],
      };

      await expect(service.reorderModules('course-1', reorderDto, trainerCtx)).rejects.toThrow(
        BadRequestError,
      );
    });

    it('TC-007: should throw BadRequestError when reordering module that does not belong to course', async () => {
      mockModuleRepo.findByCourseId.mockResolvedValue([makeModule({ id: 'module-1' })]);

      const reorderDto = {
        moduleOrders: [{ id: 'module-FOREIGN', orderIndex: 0 }],
      };

      await expect(service.reorderModules('course-1', reorderDto, trainerCtx)).rejects.toThrow(
        BadRequestError,
      );
    });
  });

  // ── 2. LESSON OPERATIONS & CONTENT TYPES (TC-031 - TC-080) ───────────────────

  describe('Lesson CRUD & Ordering Operations', () => {
    beforeEach(() => {
      mockModuleRepo.findById.mockResolvedValue(makeModule());
    });

    it('TC-031: should create a VIDEO lesson in a module', async () => {
      mockLessonRepo.create.mockResolvedValue(makeLesson({ contentType: LessonContentType.VIDEO }));

      const dto = {
        title: 'Lesson 1.1: Troposphere',
        contentType: LessonContentType.VIDEO,
        durationMinutes: 30,
        isPreview: true,
      };

      const result = await service.createLesson('course-1', 'module-1', dto, trainerCtx);
      expect(result.contentType).toBe(LessonContentType.VIDEO);
      expect(result.durationMinutes).toBe(30);
      expect(result.isPreview).toBe(true);
    });

    it('TC-032: should create a PDF document lesson', async () => {
      mockLessonRepo.create.mockResolvedValue(
        makeLesson({
          contentType: LessonContentType.PDF,
          resourceUrl: 'https://cdn.example.com/file.pdf',
        }),
      );

      const dto = {
        title: 'Lesson 1.2: Atmospheric Density PDF',
        contentType: LessonContentType.PDF,
        resourceUrl: 'https://cdn.example.com/file.pdf',
      };

      const result = await service.createLesson('course-1', 'module-1', dto, trainerCtx);
      expect(result.contentType).toBe(LessonContentType.PDF);
    });

    it('TC-037: should create a PPT presentation lesson', async () => {
      mockLessonRepo.create.mockResolvedValue(
        makeLesson({
          contentType: LessonContentType.PPT,
          resourceUrl: 'https://cdn.example.com/presentation.pptx',
          durationMinutes: 20,
        }),
      );

      const dto = {
        title: 'Lesson 1.3: Synoptic Weather PPT Presentation',
        contentType: LessonContentType.PPT,
        resourceUrl: 'https://cdn.example.com/presentation.pptx',
        durationMinutes: 20,
      };

      const result = await service.createLesson('course-1', 'module-1', dto, trainerCtx);
      expect(result.contentType).toBe(LessonContentType.PPT);
      expect(result.durationMinutes).toBe(20);
    });

    it('TC-033: should list lessons ordered by orderIndex', async () => {
      const lessons = [
        makeLesson({ orderIndex: 0 }),
        makeLesson({ id: 'lesson-2', orderIndex: 1 }),
      ];
      mockLessonRepo.findByModuleId.mockResolvedValue(lessons);

      const result = await service.listLessons('course-1', 'module-1', trainerCtx);
      expect(result.length).toBe(2);
    });

    it('TC-034: should update lesson content and durationMinutes', async () => {
      mockLessonRepo.findById.mockResolvedValue(makeLesson());
      mockLessonRepo.update.mockResolvedValue(makeLesson({ durationMinutes: 45 }));

      const result = await service.updateLesson(
        'course-1',
        'module-1',
        'lesson-1',
        { durationMinutes: 45 },
        trainerCtx,
      );
      expect(result.durationMinutes).toBe(45);
    });

    it('TC-035: should delete a lesson from a module', async () => {
      mockLessonRepo.findById.mockResolvedValue(makeLesson());
      mockLessonRepo.delete.mockResolvedValue(makeLesson());

      const result = await service.deleteLesson('course-1', 'module-1', 'lesson-1', trainerCtx);
      expect(result.id).toBe('lesson-1');
    });

    it('TC-036: should reorder lessons within a module', async () => {
      const l1 = makeLesson({ id: 'lesson-1', orderIndex: 0 });
      const l2 = makeLesson({ id: 'lesson-2', orderIndex: 1 });
      mockLessonRepo.findByModuleId.mockResolvedValue([l1, l2]);
      mockLessonRepo.reorderLessons.mockResolvedValue(undefined);

      const dto = {
        lessonOrders: [
          { id: 'lesson-1', orderIndex: 1 },
          { id: 'lesson-2', orderIndex: 0 },
        ],
      };

      await service.reorderLessons('course-1', 'module-1', dto, trainerCtx);
      expect(mockLessonRepo.reorderLessons).toHaveBeenCalledWith('module-1', dto.lessonOrders);
    });
  });

  // ── 3. RESOURCE ASSOCIATION (TC-081 - TC-095) ─────────────────────────────

  describe('Resource Attachments', () => {
    beforeEach(() => {
      mockModuleRepo.findById.mockResolvedValue(makeModule());
      mockLessonRepo.findById.mockResolvedValue(makeLesson());
    });

    it('TC-081: should attach a resource to a lesson', async () => {
      mockLessonRepo.attachResource.mockResolvedValue({
        lessonId: 'lesson-1',
        resourceId: 'resource-1',
        resource: makeResource(),
      });

      const result = await service.attachResource(
        'course-1',
        'module-1',
        'lesson-1',
        'resource-1',
        trainerCtx,
      );
      expect(result.resourceId).toBe('resource-1');
    });

    it('TC-082: should detach a resource from a lesson', async () => {
      mockLessonRepo.detachResource.mockResolvedValue({
        lessonId: 'lesson-1',
        resourceId: 'resource-1',
      });

      await service.detachResource('course-1', 'module-1', 'lesson-1', 'resource-1', trainerCtx);
      expect(mockLessonRepo.detachResource).toHaveBeenCalledWith('lesson-1', 'resource-1');
    });
  });

  // ── 4. COMPLETE COURSE HIERARCHY / STRUCTURE (TC-096 - TC-110) ───────────────

  describe('getCourseStructure()', () => {
    it('TC-096: should return complete hierarchical course structure with total module duration calculation', async () => {
      const mockStructure = {
        id: 'course-1',
        title: 'Meteorology 101',
        slug: 'meteorology-101',
        description: 'Fundamentals',
        category: 'Science',
        difficulty: 'BEGINNER',
        status: CourseStatus.PUBLISHED,
        durationMinutes: 120,
        modules: [
          {
            id: 'module-1',
            title: 'Module 1',
            description: 'Desc',
            orderIndex: 0,
            lessons: [
              {
                id: 'lesson-1',
                title: 'Lesson 1.1',
                contentType: LessonContentType.VIDEO,
                durationMinutes: 30,
                orderIndex: 0,
                isPreview: true,
                lessonResources: [{ resource: makeResource() }],
              },
              {
                id: 'lesson-2',
                title: 'Lesson 1.2',
                contentType: LessonContentType.PDF,
                durationMinutes: 15,
                orderIndex: 1,
                isPreview: false,
                lessonResources: [],
              },
            ],
          },
        ],
      };

      mockModuleRepo.getCourseStructure.mockResolvedValue(mockStructure);

      const result = await service.getCourseStructure('course-1', adminCtx);

      expect(result.course.id).toBe('course-1');
      expect(result.modules.length).toBe(1);
      expect(result.modules[0].durationMinutes).toBe(45); // 30 + 15
      expect(result.modules[0].lessons[0].resources.length).toBe(1);
    });
  });

  // ── 5. ROLE-BASED ACCESS CONTROL & OWNERSHIP (TC-111 - TC-130) ──────────────

  describe('Role-Based Access Control & Ownership Validation', () => {
    it('TC-111: should throw ForbiddenError if unauthorized Trainer modifies another trainer course', async () => {
      mockCourseRepo.findById.mockResolvedValue(makeCourse({ trainerId: 'user-trainer-1' }));

      await expect(
        service.createModule('course-1', { title: 'Unauthorized' }, otherTrainerCtx),
      ).rejects.toThrow(ForbiddenError);
    });

    it('TC-112: should throw ConflictError if modifying course structure in PUBLISHED state', async () => {
      mockCourseRepo.findById.mockResolvedValue(makeCourse({ status: CourseStatus.PUBLISHED }));

      await expect(
        service.createModule('course-1', { title: 'New Module' }, trainerCtx),
      ).rejects.toThrow(ConflictError);
    });

    it('TC-113: should throw ConflictError if modifying course structure in PENDING_APPROVAL state', async () => {
      mockCourseRepo.findById.mockResolvedValue(
        makeCourse({ status: CourseStatus.PENDING_APPROVAL }),
      );

      await expect(
        service.createModule('course-1', { title: 'New Module' }, trainerCtx),
      ).rejects.toThrow(ConflictError);
    });

    it('TC-114: should allow Admin to modify course structure across trainers', async () => {
      mockCourseRepo.findById.mockResolvedValue(makeCourse({ status: CourseStatus.DRAFT }));
      mockModuleRepo.create.mockResolvedValue(makeModule({ title: 'Admin Module' }));

      const result = await service.createModule('course-1', { title: 'Admin Module' }, adminCtx);
      expect(result.title).toBe('Admin Module');
    });

    it('TC-115: should allow Trainees to read PUBLISHED course structure', async () => {
      mockCourseRepo.findById.mockResolvedValue(makeCourse({ status: CourseStatus.PUBLISHED }));
      mockModuleRepo.getCourseStructure.mockResolvedValue({
        id: 'course-1',
        title: 'Published Course',
        status: CourseStatus.PUBLISHED,
        modules: [],
      });

      const result = await service.getCourseStructure('course-1', traineeCtx);
      expect(result.course.id).toBe('course-1');
    });

    it('TC-116: should throw ForbiddenError when Trainee tries to access DRAFT course structure', async () => {
      mockCourseRepo.findById.mockResolvedValue(makeCourse({ status: CourseStatus.DRAFT }));

      await expect(service.getCourseStructure('course-1', traineeCtx)).rejects.toThrow(
        ForbiddenError,
      );
    });

    it('TC-117: should throw ForbiddenError when user belongs to a different organization', async () => {
      mockCourseRepo.findById.mockResolvedValue(makeCourse({ organizationId: 'org-1' }));
      const diffOrgCtx: UserContext = {
        userId: 'user-diff-org',
        role: Role.TRAINER,
        permissions: [],
      };

      await expect(service.getCourseStructure('course-1', diffOrgCtx)).rejects.toThrow(
        ForbiddenError,
      );
    });
  });

  // ── 6. HIERARCHICAL VALIDATION & ERRORS (TC-131 - TC-155) ────────────────────

  describe('Hierarchical Mismatch & Not Found Errors', () => {
    it('TC-131: should throw NotFoundError if course does not exist', async () => {
      mockCourseRepo.findById.mockResolvedValue(null);

      await expect(service.listModules('nonexistent-course', trainerCtx)).rejects.toThrow(
        NotFoundError,
      );
    });

    it('TC-132: should throw NotFoundError if module does not exist', async () => {
      mockModuleRepo.findById.mockResolvedValue(null);

      await expect(service.getModule('course-1', 'nonexistent-module', trainerCtx)).rejects.toThrow(
        NotFoundError,
      );
    });

    it('TC-133: should throw BadRequestError if module does not belong to the specified course', async () => {
      mockModuleRepo.findById.mockResolvedValue(makeModule({ courseId: 'OTHER-COURSE' }));

      await expect(service.getModule('course-1', 'module-1', trainerCtx)).rejects.toThrow(
        BadRequestError,
      );
    });

    it('TC-134: should throw BadRequestError if lesson does not belong to the specified module', async () => {
      mockModuleRepo.findById.mockResolvedValue(
        makeModule({ id: 'module-1', courseId: 'course-1' }),
      );
      mockLessonRepo.findById.mockResolvedValue(makeLesson({ moduleId: 'OTHER-MODULE' }));

      await expect(
        service.getLesson('course-1', 'module-1', 'lesson-1', trainerCtx),
      ).rejects.toThrow(BadRequestError);
    });
  });
});
