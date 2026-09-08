'use client';

import React from 'react';
import Link from 'next/link';
import { ClipboardList, Calendar, Clock, ArrowRight, AlertCircle, FileCheck } from 'lucide-react';
import { UpcomingAssessmentItem } from '../types/trainee-dashboard.types';
import { useLanguageStore } from '@/store/language';
import { getTranslation } from '../utils/i18n';

interface UpcomingAssessmentsCardProps {
  assessments: UpcomingAssessmentItem[];
}

export const UpcomingAssessmentsCard: React.FC<UpcomingAssessmentsCardProps> = ({
  assessments,
}) => {
  const { language } = useLanguageStore();
  const t = getTranslation(language);

  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shadow-2xs">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              {t.upcomingAssessments}
            </h2>
            <p className="text-xs text-slate-500 font-medium">{t.assessmentSubtitle}</p>
          </div>
        </div>

        <Link
          href="/trainee/assessments"
          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors hidden sm:inline-block"
        >
          View All ({assessments.length})
        </Link>
      </div>

      {/* List */}
      {assessments.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500">
          {t.noUpcomingAssessments}
        </div>
      ) : (
        <div className="space-y-3.5">
          {assessments.map((assessment) => (
            <div
              key={assessment.id}
              className="p-4 sm:p-4.5 rounded-2xl border border-slate-200/90 bg-slate-50/60 hover:bg-white hover:border-slate-300 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3.5"
            >
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 shadow-2xs">
                    {assessment.courseTitle}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                      assessment.status === 'PENDING'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {t.dueDate}: {assessment.dueDate}
                  </span>
                </div>

                <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                  {assessment.title}
                </h3>

                <div className="flex flex-wrap items-center gap-3.5 text-[11px] text-slate-500 font-medium pt-0.5">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>
                      {t.durationLabel}: {assessment.durationMinutes} mins
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FileCheck className="w-3 h-3 text-slate-400" />
                    <span>
                      {t.passScoreLabel}: {assessment.passingScore}%
                    </span>
                  </div>
                </div>
              </div>

              {/* View Assessment CTA */}
              <div className="shrink-0 self-start sm:self-center">
                <Link
                  href="/trainee/assessments"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-2xs group"
                >
                  <span>{t.viewAssessment}</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UpcomingAssessmentsCard;
