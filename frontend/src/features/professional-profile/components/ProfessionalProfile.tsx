'use client';

import React from 'react';
import { useProfessionalProfile } from '../hooks/useProfessionalProfile';
import { ProfessionalProfileHeader } from './ProfessionalProfileHeader';
import { BasicInformationCard } from './BasicInformationCard';
import { QualificationsCard } from './QualificationsCard';
import { ExperienceCard } from './ExperienceCard';
import { SkillsCard } from './SkillsCard';
import { InterestsCard } from './InterestsCard';
import { CertificatesCard } from './CertificatesCard';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useLanguageStore } from '@/store/language';
import { useProfileTranslation } from '../utils/i18n';

export const ProfessionalProfile: React.FC = () => {
  const {
    profile,
    isLoading,
    isError,
    refetch,
    updateBasicInfo,
    isUpdatingBasicInfo,
    addQualification,
    isAddingQualification,
    updateQualification,
    isUpdatingQualification,
    deleteQualification,
    isDeletingQualification,
    addExperience,
    isAddingExperience,
    updateExperience,
    isUpdatingExperience,
    deleteExperience,
    isDeletingExperience,
    addSkill,
    removeSkill,
    addInterest,
    removeInterest,
  } = useProfessionalProfile();

  const { language } = useLanguageStore();
  const t = useProfileTranslation(language);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 animate-pulse">
        <div className="h-44 bg-slate-200/70 rounded-3xl" />
        <div className="h-64 bg-slate-200/70 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-72 bg-slate-200/70 rounded-3xl" />
          <div className="h-72 bg-slate-200/70 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-extrabold text-slate-900">Unable to load profile</h2>
          <p className="text-xs text-slate-500">
            Could not retrieve your professional records from the MoES database.
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#0B192C] text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Connection</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-in fade-in duration-300">
      {/* 1. Header with Avatar & Live Completeness */}
      <ProfessionalProfileHeader
        basicInfo={profile.basicInfo}
        qualificationsCount={profile.qualifications.length}
        experienceCount={profile.experiences.length}
        skillsCount={profile.skills.length}
        certificatesCount={profile.certificates.length}
      />

      {/* 2. Basic Information (View & Edit Mode) */}
      <BasicInformationCard
        basicInfo={profile.basicInfo}
        onSave={updateBasicInfo}
        isSaving={isUpdatingBasicInfo}
      />

      {/* 3. Qualifications & 4. Professional Experience */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QualificationsCard
          qualifications={profile.qualifications}
          onAdd={addQualification}
          onUpdate={(id, data) => updateQualification({ id, data })}
          onDelete={deleteQualification}
          isAdding={isAddingQualification}
          isUpdating={isUpdatingQualification}
          isDeleting={isDeletingQualification}
        />

        <ExperienceCard
          experiences={profile.experiences}
          onAdd={addExperience}
          onUpdate={(id, data) => updateExperience({ id, data })}
          onDelete={deleteExperience}
          isAdding={isAddingExperience}
          isUpdating={isUpdatingExperience}
          isDeleting={isDeletingExperience}
        />
      </div>

      {/* 5. Skills & 6. Professional Interests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkillsCard skills={profile.skills} onAddSkill={addSkill} onRemoveSkill={removeSkill} />

        <InterestsCard
          interests={profile.interests}
          onAddInterest={addInterest}
          onRemoveInterest={removeInterest}
        />
      </div>

      {/* 7. Certificates & Accreditations */}
      <CertificatesCard certificates={profile.certificates} />
    </div>
  );
};
