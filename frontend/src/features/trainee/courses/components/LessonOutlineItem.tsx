'use client';

import React from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Circle,
  Video,
  FileText,
  HelpCircle,
  Layers,
  Sparkles,
  Lock,
} from 'lucide-react';
import { LessonOutlineItem as LessonItemType } from '../types/viewer.types';

interface LessonOutlineItemProps {
  courseId: string;
  lesson: LessonItemType;
  isActive: boolean;
  onSelect?: () => void;
}

export const LessonOutlineItem = React.memo(function LessonOutlineItem({
  courseId,
  lesson,
  isActive,
  onSelect,
}: LessonOutlineItemProps) {
  // Content type icon
  const renderTypeIcon = () => {
    switch (lesson.contentType?.toUpperCase()) {
      case 'VIDEO':
        return <Video className="w-3 h-3 text-slate-400 shrink-0" />;
      case 'DOCUMENT':
      case 'PDF':
      case 'ARTICLE':
        return <FileText className="w-3 h-3 text-slate-400 shrink-0" />;
      case 'QUIZ':
      case 'ASSESSMENT':
        return <HelpCircle className="w-3 h-3 text-indigo-400 shrink-0" />;
      default:
        return <Layers className="w-3 h-3 text-slate-400 shrink-0" />;
    }
  };

  return (
    <Link
      href={`/trainee/courses/${courseId}/learn/${lesson.id}`}
      onClick={onSelect}
      className={`group relative p-2.5 rounded-xl text-xs flex items-center justify-between transition-all ${
        isActive
          ? 'bg-indigo-600/90 text-white font-semibold shadow-md shadow-indigo-950/50 border border-indigo-500/50'
          : 'hover:bg-slate-800/70 text-slate-300 hover:text-white border border-transparent'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0 pr-2">
        {/* Status indicator: Completed ✓, Active ◉, or Incomplete ○ */}
        {lesson.isCompleted ? (
          <CheckCircle2
            className={`w-4 h-4 shrink-0 ${
              isActive ? 'text-emerald-300' : 'text-emerald-400'
            }`}
          />
        ) : isActive ? (
          <div className="w-4 h-4 rounded-full border-2 border-white flex items-center justify-center shrink-0">
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          </div>
        ) : (
          <Circle className="w-4 h-4 text-slate-600 group-hover:text-slate-500 shrink-0" />
        )}

        <div className="flex items-center gap-1.5 min-w-0">
          {renderTypeIcon()}
          <span className="truncate leading-tight">{lesson.title}</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {lesson.resourceCount > 0 && (
          <span
            className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
              isActive
                ? 'bg-indigo-700/80 text-indigo-100'
                : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'
            }`}
            title={`${lesson.resourceCount} attached resources`}
          >
            {lesson.resourceCount} files
          </span>
        )}

        <span
          className={`text-[10px] shrink-0 font-mono ${
            isActive ? 'text-indigo-200' : 'text-slate-500 group-hover:text-slate-400'
          }`}
        >
          {lesson.durationMinutes || 10}m
        </span>
      </div>
    </Link>
  );
});
