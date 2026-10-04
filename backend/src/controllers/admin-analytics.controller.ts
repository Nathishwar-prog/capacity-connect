import { Request, Response } from 'express';
import { AdminAnalyticsService, AnalyticsFilterOptions } from '../services/admin-analytics.service';
import { ResponseHelper } from '../errors/response.helper';
import { StatusCodes } from 'http-status-codes';

export class AdminAnalyticsController {
  private analyticsService: AdminAnalyticsService;

  constructor(analyticsService?: AdminAnalyticsService) {
    this.analyticsService = analyticsService || new AdminAnalyticsService();
  }

  /**
   * GET /api/v1/admin/analytics/dashboard
   * Returns comprehensive aggregated analytics metrics
   */
  public getDashboard = async (req: Request, res: Response): Promise<Response> => {
    const filters: AnalyticsFilterOptions = {
      dateRange: req.query.dateRange as any,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      departmentId: req.query.departmentId as string,
    };

    const dashboard = await this.analyticsService.getExecutiveDashboard(filters);

    return ResponseHelper.success({
      res,
      statusCode: StatusCodes.OK,
      message: 'Executive analytics dashboard metrics retrieved successfully',
      data: dashboard,
    });
  };

  /**
   * POST /api/v1/admin/analytics/ai/query
   * Process natural language analytical query and return text answer + dynamic visual chart
   */
  public queryAi = async (req: Request, res: Response): Promise<Response> => {
    const { prompt, context } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'A valid text prompt is required for analytical AI queries',
      });
    }

    const aiResult = await this.analyticsService.processNaturalLanguageQuery(prompt, context);

    return ResponseHelper.success({
      res,
      statusCode: StatusCodes.OK,
      message: 'Analytical inquiry processed successfully',
      data: aiResult,
    });
  };

  /**
   * GET /api/v1/admin/analytics/export
   * Exports analytics tabular data as CSV for offline executive review
   */
  public exportCsv = async (req: Request, res: Response): Promise<void> => {
    const filters: AnalyticsFilterOptions = {
      dateRange: req.query.dateRange as any,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      departmentId: req.query.departmentId as string,
    };

    const dashboard = await this.analyticsService.getExecutiveDashboard(filters);
    const section = (req.query.section as string) || 'overview';

    let csvContent = '';

    if (section === 'courses') {
      csvContent = 'Course Title,Category,Difficulty,Trainer,Enrollments,Completions,Completion Rate (%),Average Progress (%)\n';
      dashboard.coursePerformance.forEach((c) => {
        csvContent += `"${c.title.replace(/"/g, '""')}","${c.category}","${c.difficulty}","${c.trainer}",${c.enrollments},${c.completions},${c.completionRate}%,${c.averageProgress}%\n`;
      });
    } else if (section === 'trainers') {
      csvContent = 'Trainer Name,Assigned Courses,Active Trainees,Completion Rate (%),Average Rating\n';
      dashboard.trainerPerformance.forEach((t) => {
        csvContent += `"${t.name.replace(/"/g, '""')}",${t.coursesCount},${t.traineesCount},${t.completionRate}%,${t.averageRating}\n`;
      });
    } else if (section === 'skill-gaps') {
      csvContent = 'Competency,Category,Affected Trainees,High Priority Count\n';
      dashboard.skillGaps.forEach((g) => {
        csvContent += `"${g.name.replace(/"/g, '""')}","${g.category}",${g.count},${g.highPriority}\n`;
      });
    } else {
      // Default: Overview Platform Summary CSV
      csvContent = 'Metric,Current Value,Unit\n';
      csvContent += `Total Registered Trainees,${dashboard.kpi.totalTrainees},Trainees\n`;
      csvContent += `Active Trainees (${filters.dateRange || '30d'}),${dashboard.kpi.activeLearners},Trainees\n`;
      csvContent += `Platform Completion Rate,${dashboard.kpi.completionRate},%\n`;
      csvContent += `Assessment Average Score,${dashboard.kpi.avgAssessmentScore},%\n`;
      csvContent += `Total Published Curricula,${dashboard.kpi.publishedCourses},Courses\n`;
      csvContent += `Total Course Enrollments,${dashboard.kpi.totalEnrollments},Enrollments\n`;
      csvContent += `Active Revision Sessions,${dashboard.revisionStats.totalSessions},Sessions\n\n`;

      csvContent += 'Course Title,Category,Enrollments,Completions,Completion Rate\n';
      dashboard.coursePerformance.slice(0, 10).forEach((c) => {
        csvContent += `"${c.title.replace(/"/g, '""')}","${c.category}",${c.enrollments},${c.completions},${c.completionRate}%\n`;
      });
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="analytics-${section}-${Date.now()}.csv"`);
    res.status(StatusCodes.OK).send(csvContent);
  };
}
