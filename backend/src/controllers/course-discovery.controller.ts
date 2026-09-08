import { Request, Response } from 'express';
import { CourseDiscoveryService } from '../services/course-discovery.service';
import { ResponseHelper } from '../errors/response.helper';
import { CourseQueryInput } from '../validators/course-discovery.validator';

export class CourseDiscoveryController {
  private service: CourseDiscoveryService;

  constructor(service: CourseDiscoveryService = new CourseDiscoveryService()) {
    this.service = service;
  }

  public getCourses = async (req: Request, res: Response): Promise<Response> => {
    const query = req.query as unknown as CourseQueryInput;
    const userId = req.user?.userId;
    const result = await this.service.getCourses(query, userId);
    return ResponseHelper.success({
      res,
      message: 'Courses retrieved successfully',
      data: result,
    });
  };

  public getCourseDetails = async (req: Request, res: Response): Promise<Response> => {
    const { courseId } = req.params;
    const userId = req.user?.userId;
    const details = await this.service.getCourseDetails(courseId, userId);
    return ResponseHelper.success({
      res,
      message: 'Course details retrieved successfully',
      data: details,
    });
  };

  public enrollCourse = async (req: Request, res: Response): Promise<Response> => {
    const { courseId } = req.params;
    const userId = req.user!.userId;
    const result = await this.service.enrollCourse(userId, courseId);
    return ResponseHelper.created(res, result, 'Enrolled in course successfully');
  };

  public getFiltersMetadata = async (_req: Request, res: Response): Promise<Response> => {
    const metadata = await this.service.getFilterMetadata();
    return ResponseHelper.success({
      res,
      message: 'Filters metadata retrieved successfully',
      data: metadata,
    });
  };
}
