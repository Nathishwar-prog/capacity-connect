'use client';

import React from 'react';
import { Award, Trophy, BookCheck, FileBadge, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { TraineeAchievementsOverview } from '../types/trainee-dashboard.types';
import { useLanguageStore } from '@/store/language';
import { getTranslation } from '../utils/i18n';

interface AchievementsCardProps {
  achievements: TraineeAchievementsOverview;
}

export const AchievementsCard: React.FC<AchievementsCardProps> = ({ achievements }) => {
  const { language } = useLanguageStore();
  const t = getTranslation(language);

  const {
    coursesCompletedCount,
    certificatesEarnedCount,
    assessmentsPassedCount,
    totalLearningHours,
    badges,
  } = achievements;

  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shadow-2xs">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              {t.achievementsTitle}
            </h2>
            <p className="text-xs text-slate-500 font-medium">{t.achievementsSubtitle}</p>
          </div>
        </div>

        <Link
          href="/trainee/certificates"
          className="text-xs font-bold text-amber-600 hover:text-amber-800 transition-colors hidden sm:inline-block"
        >
          View All Badges
        </Link>
      </div>

      {/* Summary KPI Counters Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center space-y-1">
          <BookCheck className="w-5 h-5 text-indigo-600 mx-auto" />
          <span className="text-xl sm:text-2xl font-black text-slate-900 block">
            {coursesCompletedCount}
          </span>
          <span className="text-[11px] font-semibold text-slate-500 leading-tight block">
            {t.coursesCompleted}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center space-y-1">
          <FileBadge className="w-5 h-5 text-emerald-600 mx-auto" />
          <span className="text-xl sm:text-2xl font-black text-slate-900 block">
            {certificatesEarnedCount}
          </span>
          <span className="text-[11px] font-semibold text-slate-500 leading-tight block">
            {t.certificatesEarned}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center space-y-1">
          <CheckCircle className="w-5 h-5 text-sky-600 mx-auto" />
          <span className="text-xl sm:text-2xl font-black text-slate-900 block">
            {assessmentsPassedCount}
          </span>
          <span className="text-[11px] font-semibold text-slate-500 leading-tight block">
            {t.assessmentsPassed}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center space-y-1">
          <Clock className="w-5 h-5 text-amber-600 mx-auto" />
          <span className="text-xl sm:text-2xl font-black text-slate-900 block">
            {totalLearningHours}h
          </span>
          <span className="text-[11px] font-semibold text-slate-500 leading-tight block">
            {t.learningHours}
          </span>
        </div>
      </div>

      {/* Milestone Badges List */}
      <div className="space-y-3 pt-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          {t.accreditedBadges}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className="p-3.5 rounded-2xl border border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-xs transition-all flex items-start gap-3"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/60 flex items-center justify-center text-amber-600 shrink-0 shadow-2xs">
                <Award className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-slate-900 leading-tight truncate">
                  {badge.title}
                </h4>
                <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                  {badge.category}
                </p>
                <span className="text-[9px] font-mono text-slate-400 block mt-1">
                  Issued: {badge.dateEarned}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AchievementsCard;
