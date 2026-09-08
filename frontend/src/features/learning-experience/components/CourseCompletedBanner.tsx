'use client';

import React from 'react';
import Link from 'next/link';
import { Award, CheckCircle2, ArrowRight, BookOpen } from 'lucide-react';
import { useLanguageStore } from '@/store/language';
import { useLearningTranslation } from '../utils/i18n';

interface Props {
  courseTitle: string;
}

export const CourseCompletedBanner: React.FC<Props> = ({ courseTitle }) => {
  const { language } = useLanguageStore();
  const t = useLearningTranslation(language);

  return (
    <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-teal-950 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 text-white shadow-lg space-y-4 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Award className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                100% Completed
              </span>
              <span className="text-xs text-emerald-300 font-medium">WMO-258 Accredited Track</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
              {t.courseCompletedTitle}
            </h3>
            <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed max-w-xl">
              {t.courseCompletedSub}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/trainee/courses"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md transition-all active:scale-95"
          >
            <span>{t.backToCourses}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};
