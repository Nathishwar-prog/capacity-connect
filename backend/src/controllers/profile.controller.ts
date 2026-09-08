import { Request, Response } from 'express';
import { ProfileService } from '../services/profile.service';
import { ResponseHelper } from '../errors/response.helper';

export class ProfileController {
  private profileService: ProfileService;

  constructor(profileService?: ProfileService) {
    this.profileService = profileService || new ProfileService();
  }

  // ==============================================================================
  // TRAINEE PROFILE
  // ==============================================================================

  public getTraineeProfile = async (req: Request, res: Response): Promise<Response> => {
    const userId = req.user!.userId;
    const data = await this.profileService.getTraineeProfile(userId);
    return ResponseHelper.success({
      res,
      message: 'Trainee profile retrieved successfully',
      data,
    });
  };

  public updateTraineeProfile = async (req: Request, res: Response): Promise<Response> => {
    const userId = req.user!.userId;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] as string | undefined;

    const data = await this.profileService.updateTraineeProfile(userId, req.body, {
      ipAddress,
      userAgent,
    });

    return ResponseHelper.success({
      res,
      message: 'Trainee profile updated successfully',
      data,
    });
  };

  // ==============================================================================
  // QUALIFICATIONS
  // ==============================================================================

  public getQualifications = async (req: Request, res: Response): Promise<Response> => {
    const userId = req.user!.userId;
    const data = await this.profileService.getQualifications(userId);
    return ResponseHelper.success({
      res,
      message: 'Qualifications retrieved successfully',
      data,
    });
  };

  public addQualification = async (req: Request, res: Response): Promise<Response> => {
    const userId = req.user!.userId;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] as string | undefined;

    const data = await this.profileService.addQualification(userId, req.body, {
      ipAddress,
      userAgent,
    });

    return ResponseHelper.success({
      res,
      statusCode: 201,
      message: 'Qualification added successfully',
      data,
    });
  };

  public updateQualification = async (req: Request, res: Response): Promise<Response> => {
    const userId = req.user!.userId;
    const id = req.params.id;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] as string | undefined;

    const data = await this.profileService.updateQualification(id, userId, req.body, {
      ipAddress,
      userAgent,
    });

    return ResponseHelper.success({
      res,
      message: 'Qualification updated successfully',
      data,
    });
  };

  public deleteQualification = async (req: Request, res: Response): Promise<Response> => {
    const userId = req.user!.userId;
    const id = req.params.id;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] as string | undefined;

    await this.profileService.deleteQualification(id, userId, { ipAddress, userAgent });

    return ResponseHelper.success({
      res,
      message: 'Qualification deleted successfully',
    });
  };

  // ==============================================================================
  // WORK EXPERIENCE
  // ==============================================================================

  public getWorkExperiences = async (req: Request, res: Response): Promise<Response> => {
    const userId = req.user!.userId;
    const data = await this.profileService.getWorkExperiences(userId);
    return ResponseHelper.success({
      res,
      message: 'Work experiences retrieved successfully',
      data,
    });
  };

  public addWorkExperience = async (req: Request, res: Response): Promise<Response> => {
    const userId = req.user!.userId;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] as string | undefined;

    const data = await this.profileService.addWorkExperience(userId, req.body, {
      ipAddress,
      userAgent,
    });

    return ResponseHelper.success({
      res,
      statusCode: 201,
      message: 'Work experience added successfully',
      data,
    });
  };

  public updateWorkExperience = async (req: Request, res: Response): Promise<Response> => {
    const userId = req.user!.userId;
    const id = req.params.id;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] as string | undefined;

    const data = await this.profileService.updateWorkExperience(id, userId, req.body, {
      ipAddress,
      userAgent,
    });

    return ResponseHelper.success({
      res,
      message: 'Work experience updated successfully',
      data,
    });
  };

  public deleteWorkExperience = async (req: Request, res: Response): Promise<Response> => {
    const userId = req.user!.userId;
    const id = req.params.id;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] as string | undefined;

    await this.profileService.deleteWorkExperience(id, userId, { ipAddress, userAgent });

    return ResponseHelper.success({
      res,
      message: 'Work experience deleted successfully',
    });
  };

  // ==============================================================================
  // USER SKILLS
  // ==============================================================================

  public getUserSkills = async (req: Request, res: Response): Promise<Response> => {
    const userId = req.user!.userId;
    const data = await this.profileService.getUserSkills(userId);
    return ResponseHelper.success({
      res,
      message: 'Skills retrieved successfully',
      data,
    });
  };

  public addUserSkill = async (req: Request, res: Response): Promise<Response> => {
    const userId = req.user!.userId;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] as string | undefined;

    const data = await this.profileService.addUserSkill(userId, req.body, {
      ipAddress,
      userAgent,
    });

    return ResponseHelper.success({
      res,
      statusCode: 201,
      message: 'Skill added to profile successfully',
      data,
    });
  };

  public removeUserSkill = async (req: Request, res: Response): Promise<Response> => {
    const userId = req.user!.userId;
    const skillId = req.params.skillId;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] as string | undefined;

    await this.profileService.removeUserSkill(userId, skillId, { ipAddress, userAgent });

    return ResponseHelper.success({
      res,
      message: 'Skill removed from profile successfully',
    });
  };

  public getAvailableSkills = async (req: Request, res: Response): Promise<Response> => {
    const query = {
      search: req.query.search as string | undefined,
      category: req.query.category as string | undefined,
      skip: req.query.skip ? parseInt(req.query.skip as string, 10) : 0,
      take: req.query.take ? parseInt(req.query.take as string, 10) : 50,
    };

    const data = await this.profileService.getAvailableSkills(query);
    return ResponseHelper.success({
      res,
      message: 'Available skills catalog retrieved successfully',
      data,
    });
  };

  // ==============================================================================
  // CERTIFICATES
  // ==============================================================================

  public getCertificates = async (req: Request, res: Response): Promise<Response> => {
    const userId = req.user!.userId;
    const data = await this.profileService.getCertificates(userId);
    return ResponseHelper.success({
      res,
      message: 'Certificates retrieved successfully',
      data,
    });
  };

  public addCertificate = async (req: Request, res: Response): Promise<Response> => {
    const userId = req.user!.userId;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] as string | undefined;

    const data = await this.profileService.addCertificate(userId, req.body, {
      ipAddress,
      userAgent,
    });

    return ResponseHelper.success({
      res,
      statusCode: 201,
      message: 'Certificate registered successfully',
      data,
    });
  };

  public deleteCertificate = async (req: Request, res: Response): Promise<Response> => {
    const userId = req.user!.userId;
    const id = req.params.id;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] as string | undefined;

    await this.profileService.deleteCertificate(id, userId, { ipAddress, userAgent });

    return ResponseHelper.success({
      res,
      message: 'Certificate deleted successfully',
    });
  };
}
