'use client';

import React from 'react';
import { Target, Award, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { TraineeCompetencyOverview } from '../types/trainee-dashboard.types';
import { useLanguageStore } from '@/store/language';
import { getTranslation } from '../utils/i18n';

interface CompetencyCardProps {
  competency: TraineeCompetencyOverview;
}

export const CompetencyCard: React.FC<CompetencyCardProps> = ({ competency }) => {
  const { language } = useLanguageStore();
  const t = getTranslation(language);

  const { overallPercentage, levelLabel, statusText, breakdown } = competency;

  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shadow-2xs">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              {t.competencyTitle}
            </h2>
            <p className="text-xs text-slate-500 font-medium">{t.competencySubtitle}</p>
          </div>
        </div>

        <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          {overallPercentage}%
        </span>
      </div>

      {/* Main Competency Gauge */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
          <span>{levelLabel}</span>
          <span className="text-sky-700 bg-sky-100/80 px-2 py-0.5 rounded-full text-[10px] font-extrabold">
            {statusText.split('•')[0].trim() || t.goodProgress}
          </span>
        </div>
        <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-sky-500 to-indigo-600 h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${overallPercentage}%` }}
          />
        </div>
        <p className="text-[11px] text-slate-500 font-medium pt-0.5">{statusText}</p>
      </div>

      {/* Core Competency Breakdown */}
      <div className="space-y-3 pt-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Core Forecaster Domains
        </h3>
        {breakdown.map((item) => (
          <div key={item.id} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 truncate">{item.name}</span>
              <span className="font-bold text-slate-900">{item.score}%</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  item.score >= 75
                    ? 'bg-emerald-500'
                    : item.score >= 65
                      ? 'bg-sky-500'
                      : 'bg-amber-500'
                }`}
                style={{ width: `${item.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CompetencyCard;
