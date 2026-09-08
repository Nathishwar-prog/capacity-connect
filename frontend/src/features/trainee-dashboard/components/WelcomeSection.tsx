'use client';

import React from 'react';
import { Calendar, Shield, MapPin, Sparkles } from 'lucide-react';
import { useLanguageStore } from '@/store/language';
import { getTranslation } from '../utils/i18n';

interface WelcomeSectionProps {
  traineeName: string;
  designation: string;
  department: string;
  organization: string;
}

export const WelcomeSection: React.FC<WelcomeSectionProps> = ({
  traineeName,
  designation,
  department,
  organization,
}) => {
  const { language } = useLanguageStore();
  const t = getTranslation(language);

  // Format today's date
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
      {/* Ambient background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-sky-100/40 to-indigo-100/20 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />

      {/* Trainee Details */}
      <div className="space-y-3 relative z-10">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
            {designation || 'Met. Observer Trainee'}
          </span>
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">•</span>
          <span className="text-xs text-slate-500 font-semibold">{department}</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          {t.welcomeBack}, {traineeName} !
        </h1>

        <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
          {t.welcomeSubtitle}
        </p>

        {/* Institution metadata badges */}
        <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-600 font-medium">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-sky-600 shrink-0" />
            <span className="text-[11px] font-semibold">{organization}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="text-[11px] font-semibold">HQ NWFC New Delhi / Pune Training</span>
          </div>
        </div>
      </div>

      {/* Today's Date Box */}
      <div className="shrink-0 relative z-10 self-start md:self-center">
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-slate-700 text-xs font-semibold shadow-2xs">
          <Calendar className="w-4 h-4 text-slate-500" />
          <span>{today}</span>
        </div>
      </div>
    </div>
  );
};

export default WelcomeSection;
