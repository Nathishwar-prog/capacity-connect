import { Request, Response } from 'express';
import { ProfessionalProfileService } from '../services/professional-profile.service';
import { ResponseHelper } from '../errors/response.helper';

export class ProfessionalProfileController {
  private service: ProfessionalProfileService;

  constructor(service: ProfessionalProfileService = new ProfessionalProfileService()) {
    this.service = service;
  }

  public getProfile = async (req: Request, res: Response): Promise<Response> => {
    const userId = req.user!.userId;
    const profile = await this.service.getFullProfile(userId);
    return ResponseHelper.success({
      res,
      message: 'Professional profile retrieved successfully',
      data: profile,
    });
  };

  public updateBasicInfo = async (req: Request, res: Response): Promise<Response> => {
    const userId = req.user!.userId;
    const basicInfo = await this.service.updateBasicInfo(userId, req.body);
    return ResponseHelper.success({
      res,
      message: 'Basic information updated successfully',
      data: basicInfo,
    });
  };

  public addQualification = async (req: Request, res: Response): Promise<Response> => {
    const userId = req.user!.userId;
    const qualification = await this.service.addQualification(userId, req.body);
    return ResponseHelper.created(res, qualification, 'Qualification added successfully');
  };

  public updateQualification = async (req: Request, res: Response): Promise<Response> => {
    const userId = req.user!.userId;
    const qualificationId = req.params.id;
    const qualification = await this.service.updateQualification(userId, qualificationId, req.body);
    return ResponseHelper.success({
      res,
      message: 'Qualification updated successfully',
      data: qualification,
    });
  };

  public deleteQualification = async (req: Request, res: Response): Promise<Response> => {
    const userId = req.user!.userId;
    const qualificationId = req.params.id;
    await this.service.deleteQualification(userId, qualificationId);
    return ResponseHelper.success({
      res,
      message: 'Qualification deleted successfully',
    });
  };

  public addExperience = async (req: Request, res: Response): Promise<Response> => {
    const userId = req.user!.userId;
    const experience = await this.service.addWorkExperience(userId, req.body);
    return ResponseHelper.created(res, experience, 'Professional experience added successfully');
  };

  public updateExperience = async (req: Request, res: Response): Promise<Response> => {
    const userId = req.user!.userId;
    const experienceId = req.params.id;
    const experience = await this.service.updateWorkExperience(userId, experienceId, req.body);
    return ResponseHelper.success({
      res,
      message: 'Professional experience updated successfully',
      data: experience,
    });
  };

  public deleteExperience = async (req: Request, res: Response): Promise<Response> => {
    const userId = req.user!.userId;
    const experienceId = req.params.id;
    await this.service.deleteWorkExperience(userId, experienceId);
    return ResponseHelper.success({
      res,
      message: 'Professional experience deleted successfully',
    });
  };

  public updateSkills = async (req: Request, res: Response): Promise<Response> => {
    const userId = req.user!.userId;
    const skills = await this.service.syncSkills(userId, req.body.skills);
    return ResponseHelper.success({
      res,
      message: 'Professional skills updated successfully',
      data: skills,
    });
  };

  public updateInterests = async (req: Request, res: Response): Promise<Response> => {
    const userId = req.user!.userId;
    const interests = await this.service.updateInterests(userId, req.body.interests);
    return ResponseHelper.success({
      res,
      message: 'Professional interests updated successfully',
      data: interests,
    });
  };

  public getCertificates = async (req: Request, res: Response): Promise<Response> => {
    const userId = req.user!.userId;
    const certificates = await this.service.getCertificates(userId);
    return ResponseHelper.success({
      res,
      message: 'Certificates retrieved successfully',
      data: certificates,
    });
  };
}
