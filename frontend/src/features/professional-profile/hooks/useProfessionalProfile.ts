import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { professionalProfileApi } from '../api/professionalProfileApi';
import { mockProfessionalProfile } from '../utils/mockData';
import {
  FullProfessionalProfile,
  BasicInformation,
  Qualification,
  WorkExperience,
  ProfessionalSkill,
  UpdateBasicInfoInput,
  QualificationInput,
  ExperienceInput,
} from '../types/professional-profile.types';

const PROFILE_QUERY_KEY = ['trainee-professional-profile'];

export function useProfessionalProfile() {
  const queryClient = useQueryClient();

  // Local fallback state to support interactive CRUD even when backend is offline/unseeded
  const [localProfile, setLocalProfile] =
    useState<FullProfessionalProfile>(mockProfessionalProfile);
  const [isUsingMock, setIsUsingMock] = useState(false);

  const calculateLiveCompletion = useCallback((p: FullProfessionalProfile): number => {
    let score = 0;
    if (p.basicInfo.firstName && p.basicInfo.email) score += 15;
    if (p.basicInfo.phone) score += 5;
    if (p.basicInfo.designation) score += 5;
    if (p.qualifications.length > 0) score += 20;
    if (p.experiences.length > 0) score += 20;
    if (p.skills.length >= 3) score += 15;
    else if (p.skills.length > 0) score += 8;
    if (p.interests.length >= 2) score += 10;
    else if (p.interests.length > 0) score += 5;
    if (p.certificates.length > 0) score += 10;
    return Math.min(100, score);
  }, []);

  const profileQuery = useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: async () => {
      try {
        const data = await professionalProfileApi.getFullProfile();
        setIsUsingMock(false);
        return data;
      } catch (err) {
        // Fallback gracefully to domain mock data in local offline development
        setIsUsingMock(true);
        return localProfile;
      }
    },
    staleTime: 1000 * 60 * 5,
  });

  const profile = profileQuery.data || localProfile;

  // --- 1. Basic Info Mutation ---
  const updateBasicInfoMutation = useMutation({
    mutationFn: async (input: UpdateBasicInfoInput) => {
      if (!isUsingMock) {
        try {
          return await professionalProfileApi.updateBasicInfo(input);
        } catch {
          // Fall through to local update
        }
      }
      // Local state update
      const updatedBasicInfo: BasicInformation = {
        ...profile.basicInfo,
        ...input,
        firstName: input.firstName,
        lastName: input.lastName ?? profile.basicInfo.lastName,
        phone: input.phone ?? profile.basicInfo.phone,
        avatarUrl: input.avatarUrl ?? profile.basicInfo.avatarUrl,
        designation: input.designation ?? profile.basicInfo.designation,
        bio: input.bio ?? profile.basicInfo.bio,
        age: input.age ?? profile.basicInfo.age,
        location: input.location ?? profile.basicInfo.location,
        moesEmployeeId: input.moesEmployeeId ?? profile.basicInfo.moesEmployeeId,
        imdEmployeeId: input.imdEmployeeId ?? profile.basicInfo.imdEmployeeId,
      };

      const updatedProfile: FullProfessionalProfile = {
        ...profile,
        basicInfo: updatedBasicInfo,
      };
      updatedProfile.basicInfo.profileCompletion = calculateLiveCompletion(updatedProfile);

      setLocalProfile(updatedProfile);
      return updatedBasicInfo;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
    },
  });

  // --- 2. Qualifications Mutations ---
  const addQualificationMutation = useMutation({
    mutationFn: async (input: QualificationInput) => {
      if (!isUsingMock) {
        try {
          return await professionalProfileApi.addQualification(input);
        } catch {
          // Fall through
        }
      }
      const newQual: Qualification = {
        id: `qual-${Date.now()}`,
        degree: input.degree,
        fieldOfStudy: input.fieldOfStudy,
        institution: input.institution,
        startDate: input.startDate || null,
        endDate: input.endDate || null,
        description: input.description || null,
      };

      const updatedProfile: FullProfessionalProfile = {
        ...profile,
        qualifications: [newQual, ...profile.qualifications],
      };
      updatedProfile.basicInfo.profileCompletion = calculateLiveCompletion(updatedProfile);

      setLocalProfile(updatedProfile);
      return newQual;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
    },
  });

  const updateQualificationMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<QualificationInput> }) => {
      if (!isUsingMock) {
        try {
          return await professionalProfileApi.updateQualification(id, data);
        } catch {
          // Fall through
        }
      }
      const updatedList = profile.qualifications.map((q) => (q.id === id ? { ...q, ...data } : q));

      const updatedProfile: FullProfessionalProfile = {
        ...profile,
        qualifications: updatedList,
      };
      updatedProfile.basicInfo.profileCompletion = calculateLiveCompletion(updatedProfile);

      setLocalProfile(updatedProfile);
      return updatedList.find((q) => q.id === id)!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
    },
  });

  const deleteQualificationMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!isUsingMock) {
        try {
          await professionalProfileApi.deleteQualification(id);
        } catch {
          // Fall through
        }
      }
      const filtered = profile.qualifications.filter((q) => q.id !== id);
      const updatedProfile: FullProfessionalProfile = {
        ...profile,
        qualifications: filtered,
      };
      updatedProfile.basicInfo.profileCompletion = calculateLiveCompletion(updatedProfile);

      setLocalProfile(updatedProfile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
    },
  });

  // --- 3. Experience Mutations ---
  const addExperienceMutation = useMutation({
    mutationFn: async (input: ExperienceInput) => {
      if (!isUsingMock) {
        try {
          return await professionalProfileApi.addExperience(input);
        } catch {
          // Fall through
        }
      }
      const newExp: WorkExperience = {
        id: `exp-${Date.now()}`,
        companyName: input.companyName,
        jobTitle: input.jobTitle,
        description: input.description || null,
        startDate: input.startDate,
        endDate: input.isCurrent ? null : input.endDate || null,
        isCurrent: input.isCurrent,
      };

      const updatedProfile: FullProfessionalProfile = {
        ...profile,
        experiences: [newExp, ...profile.experiences],
      };
      updatedProfile.basicInfo.profileCompletion = calculateLiveCompletion(updatedProfile);

      setLocalProfile(updatedProfile);
      return newExp;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
    },
  });

  const updateExperienceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ExperienceInput> }) => {
      if (!isUsingMock) {
        try {
          return await professionalProfileApi.updateExperience(id, data);
        } catch {
          // Fall through
        }
      }
      const updatedList = profile.experiences.map((exp) =>
        exp.id === id
          ? { ...exp, ...data, endDate: data.isCurrent ? null : (data.endDate ?? exp.endDate) }
          : exp,
      );

      const updatedProfile: FullProfessionalProfile = {
        ...profile,
        experiences: updatedList,
      };
      updatedProfile.basicInfo.profileCompletion = calculateLiveCompletion(updatedProfile);

      setLocalProfile(updatedProfile);
      return updatedList.find((e) => e.id === id)!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
    },
  });

  const deleteExperienceMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!isUsingMock) {
        try {
          await professionalProfileApi.deleteExperience(id);
        } catch {
          // Fall through
        }
      }
      const filtered = profile.experiences.filter((e) => e.id !== id);
      const updatedProfile: FullProfessionalProfile = {
        ...profile,
        experiences: filtered,
      };
      updatedProfile.basicInfo.profileCompletion = calculateLiveCompletion(updatedProfile);

      setLocalProfile(updatedProfile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
    },
  });

  // --- 4. Skills Mutations ---
  const addSkillMutation = useMutation({
    mutationFn: async (skillName: string) => {
      const trimmed = skillName.trim();
      if (!trimmed || profile.skills.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
        return profile.skills;
      }
      const newSkill: ProfessionalSkill = {
        id: `skill-${Date.now()}`,
        name: trimmed,
        code: trimmed.toUpperCase().replace(/[^A-Z0-9]/g, '_'),
        category: 'METEOROLOGY',
        proficiencyLevel: 3,
      };
      const updatedSkills = [...profile.skills, newSkill];

      if (!isUsingMock) {
        try {
          await professionalProfileApi.updateSkills(updatedSkills.map((s) => s.name));
        } catch {
          // Fall through
        }
      }

      const updatedProfile: FullProfessionalProfile = {
        ...profile,
        skills: updatedSkills,
      };
      updatedProfile.basicInfo.profileCompletion = calculateLiveCompletion(updatedProfile);

      setLocalProfile(updatedProfile);
      return updatedSkills;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
    },
  });

  const removeSkillMutation = useMutation({
    mutationFn: async (skillId: string) => {
      const updatedSkills = profile.skills.filter((s) => s.id !== skillId);

      if (!isUsingMock) {
        try {
          await professionalProfileApi.updateSkills(updatedSkills.map((s) => s.name));
        } catch {
          // Fall through
        }
      }

      const updatedProfile: FullProfessionalProfile = {
        ...profile,
        skills: updatedSkills,
      };
      updatedProfile.basicInfo.profileCompletion = calculateLiveCompletion(updatedProfile);

      setLocalProfile(updatedProfile);
      return updatedSkills;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
    },
  });

  // --- 5. Interests Mutations ---
  const addInterestMutation = useMutation({
    mutationFn: async (interestName: string) => {
      const trimmed = interestName.trim();
      if (!trimmed || profile.interests.includes(trimmed)) {
        return profile.interests;
      }
      const updatedInterests = [...profile.interests, trimmed];

      if (!isUsingMock) {
        try {
          await professionalProfileApi.updateInterests(updatedInterests);
        } catch {
          // Fall through
        }
      }

      const updatedProfile: FullProfessionalProfile = {
        ...profile,
        interests: updatedInterests,
      };
      updatedProfile.basicInfo.profileCompletion = calculateLiveCompletion(updatedProfile);

      setLocalProfile(updatedProfile);
      return updatedInterests;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
    },
  });

  const removeInterestMutation = useMutation({
    mutationFn: async (interestName: string) => {
      const updatedInterests = profile.interests.filter((i) => i !== interestName);

      if (!isUsingMock) {
        try {
          await professionalProfileApi.updateInterests(updatedInterests);
        } catch {
          // Fall through
        }
      }

      const updatedProfile: FullProfessionalProfile = {
        ...profile,
        interests: updatedInterests,
      };
      updatedProfile.basicInfo.profileCompletion = calculateLiveCompletion(updatedProfile);

      setLocalProfile(updatedProfile);
      return updatedInterests;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
    },
  });

  return {
    profile,
    isLoading: profileQuery.isLoading,
    isError: profileQuery.isError && !isUsingMock,
    refetch: profileQuery.refetch,
    // Mutations
    updateBasicInfo: updateBasicInfoMutation.mutateAsync,
    isUpdatingBasicInfo: updateBasicInfoMutation.isPending,
    addQualification: addQualificationMutation.mutateAsync,
    isAddingQualification: addQualificationMutation.isPending,
    updateQualification: updateQualificationMutation.mutateAsync,
    isUpdatingQualification: updateQualificationMutation.isPending,
    deleteQualification: deleteQualificationMutation.mutateAsync,
    isDeletingQualification: deleteQualificationMutation.isPending,
    addExperience: addExperienceMutation.mutateAsync,
    isAddingExperience: addExperienceMutation.isPending,
    updateExperience: updateExperienceMutation.mutateAsync,
    isUpdatingExperience: updateExperienceMutation.isPending,
    deleteExperience: deleteExperienceMutation.mutateAsync,
    isDeletingExperience: deleteExperienceMutation.isPending,
    addSkill: addSkillMutation.mutateAsync,
    removeSkill: removeSkillMutation.mutateAsync,
    addInterest: addInterestMutation.mutateAsync,
    removeInterest: removeInterestMutation.mutateAsync,
  };
}
