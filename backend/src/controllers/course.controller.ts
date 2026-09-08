import { Request, Response } from 'express';
import { CourseService } from '../services/course.service';
import { ResponseHelper } from '../errors/response.helper';

export class CourseController {
    private courseService: CourseService;

    constructor(courseService: CourseService) {
        this.courseService = courseService;
    }

    public createCourse = async (req: Request, res: Response): Promise<Response> => {
        const userCtx = req.user as any;
        const course = await this.courseService.createCourse(req.body, userCtx);
        return ResponseHelper.created(res, course, 'Course created successfully');
    };

    public getCourse = async (req: Request, res: Response): Promise<Response> => {
        const userCtx = req.user as any;
        const course = await this.courseService.getCourseById(req.params.id, userCtx);
        return ResponseHelper.success({
            res,
            message: 'Course retrieved successfully',
            data: course,
        });
    };

    public listCourses = async (req: Request, res: Response): Promise<Response> => {
        const userCtx = req.user as any;
        const params = req.query as any;

        const limit = parseInt(params.take as string) || 20;
        const offset = parseInt(params.skip as string) || 0;

        const result = await this.courseService.listCourses({ ...params, take: limit, skip: offset }, userCtx);
        return ResponseHelper.success({
            res,
            message: 'Courses retrieved successfully',
            data: result.courses,
            meta: {
                total: result.total,
                skip: offset,
                take: limit,
            }
        });
    };

    public updateCourse = async (req: Request, res: Response): Promise<Response> => {
        const userCtx = req.user as any;
        const course = await this.courseService.updateCourse(req.params.id, req.body, userCtx);
        return ResponseHelper.success({
            res,
            message: 'Course updated successfully',
            data: course,
        });
    };

    public submitCourse = async (req: Request, res: Response): Promise<Response> => {
        const userCtx = req.user as any;
        const course = await this.courseService.submitCourse(req.params.id, userCtx);
        return ResponseHelper.success({
            res,
            message: 'Course submitted for approval',
            data: course,
        });
    };

    public approveCourse = async (req: Request, res: Response): Promise<Response> => {
        const userCtx = req.user as any;
        const course = await this.courseService.approveCourse(req.params.id, userCtx);
        return ResponseHelper.success({
            res,
            message: 'Course approved',
            data: course,
        });
    };

    public rejectCourse = async (req: Request, res: Response): Promise<Response> => {
        const userCtx = req.user as any;
        const course = await this.courseService.rejectCourse(req.params.id, userCtx);
        return ResponseHelper.success({
            res,
            message: 'Course rejected',
            data: course,
        });
    };

    public publishCourse = async (req: Request, res: Response): Promise<Response> => {
        const userCtx = req.user as any;
        const course = await this.courseService.publishCourse(req.params.id, userCtx);
        return ResponseHelper.success({
            res,
            message: 'Course published',
            data: course,
        });
    };

    public archiveCourse = async (req: Request, res: Response): Promise<Response> => {
        const userCtx = req.user as any;
        const course = await this.courseService.archiveCourse(req.params.id, userCtx);
        return ResponseHelper.success({
            res,
            message: 'Course archived',
            data: course,
        });
    };
}

export default CourseController;
