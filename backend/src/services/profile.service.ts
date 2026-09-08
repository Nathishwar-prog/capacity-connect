import { ProfileRepository } from '../repositories/profile.repository';
import { NotFoundError, BadRequestError } from '../errors/app-error';
import {
  ProfileDtoMapper,
  TraineeProfileResponseDto,
  QualificationResponseDto,
  WorkExperienceResponseDto,
  UserSkillResponseDto,
  CertificateResponseDto,
  AvailableSkillDto,
} from '../dto/profile.dto';

export class ProfileService {
  private profileRepository: ProfileRepository;

  constructor(profileRepository?: ProfileRepository) {
    this.profileRepository = profileRepository || new ProfileRepository();
  }

  /**
   * Helper to calculate trainee profile completion percentage based on data density
   */
  private calculateProfileCompletion(user: {
    departmentId?: string | null;
    traineeProfile?: {
      designation?: string | null;
      bio?: string | null;
      interests?: string[];
    } | null;
    qualifications?: unknown[];
    userSkills?: unknown[];
  }): number {
    let score = 20; // Base registration completion

    if (user.departmentId) {
      score += 20;
    }

    if (user.traineeProfile?.designation && user.traineeProfile.designation.trim().length > 0) {
      score += 20;
    }

    if (user.qualifications && user.qualifications.length > 0) {
      score += 15;
    }

    if (user.userSkills && user.userSkills.length > 0) {
      score += 15;
    }

    const hasBio = Boolean(user.traineeProfile?.bio && user.traineeProfile.bio.trim().length > 0);
    const hasInterests = Boolean(
      user.traineeProfile?.interests && user.traineeProfile.interests.length > 0,
    );
    if (hasBio || hasInterests) {
      score += 10;
    }

    return Math.min(100, score);
  }

  // ==============================================================================
  // TRAINEE PROFILE
  // ==============================================================================

  public async getTraineeProfile(userId: string): Promise<TraineeProfileResponseDto> {
    const user = await this.profileRepository.getTraineeProfile(userId);
    if (!user) {
      throw new NotFoundError('Trainee profile not found');
    }

    // Refresh profile completion dynamically if needed
    const calculatedCompletion = this.calculateProfileCompletion(user);
    if (user.traineeProfile && user.traineeProfile.profileCompletion !== calculatedCompletion) {
      user.traineeProfile.profileCompletion = calculatedCompletion;
      // Persist without blocking response
      this.profileRepository
        .updateTraineeProfile(userId, { profileCompletion: calculatedCompletion })
        .catch(() => {});
    }

    return ProfileDtoMapper.toTraineeProfile(user);
  }

