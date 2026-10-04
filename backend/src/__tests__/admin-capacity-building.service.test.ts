import { AdminCapacityBuildingService } from '../services/admin-capacity-building.service';
import { AdminCapacityBuildingController } from '../controllers/admin-capacity-building.controller';
import { Role, UserStatus, CourseStatus, EnrollmentStatus } from '@prisma/client';
import { NotFoundError } from '../errors/app-error';
import { prisma } from '../database/client';

jest.mock('../database/client', () => ({
  __esModule: true,
  prisma: {
    user: {
      count: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    course: {
      count: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    enrollment: {
      count: jest.fn(),
      findMany: jest.fn(),
      aggregate: jest.fn(),
    },
    resource: {
      count: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      groupBy: jest.fn(),
    },
    auditLog: {
      findMany: jest.fn(),
    },
    department: {
      findMany: jest.fn(),
    },
    trainerProfile: {
      aggregate: jest.fn(),
    },
  },
}));

describe('Admin Capacity Building Module Unit Tests', () => {
  let service: AdminCapacityBuildingService;
  let controller: AdminCapacityBuildingController;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AdminCapacityBuildingService();
    controller = new AdminCapacityBuildingController(service);
  });

  describe('getOverview', () => {
    it('should aggregate and return cross-module program KPIs with attention alerts', async () => {
      // Mock counts
      (prisma.user.count as jest.Mock)
        .mockResolvedValueOnce(50) // totalTrainees
        .mockResolvedValueOnce(5)  // newTraineesThisMonth
        .mockResolvedValueOnce(12) // totalTrainers
        .mockResolvedValueOnce(10) // activeTrainers
        .mockResolvedValueOnce(3)  // inactiveTraineesCount
        .mockResolvedValueOnce(45); // activeTrainees

      (prisma.course.count as jest.Mock)
        .mockResolvedValueOnce(25) // totalCourses
        .mockResolvedValueOnce(20) // publishedCourses
        .mockResolvedValueOnce(3);  // pendingCourses

      (prisma.enrollment.count as jest.Mock)
        .mockResolvedValueOnce(120) // totalEnrollments
        .mockResolvedValueOnce(40)  // completedEnrollments
        .mockResolvedValueOnce(70);  // inProgressEnrollments

      (prisma.enrollment.aggregate as jest.Mock).mockResolvedValue({
        _avg: { progressPercentage: 68.4 },
      });

      (prisma.resource.count as jest.Mock)
        .mockResolvedValueOnce(30) // totalResources
        .mockResolvedValueOnce(25) // publishedResources
        .mockResolvedValueOnce(5);  // pendingResources

      (prisma.resource.groupBy as jest.Mock).mockResolvedValue([
        { resourceType: 'PDF', _count: { id: 15 } },
        { resourceType: 'VIDEO', _count: { id: 10 } },
      ]);

      (prisma.auditLog.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.course.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.user.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getOverview();

      expect(result).toBeDefined();
      expect(result.kpi.totalTrainees).toBe(50);
      expect(result.kpi.totalTrainers).toBe(12);
      expect(result.kpi.publishedCourses).toBe(20);
      expect(result.kpi.totalEnrollments).toBe(120);
      expect(result.kpi.averageCompletionRate).toBe(68);
      expect(result.resourceTypeDistribution).toEqual([
        { type: 'PDF', count: 15 },
        { type: 'VIDEO', count: 10 },
      ]);
      expect(result.attentionRequired.length).toBeGreaterThan(0);
    });
  });

  describe('getTrainees', () => {
    it('should return paginated trainees cohort with real calculated progress and competency', async () => {
      (prisma.user.count as jest.Mock).mockResolvedValue(1);
      (prisma.user.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'trainee-1',
          firstName: 'Arun',
          lastName: 'Kumar',
          email: 'arun@imd.gov.in',
          role: Role.TRAINEE,
          status: UserStatus.APPROVED,
          createdAt: new Date('2026-01-01'),
          lastLoginAt: new Date('2026-02-01'),
          department: { id: 'dept-1', name: 'Monsoon Forecasting', code: 'MF' },
          traineeProfile: {
            designation: 'Meteorologist-I',
            profileCompletion: 85,
            targetRole: { id: 'role-1', name: 'Senior Radar Forecaster' },
          },
          enrollments: [
            { id: 'enr-1', status: EnrollmentStatus.COMPLETED, progressPercentage: 100 },
            { id: 'enr-2', status: EnrollmentStatus.IN_PROGRESS, progressPercentage: 60 },
          ],
          userTopicCompetencies: [
            { competencyScore: 80 },
            { competencyScore: 90 },
          ],
        },
      ]);
      (prisma.department.findMany as jest.Mock).mockResolvedValue([
        { id: 'dept-1', name: 'Monsoon Forecasting', code: 'MF' },
      ]);
      (prisma.enrollment.aggregate as jest.Mock).mockResolvedValue({
        _avg: { progressPercentage: 80 },
      });

      const result = await service.getTrainees({ page: 1, limit: 10 });

      expect(result.trainees.length).toBe(1);
      const trainee = result.trainees[0];
      expect(trainee.name).toBe('Arun Kumar');
      expect(trainee.enrolledCoursesCount).toBe(2);
      expect(trainee.completedCoursesCount).toBe(1);
      expect(trainee.averageProgress).toBe(80); // (100 + 60) / 2
      expect(trainee.competencyScore).toBe(85); // (80 + 90) / 2
      expect(trainee.targetRole).toBe('Senior Radar Forecaster');
    });
  });

  describe('getTraineeById', () => {
    it('should return null when trainee does not exist', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await service.getTraineeById('non-existent');
      expect(result).toBeNull();
    });

    it('should return complete trainee profile with learning history when found', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: 'trainee-1',
        firstName: 'Priya',
        lastName: 'Sharma',
        email: 'priya@imd.gov.in',
        role: Role.TRAINEE,
        status: UserStatus.APPROVED,
        createdAt: new Date(),
        department: { name: 'Satellite Meteorology' },
        organization: { name: 'MoES / IMD' },
        traineeProfile: {
          designation: 'Scientific Officer',
          targetRole: { name: 'Satellite Analyst' },
          profileCompletion: 90,
        },
        enrollments: [],
        assessmentAttempts: [],
        userTopicCompetencies: [],
        skillGaps: [],
        revisionSessions: [],
        learningEvents: [],
      });

      const result = await service.getTraineeById('trainee-1');
      expect(result).toBeDefined();
      expect(result?.profile.firstName).toBe('Priya');
      expect(result?.profile.designation).toBe('Scientific Officer');
    });
  });

  describe('getTrainers & Workload Calculation', () => {
    it('should calculate trainer workload level accurately based on distinct trainee count', async () => {
      (prisma.user.count as jest.Mock).mockResolvedValue(1);
      (prisma.user.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'trainer-1',
          firstName: 'Dr. Rajesh',
          lastName: 'Nath',
          email: 'rajesh.trainer@imd.gov.in',
          role: Role.TRAINER,
          status: UserStatus.APPROVED,
          createdAt: new Date(),
          department: { id: 'dept-1', name: 'Cyclone Warning Division' },
          trainerProfile: {
            designation: 'Senior Faculty Specialist',
            yearsExperience: 14,
            averageRating: 4.9,
            totalReviews: 24,
            expertise: [],
          },
          taughtCourses: [
            {
              id: 'c-1',
              status: CourseStatus.PUBLISHED,
              enrollments: [
                { userId: 'trainee-a', status: EnrollmentStatus.COMPLETED, progressPercentage: 100 },
                { userId: 'trainee-b', status: EnrollmentStatus.IN_PROGRESS, progressPercentage: 50 },
              ],
            },
          ],
        },
      ]);
      (prisma.department.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.enrollment.findMany as jest.Mock).mockResolvedValue([{ userId: 'trainee-a' }, { userId: 'trainee-b' }]);
      (prisma.trainerProfile.aggregate as jest.Mock).mockResolvedValue({
        _avg: { averageRating: 4.9 },
      });

      const result = await service.getTrainers({ page: 1, limit: 10 });
      expect(result.trainers.length).toBe(1);
      const tr = result.trainers[0];
      expect(tr.name).toBe('Dr. Rajesh Nath');
      expect(tr.uniqueTraineesCount).toBe(2);
      expect(tr.workloadLevel).toBe('LOW'); // < 15 is LOW
    });
  });

  describe('AdminCapacityBuildingController error handling', () => {
    it('should throw NotFoundError if trainee is not found in getTraineeById', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);

      const req = { params: { id: 'missing-id' } } as any;
      const res = {} as any;

      await expect(controller.getTraineeById(req, res)).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError if trainer is not found in getTrainerById', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);

      const req = { params: { id: 'missing-id' } } as any;
      const res = {} as any;

      await expect(controller.getTrainerById(req, res)).rejects.toThrow(NotFoundError);
    });
  });
});
