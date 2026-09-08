'use client';

import React from 'react';
import { ArrowLeft, ArrowRight, CheckCircle, Loader2 } from 'lucide-react';
import { LessonSummary } from '../types/learning-experience.types';
import { useLanguageStore } from '@/store/language';
import { useLearningTranslation } from '../utils/i18n';

interface Props {
  previousLesson: LessonSummary | null;
  nextLesson: LessonSummary | null;
  isCompleted: boolean;
  isCompleting: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onComplete: () => void;
}

export const LessonNavigation: React.FC<Props> = ({
  previousLesson,
  nextLesson,
  isCompleted,
  isCompleting,
  onPrevious,
  onNext,
  onComplete,
}) => {
  const { language } = useLanguageStore();
  const t = useLearningTranslation(language);

  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl p-4 sm:p-5 shadow-sm sticky bottom-4 z-20 backdrop-blur-md bg-white/95">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Previous Lesson Action */}
        <button
          type="button"
          onClick={onPrevious}
          disabled={!previousLesson}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t.previousLesson}</span>
        </button>

        {/* Center: Mark as Complete / Completed status */}
        <button
          type="button"
          onClick={onComplete}
          disabled={isCompleting || isCompleted}
          className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl text-xs font-black transition-all shadow-xs ${
            isCompleted
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
              : 'bg-[#0B192C] hover:bg-slate-800 text-white active:scale-95'
          }`}
        >
          {isCompleting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{t.savingProgress}</span>
            </>
          ) : isCompleted ? (
            <>
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>{t.lessonCompleted}</span>
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 text-blue-400" />
              <span>{t.markAsComplete}</span>
            </>
          )}
        </button>

        {/* Next Lesson Action */}
        <button
          type="button"
          onClick={onNext}
          disabled={!nextLesson}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold disabled:opacity-30 disabled:pointer-events-none transition-all shadow-xs active:scale-95"
        >
          <span>{t.nextLesson}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
