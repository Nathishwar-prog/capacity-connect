'use client';

import React from 'react';
import { AlertTriangle, ArrowUpRight, BookOpenCheck, Compass } from 'lucide-react';
import Link from 'next/link';
import { SkillGapItem } from '../types/trainee-dashboard.types';
import { useLanguageStore } from '@/store/language';
import { getTranslation } from '../utils/i18n';

interface SkillGapCardProps {
  skillGaps: SkillGapItem[];
}

export const SkillGapCard: React.FC<SkillGapCardProps> = ({ skillGaps }) => {
  const { language } = useLanguageStore();
  const t = getTranslation(language);

  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shadow-2xs">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              {t.skillGapsTitle}
            </h2>
            <p className="text-xs text-slate-500 font-medium">{t.skillGapsSubtitle}</p>
          </div>
        </div>

        <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
          {skillGaps.length} Action Items
        </span>
      </div>

      {/* Skill Gaps List */}
      {skillGaps.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500">
          {t.noSkillGaps}
        </div>
      ) : (
        <div className="space-y-3.5">
          {skillGaps.map((gap) => (
            <div
              key={gap.id}
              className="p-4 rounded-2xl border border-slate-200/90 bg-slate-50/50 hover:bg-white hover:border-slate-300 hover:shadow-xs transition-all space-y-2.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                        gap.priority === 'HIGH'
                          ? 'bg-rose-100 text-rose-700 border border-rose-200'
                          : 'bg-amber-100 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {gap.priority === 'HIGH' ? t.highPriority : t.mediumPriority}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {gap.competencyArea}
                    </span>
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                    {gap.skillName}
                  </h3>
                </div>

                <span className="text-xs font-black text-rose-600 shrink-0">
                  -{gap.gapPercentage}% Gap
                </span>
              </div>

              {/* Level indicator Comparison */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium pt-0.5">
                <span>
                  {t.currentLevel}: <strong className="text-slate-700">L{gap.currentLevel}</strong>
                </span>
                <div className="flex-1 mx-3 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-rose-500 h-full rounded-full"
                    style={{ width: `${(gap.currentLevel / gap.targetLevel) * 100}%` }}
                  />
                </div>
                <span>
                  {t.targetLevel}: <strong className="text-emerald-700">L{gap.targetLevel}</strong>
                </span>
              </div>

              {/* Recommended Course Link */}
              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-medium truncate max-w-[220px]">
                  Target Curricula: {gap.recommendedCourse}
                </span>
                <Link
                  href="/trainee/explore"
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-800"
                >
                  <span>Enroll</span>
                  <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SkillGapCard;
