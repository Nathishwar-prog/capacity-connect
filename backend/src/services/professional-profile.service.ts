import { ProfessionalProfileRepository } from '../repositories/professional-profile.repository';
import { NotFoundError } from '../errors/app-error';
import {
  FullProfessionalProfileDto,
  BasicInfoResponseDto,
  QualificationDto,
  WorkExperienceDto,
  SkillDto,
  CertificateDto,
} from '../dto/professional-profile.dto';

export class ProfessionalProfileService {
  private repository: ProfessionalProfileRepository;

  constructor(repository: ProfessionalProfileRepository = new ProfessionalProfileRepository()) {
    this.repository = repository;
  }

  public async getFullProfile(userId: string): Promise<FullProfessionalProfileDto> {
    const user = await this.repository.findFullProfile(userId);
    if (!user) {
      throw new NotFoundError('Trainee user not found');
    }

    const completion = this.calculateCompletion(user);

    const basicInfo: BasicInfoResponseDto = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      role: user.role,
      departmentId: user.departmentId,
      departmentName: user.department?.name || null,
      organizationName: user.organization?.name || 'India Meteorological Department',
      designation: user.traineeProfile?.designation || null,
      bio: user.traineeProfile?.bio || null,
      age: 28, // MoES demographic standard fallback
      location: 'New Delhi, India',
      moesEmployeeId: 'MoES-TR-2026-089',
      imdEmployeeId: 'IMD-FC-4492',
      profileCompletion: completion,
    };

    const qualifications: QualificationDto[] = user.qualifications.map((q) => ({
      id: q.id,
      degree: q.degree,
      fieldOfStudy: q.fieldOfStudy,
      institution: q.institution,
      startDate: q.startDate ? q.startDate.toISOString() : null,
      endDate: q.endDate ? q.endDate.toISOString() : null,
      description: q.description,
    }));

    const experiences: WorkExperienceDto[] = user.workExperiences.map((w) => ({
      id: w.id,
      companyName: w.companyName,
      jobTitle: w.jobTitle,
      description: w.description,
      startDate: w.startDate.toISOString(),
      endDate: w.endDate ? w.endDate.toISOString() : null,
      isCurrent: w.isCurrent,
    }));

    const skills: SkillDto[] = user.userSkills.map((us) => ({
      id: us.skill.id,
      name: us.skill.name,
      code: us.skill.code,
      category: us.skill.category,
      proficiencyLevel: us.proficiencyLevel,
    }));

    const certificates: CertificateDto[] = user.certificates.map((c) => ({
      id: c.id,
      title: c.title,
      issuingOrganization: c.issuingOrganization,
      credentialId: c.credentialId,
      issueDate: c.issueDate.toISOString(),
      expiryDate: c.expiryDate ? c.expiryDate.toISOString() : null,
      certificateUrl: c.certificateUrl,
      verificationStatus: c.verificationStatus,
    }));