  public async updateTraineeProfile(
    userId: string,
    data: {
      firstName?: string;
      lastName?: string | null;
      phone?: string | null;
      avatarUrl?: string | null;
      departmentId?: string | null;
      designation?: string | null;
      bio?: string | null;
      interests?: string[];
    },
    meta?: { ipAddress?: string; userAgent?: string },
  ): Promise<TraineeProfileResponseDto> {
    const existing = await this.profileRepository.getTraineeProfile(userId);
    if (!existing) {
      throw new NotFoundError('Trainee profile not found');
    }

    // Predict completion score with updated values
    const mergedState = {
      departmentId: data.departmentId !== undefined ? data.departmentId : existing.departmentId,
      traineeProfile: {
        designation:
          data.designation !== undefined ? data.designation : existing.traineeProfile?.designation,
        bio: data.bio !== undefined ? data.bio : existing.traineeProfile?.bio,
        interests:
          data.interests !== undefined ? data.interests : existing.traineeProfile?.interests,
      },
      qualifications: existing.qualifications,
      userSkills: existing.userSkills,
    };
    const profileCompletion = this.calculateProfileCompletion(mergedState);

    const updated = await this.profileRepository.updateTraineeProfile(userId, {
      ...data,
      profileCompletion,
    });

    if (!updated) {
      throw new NotFoundError('Failed to update trainee profile');
    }

    await this.profileRepository.createAuditLog({
      organizationId: updated.organizationId,
      userId,
      action: 'TRAINEE_PROFILE_UPDATED',
      entityType: 'TraineeProfile',
      entityId: updated.traineeProfile?.id || null,
      oldValues: {
        firstName: existing.firstName,
        lastName: existing.lastName,
        designation: existing.traineeProfile?.designation,
      },
      newValues: {
        firstName: updated.firstName,
        lastName: updated.lastName,
        designation: updated.traineeProfile?.designation,
        profileCompletion,
      },
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    return ProfileDtoMapper.toTraineeProfile(updated);
  }

  // ==============================================================================
  // QUALIFICATIONS
  // ==============================================================================

  public async getQualifications(userId: string): Promise<QualificationResponseDto[]> {
    const list = await this.profileRepository.getQualifications(userId);
    return ProfileDtoMapper.toQualificationList(list);
  }

  public async addQualification(
    userId: string,
    data: {
      degree: string;
      fieldOfStudy: string;
      institution: string;
      startDate: string;
      endDate?: string | null;
      description?: string | null;
    },
    meta?: { ipAddress?: string; userAgent?: string },
  ): Promise<QualificationResponseDto> {
    const startDate = new Date(data.startDate);
    const endDate = data.endDate ? new Date(data.endDate) : null;

    if (endDate && endDate < startDate) {
      throw new BadRequestError('Qualification end date cannot be earlier than start date');
    }

    const created = await this.profileRepository.createQualification(userId, {
      degree: data.degree,
      fieldOfStudy: data.fieldOfStudy,
      institution: data.institution,
      startDate,
      endDate,
      description: data.description || null,
    });

    await this.profileRepository.createAuditLog({
      userId,
      action: 'QUALIFICATION_ADDED',
      entityType: 'Qualification',
      entityId: created.id,
      newValues: { degree: created.degree, institution: created.institution },
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    return ProfileDtoMapper.toQualification(created);
  }

  public async updateQualification(
    id: string,
    userId: string,
    data: {
      degree?: string;
      fieldOfStudy?: string;
      institution?: string;
      startDate?: string;
      endDate?: string | null;
      description?: string | null;
    },
    meta?: { ipAddress?: string; userAgent?: string },
  ): Promise<QualificationResponseDto> {
    const existing = await this.profileRepository.getQualificationById(id, userId);
    if (!existing) {
      throw new NotFoundError(`Qualification record '${id}' was not found or access denied`);
    }

    const startDate = data.startDate ? new Date(data.startDate) : existing.startDate || new Date();
    const endDate =
      data.endDate !== undefined
        ? data.endDate
          ? new Date(data.endDate)
          : null
        : existing.endDate;

    if (startDate && endDate && endDate < startDate) {
      throw new BadRequestError('Qualification end date cannot be earlier than start date');
    }

    const updated = await this.profileRepository.updateQualification(id, userId, {
      degree: data.degree,
      fieldOfStudy: data.fieldOfStudy,
      institution: data.institution,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate,
      description: data.description,
    });

    if (!updated) {
      throw new NotFoundError(`Qualification record '${id}' could not be updated`);
    }

    await this.profileRepository.createAuditLog({
      userId,
      action: 'QUALIFICATION_UPDATED',
      entityType: 'Qualification',
      entityId: id,
      newValues: data,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    return ProfileDtoMapper.toQualification(updated);
  }

  public async deleteQualification(
    id: string,
    userId: string,
    meta?: { ipAddress?: string; userAgent?: string },
  ): Promise<void> {
    const deleted = await this.profileRepository.deleteQualification(id, userId);
    if (!deleted) {
      throw new NotFoundError(`Qualification record '${id}' was not found or access denied`);
    }

    await this.profileRepository.createAuditLog({
      userId,
      action: 'QUALIFICATION_DELETED',
      entityType: 'Qualification',
      entityId: id,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });
  }

  // ==============================================================================
  // WORK EXPERIENCE
  // ==============================================================================

  public async getWorkExperiences(userId: string): Promise<WorkExperienceResponseDto[]> {
    const list = await this.profileRepository.getWorkExperiences(userId);
    return ProfileDtoMapper.toWorkExperienceList(list);
  }

  public async addWorkExperience(
    userId: string,
    data: {
      companyName: string;
      jobTitle: string;
      startDate: string;
      endDate?: string | null;
      isCurrent?: boolean;
      description?: string | null;
    },
    meta?: { ipAddress?: string; userAgent?: string },
  ): Promise<WorkExperienceResponseDto> {
    const startDate = new Date(data.startDate);
    const endDate = data.endDate ? new Date(data.endDate) : null;

    if (endDate && endDate < startDate) {
      throw new BadRequestError('Work experience end date cannot be earlier than start date');
    }

    const created = await this.profileRepository.createWorkExperience(userId, {
      companyName: data.companyName,
      jobTitle: data.jobTitle,
      startDate,
      endDate,
      isCurrent: data.isCurrent ?? false,
      description: data.description || null,
    });

    await this.profileRepository.createAuditLog({
      userId,
      action: 'WORK_EXPERIENCE_ADDED',
      entityType: 'WorkExperience',
      entityId: created.id,
      newValues: { companyName: created.companyName, jobTitle: created.jobTitle },
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    return ProfileDtoMapper.toWorkExperience(created);
  }

  public async updateWorkExperience(
    id: string,
    userId: string,
    data: {
      companyName?: string;
      jobTitle?: string;
      startDate?: string;
      endDate?: string | null;
      isCurrent?: boolean;
      description?: string | null;
    },
    meta?: { ipAddress?: string; userAgent?: string },
  ): Promise<WorkExperienceResponseDto> {
    const existing = await this.profileRepository.getWorkExperienceById(id, userId);
    if (!existing) {
      throw new NotFoundError(`Work experience record '${id}' was not found or access denied`);
    }

    const startDate = data.startDate ? new Date(data.startDate) : existing.startDate;
    const endDate =
      data.endDate !== undefined
        ? data.endDate
          ? new Date(data.endDate)
          : null
        : existing.endDate;

    if (startDate && endDate && endDate < startDate) {
      throw new BadRequestError('Work experience end date cannot be earlier than start date');
    }

    const updated = await this.profileRepository.updateWorkExperience(id, userId, {
      companyName: data.companyName,
      jobTitle: data.jobTitle,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate,
      isCurrent: data.isCurrent,
      description: data.description,
    });

    if (!updated) {
      throw new NotFoundError(`Work experience record '${id}' could not be updated`);
    }

    await this.profileRepository.createAuditLog({
      userId,
      action: 'WORK_EXPERIENCE_UPDATED',
      entityType: 'WorkExperience',
      entityId: id,
      newValues: data,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    return ProfileDtoMapper.toWorkExperience(updated);
  }

  public async deleteWorkExperience(
    id: string,
    userId: string,
    meta?: { ipAddress?: string; userAgent?: string },
  ): Promise<void> {
    const deleted = await this.profileRepository.deleteWorkExperience(id, userId);
    if (!deleted) {
      throw new NotFoundError(`Work experience record '${id}' was not found or access denied`);
    }

    await this.profileRepository.createAuditLog({
      userId,
      action: 'WORK_EXPERIENCE_DELETED',
      entityType: 'WorkExperience',
      entityId: id,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });
  }

  // ==============================================================================
  // USER SKILLS
  // ==============================================================================

  public async getUserSkills(userId: string): Promise<UserSkillResponseDto[]> {
    const list = await this.profileRepository.getUserSkills(userId);
    return ProfileDtoMapper.toUserSkillList(list);
  }

  public async addUserSkill(
    userId: string,
    data: {
      skillId?: string;
      skillName?: string;
      proficiencyLevel?: number;
      yearsExperience?: number | null;
    },
    meta?: { ipAddress?: string; userAgent?: string },
  ): Promise<UserSkillResponseDto> {
    let skillId = data.skillId;

    if (!skillId && data.skillName) {
      const skill = await this.profileRepository.findOrCreateSkill(data.skillName);
      skillId = skill.id;
    }

    if (!skillId) {
      throw new BadRequestError('Either skillId or skillName must be provided');
    }

    const userSkill = await this.profileRepository.addUserSkill(
      userId,
      skillId,
      data.proficiencyLevel || 1,
      data.yearsExperience,
    );

    await this.profileRepository.createAuditLog({
      userId,
      action: 'USER_SKILL_ADDED',
      entityType: 'UserSkill',
      entityId: userSkill.id,
      newValues: { skillId, proficiencyLevel: userSkill.proficiencyLevel },
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    return ProfileDtoMapper.toUserSkill(userSkill);
  }

  public async removeUserSkill(
    userId: string,
    skillId: string,
    meta?: { ipAddress?: string; userAgent?: string },
  ): Promise<void> {
    const removed = await this.profileRepository.removeUserSkill(userId, skillId);
    if (!removed) {
      throw new NotFoundError(`Skill '${skillId}' is not associated with this profile`);
    }

    await this.profileRepository.createAuditLog({
      userId,
      action: 'USER_SKILL_REMOVED',
      entityType: 'UserSkill',
      entityId: skillId,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });
  }

  public async getAvailableSkills(options: {
    search?: string;
    category?: string;
    skip?: number;
    take?: number;
  }): Promise<{ skills: AvailableSkillDto[]; total: number }> {
    const { skills, total } = await this.profileRepository.getAvailableSkills(options);
    return {
      skills: ProfileDtoMapper.toAvailableSkillList(skills),
      total,
    };
  }

  // ==============================================================================
  // CERTIFICATES
  // ==============================================================================

  public async getCertificates(userId: string): Promise<CertificateResponseDto[]> {
    const list = await this.profileRepository.getCertificates(userId);
    return ProfileDtoMapper.toCertificateList(list);
  }

  public async addCertificate(
    userId: string,
    data: {
      title: string;
      issuingOrganization: string;
      credentialId?: string | null;
      issueDate: string;
      expiryDate?: string | null;
      certificateUrl?: string | null;
    },
    meta?: { ipAddress?: string; userAgent?: string },
  ): Promise<CertificateResponseDto> {
    const issueDate = new Date(data.issueDate);
    const expiryDate = data.expiryDate ? new Date(data.expiryDate) : null;

    if (expiryDate && expiryDate < issueDate) {
      throw new BadRequestError('Certificate expiry date cannot be earlier than issue date');
    }

    const created = await this.profileRepository.createCertificate(userId, {
      title: data.title,
      issuingOrganization: data.issuingOrganization,
      credentialId: data.credentialId || null,
      issueDate,
      expiryDate,
      certificateUrl: data.certificateUrl || null,
    });

    await this.profileRepository.createAuditLog({
      userId,
      action: 'CERTIFICATE_ADDED',
      entityType: 'Certificate',
      entityId: created.id,
      newValues: { title: created.title, issuingOrganization: created.issuingOrganization },
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    return ProfileDtoMapper.toCertificate(created);
  }

  public async deleteCertificate(
    id: string,
    userId: string,
    meta?: { ipAddress?: string; userAgent?: string },
  ): Promise<void> {
    const deleted = await this.profileRepository.deleteCertificate(id, userId);
    if (!deleted) {
      throw new NotFoundError(`Certificate record '${id}' was not found or access denied`);
    }

    await this.profileRepository.createAuditLog({
      userId,
      action: 'CERTIFICATE_DELETED',
      entityType: 'Certificate',
      entityId: id,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });
  }
}
