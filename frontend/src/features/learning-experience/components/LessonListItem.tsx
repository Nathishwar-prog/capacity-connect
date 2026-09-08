'use client';

import React from 'react';
import { CheckCircle2, PlayCircle, Circle, Video, FileText, FileCheck, Clock } from 'lucide-react';
import { LessonSummary } from '../types/learning-experience.types';
import { useLanguageStore } from '@/store/language';
import { useLearningTranslation } from '../utils/i18n';

interface Props {
  lesson: LessonSummary;
  isActive: boolean;
  isCompleted: boolean;
  onSelect: (lessonId: string) => void;
}

export const LessonListItem: React.FC<Props> = ({ lesson, isActive, isCompleted, onSelect }) => {
  const { language } = useLanguageStore();
  const t = useLearningTranslation(language);

  const getContentTypeIcon = () => {
    switch (lesson.contentType) {
      case 'VIDEO':
        return <Video className="w-3.5 h-3.5 text-blue-500 shrink-0" />;
      case 'PDF':
        return <FileText className="w-3.5 h-3.5 text-rose-500 shrink-0" />;
      case 'DOCUMENT':
      case 'ARTICLE':
        return <FileCheck className="w-3.5 h-3.5 text-amber-500 shrink-0" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" />;
    }
  };

  return (
    <button
      type="button"
      onClick={() => onSelect(lesson.id)}
      className={`w-full text-left p-3 rounded-2xl transition-all flex items-start gap-3 group relative ${
        isActive
          ? 'bg-blue-50/90 border border-blue-200 text-blue-950 shadow-2xs font-semibold'
          : 'hover:bg-slate-50 border border-transparent text-slate-700 font-medium'
      }`}
    >
      {/* Status icon */}
      <div className="pt-0.5 shrink-0">
        {isCompleted ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
        ) : isActive ? (
          <PlayCircle className="w-4 h-4 text-blue-600 fill-blue-100" />
        ) : (
          <Circle className="w-4 h-4 text-slate-300 group-hover:text-slate-400" />
        )}
      </div>

      {/* Lesson details */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <p
            className={`text-xs leading-snug line-clamp-2 ${
              isActive
                ? 'font-bold text-blue-900'
                : isCompleted
                  ? 'text-slate-600'
                  : 'text-slate-800'
            }`}
          >
            {lesson.title}
          </p>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            {getContentTypeIcon()}
            <span className="capitalize">{lesson.contentType.toLowerCase()}</span>
          </span>

          {lesson.durationMinutes && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>
                  {lesson.durationMinutes} {t.durationMinutes}
                </span>
              </span>
            </>
          )}

          {lesson.isPreview && (
            <>
              <span>•</span>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded">
                {t.previewBadge}
              </span>
            </>
          )}
        </div>
      </div>
    </button>
  );
};
