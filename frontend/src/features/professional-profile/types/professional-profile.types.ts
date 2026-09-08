export type CertificateStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';

export interface BasicInformation {
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

export interface Qualification {
  id: string;
  degree: string;
  fieldOfStudy: string;
  institution: string;
  startDate: string | null;
  endDate: string | null;
  description: string | null;
}

export interface WorkExperience {
  id: string;
  companyName: string;
  jobTitle: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
}

export interface ProfessionalSkill {
  id: string;
  name: string;
  code: string;
  category: string | null;
  proficiencyLevel: number;
}

export interface TraineeCertificate {
  id: string;
  title: string;
  issuingOrganization: string;
  credentialId: string | null;
  issueDate: string;
  expiryDate: string | null;
  certificateUrl: string | null;
  verificationStatus: CertificateStatus;
}

export interface FullProfessionalProfile {
  basicInfo: BasicInformation;
  qualifications: Qualification[];
  experiences: WorkExperience[];
  skills: ProfessionalSkill[];
  interests: string[];
  certificates: TraineeCertificate[];
}

export interface UpdateBasicInfoInput {
  firstName: string;
  lastName?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  designation?: string | null;
  bio?: string | null;
  age?: number | null;
  location?: string | null;
  moesEmployeeId?: string | null;
  imdEmployeeId?: string | null;
}

export interface QualificationInput {
  degree: string;
  fieldOfStudy: string;
  institution: string;
  startDate?: string | null;
  endDate?: string | null;
  description?: string | null;
}

export interface ExperienceInput {
  companyName: string;
  jobTitle: string;
  description?: string | null;
  startDate: string;
  endDate?: string | null;
  isCurrent: boolean;
}
