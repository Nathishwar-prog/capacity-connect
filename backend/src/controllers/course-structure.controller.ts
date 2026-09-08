import { Request, Response } from 'express';
import { CourseStructureService } from '../services/course-structure.service';
import { ResponseHelper } from '../errors/response.helper';

export class CourseStructureController {
    constructor(private courseStructureService: CourseStructureService) { }

    // ── Modules ────────────────────────────────────────────────────────────────

    public createModule = async (req: Request, res: Response): Promise<Response> => {
        const userCtx = req.user as any;
        const { courseId } = req.params;
        const module = await this.courseStructureService.createModule(courseId, req.body, userCtx);
        return ResponseHelper.created(res, module, 'Module created successfully');
    };

    public listModules = async (req: Request, res: Response): Promise<Response> => {
        const userCtx = req.user as any;
        const { courseId } = req.params;
        const modules = await this.courseStructureService.listModules(courseId, userCtx);
        return ResponseHelper.success({
            res,
            message: 'Modules retrieved successfully',
            data: modules,
        });
    };

    public getModule = async (req: Request, res: Response): Promise<Response> => {
        const userCtx = req.user as any;
        const { courseId, moduleId } = req.params;
        const module = await this.courseStructureService.getModule(courseId, moduleId, userCtx);
        return ResponseHelper.success({
            res,
            message: 'Module retrieved successfully',
            data: module,
        });
    };

    public updateModule = async (req: Request, res: Response): Promise<Response> => {
        const userCtx = req.user as any;
        const { courseId, moduleId } = req.params;
        const module = await this.courseStructureService.updateModule(courseId, moduleId, req.body, userCtx);
        return ResponseHelper.success({
            res,
            message: 'Module updated successfully',
            data: module,
        });
    };

    public deleteModule = async (req: Request, res: Response): Promise<Response> => {
        const userCtx = req.user as any;
        const { courseId, moduleId } = req.params;
        const deleted = await this.courseStructureService.deleteModule(courseId, moduleId, userCtx);
        return ResponseHelper.success({
            res,
            message: 'Module deleted successfully',
            data: deleted,
        });
    };

    public reorderModules = async (req: Request, res: Response): Promise<Response> => {
        const userCtx = req.user as any;
        const { courseId } = req.params;
        const modules = await this.courseStructureService.reorderModules(courseId, req.body, userCtx);
        return ResponseHelper.success({
            res,
            message: 'Modules reordered successfully',
            data: modules,
        });
    };

    // ── Lessons ────────────────────────────────────────────────────────────────

    public createLesson = async (req: Request, res: Response): Promise<Response> => {
        const userCtx = req.user as any;
        const { courseId, moduleId } = req.params;
        const lesson = await this.courseStructureService.createLesson(courseId, moduleId, req.body, userCtx);
        return ResponseHelper.created(res, lesson, 'Lesson created successfully');
    };

    public listLessons = async (req: Request, res: Response): Promise<Response> => {
        const userCtx = req.user as any;
        const { courseId, moduleId } = req.params;
        const lessons = await this.courseStructureService.listLessons(courseId, moduleId, userCtx);
        return ResponseHelper.success({
            res,
            message: 'Lessons retrieved successfully',
            data: lessons,
        });
    };

    public getLesson = async (req: Request, res: Response): Promise<Response> => {
        const userCtx = req.user as any;
        const { courseId, moduleId, lessonId } = req.params;
        const lesson = await this.courseStructureService.getLesson(courseId, moduleId, lessonId, userCtx);
        return ResponseHelper.success({
            res,
            message: 'Lesson retrieved successfully',
            data: lesson,
        });
    };

    public updateLesson = async (req: Request, res: Response): Promise<Response> => {
        const userCtx = req.user as any;
        const { courseId, moduleId, lessonId } = req.params;
        const lesson = await this.courseStructureService.updateLesson(courseId, moduleId, lessonId, req.body, userCtx);
        return ResponseHelper.success({
            res,
            message: 'Lesson updated successfully',
            data: lesson,
        });
    };

    public deleteLesson = async (req: Request, res: Response): Promise<Response> => {
        const userCtx = req.user as any;
        const { courseId, moduleId, lessonId } = req.params;
        const deleted = await this.courseStructureService.deleteLesson(courseId, moduleId, lessonId, userCtx);
        return ResponseHelper.success({
            res,
            message: 'Lesson deleted successfully',
            data: deleted,
        });
    };

    public reorderLessons = async (req: Request, res: Response): Promise<Response> => {
        const userCtx = req.user as any;
        const { courseId, moduleId } = req.params;
        const lessons = await this.courseStructureService.reorderLessons(courseId, moduleId, req.body, userCtx);
        return ResponseHelper.success({
            res,
            message: 'Lessons reordered successfully',
            data: lessons,
        });
    };

    // ── Full Structure ─────────────────────────────────────────────────────────

    public getCourseStructure = async (req: Request, res: Response): Promise<Response> => {
        const userCtx = req.user as any;
        const { courseId } = req.params;
        const structure = await this.courseStructureService.getCourseStructure(courseId, userCtx);
        return ResponseHelper.success({
            res,
            message: 'Course structure retrieved successfully',
            data: structure,
        });
    };

    // ── Resource Association ───────────────────────────────────────────────────

    public attachResource = async (req: Request, res: Response): Promise<Response> => {
        const userCtx = req.user as any;
        const { courseId, moduleId, lessonId } = req.params;
        const { resourceId } = req.body;
        const attached = await this.courseStructureService.attachResource(courseId, moduleId, lessonId, resourceId, userCtx);
        return ResponseHelper.created(res, attached, 'Resource attached to lesson successfully');
    };

    public detachResource = async (req: Request, res: Response): Promise<Response> => {
        const userCtx = req.user as any;
        const { courseId, moduleId, lessonId, resourceId } = req.params;
        await this.courseStructureService.detachResource(courseId, moduleId, lessonId, resourceId, userCtx);
        return ResponseHelper.success({
            res,
            message: 'Resource detached from lesson successfully',
            data: null,
        });
    };
}

export default CourseStructureController;
