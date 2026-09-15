import { Request, Response } from 'express';
import { TrainerService } from '../services/trainer.service';
import { assessmentImportService } from '../services/assessment-import.service';
import { ResponseHelper } from '../errors/response.helper';

export class TrainerController {
  private trainerService: TrainerService;

  constructor() {
    this.trainerService = new TrainerService();
  }

  // Profile & Expertise
  public getProfile = async (req: Request, res: Response): Promise<Response> => {
    const data = await this.trainerService.getProfile(req.user!.userId);
    return ResponseHelper.success({ res, message: 'Trainer profile retrieved', data });
  };

  public updateProfile = async (req: Request, res: Response): Promise<Response> => {
    const data = await this.trainerService.updateProfile(req.user!.userId, req.body);
    return ResponseHelper.success({ res, message: 'Trainer profile updated successfully', data });
  };

  public addExpertise = async (req: Request, res: Response): Promise<Response> => {
    const data = await this.trainerService.addExpertise(req.user!.userId, req.body);
    return ResponseHelper.success({
      res,
      statusCode: 201,
      message: 'Expertise skill added successfully',
      data,
    });
  };

  public removeExpertise = async (req: Request, res: Response): Promise<Response> => {
    await this.trainerService.removeExpertise(req.user!.userId, req.params.skillId);
    return ResponseHelper.success({ res, message: 'Expertise skill removed successfully' });
  };

  // Dashboard
  public getDashboard = async (req: Request, res: Response): Promise<Response> => {
    const data = await this.trainerService.getDashboard(req.user!.userId);
    return ResponseHelper.success({ res, message: 'Trainer dashboard metrics retrieved', data });
  };

  // Courses
  public getCourses = async (req: Request, res: Response): Promise<Response> => {
    const data = await this.trainerService.getCourses(
      req.user!.userId,
      req.query as any,
      req.user!.role,
      req.user!.organizationId,
    );
    return ResponseHelper.success({ res, message: 'Trainer courses retrieved', data });
  };

  public getCourseById = async (req: Request, res: Response): Promise<Response> => {
    const data = await this.trainerService.getCourseById(
      req.params.courseId,
      req.user!.userId,
      req.user!.role,
    );
    return ResponseHelper.success({ res, message: 'Course details retrieved', data });
  };

  public createCourse = async (req: Request, res: Response): Promise<Response> => {
    const data = await this.trainerService.createCourse(req.user!.userId, req.body);
    return ResponseHelper.success({
      res,
      statusCode: 201,
      message: 'Course draft created successfully',
      data,
    });
  };

  public updateCourse = async (req: Request, res: Response): Promise<Response> => {
    const data = await this.trainerService.updateCourse(
      req.params.courseId,
      req.user!.userId,
      req.user!.role,
      req.body,
    );
    return ResponseHelper.success({ res, message: 'Course updated successfully', data });
  };

  public deleteCourse = async (req: Request, res: Response): Promise<Response> => {
    const data = await this.trainerService.deleteCourse(
      req.params.courseId,
      req.user!.userId,
      req.user!.role,
    );
    return ResponseHelper.success({ res, message: 'Course deleted successfully', data });
  };

  public submitCourseForApproval = async (req: Request, res: Response): Promise<Response> => {
    const data = await this.trainerService.submitCourseForApproval(
      req.params.courseId,
      req.user!.userId,
      req.user!.role,
    );
    return ResponseHelper.success({
      res,
      message: 'Course submitted for institutional approval successfully',
      data,
    });
  };

  public publishCourse = async (req: Request, res: Response): Promise<Response> => {
    const data = await this.trainerService.publishCourse(
      req.params.courseId,
      req.user!.userId,
      req.user!.role,
    );
    return ResponseHelper.success({
      res,
      message: 'Course published successfully and available to trainees',
      data,
    });
  };

  public unpublishCourse = async (req: Request, res: Response): Promise<Response> => {
    const data = await this.trainerService.unpublishCourse(
      req.params.courseId,
      req.user!.userId,
      req.user!.role,
    );
    return ResponseHelper.success({
      res,
      message: 'Course unpublished and reverted to draft status',
      data,
    });
  };

