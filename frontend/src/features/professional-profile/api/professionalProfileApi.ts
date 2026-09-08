import { apiClient } from '@/api/client';
import {
  FullProfessionalProfile,
  BasicInformation,
  Qualification,
  WorkExperience,
  ProfessionalSkill,
  TraineeCertificate,
  UpdateBasicInfoInput,
  QualificationInput,
  ExperienceInput,
} from '../types/professional-profile.types';

export const professionalProfileApi = {
  // 1. Get full profile
  getFullProfile: async (): Promise<FullProfessionalProfile> => {
    const response = await apiClient.get<{ success: boolean; data: FullProfessionalProfile }>(
      '/trainee/profile',
    );
    return response.data.data;
  },

  // 2. Update basic info
  updateBasicInfo: async (data: UpdateBasicInfoInput): Promise<BasicInformation> => {
    const response = await apiClient.patch<{ success: boolean; data: BasicInformation }>(
      '/trainee/profile/basic-info',
      data,
    );
    return response.data.data;
  },

  // 3. Qualifications
  addQualification: async (data: QualificationInput): Promise<Qualification> => {
    const response = await apiClient.post<{ success: boolean; data: Qualification }>(
      '/trainee/profile/qualifications',
      data,
    );
    return response.data.data;
  },

  updateQualification: async (
    id: string,
    data: Partial<QualificationInput>,
  ): Promise<Qualification> => {
    const response = await apiClient.patch<{ success: boolean; data: Qualification }>(
      `/trainee/profile/qualifications/${id}`,
      data,
    );
    return response.data.data;
  },

  deleteQualification: async (id: string): Promise<void> => {
    await apiClient.delete(`/trainee/profile/qualifications/${id}`);
  },

  // 4. Experience
  addExperience: async (data: ExperienceInput): Promise<WorkExperience> => {
    const response = await apiClient.post<{ success: boolean; data: WorkExperience }>(
      '/trainee/profile/experiences',
      data,
    );
    return response.data.data;
  },

  updateExperience: async (id: string, data: Partial<ExperienceInput>): Promise<WorkExperience> => {
    const response = await apiClient.patch<{ success: boolean; data: WorkExperience }>(
      `/trainee/profile/experiences/${id}`,
      data,
    );
    return response.data.data;
  },

  deleteExperience: async (id: string): Promise<void> => {
    await apiClient.delete(`/trainee/profile/experiences/${id}`);
  },

  // 5. Skills
  updateSkills: async (skills: string[]): Promise<ProfessionalSkill[]> => {
    const response = await apiClient.patch<{ success: boolean; data: ProfessionalSkill[] }>(
      '/trainee/profile/skills',
      { skills },
    );
    return response.data.data;
  },

  // 6. Interests
  updateInterests: async (interests: string[]): Promise<string[]> => {
    const response = await apiClient.patch<{ success: boolean; data: string[] }>(
      '/trainee/profile/interests',
      { interests },
    );
    return response.data.data;
  },

  // 7. Certificates
  getCertificates: async (): Promise<TraineeCertificate[]> => {
    const response = await apiClient.get<{ success: boolean; data: TraineeCertificate[] }>(
      '/trainee/profile/certificates',
    );
    return response.data.data;
  },
};
