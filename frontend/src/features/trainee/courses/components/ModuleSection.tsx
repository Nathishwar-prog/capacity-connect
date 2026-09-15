'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight, CheckCircle2, ClipboardCheck, ArrowRight } from 'lucide-react';
import { ModuleOutline } from '../types/viewer.types';
import { LessonOutlineItem } from './LessonOutlineItem';

interface ModuleSectionProps {
  courseId: string;
  module: ModuleOutline;
  moduleIndex: number;
  activeLessonId?: string;
  onSelectLesson?: () => void;
  defaultExpanded?: boolean;
}

export const ModuleSection = React.memo(function ModuleSection({
  courseId,
  module,
  moduleIndex,
  activeLessonId,
  onSelectLesson,
  defaultExpanded = true,
}: ModuleSectionProps) {
  const isLessonInsideActive = (module.lessons || []).some((l) => l.id === activeLessonId);
  const [isExpanded, setIsExpanded] = useState(defaultExpanded || isLessonInsideActive);

  // Auto-expand module if the active lesson is inside it
  useEffect(() => {
    if (isLessonInsideActive) {
      setIsExpanded(true);
    }
  }, [isLessonInsideActive]);

  const isModuleFullyCompleted =
    module.totalCount > 0 && module.completedCount === module.totalCount;

  // Format module number e.g. "Module 01"
  const formattedIndex = String(moduleIndex + 1).padStart(2, '0');

  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 overflow-hidden transition-all shadow-sm">
      {/* Module Header Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 bg-slate-900/90 hover:bg-slate-850 text-left flex items-start justify-between gap-2.5 transition-colors group"
      >
        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-wider text-indigo-400 uppercase">
              Module {formattedIndex}
            </span>
            {isModuleFullyCompleted && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/40 px-1.5 py-0.2 rounded border border-emerald-800/50">
                <CheckCircle2 className="w-3 h-3" /> Done
              </span>
            )}
          </div>

          <h3 className="text-xs font-bold text-slate-200 group-hover:text-white truncate leading-snug">
            {module.title}
          </h3>

          <div className="flex items-center gap-2 text-[10px] text-slate-400 pt-0.5">
            <span className="font-semibold text-slate-300">
              {module.completedCount} / {module.totalCount} completed
            </span>
            <span>•</span>
            <span>{module.durationMinutes || 30}m</span>
          </div>
        </div>

        <div className="p-1 rounded-lg text-slate-500 group-hover:text-slate-300 transition-colors shrink-0">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </div>
      </button>

      {/* Module Lessons Accordion Content */}
      {isExpanded && (
        <div className="p-1.5 space-y-1 border-t border-slate-800/50 bg-slate-950/40">
          {(module.lessons || []).map((lesson) => (
            <LessonOutlineItem
              key={lesson.id}
              courseId={courseId}
              lesson={lesson}
              isActive={lesson.id === activeLessonId}
              onSelect={onSelectLesson}
            />
          ))}

          {/* Module Assessments (Section 11, 12, 13) */}
          {(module.assessments || []).map((assessment) => (
            <Link
              key={assessment.id}
              href={`/trainee/courses/${courseId}/assessments/${assessment.id}`}
              className="group flex items-center justify-between gap-3 p-2.5 rounded-xl border border-indigo-900/50 bg-indigo-950/30 hover:bg-indigo-900/40 transition-all text-left"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/30">
                  <ClipboardCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                      Module Assessment
                    </span>
                    {assessment.isCompleted && assessment.passed && (
                      <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-800/40">
                        Passed ({assessment.percentage}%)
                      </span>
                    )}
                    {assessment.isCompleted && !assessment.passed && (
                      <span className="text-[9px] font-bold text-amber-400 bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-800/40">
                        Review Needed ({assessment.percentage}%)
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-slate-200 group-hover:text-white truncate">
                    {assessment.title}
                  </h4>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <span>{assessment.questionCount} Questions</span>
                    <span>•</span>
                    <span>{assessment.durationMinutes}m</span>
                    <span>•</span>
                    <span>Pass: {assessment.passingScore}%</span>
                  </div>
                </div>
              </div>
              <div className="shrink-0 text-slate-500 group-hover:text-indigo-400 transition-colors pr-1">
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
});