  public duplicateCourse = async (req: Request, res: Response): Promise<Response> => {
    const data = await this.trainerService.duplicateCourse(
      req.params.courseId,
      req.user!.userId,
      req.user!.role,
    );
    return ResponseHelper.success({
      res,
      statusCode: 201,
      message: 'Course duplicated successfully',
      data,
    });
  };

  public getCourseAnalytics = async (req: Request, res: Response): Promise<Response> => {
    const data = await this.trainerService.getCourseAnalytics(
      req.params.courseId,
      req.user!.userId,
      req.user!.role,
    );
    return ResponseHelper.success({
      res,
      message: 'Course analytics retrieved successfully',
      data,
    });
  };

  // Modules & Lessons
  public createModule = async (req: Request, res: Response): Promise<Response> => {
    const data = await this.trainerService.createModule(
      req.params.courseId,
      req.user!.userId,
      req.user!.role,
      req.body,
    );
    return ResponseHelper.success({
      res,
      statusCode: 201,
      message: 'Module created successfully',
      data,
    });
  };

  public updateModule = async (req: Request, res: Response): Promise<Response> => {
    const data = await this.trainerService.updateModule(
      req.params.courseId,
      req.params.moduleId,
      req.user!.userId,
      req.user!.role,
      req.body,
    );
    return ResponseHelper.success({ res, message: 'Module updated successfully', data });
  };

  public deleteModule = async (req: Request, res: Response): Promise<Response> => {
    await this.trainerService.deleteModule(
      req.params.courseId,
      req.params.moduleId,
      req.user!.userId,
      req.user!.role,
    );
    return ResponseHelper.success({ res, message: 'Module deleted successfully' });
  };

  public createLesson = async (req: Request, res: Response): Promise<Response> => {
    const data = await this.trainerService.createLesson(
      req.params.courseId,
      req.params.moduleId,
      req.user!.userId,
      req.user!.role,
      req.body,
    );
    return ResponseHelper.success({
      res,
      statusCode: 201,
      message: 'Lesson created successfully',
      data,
    });
  };

  public updateLesson = async (req: Request, res: Response): Promise<Response> => {
    const data = await this.trainerService.updateLesson(
      req.params.courseId,
      req.params.moduleId,
      req.params.lessonId,
      req.user!.userId,
      req.user!.role,
      req.body,
    );
    return ResponseHelper.success({ res, message: 'Lesson updated successfully', data });
  };

  public deleteLesson = async (req: Request, res: Response): Promise<Response> => {
    await this.trainerService.deleteLesson(
      req.params.courseId,
      req.params.moduleId,
      req.params.lessonId,
      req.user!.userId,
      req.user!.role,
    );
    return ResponseHelper.success({ res, message: 'Lesson deleted successfully' });
  };

  public reorderCourse = async (req: Request, res: Response): Promise<Response> => {
    await this.trainerService.reorderCourse(
      req.params.courseId,
      req.user!.userId,
      req.user!.role,
      req.body.modules,
    );
    return ResponseHelper.success({ res, message: 'Course structure reordered successfully' });
  };

  public mapCompetency = async (req: Request, res: Response): Promise<Response> => {
    const data = await this.trainerService.mapCompetency(
      req.params.courseId,
      req.user!.userId,
      req.user!.role,
      req.body.competencyId,
      req.body.targetLevel,
    );
    return ResponseHelper.success({ res, message: 'Competency mapped to course', data });
  };

  public unmapCompetency = async (req: Request, res: Response): Promise<Response> => {
    await this.trainerService.unmapCompetency(
      req.params.courseId,
      req.user!.userId,
      req.user!.role,
      req.params.competencyId,
    );
    return ResponseHelper.success({ res, message: 'Competency unmapped from course' });
  };

  public addPrerequisite = async (req: Request, res: Response): Promise<Response> => {
    const data = await this.trainerService.addPrerequisite(
      req.params.courseId,
      req.user!.userId,
      req.user!.role,
      req.body.prerequisiteCourseId,
    );
    return ResponseHelper.success({ res, message: 'Prerequisite added to course', data });
  };

