import { Request, Response } from 'express';
import { CourseService } from '../services/course.service';
import { courseImportService } from '../services/course-import.service';
import { ResponseHelper } from '../errors/response.helper';
import { BadRequestError } from '../errors/app-error';

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
        const reason = req.body?.reason || req.body?.rejectionReason || '';
        const course = await this.courseService.rejectCourse(req.params.id, reason, userCtx);
        return ResponseHelper.success({
            res,
            message: 'Course rejected and returned to trainer for revision',
            data: course,
        });
    };

    public publishCourse = async (req: Request, res: Response): Promise<Response> => {
        const userCtx = req.user as any;
        const course = await this.courseService.publishCourse(req.params.id, userCtx);
        return ResponseHelper.success({
            res,
            message: 'Course published successfully and made available to trainees',
            data: course,
        });
    };

    public unpublishCourse = async (req: Request, res: Response): Promise<Response> => {
        const userCtx = req.user as any;
        const course = await this.courseService.unpublishCourse(req.params.id, userCtx);
        return ResponseHelper.success({
            res,
            message: 'Course unpublished from trainee catalog',
            data: course,
        });
    };

    public getAdminStats = async (req: Request, res: Response): Promise<Response> => {
        const userCtx = req.user as any;
        const stats = await this.courseService.getAdminStats(userCtx);
        return ResponseHelper.success({
            res,
            message: 'Admin course statistics retrieved',
            data: stats,
        });
    };

    public getCourseForReview = async (req: Request, res: Response): Promise<Response> => {
        const userCtx = req.user as any;
        const reviewData = await this.courseService.getCourseForReview(req.params.id, userCtx);
        return ResponseHelper.success({
            res,
            message: 'Course review payload retrieved',
            data: reviewData,
        });
    };

    public setUnderReview = async (req: Request, res: Response): Promise<Response> => {
        const userCtx = req.user as any;
        const course = await this.courseService.setUnderReview(req.params.id, userCtx);
        return ResponseHelper.success({
            res,
            message: 'Course marked as under review',
            data: course,
        });
    };

    public duplicateCourse = async (req: Request, res: Response): Promise<Response> => {
        const userCtx = req.user as any;
        const course = await this.courseService.duplicateCourse(req.params.id, userCtx);
        return ResponseHelper.created(res, course, 'Course duplicated successfully');
    };

    public deleteCourse = async (req: Request, res: Response): Promise<Response> => {
        const userCtx = req.user as any;
        const result = await this.courseService.deleteCourse(req.params.id, userCtx);
        return ResponseHelper.success({
            res,
            message: result.message,
            data: result,
        });
    };

    public validateCourse = async (req: Request, res: Response): Promise<Response> => {
        const userCtx = req.user as any;
        const validation = await this.courseService.validateCourse(req.params.id, userCtx);
        return ResponseHelper.success({
            res,
            message: 'Course validation completed',
            data: validation,
        });
    };

    public saveDraft = async (req: Request, res: Response): Promise<Response> => {
        const userCtx = req.user as any;
        const course = await this.courseService.saveDraft(req.params.id, req.body, userCtx);
        return ResponseHelper.success({
            res,
            message: 'Course draft saved successfully',
            data: course,
        });
    };

    public getTopicsAndCompetencies = async (req: Request, res: Response): Promise<Response> => {
        const userCtx = req.user as any;
        const data = await this.courseService.getTopicsAndCompetencies(req.params.id, userCtx);
        return ResponseHelper.success({
            res,
            message: 'Course topics and competencies retrieved',
            data,
        });
    };

    public updateTopicsAndCompetencies = async (req: Request, res: Response): Promise<Response> => {
        const userCtx = req.user as any;
        const data = await this.courseService.updateTopicsAndCompetencies(req.params.id, req.body, userCtx);
        return ResponseHelper.success({
            res,
            message: 'Course topics and competencies updated',
            data,
        });
    };

    public importCourse = async (req: Request, res: Response): Promise<Response> => {
        const userCtx = req.user as any;
        const file = req.file;
        if (!file) {
            throw new BadRequestError('No document file uploaded');
        }

        const job = await courseImportService.createJob(file, userCtx.userId);
        return ResponseHelper.created(res, job, 'Course document uploaded and ingestion job started');
    };

    public getImportStatus = async (req: Request, res: Response): Promise<Response> => {
        const userCtx = req.user as any;
        const status = await courseImportService.getJobStatus(req.params.jobId, userCtx.userId);
        return ResponseHelper.success({
            res,
            message: 'Import job status retrieved',
            data: status,
        });
    };

    public getImportPreview = async (req: Request, res: Response): Promise<Response> => {
        const userCtx = req.user as any;
        const preview = await courseImportService.getJobPreview(req.params.jobId, userCtx.userId);
        return ResponseHelper.success({
            res,
            message: 'Import job preview retrieved',
            data: preview,
        });
    };

    public approveImport = async (req: Request, res: Response): Promise<Response> => {
        const userCtx = req.user as any;
        const course = await courseImportService.approveJob(req.params.jobId, userCtx, req.body.customEdits);
        return ResponseHelper.created(res, course, 'Course imported and committed to database successfully');
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
