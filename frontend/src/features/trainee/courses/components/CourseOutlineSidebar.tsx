'use client';

import React, { useState, useMemo } from 'react';
import { Layers, Search, X } from 'lucide-react';
import { CourseOutlineData } from '../types/viewer.types';
import { ModuleSection } from './ModuleSection';

interface CourseOutlineSidebarProps {
  courseId: string;
  outlineData: CourseOutlineData;
  activeLessonId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const CourseOutlineSidebar = React.memo(function CourseOutlineSidebar({
  courseId,
  outlineData,
  activeLessonId,
  isOpen,
  onClose,
}: CourseOutlineSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter modules and lessons based on search query
  const filteredModules = useMemo(() => {
    if (!searchQuery.trim()) return outlineData.modules;

    const query = searchQuery.toLowerCase();
    return outlineData.modules
      .map((mod) => {
        const matchesModule = mod.title.toLowerCase().includes(query);
        const matchingLessons = (mod.lessons || []).filter(
          (l) => l.title.toLowerCase().includes(query) || l.description?.toLowerCase().includes(query)
        );

        if (matchesModule || matchingLessons.length > 0) {
          return {
            ...mod,
            lessons: matchesModule ? mod.lessons : matchingLessons,
          };
        }
        return null;
      })
      .filter(Boolean) as typeof outlineData.modules;
  }, [outlineData.modules, searchQuery]);

  const { completedLessonsCount, totalLessonsCount } = outlineData.progress;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-80 sm:w-88 border-r border-slate-800/80 bg-slate-950 flex flex-col shrink-0 h-full overflow-hidden transition-all duration-300 shadow-2xl lg:shadow-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:hidden'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/90 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-950/60 border border-indigo-800/60 flex items-center justify-center text-indigo-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-white tracking-wide uppercase">
                Course Outline
              </span>
              <p className="text-[10px] text-slate-400">
                {completedLessonsCount} of {totalLessonsCount} completed
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors lg:hidden"
            aria-label="Close outline drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-slate-800/60 bg-slate-950/40 shrink-0">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search modules or lessons..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Modules Accordion Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
          {filteredModules.length === 0 ? (
            <div className="text-center py-10 px-4 space-y-2">
              <p className="text-xs text-slate-400">No lessons match your search query.</p>
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs font-semibold text-indigo-400 hover:underline"
              >
                Clear filter
              </button>
            </div>
          ) : (
            filteredModules.map((mod, mIdx) => (
              <ModuleSection
                key={mod.id || mIdx}
                courseId={courseId}
                module={mod}
                moduleIndex={mIdx}
                activeLessonId={activeLessonId}
                onSelectLesson={() => {
                  // If on mobile view, auto-close drawer on lesson select
                  if (window.innerWidth < 1024) {
                    onClose();
                  }
                }}
              />
            ))
          )}
        </div>
      </aside>
    </>
  );
});
