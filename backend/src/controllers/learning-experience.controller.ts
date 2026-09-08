import { Request, Response } from 'express';
import { LearningExperienceService } from '../services/learning-experience.service';
import { ResponseHelper } from '../errors/response.helper';

export class LearningExperienceController {
  private service: LearningExperienceService;

  constructor(service: LearningExperienceService = new LearningExperienceService()) {
    this.service = service;
  }

  /**
   * GET /api/v1/learning/courses/:courseId
   */
  public getCourseLearningOverview = async (req: Request, res: Response): Promise<Response> => {
    const { courseId } = req.params;
    const userId = req.user!.userId;
    const overview = await this.service.getCourseLearningOverview(userId, courseId);
    return ResponseHelper.success({
      res,
      message: 'Course learning overview retrieved successfully',
      data: overview,
    });
  };

  /**
   * GET /api/v1/learning/lessons/:lessonId
   */
  public getLessonDetails = async (req: Request, res: Response): Promise<Response> => {
    const { lessonId } = req.params;
    const userId = req.user!.userId;
    const details = await this.service.getLessonDetails(userId, lessonId);
    return ResponseHelper.success({
      res,
      message: 'Lesson details retrieved successfully',
      data: details,
    });
  };

  /**
   * POST /api/v1/learning/lessons/:lessonId/complete
   */
  public completeLesson = async (req: Request, res: Response): Promise<Response> => {
    const { lessonId } = req.params;
    const userId = req.user!.userId;
    const result = await this.service.completeLesson(userId, lessonId);
    return ResponseHelper.success({
      res,
      message: 'Lesson marked as complete',
      data: result,
    });
  };

  /**
   * GET /api/v1/learning/courses/:courseId/progress
   */
  public getCourseProgress = async (req: Request, res: Response): Promise<Response> => {
    const { courseId } = req.params;
    const userId = req.user!.userId;
    const progress = await this.service.getCourseProgress(userId, courseId);
    return ResponseHelper.success({
      res,
      message: 'Course progress retrieved successfully',
      data: progress,
    });
  };
}
