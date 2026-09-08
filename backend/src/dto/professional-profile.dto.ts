import { CertificateStatus } from '@prisma/client';

export interface BasicInfoResponseDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  role: string;
  departmentId: string | null;
  departmentName: string | null;
  organizationName: string | null;
  designation: string | null;
  bio: string | null;
  age: number | null;
  location: string | null;
  moesEmployeeId: string | null;
  imdEmployeeId: string | null;
  profileCompletion: number;
}

export interface QualificationDto {
  id: string;
  degree: string;
  fieldOfStudy: string;
  institution: string;
  startDate: string | null;
  endDate: string | null;
  description: string | null;
}

export interface WorkExperienceDto {
  id: string;
  companyName: string;
  jobTitle: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
}

export interface SkillDto {
  id: string;
  name: string;
  code: string;
  category: string | null;
  proficiencyLevel: number;
}

export interface CertificateDto {
  id: string;
  title: string;
  issuingOrganization: string;
  credentialId: string | null;
  issueDate: string;
  expiryDate: string | null;
  certificateUrl: string | null;
  verificationStatus: CertificateStatus;
}

export interface FullProfessionalProfileDto {
  basicInfo: BasicInfoResponseDto;
  qualifications: QualificationDto[];
  experiences: WorkExperienceDto[];
  skills: SkillDto[];
  interests: string[];
  certificates: CertificateDto[];
}
