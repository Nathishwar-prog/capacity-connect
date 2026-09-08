'use client';

import React from 'react';
import Link from 'next/link';
import { UserCheck, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { TraineeProfileCompletion } from '../types/trainee-dashboard.types';
import { useLanguageStore } from '@/store/language';
import { getTranslation } from '../utils/i18n';

interface ProfileCompletionCardProps {
  profileCompletion: TraineeProfileCompletion;
}

export const ProfileCompletionCard: React.FC<ProfileCompletionCardProps> = ({
  profileCompletion,
}) => {
  const { language } = useLanguageStore();
  const t = getTranslation(language);

  const { percentage, statusText, completedFieldsCount, totalFieldsCount, missingFields } =
    profileCompletion;

  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-xs relative overflow-hidden flex flex-col justify-between">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shadow-2xs">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">
                {t.profileCompletion}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                {completedFieldsCount} of {totalFieldsCount} fields verified
              </p>
            </div>
          </div>

          <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {percentage}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-sky-500 to-[#0B192C] h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${percentage}%` }}
              role="progressbar"
              aria-valuenow={percentage}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
            {statusText || t.profileStatusDetail}
          </p>
        </div>

        {/* Missing Fields Preview */}
        {missingFields && missingFields.length > 0 && (
          <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 space-y-1.5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-700 uppercase tracking-wide">
              <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Pending Information</span>
            </div>
            <ul className="text-[11px] text-slate-600 space-y-1">
              {missingFields.map((field, idx) => (
                <li key={idx} className="flex items-center gap-1.5 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                  <span className="truncate">{field}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="pt-4 mt-4 border-t border-slate-100">
        <Link
          href="/trainee/profile"
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-2xs group"
        >
          <span>{t.completeProfile}</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
};

export default ProfileCompletionCard;
