import { CertificateStatus, SkillSource } from '@prisma/client';

export interface PersonalInfoDto {
  firstName: string;
  lastName: string | null;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  organizationId: string;
  organizationName: string | null;
  departmentId: string | null;
  departmentName: string | null;
}

export interface QualificationResponseDto {
  id: string;
  userId: string;
  degree: string;
  fieldOfStudy: string;
  institution: string;
  startDate: string | null;
  endDate: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkExperienceResponseDto {
  id: string;
  userId: string;
  companyName: string;
  jobTitle: string;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserSkillResponseDto {
  id: string;
  userId: string;
  skillId: string;
  name: string;
  code: string;
  category: string | null;
  proficiencyLevel: number;
  yearsExperience: number | null;
  source: SkillSource;
  createdAt: string;
  updatedAt: string;
}

export interface CertificateResponseDto {
  id: string;
  userId: string;
  title: string;
  issuingOrganization: string;
  credentialId: string | null;
  issueDate: string;
  expiryDate: string | null;
  certificateUrl: string | null;
  verificationStatus: CertificateStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TraineeProfileResponseDto {
  id: string;
  userId: string;
  personalInfo: PersonalInfoDto;
  designation: string | null;
  bio: string | null;
  interests: string[];
  profileCompletion: number;
  qualifications: QualificationResponseDto[];
  workExperiences: WorkExperienceResponseDto[];
  skills: UserSkillResponseDto[];
  certificates: CertificateResponseDto[];
  createdAt: string;
  updatedAt: string;
}

export interface TrainerExpertiseResponseDto {
  id: string;
  skillId: string;
  skillName: string;
  skillCode: string;
  category: string | null;
  proficiencyLevel: number;
  yearsExperience: number | null;
}

export interface TrainerProfileResponseDto {
  id: string;
  userId: string;
  personalInfo: PersonalInfoDto;
  designation: string;
  organizationName: string | null;
  bio: string;
  yearsExperience: number;
  expertise: TrainerExpertiseResponseDto[];
  qualifications: QualificationResponseDto[];
  workExperiences: WorkExperienceResponseDto[];
  skills: UserSkillResponseDto[];
  certificates: CertificateResponseDto[];
  stats?: {
    totalCourses: number;
    publishedCourses: number;
    learnersTrained: number;
    avgCompletionRate: number;
    avgAssessmentScore: number;
    competenciesCovered: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AvailableSkillDto {
  id: string;
  name: string;
  code: string;
  category: string | null;
  description: string | null;
}

import {
  Qualification,
  WorkExperience,
  UserSkill,
  Certificate,
  Skill,
  User,
  TraineeProfile,
} from '@prisma/client';

export type TraineeProfileWithRelations = User & {
  organization?: { id: string; name: string; code: string } | null;
  department?: { id: string; name: string; code: string } | null;
  traineeProfile?: TraineeProfile | null;
  qualifications?: Qualification[];
  workExperiences?: WorkExperience[];
  userSkills?: (UserSkill & { skill?: Skill | null })[];
  certificates?: Certificate[];
};

export class ProfileDtoMapper {
  public static toQualification(q: Qualification): QualificationResponseDto {
    return {
      id: q.id,
      userId: q.userId,
      degree: q.degree,
      fieldOfStudy: q.fieldOfStudy,
      institution: q.institution,
      startDate: q.startDate ? new Date(q.startDate).toISOString() : null,
      endDate: q.endDate ? new Date(q.endDate).toISOString() : null,
      description: q.description || null,
      createdAt: new Date(q.createdAt).toISOString(),
      updatedAt: new Date(q.updatedAt).toISOString(),
    };
  }

  public static toQualificationList(list: Qualification[]): QualificationResponseDto[] {
    return list.map((q) => this.toQualification(q));
  }

  public static toWorkExperience(exp: WorkExperience): WorkExperienceResponseDto {
    return {
      id: exp.id,
      userId: exp.userId,
      companyName: exp.companyName,
      jobTitle: exp.jobTitle,
      startDate: new Date(exp.startDate).toISOString(),
      endDate: exp.endDate ? new Date(exp.endDate).toISOString() : null,
      isCurrent: exp.isCurrent,
      description: exp.description || null,
      createdAt: new Date(exp.createdAt).toISOString(),
      updatedAt: new Date(exp.updatedAt).toISOString(),
    };
  }

  public static toWorkExperienceList(list: WorkExperience[]): WorkExperienceResponseDto[] {
    return list.map((e) => this.toWorkExperience(e));
  }

  public static toUserSkill(us: UserSkill & { skill?: Skill | null }): UserSkillResponseDto {
    return {
      id: us.id,
      userId: us.userId,
      skillId: us.skillId,
      name: us.skill?.name || '',
      code: us.skill?.code || '',
      category: us.skill?.category || null,
      proficiencyLevel: us.proficiencyLevel,
      yearsExperience: us.yearsExperience ?? null,
      source: us.source,
      createdAt: new Date(us.createdAt).toISOString(),
      updatedAt: new Date(us.updatedAt).toISOString(),
    };
  }

  public static toUserSkillList(
    list: (UserSkill & { skill?: Skill | null })[],
  ): UserSkillResponseDto[] {
    return list.map((s) => this.toUserSkill(s));
  }

  public static toCertificate(cert: Certificate): CertificateResponseDto {
    return {
      id: cert.id,
      userId: cert.userId,
      title: cert.title,
      issuingOrganization: cert.issuingOrganization,
      credentialId: cert.credentialId || null,
      issueDate: new Date(cert.issueDate).toISOString(),
      expiryDate: cert.expiryDate ? new Date(cert.expiryDate).toISOString() : null,
      certificateUrl: cert.certificateUrl || null,
      verificationStatus: cert.verificationStatus,
      createdAt: new Date(cert.createdAt).toISOString(),
      updatedAt: new Date(cert.updatedAt).toISOString(),
    };
  }

  public static toCertificateList(list: Certificate[]): CertificateResponseDto[] {
    return list.map((c) => this.toCertificate(c));
  }

  public static toTraineeProfile(user: TraineeProfileWithRelations): TraineeProfileResponseDto {
    const tp = user.traineeProfile || ({} as Partial<TraineeProfile>);
    return {
      id: tp.id || '',
      userId: user.id,
      personalInfo: {
        firstName: user.firstName,
        lastName: user.lastName || null,
        email: user.email,
        phone: user.phone || null,
        avatarUrl: user.avatarUrl || null,
        organizationId: user.organizationId,
        organizationName: user.organization?.name || null,
        departmentId: user.departmentId || null,
        departmentName: user.department?.name || null,
      },
      designation: tp.designation || null,
      bio: tp.bio || null,
      interests: tp.interests || [],
      profileCompletion: tp.profileCompletion || 0,
      qualifications: this.toQualificationList(user.qualifications || []),
      workExperiences: this.toWorkExperienceList(user.workExperiences || []),
      skills: this.toUserSkillList(user.userSkills || []),
      certificates: this.toCertificateList(user.certificates || []),
      createdAt: tp.createdAt ? new Date(tp.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: tp.updatedAt ? new Date(tp.updatedAt).toISOString() : new Date().toISOString(),
    };
  }

  public static toAvailableSkill(s: Skill): AvailableSkillDto {
    return {
      id: s.id,
      name: s.name,
      code: s.code,
      category: s.category || null,
      description: s.description || null,
    };
  }

  public static toAvailableSkillList(list: Skill[]): AvailableSkillDto[] {
    return list.map((s) => this.toAvailableSkill(s));
  }
}
