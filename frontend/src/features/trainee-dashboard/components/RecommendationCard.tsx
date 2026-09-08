'use client';

import React from 'react';
import Link from 'next/link';
import { Compass, Sparkles, ArrowRight, Clock, Target } from 'lucide-react';
import { CourseRecommendationItem } from '../types/trainee-dashboard.types';
import { useLanguageStore } from '@/store/language';
import { getTranslation } from '../utils/i18n';

interface RecommendationCardProps {
  recommendations: CourseRecommendationItem[];
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({ recommendations }) => {
  const { language } = useLanguageStore();
  const t = getTranslation(language);

  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shadow-2xs">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              {t.recommendationsTitle}
            </h2>
            <p className="text-xs text-slate-500 font-medium">{t.recommendationsSubtitle}</p>
          </div>
        </div>

        <Link
          href="/trainee/explore"
          className="text-xs font-bold text-sky-600 hover:text-sky-800 transition-colors hidden sm:inline-block"
        >
          Explore All
        </Link>
      </div>

      {/* Recommendations List */}
      {recommendations.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500">
          {t.noRecommendations}
        </div>
      ) : (
        <div className="space-y-3.5">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className="p-4 rounded-2xl border border-slate-200/90 bg-slate-50/50 hover:bg-white hover:border-slate-300 hover:shadow-xs transition-all space-y-2.5 group"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-sky-100/70 text-sky-800 border border-sky-200">
                  {rec.category}
                </span>

                <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                  <Clock className="w-3 h-3" />
                  <span>{rec.estimatedHours} Hours</span>
                </div>
              </div>

              <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-sky-700 transition-colors">
                {rec.courseTitle}
              </h3>

              {/* Reason for recommendation */}
              <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200/60 space-y-1">
                <div className="flex items-start gap-1.5 text-[11px] text-slate-600">
                  <Sparkles className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
                  <span className="leading-snug">{rec.reason}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 pt-0.5">
                  <Target className="w-3 h-3 text-indigo-500" />
                  <span>
                    {t.targetCompetency}: {rec.targetSkill}
                  </span>
                </div>
              </div>

              {/* View Course Action */}
              <div className="pt-1 flex justify-end">
                <Link
                  href="/trainee/explore"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-2xs group/btn"
                >
                  <span>{t.viewCourse}</span>
                  <ArrowRight className="w-3 h-3 transition-transform group-hover/btn:translate-x-0.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecommendationCard;
