import { AdminAnalyticsService } from '../services/admin-analytics.service';
import { AdminAnalyticsController } from '../controllers/admin-analytics.controller';
import { EnrollmentStatus } from '@prisma/client';
import { prisma } from '../database/client';

jest.mock('../database/client', () => ({
  __esModule: true,
  prisma: {
    user: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    course: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    enrollment: {
      count: jest.fn(),
      findMany: jest.fn(),
      aggregate: jest.fn(),
    },
    assessmentAttempt: {
      count: jest.fn(),
      findMany: jest.fn(),
      aggregate: jest.fn(),
    },
    userTopicCompetency: {
      findMany: jest.fn(),
      aggregate: jest.fn(),
    },
    skillGap: {
      findMany: jest.fn(),
    },
    resource: {
      groupBy: jest.fn(),
    },
    revisionSession: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    revisionOutcome: {
      findMany: jest.fn(),
    },
  },
}));

describe('Admin Analytics & AI Assistant Unit Tests', () => {
  let service: AdminAnalyticsService;
  let controller: AdminAnalyticsController;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AdminAnalyticsService();
    controller = new AdminAnalyticsController(service);
  });

  describe('getExecutiveDashboard', () => {
    it('should aggregate database metrics across all modules into executive telemetry', async () => {
      // 1. Trainees & growth
      (prisma.user.count as jest.Mock)
        .mockResolvedValueOnce(45) // totalTrainees
        .mockResolvedValueOnce(40) // prevTotalTrainees
        .mockResolvedValueOnce(28) // activeTrainees
        .mockResolvedValueOnce(25) // prevActiveTrainees
        .mockResolvedValueOnce(8);  // totalTrainers

      // 4. Published courses
      (prisma.course.count as jest.Mock)
        .mockResolvedValueOnce(12) // publishedCourses
        .mockResolvedValueOnce(10); // prevPublishedCourses

      // 6. Enrollment aggregations
      (prisma.enrollment.aggregate as jest.Mock)
        .mockResolvedValueOnce({ _avg: { progressPercentage: 68 } })
        .mockResolvedValueOnce({ _avg: { progressPercentage: 62 } });

      (prisma.enrollment.count as jest.Mock).mockResolvedValueOnce(110);

      // 8. Assessment attempts
      (prisma.assessmentAttempt.count as jest.Mock)
        .mockResolvedValueOnce(85) // assessmentAttempts
        .mockResolvedValueOnce(70); // assessmentsSubmitted

      (prisma.assessmentAttempt.aggregate as jest.Mock).mockResolvedValueOnce({
        _avg: { score: 74 },
      });

      // 10. Competencies aggregate
      (prisma.userTopicCompetency.aggregate as jest.Mock).mockResolvedValueOnce({
        _avg: { competencyScore: 78 },
      });

      // 11. Activity series
      (prisma.enrollment.findMany as jest.Mock).mockResolvedValueOnce([
        { enrolledAt: new Date() },
      ]);
      (prisma.assessmentAttempt.findMany as jest.Mock)
        .mockResolvedValueOnce([{ createdAt: new Date() }]) // activity attempts
        .mockResolvedValueOnce([{ score: 35 }, { score: 75 }, { score: 90 }]); // scoreDistributionRaw

      (prisma.revisionSession.findMany as jest.Mock).mockResolvedValueOnce([
        { createdAt: new Date() },
      ]);

      // 12. Top Courses
      (prisma.course.findMany as jest.Mock).mockResolvedValueOnce([
        {
          id: 'c-1',
          title: 'Radar Meteorology',
          category: 'Radar',
          difficulty: 'INTERMEDIATE',
          trainer: { firstName: 'Dr. Jane', lastName: 'Doe' },
          _count: { enrollments: 2, modules: 4 },
          enrollments: [
            { userId: 'u-1', status: EnrollmentStatus.COMPLETED, progressPercentage: 100 },
            { userId: 'u-2', status: EnrollmentStatus.IN_PROGRESS, progressPercentage: 50 },
          ],
        },
      ]);

      // 13. Trainers Raw
      (prisma.user.findMany as jest.Mock).mockResolvedValueOnce([
        {
          id: 't-1',
          firstName: 'Dr. Jane',
          lastName: 'Doe',
          trainerProfile: { averageRating: 4.9 },
          taughtCourses: [
            {
              id: 'c-1',
              enrollments: [
                { userId: 'u-1', status: EnrollmentStatus.COMPLETED, progressPercentage: 100 },
              ],
            },
          ],
        },
      ]);

      // 14. Competencies raw
      (prisma.userTopicCompetency.findMany as jest.Mock).mockResolvedValueOnce([
        { topic: { name: 'Doppler Velocity' }, competencyScore: 82 },
      ]);

      // 15. Skill Gaps raw
      (prisma.skillGap.findMany as jest.Mock).mockResolvedValueOnce([
        {
          competency: { name: 'Radar Algorithms', category: 'Radar' },
          priority: 'HIGH',
        },
      ]);

      // 16. Resource groups
      (prisma.resource.groupBy as jest.Mock).mockResolvedValueOnce([
        { resourceType: 'VIDEO', _count: { id: 14 } },
      ]);

      // 17. Revision sessions count & outcomes
      (prisma.revisionSession.count as jest.Mock).mockResolvedValueOnce(34);
      (prisma.revisionOutcome.findMany as jest.Mock).mockResolvedValueOnce([
        { preScore: 50, postScore: 72 },
      ]);

      // 18. Pending courses count & inactive trainees count
      (prisma.course.count as jest.Mock).mockResolvedValueOnce(2);
      (prisma.user.count as jest.Mock).mockResolvedValueOnce(5);

      const res = await service.getExecutiveDashboard({ dateRange: '30d' });

      expect(res.kpi.totalTrainees).toBe(45);
      expect(res.kpi.activeLearners).toBe(28);
      expect(res.kpi.publishedCourses).toBe(12);
      expect(res.kpi.completionRate).toBe(68);
      expect(res.kpi.avgAssessmentScore).toBe(74);

      expect(res.coursePerformance).toHaveLength(1);
      expect(res.coursePerformance[0].title).toBe('Radar Meteorology');
      expect(res.coursePerformance[0].completionRate).toBe(50);

      expect(res.courseFunnel).toBeDefined();
      expect(res.courseFunnel.length).toBe(5);

      expect(res.scoreDistribution).toBeDefined();
      expect(res.skillGaps).toHaveLength(1);
      expect(res.attentionRequired.length).toBeGreaterThan(0);
    });
  });

  describe('processNaturalLanguageQuery', () => {
    it('should map "lowest completion" intent and return structured bar chart visualization', async () => {
      (prisma.course.findMany as jest.Mock).mockResolvedValueOnce([
        {
          id: 'c-low',
          title: 'Satellite Analysis',
          category: 'Remote Sensing',
          enrollments: [
            { status: EnrollmentStatus.IN_PROGRESS, progressPercentage: 20 },
            { status: EnrollmentStatus.IN_PROGRESS, progressPercentage: 10 },
          ],
        },
      ]);

      const res = await service.processNaturalLanguageQuery('Show courses with lowest completion rates');

      expect(res.intent).toBe('LOWEST_COMPLETION_COURSES');
      expect(res.answer).toContain('Satellite Analysis');
      expect(res.visualization).toBeDefined();
      expect(res.visualization?.type).toBe('bar');
      expect(res.supportingData).toBeDefined();
    });

    it('should map "inactive trainees" intent and return donut visualization', async () => {
      (prisma.user.count as jest.Mock)
        .mockResolvedValueOnce(50) // total
        .mockResolvedValueOnce(12) // inactive 14d
        .mockResolvedValueOnce(4);  // inactive 30d

      const res = await service.processNaturalLanguageQuery('List inactive trainees over 14 days');

      expect(res.intent).toBe('INACTIVE_TRAINEES');
      expect(res.answer).toContain('12 trainees inactive');
      expect(res.visualization?.type).toBe('donut');
    });

    it('should map "trainer workload" intent and return comparison metrics', async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValueOnce([
        {
          id: 'tr-1',
          firstName: 'Dr. Jane',
          lastName: 'Doe',
          taughtCourses: [
            {
              title: 'Radar',
              enrollments: [{ userId: 'u-1', status: EnrollmentStatus.COMPLETED }],
            },
          ],
          trainerProfile: { averageRating: 4.8 },
        },
      ]);

      const res = await service.processNaturalLanguageQuery('Compare trainer workloads');

      expect(res.intent).toBe('TRAINER_WORKLOAD');
      expect(res.answer).toContain('Dr. Jane Doe');
      expect(res.visualization?.type).toBe('bar');
    });

    it('should map "skill gaps" intent and return breakdown', async () => {
      (prisma.skillGap.findMany as jest.Mock).mockResolvedValueOnce([
        {
          competency: { name: 'Doppler Processing', category: 'Radar' },
          priority: 'HIGH',
        },
      ]);

      const res = await service.processNaturalLanguageQuery('What are the most critical skill gaps?');

      expect(res.intent).toBe('SKILL_GAPS');
      expect(res.answer).toContain('Doppler Processing');
      expect(res.visualization?.type).toBe('bar');
    });

    it('should map general summary intent and return kpi visualization', async () => {
      (prisma.user.count as jest.Mock).mockResolvedValueOnce(50).mockResolvedValueOnce(35);
      (prisma.course.count as jest.Mock).mockResolvedValueOnce(15);
      (prisma.enrollment.aggregate as jest.Mock).mockResolvedValueOnce({
        _avg: { progressPercentage: 72 },
      });
      (prisma.assessmentAttempt.aggregate as jest.Mock).mockResolvedValueOnce({
        _avg: { score: 80 },
      });

      const res = await service.processNaturalLanguageQuery('Give me an executive platform health summary');

      expect(res.intent).toBe('EXECUTIVE_OVERVIEW');
      expect(res.visualization?.type).toBe('kpi');
    });
  });

  describe('AdminAnalyticsController', () => {
    it('should handle getDashboard HTTP request', async () => {
      jest.spyOn(service, 'getExecutiveDashboard').mockResolvedValueOnce({
        kpi: { totalTrainees: 45 } as any,
      } as any);

      const mockReq: any = { query: { dateRange: '30d' } };
      const mockRes: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      await controller.getDashboard(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('Executive analytics dashboard'),
        })
      );
    });

    it('should handle queryAi HTTP request with validation', async () => {
      jest.spyOn(service, 'processNaturalLanguageQuery').mockResolvedValueOnce({
        intent: 'TEST',
        answer: 'Test Answer',
      } as any);

      const mockReq: any = { body: { prompt: 'What are the top courses?' } };
      const mockRes: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      await controller.queryAi(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ answer: 'Test Answer' }),
        })
      );
    });

    it('should reject queryAi if prompt is missing', async () => {
      const mockReq: any = { body: {} };
      const mockRes: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      await controller.queryAi(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        })
      );
    });

    it('should export CSV format correctly', async () => {
      jest.spyOn(service, 'getExecutiveDashboard').mockResolvedValueOnce({
        kpi: {
          totalTrainees: 50,
          activeLearners: 30,
          completionRate: 65,
          avgAssessmentScore: 75,
          publishedCourses: 10,
          totalEnrollments: 120,
        },
        revisionStats: { totalSessions: 40 },
        coursePerformance: [
          {
            title: 'Synoptic Meteorology',
            category: 'General',
            difficulty: 'BEGINNER',
            trainer: 'Faculty',
            enrollments: 20,
            completions: 15,
            completionRate: 75,
            averageProgress: 80,
          },
        ],
        trainerPerformance: [],
        skillGaps: [],
      } as any);

      const mockReq: any = { query: { section: 'overview' } };
      const mockRes: any = {
        setHeader: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
      };

      await controller.exportCsv(mockReq, mockRes);

      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv; charset=utf-8');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith(expect.stringContaining('Synoptic Meteorology'));
    });
  });
});
