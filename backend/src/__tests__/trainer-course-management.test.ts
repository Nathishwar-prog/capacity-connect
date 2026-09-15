import { TrainerService } from '../services/trainer.service';
import { TrainerRepository } from '../repositories/trainer.repository';
import { UserRepository } from '../repositories/user.repository';
import { Role, CourseStatus, CourseDifficulty } from '@prisma/client';
import { ForbiddenError, NotFoundError, BadRequestError } from '../errors/app-error';
import { hasPermission, Permissions } from '../permissions';

describe('Trainer Course Management & IDOR Security Isolation', () => {
  let service: TrainerService;
  let mockTrainerRepo: jest.Mocked<TrainerRepository>;
  let mockUserRepo: jest.Mocked<UserRepository>;

  // Canonical Test Personas
  const trainerA = {
    id: 'trainer-alex-101',
    email: 'alex.trainer@imd.gov.in',
    role: Role.TRAINER,
    organizationId: 'org-imd-delhi',
  };

  const trainerB = {
    id: 'trainer-elena-102',
    email: 'elena.trainer@imd.gov.in',
    role: Role.TRAINER,
    organizationId: 'org-imd-delhi',
  };

  const adminUser = {
    id: 'admin-sarah-201',
    email: 'admin@imd.gov.in',
    role: Role.ADMIN,
    organizationId: 'org-imd-delhi',
  };

  const traineeUser = {
    id: 'trainee-rahul-301',
    email: 'rahul.trainee@imd.gov.in',
    role: Role.TRAINEE,
    organizationId: 'org-imd-delhi',
  };

  // Sample course owned by Trainer A
  const sampleCourseA = {
    id: 'course-nwp-101',
    organizationId: 'org-imd-delhi',
    trainerId: trainerA.id,
    title: 'Numerical Weather Prediction Basics',
    slug: 'numerical-weather-prediction-basics',
    description: 'Operational NWP model diagnostics and assimilation.',
    status: CourseStatus.DRAFT,
    difficulty: CourseDifficulty.INTERMEDIATE,
    durationMinutes: 240,
    modules: [
      {
        id: 'mod-1',
        title: 'Atmospheric Dynamics Primer',
        orderIndex: 0,
        lessons: [
          {
            id: 'les-1',
            title: 'Governing Primitive Equations',
            orderIndex: 0,
          },
        ],
      },
    ],
  };

  beforeEach(() => {
    mockTrainerRepo = {
      getCourseById: jest.fn(),
      updateCourse: jest.fn(),
      unpublishCourse: jest.fn(),
      duplicateCourse: jest.fn(),
      deleteCourseSafely: jest.fn(),
      getCourseAnalytics: jest.fn(),
      getTrainerTrainees: jest.fn(),
      getTraineeDetail: jest.fn(),
      logAudit: jest.fn().mockResolvedValue({}),
      getTrainerProfile: jest.fn(),
      getTrainerAnalytics: jest.fn(),
    } as unknown as jest.Mocked<TrainerRepository>;

    mockUserRepo = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<UserRepository>;

    service = new TrainerService(mockTrainerRepo, mockUserRepo);
  });

  describe('1. Course Ownership & Multi-Tenant IDOR Guard', () => {
    it('TC-TCM-000: Trainer role must possess COURSES_PUBLISH and COURSES_DELETE permissions', () => {
      expect(hasPermission(Role.TRAINER, [], Permissions.COURSES_PUBLISH)).toBe(true);
      expect(hasPermission(Role.TRAINER, [], Permissions.COURSES_DELETE)).toBe(true);
      expect(hasPermission(Role.TRAINER, [], Permissions.COURSES_WRITE)).toBe(true);
      // Trainee role must NOT have publishing or deletion rights
      expect(hasPermission(Role.TRAINEE, [], Permissions.COURSES_PUBLISH)).toBe(false);
      expect(hasPermission(Role.TRAINEE, [], Permissions.COURSES_DELETE)).toBe(false);
    });

    it('TC-TCM-001: Should allow Trainer A to access and manage their own course', async () => {
      mockTrainerRepo.getCourseById.mockResolvedValue(sampleCourseA as any);
      mockTrainerRepo.getCourseAnalytics.mockResolvedValue({
        kpis: { totalEnrollments: 5 },
      } as any);

      const result = await service.getCourseAnalytics(sampleCourseA.id, trainerA.id, trainerA.role);
      expect(result).toBeDefined();
      expect(mockTrainerRepo.getCourseById).toHaveBeenCalledWith(sampleCourseA.id);
    });

    it('TC-TCM-002: Should REJECT Trainer B trying to access Trainer A course (IDOR prevention)', async () => {
      mockTrainerRepo.getCourseById.mockResolvedValue(sampleCourseA as any);

      await expect(
        service.getCourseAnalytics(sampleCourseA.id, trainerB.id, trainerB.role),
      ).rejects.toThrow(ForbiddenError);

      await expect(
        service.publishCourse(sampleCourseA.id, trainerB.id, trainerB.role),
      ).rejects.toThrow(ForbiddenError);

      await expect(
        service.unpublishCourse(sampleCourseA.id, trainerB.id, trainerB.role),
      ).rejects.toThrow(ForbiddenError);

      await expect(
        service.duplicateCourse(sampleCourseA.id, trainerB.id, trainerB.role),
      ).rejects.toThrow(ForbiddenError);

      await expect(
        service.deleteCourse(sampleCourseA.id, trainerB.id, trainerB.role),
      ).rejects.toThrow(ForbiddenError);
    });

    it('TC-TCM-003: Should allow Administrator to access any course regardless of trainerId', async () => {
      mockTrainerRepo.getCourseById.mockResolvedValue(sampleCourseA as any);
      mockTrainerRepo.getCourseAnalytics.mockResolvedValue({ kpis: {} } as any);

      const result = await service.getCourseAnalytics(sampleCourseA.id, adminUser.id, adminUser.role);
      expect(result).toBeDefined();
    });

    it('TC-TCM-004: Should throw NotFoundError if course does not exist', async () => {
      mockTrainerRepo.getCourseById.mockResolvedValue(null);

      await expect(
        service.getCourseAnalytics('nonexistent-course', trainerA.id, trainerA.role),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('2. Course Publishing Lifecycle & Pre-flight Validation', () => {
    it('TC-TCM-005: Trainer A should publish a valid DRAFT course with modules and lessons', async () => {
      mockTrainerRepo.getCourseById.mockResolvedValue(sampleCourseA as any);
      mockTrainerRepo.updateCourse.mockResolvedValue({
        ...sampleCourseA,
        status: CourseStatus.PUBLISHED,
        publishedAt: new Date(),
      } as any);

      const published = await service.publishCourse(sampleCourseA.id, trainerA.id, trainerA.role);
      expect(published.status).toBe(CourseStatus.PUBLISHED);
      expect(mockTrainerRepo.updateCourse).toHaveBeenCalledWith(
        sampleCourseA.id,
        expect.objectContaining({ status: CourseStatus.PUBLISHED }),
      );
      expect(mockTrainerRepo.logAudit).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'COURSE_PUBLISHED' }),
      );
    });

    it('TC-TCM-006: Pre-flight validation should reject publishing course with 0 modules', async () => {
      const invalidCourse = { ...sampleCourseA, modules: [] };
      mockTrainerRepo.getCourseById.mockResolvedValue(invalidCourse as any);

      await expect(
        service.publishCourse(sampleCourseA.id, trainerA.id, trainerA.role),
      ).rejects.toThrow(BadRequestError);
    });

    it('TC-TCM-007: Pre-flight validation should reject publishing course where a module has 0 lessons', async () => {
      const invalidCourse = {
        ...sampleCourseA,
        modules: [{ id: 'mod-empty', title: 'Empty Module', lessons: [] }],
      };
      mockTrainerRepo.getCourseById.mockResolvedValue(invalidCourse as any);

      await expect(
        service.publishCourse(sampleCourseA.id, trainerA.id, trainerA.role),
      ).rejects.toThrow(BadRequestError);
    });

    it('TC-TCM-008: Should reject publishing an already PUBLISHED course', async () => {
      const alreadyPublished = { ...sampleCourseA, status: CourseStatus.PUBLISHED };
      mockTrainerRepo.getCourseById.mockResolvedValue(alreadyPublished as any);

      await expect(
        service.publishCourse(sampleCourseA.id, trainerA.id, trainerA.role),
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('3. Course Unpublishing (Revert to Draft)', () => {
    it('TC-TCM-009: Trainer A should unpublish a PUBLISHED course back to DRAFT', async () => {
      const publishedCourse = { ...sampleCourseA, status: CourseStatus.PUBLISHED };
      mockTrainerRepo.getCourseById.mockResolvedValue(publishedCourse as any);
      mockTrainerRepo.unpublishCourse.mockResolvedValue({
        ...sampleCourseA,
        status: CourseStatus.DRAFT,
      } as any);

      const unpublished = await service.unpublishCourse(sampleCourseA.id, trainerA.id, trainerA.role);
      expect(unpublished.status).toBe(CourseStatus.DRAFT);
      expect(mockTrainerRepo.unpublishCourse).toHaveBeenCalledWith(sampleCourseA.id);
      expect(mockTrainerRepo.logAudit).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'COURSE_UNPUBLISHED' }),
      );
    });

    it('TC-TCM-010: Should reject unpublishing a course that is already in DRAFT state', async () => {
      mockTrainerRepo.getCourseById.mockResolvedValue(sampleCourseA as any); // status is DRAFT

      await expect(
        service.unpublishCourse(sampleCourseA.id, trainerA.id, trainerA.role),
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('4. Course Duplication / Cloning', () => {
    it('TC-TCM-011: Trainer A should duplicate their course producing a new draft copy', async () => {
      mockTrainerRepo.getCourseById.mockResolvedValue(sampleCourseA as any);
      const duplicatedMock = {
        id: 'course-nwp-copy-1',
        title: 'Numerical Weather Prediction Basics (Copy)',
        status: CourseStatus.DRAFT,
        trainerId: trainerA.id,
      };
      mockTrainerRepo.duplicateCourse.mockResolvedValue(duplicatedMock as any);

      const result = await service.duplicateCourse(sampleCourseA.id, trainerA.id, trainerA.role);
      expect(result.id).toBe('course-nwp-copy-1');
      expect(mockTrainerRepo.duplicateCourse).toHaveBeenCalledWith(sampleCourseA.id, trainerA.id);
      expect(mockTrainerRepo.logAudit).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'COURSE_DUPLICATED' }),
      );
    });
  });

  describe('5. Safe Deletion Protocol (Soft-Delete vs Hard-Delete)', () => {
    it('TC-TCM-012: Should hard-delete course when 0 enrollments exist', async () => {
      mockTrainerRepo.getCourseById.mockResolvedValue(sampleCourseA as any);
      mockTrainerRepo.deleteCourseSafely.mockResolvedValue({
        message: 'Course permanently deleted as it had no student enrollments.',
        archived: false,
      });

      const result = await service.deleteCourse(sampleCourseA.id, trainerA.id, trainerA.role);
      expect(result.archived).toBe(false);
      expect(mockTrainerRepo.logAudit).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'COURSE_DELETED' }),
      );
    });

    it('TC-TCM-013: Should soft-delete/archive course when active enrollments exist to protect learner history', async () => {
      mockTrainerRepo.getCourseById.mockResolvedValue(sampleCourseA as any);
      mockTrainerRepo.deleteCourseSafely.mockResolvedValue({
        message: 'Course archived to preserve historical trainee records and certifications.',
        archived: true,
      });

      const result = await service.deleteCourse(sampleCourseA.id, trainerA.id, trainerA.role);
      expect(result.archived).toBe(true);
      expect(mockTrainerRepo.logAudit).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'COURSE_ARCHIVED' }),
      );
    });
  });

  describe('6. Scoped Trainee Monitoring & Trainee Detail Isolation', () => {
    it('TC-TCM-014: Trainer A should only view trainees enrolled in Trainer A courses', async () => {
      mockTrainerRepo.getTrainerTrainees.mockResolvedValue({
        total: 1,
        enrollments: [
          {
            id: 'enr-1',
            progressPercentage: 45,
            status: 'ACTIVE',
            enrolledAt: new Date(),
            user: {
              id: traineeUser.id,
              firstName: 'Rahul',
              lastName: 'Trainee',
              email: traineeUser.email,
              phone: null,
              traineeProfile: { designation: 'Scientific Officer' },
              department: { name: 'Observational Meteorology' },
              userSkills: [],
              userCompetencies: [],
            },
            course: {
              id: sampleCourseA.id,
              title: sampleCourseA.title,
            },
          },
        ],
      } as any);

      const result = await service.getTrainees(trainerA.id, {});
      expect(result.trainees).toHaveLength(1);
      expect(result.trainees[0].name).toBe('Rahul Trainee');
      expect(mockTrainerRepo.getTrainerTrainees).toHaveBeenCalledWith(trainerA.id, {});
    });

    it('TC-TCM-015: Trainer A should retrieve deep learning telemetry for trainee enrolled in their course', async () => {
      mockTrainerRepo.getTraineeDetail.mockResolvedValue({
        trainee: {
          id: traineeUser.id,
          firstName: 'Rahul',
          lastName: 'Trainee',
          email: traineeUser.email,
          organization: { name: 'IMD' },
          department: { name: 'Radar Meteorology' },
          traineeProfile: { designation: 'Meteorological Observer' },
        },
        enrollments: [],
        topicCompetencies: [
          {
            topicId: 'top-doppler',
            topicTitle: 'Doppler Velocity De-aliasing',
            competencyScore: 82,
            forgettingRisk: 28,
            stability: 14,
            priorityScore: 25,
            retention: 0.82,
            lastReviewedAt: new Date().toISOString(),
          },
        ],
        learningEvents: [],
        revisionActivity: [{ id: 'sess-1', status: 'COMPLETED', score: 85, startedAt: new Date().toISOString() }],
      } as any);

      const result = await service.getTraineeDetail(trainerA.id, traineeUser.id);
      expect(result.profile.name).toBe('Rahul Trainee');
      expect(result.topicCompetencies).toHaveLength(1);
      expect(result.revisionActivity).toHaveLength(1);
    });

    it('TC-TCM-016: Trainer A requesting trainee NOT in any of their courses should throw NotFoundError', async () => {
      // getTraineeDetail returns null if trainee is not enrolled in trainer's courses
      mockTrainerRepo.getTraineeDetail.mockResolvedValue(null);

      await expect(
        service.getTraineeDetail(trainerA.id, 'unauthorized-trainee-999'),
      ).rejects.toThrow(NotFoundError);
    });
  });
});
