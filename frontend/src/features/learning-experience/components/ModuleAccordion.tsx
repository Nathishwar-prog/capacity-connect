'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, BookOpen, CheckCircle2 } from 'lucide-react';
import { ModuleSummary } from '../types/learning-experience.types';
import { LessonListItem } from './LessonListItem';

interface Props {
  module: ModuleSummary;
  activeLessonId: string | null;
  completedLessonIds: Set<string>;
  onSelectLesson: (lessonId: string) => void;
  defaultExpanded?: boolean;
}

export const ModuleAccordion: React.FC<Props> = ({
  module,
  activeLessonId,
  completedLessonIds,
  onSelectLesson,
  defaultExpanded = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const completedInModule = module.lessons.filter((l) => completedLessonIds.has(l.id)).length;
  const isModuleFullyComplete =
    module.lessons.length > 0 && completedInModule === module.lessons.length;

  return (
    <div className="border border-slate-200/90 rounded-2xl overflow-hidden bg-white shadow-2xs transition-all">
      {/* Module Header Button */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left p-3.5 sm:p-4 bg-slate-50/70 hover:bg-slate-100/80 transition-colors flex items-center justify-between gap-3 border-b border-slate-100"
      >
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
              Module {module.orderIndex}
            </span>
            {isModuleFullyComplete && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Completed</span>
              </span>
            )}
          </div>

          <h3 className="text-xs sm:text-sm font-black text-slate-800 leading-snug line-clamp-2">
            {module.title}
          </h3>

          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
            <span>
              {completedInModule} / {module.lessons.length} lessons
            </span>
            <span>•</span>
            <span className="text-blue-700 font-bold">
              {module.lessons.length > 0
                ? Math.round((completedInModule / module.lessons.length) * 100)
                : 0}
              %
            </span>
          </div>
        </div>

        <div className="p-1 rounded-xl text-slate-400 bg-white border border-slate-200/80 shrink-0">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Collapsible Lesson List */}
      {isExpanded && (
        <div className="p-2 space-y-1 bg-white divide-y divide-slate-50">
          {module.lessons.map((lesson) => (
            <LessonListItem
              key={lesson.id}
              lesson={lesson}
              isActive={lesson.id === activeLessonId}
              isCompleted={completedLessonIds.has(lesson.id)}
              onSelect={onSelectLesson}
            />
          ))}
        </div>
      )}
    </div>
  );
};
