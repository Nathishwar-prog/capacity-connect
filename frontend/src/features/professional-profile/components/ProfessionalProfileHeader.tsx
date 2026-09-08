'use client';

import React from 'react';
import { ShieldCheck, Award, MapPin, Building2, BadgeCheck, CheckCircle2 } from 'lucide-react';
import { BasicInformation } from '../types/professional-profile.types';
import { useLanguageStore } from '@/store/language';
import { useProfileTranslation } from '../utils/i18n';

interface Props {
  basicInfo: BasicInformation;
  qualificationsCount: number;
  experienceCount: number;
  skillsCount: number;
  certificatesCount: number;
}

export const ProfessionalProfileHeader: React.FC<Props> = ({
  basicInfo,
  qualificationsCount,
  experienceCount,
  skillsCount,
  certificatesCount,
}) => {
  const { language } = useLanguageStore();
  const t = useProfileTranslation(language);

  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        {/* Trainee Identity */}
        <div className="flex items-center gap-4 sm:gap-5">
          <div className="relative">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-[#0B192C] via-[#1E3E62] to-[#0078D4] text-white flex items-center justify-center font-black text-2xl sm:text-3xl shadow-md border-2 border-white ring-2 ring-slate-100">
              {basicInfo.firstName[0]}
              {basicInfo.lastName ? basicInfo.lastName[0] : ''}
            </div>
            <div
              className="absolute -bottom-1.5 -right-1.5 bg-emerald-500 text-white rounded-full p-1 shadow-xs border-2 border-white"
              title="Verified Officer"
            >
              <BadgeCheck className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {basicInfo.firstName} {basicInfo.lastName || ''}
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200/80">
                <ShieldCheck className="w-3 h-3 text-blue-600" />
                <span>{basicInfo.role}</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>{t.verifiedOfficer}</span>
              </span>
            </div>

            <p className="text-xs sm:text-sm font-semibold text-slate-600">
              {basicInfo.designation || 'Forecaster Grade I (Operational Trainee)'}
            </p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-0.5">
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {basicInfo.departmentName || 'National Weather Forecasting Centre (NWFC)'}
                </span>
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{basicInfo.location || 'New Delhi, India'}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Live Profile Completeness Widget */}
        <div className="w-full md:w-auto shrink-0 bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 sm:px-6 sm:py-4 flex flex-col justify-center space-y-2 min-w-[240px]">
          <div className="flex items-center justify-between text-xs">
            <span className="font-extrabold text-slate-700 uppercase tracking-wider text-[11px]">
              {t.completeness}
            </span>
            <span className="font-black text-blue-700 text-sm">{basicInfo.profileCompletion}%</span>
          </div>

          <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${basicInfo.profileCompletion}%` }}
            />
          </div>

          <p className="text-[10px] text-slate-500 font-medium">
            {basicInfo.profileCompletion >= 100
              ? 'Profile fully verified & complete'
              : t.completeAction}
          </p>
        </div>
      </div>

      {/* Quick Summary Pill Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100">
        <div className="p-3 bg-slate-50/60 rounded-xl border border-slate-200/60 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
            {qualificationsCount}
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Qualifications
            </p>
            <p className="text-xs font-black text-slate-800">Academic Degrees</p>
          </div>
        </div>

        <div className="p-3 bg-slate-50/60 rounded-xl border border-slate-200/60 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
            {experienceCount}
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Experience
            </p>
            <p className="text-xs font-black text-slate-800">Operational Posts</p>
          </div>
        </div>

        <div className="p-3 bg-slate-50/60 rounded-xl border border-slate-200/60 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
            {skillsCount}
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Competencies
            </p>
            <p className="text-xs font-black text-slate-800">Technical Skills</p>
          </div>
        </div>

        <div className="p-3 bg-slate-50/60 rounded-xl border border-slate-200/60 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Certificates
            </p>
            <p className="text-xs font-black text-slate-800">{certificatesCount} Verified</p>
          </div>
        </div>
      </div>
    </div>
  );
};