  public removePrerequisite = async (req: Request, res: Response): Promise<Response> => {
    await this.trainerService.removePrerequisite(
      req.params.courseId,
      req.user!.userId,
      req.user!.role,
      req.params.prerequisiteCourseId,
    );
    return ResponseHelper.success({ res, message: 'Prerequisite removed from course' });
  };

  // Trainees
  public getTrainees = async (req: Request, res: Response): Promise<Response> => {
    const data = await this.trainerService.getTrainees(req.user!.userId, req.query as any);
    return ResponseHelper.success({ res, message: 'Trainees list retrieved', data });
  };

  public getTraineeDetail = async (req: Request, res: Response): Promise<Response> => {
    const data = await this.trainerService.getTraineeDetail(req.user!.userId, req.params.traineeId);
    return ResponseHelper.success({ res, message: 'Trainee details retrieved', data });
  };

  // Assessments
  public getAssessments = async (req: Request, res: Response): Promise<Response> => {
    const data = await this.trainerService.getAssessments(req.user!.userId);
    return ResponseHelper.success({ res, message: 'Assessments list retrieved', data });
  };

  public getAssessmentById = async (req: Request, res: Response): Promise<Response> => {
    const data = await this.trainerService.getAssessmentById(
      req.params.assessmentId,
      req.user!.userId,
      req.user!.role,
    );
    return ResponseHelper.success({ res, message: 'Assessment details retrieved', data });
  };

  public createAssessment = async (req: Request, res: Response): Promise<Response> => {
    const data = await this.trainerService.createAssessment(req.user!.userId, req.body);
    return ResponseHelper.success({
      res,
      statusCode: 201,
      message: 'Assessment created successfully',
      data,
    });
  };

  public getAssessmentAttempts = async (req: Request, res: Response): Promise<Response> => {
    const data = await this.trainerService.getAssessmentAttempts(
      req.params.assessmentId,
      req.user!.userId,
      req.user!.role,
    );
    return ResponseHelper.success({ res, message: 'Assessment attempts retrieved', data });
  };

  // Analytics & Feedback
  public getAnalytics = async (req: Request, res: Response): Promise<Response> => {
    const data = await this.trainerService.getAnalytics(req.user!.userId);
    return ResponseHelper.success({ res, message: 'Trainer analytics retrieved', data });
  };

  public getFeedback = async (req: Request, res: Response): Promise<Response> => {
    const data = await this.trainerService.getFeedback(req.user!.userId);
    return ResponseHelper.success({ res, message: 'Trainer feedback retrieved', data });
  };

  // Assessment JSON Import
  public getAssessmentImportTemplate = async (_req: Request, res: Response): Promise<Response> => {
    const template = assessmentImportService.getTemplateJson();
    return ResponseHelper.success({ res, message: 'Assessment JSON template retrieved', data: template });
  };

  public validateAssessmentImport = async (req: Request, res: Response): Promise<Response> => {
    const payload = req.body.payload || req.body;
    const mappingOverride = req.body.mappingOverride;
    const data = await assessmentImportService.validateAssessmentImport(
      req.user!.userId,
      req.user!.role as any,
      payload,
      mappingOverride,
      req.user!.organizationId,
    );
    return ResponseHelper.success({ res, message: 'Assessment validation complete', data });
  };

  public confirmAssessmentImport = async (req: Request, res: Response): Promise<Response> => {
    const fileMetadata = {
      fileName: req.body.fileName || 'assessment-import.json',
      fileSize: req.body.fileSize,
    };
    const payload = req.body.payload || req.body;
    const mappingOverride = req.body.mappingOverride;
    const data = await assessmentImportService.confirmAssessmentImport(
      req.user!.userId,
      req.user!.role as any,
      payload,
      fileMetadata,
      mappingOverride,
      req.user!.organizationId,
    );
    return ResponseHelper.success({
      res,
      statusCode: 201,
      message: data.message,
      data,
    });
  };
}