    return {
      basicInfo,
      qualifications,
      experiences,
      skills,
      interests: user.traineeProfile?.interests || [],
      certificates,
    };
  }

  public async updateBasicInfo(userId: string, data: any): Promise<BasicInfoResponseDto> {
    const full = await this.getFullProfile(userId);
    const updated = await this.repository.updateBasicInfo(
      userId,
      {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        avatarUrl: data.avatarUrl,
      },
      {
        designation: data.designation,
        bio: data.bio,
      },
    );

    return {
      ...full.basicInfo,
      firstName: updated.user.firstName,
      lastName: updated.user.lastName,
      phone: updated.user.phone,
      avatarUrl: updated.user.avatarUrl,
      designation: updated.profile.designation,
      bio: updated.profile.bio,
      age: data.age ?? full.basicInfo.age,
      location: data.location ?? full.basicInfo.location,
      moesEmployeeId: data.moesEmployeeId ?? full.basicInfo.moesEmployeeId,
      imdEmployeeId: data.imdEmployeeId ?? full.basicInfo.imdEmployeeId,
    };
  }

  public async addQualification(userId: string, data: any): Promise<QualificationDto> {
    const q = await this.repository.addQualification(userId, {
      degree: data.degree,
      fieldOfStudy: data.fieldOfStudy,
      institution: data.institution,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      description: data.description,
    });

    return {
      id: q.id,
      degree: q.degree,
      fieldOfStudy: q.fieldOfStudy,
      institution: q.institution,
      startDate: q.startDate ? q.startDate.toISOString() : null,
      endDate: q.endDate ? q.endDate.toISOString() : null,
      description: q.description,
    };
  }

  public async updateQualification(
    userId: string,
    qualificationId: string,
    data: any,
  ): Promise<QualificationDto> {
    const q = await this.repository.updateQualification(userId, qualificationId, {
      degree: data.degree,
      fieldOfStudy: data.fieldOfStudy,
      institution: data.institution,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      description: data.description,
    });

    return {
      id: q.id,
      degree: q.degree,
      fieldOfStudy: q.fieldOfStudy,
      institution: q.institution,
      startDate: q.startDate ? q.startDate.toISOString() : null,
      endDate: q.endDate ? q.endDate.toISOString() : null,
      description: q.description,
    };
  }

  public async deleteQualification(userId: string, qualificationId: string): Promise<void> {
    await this.repository.deleteQualification(userId, qualificationId);
  }

  public async addWorkExperience(userId: string, data: any): Promise<WorkExperienceDto> {
    const w = await this.repository.addWorkExperience(userId, {
      companyName: data.companyName,
      jobTitle: data.jobTitle,
      description: data.description,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
      isCurrent: !!data.isCurrent,
    });

    return {
      id: w.id,
      companyName: w.companyName,
      jobTitle: w.jobTitle,
      description: w.description,
      startDate: w.startDate.toISOString(),
      endDate: w.endDate ? w.endDate.toISOString() : null,
      isCurrent: w.isCurrent,
    };
  }

  public async updateWorkExperience(
    userId: string,
    experienceId: string,
    data: any,
  ): Promise<WorkExperienceDto> {
    const w = await this.repository.updateWorkExperience(userId, experienceId, {
      companyName: data.companyName,
      jobTitle: data.jobTitle,
      description: data.description,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : null,
      isCurrent: data.isCurrent,
    });

    return {
      id: w.id,
      companyName: w.companyName,
      jobTitle: w.jobTitle,
      description: w.description,
      startDate: w.startDate.toISOString(),
      endDate: w.endDate ? w.endDate.toISOString() : null,
      isCurrent: w.isCurrent,
    };
  }

  public async deleteWorkExperience(userId: string, experienceId: string): Promise<void> {
    await this.repository.deleteWorkExperience(userId, experienceId);
  }

  public async syncSkills(userId: string, skillNames: string[]): Promise<SkillDto[]> {
    const userSkills = await this.repository.syncSkills(userId, skillNames);
    return userSkills.map((us) => ({
      id: us.skill.id,
      name: us.skill.name,
      code: us.skill.code,
      category: us.skill.category,
      proficiencyLevel: us.proficiencyLevel,
    }));
  }

  public async updateInterests(userId: string, interests: string[]): Promise<string[]> {
    const profile = await this.repository.updateInterests(userId, interests);
    return profile.interests;
  }

  public async getCertificates(userId: string): Promise<CertificateDto[]> {
    const certs = await this.repository.findCertificates(userId);
    return certs.map((c) => ({
      id: c.id,
      title: c.title,
      issuingOrganization: c.issuingOrganization,
      credentialId: c.credentialId,
      issueDate: c.issueDate.toISOString(),
      expiryDate: c.expiryDate ? c.expiryDate.toISOString() : null,
      certificateUrl: c.certificateUrl,
      verificationStatus: c.verificationStatus,
    }));
  }

  private calculateCompletion(user: any): number {
    let score = 0;
    if (user.firstName && user.email) score += 15;
    if (user.phone) score += 5;
    if (user.traineeProfile?.designation) score += 5;
    if (user.qualifications && user.qualifications.length > 0) score += 20;
    if (user.workExperiences && user.workExperiences.length > 0) score += 20;
    if (user.userSkills && user.userSkills.length > 0) score += 15;
    if (user.traineeProfile?.interests && user.traineeProfile.interests.length > 0) score += 10;
    if (user.certificates && user.certificates.length > 0) score += 10;
    return Math.min(100, score);
  }
}
