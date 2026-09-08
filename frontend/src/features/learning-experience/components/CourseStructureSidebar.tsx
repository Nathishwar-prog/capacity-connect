'use client';

import React from 'react';
import { BookOpen, Layers } from 'lucide-react';
import { ModuleSummary } from '../types/learning-experience.types';
import { ModuleAccordion } from './ModuleAccordion';
import { useLanguageStore } from '@/store/language';
import { useLearningTranslation } from '../utils/i18n';

interface Props {
  modules: ModuleSummary[];
  activeLessonId: string | null;
  completedLessonIds: Set<string>;
  onSelectLesson: (lessonId: string) => void;
}

export const CourseStructureSidebar: React.FC<Props> = ({
  modules,
  activeLessonId,
  completedLessonIds,
  onSelectLesson,
}) => {
  const { language } = useLanguageStore();
  const t = useLearningTranslation(language);

  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4 flex flex-col h-full">
      {/* Sidebar Top Title */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight">
              {t.courseContent}
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
              {modules.length} {t.modulesCount}
            </p>
          </div>
        </div>
      </div>

      {/* Module List Accordions */}
      <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-280px)] pr-1 custom-scrollbar">
        {modules.map((module) => (
          <ModuleAccordion
            key={module.id}
            module={module}
            activeLessonId={activeLessonId}
            completedLessonIds={completedLessonIds}
            onSelectLesson={onSelectLesson}
          />
        ))}
      </div>
    </div>
  );
};
