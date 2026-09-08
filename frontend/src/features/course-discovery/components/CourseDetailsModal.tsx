'use client';

import React, { useState } from 'react';
import {
  X,
  Clock,
  BookOpen,
  Award,
  CheckCircle,
  AlertCircle,
  PlayCircle,
  User,
  Building2,
  FileCheck,
  ChevronDown,
  ChevronUp,
  Plus,
} from 'lucide-react';
import { CourseDetails } from '../types/course-discovery.types';
import { useLanguageStore } from '@/store/language';
import { useCourseDiscoveryTranslation } from '../utils/i18n';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  course: CourseDetails | null;
  onEnrollPrompt: (course: CourseDetails) => void;
  isEnrolling: boolean;
}

export const CourseDetailsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  course,
  onEnrollPrompt,
  isEnrolling,
}) => {
  const { language } = useLanguageStore();
  const t = useCourseDiscoveryTranslation(language);

  const [activeTab, setActiveTab] = useState<
    'OVERVIEW' | 'SYLLABUS' | 'PREREQUISITES' | 'COMPETENCIES' | 'TRAINER'
  >('OVERVIEW');
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  if (!isOpen || !course) return null;

  const durationHours = Math.round(course.durationMinutes / 60);

  const formatCategory = (cat: string) => cat.replace(/_/g, ' ');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/60 gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                {formatCategory(course.category)}
              </span>
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {course.difficulty}
              </span>
              {course.isEnrolled && (
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                  <span>{t.alreadyEnrolled}</span>
                </span>
              )}
            </div>

            <h2 className="text-lg sm:text-xl font-black text-slate-900 leading-snug">
              {course.title}
            </h2>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {durationHours} {t.hours}
                </span>
              </span>
              <span className="flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {course.modules?.length || 4} {t.modules}
                </span>
              </span>
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>{course.trainer.name}</span>
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="px-6 pt-3 border-b border-slate-100 bg-white flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('OVERVIEW')}
            className={`px-3.5 py-2 text-xs font-bold border-b-2 transition-all shrink-0 ${
              activeTab === 'OVERVIEW'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.tabOverview}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('SYLLABUS')}
            className={`px-3.5 py-2 text-xs font-bold border-b-2 transition-all shrink-0 ${
              activeTab === 'SYLLABUS'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.tabSyllabus}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('PREREQUISITES')}
            className={`px-3.5 py-2 text-xs font-bold border-b-2 transition-all shrink-0 ${
              activeTab === 'PREREQUISITES'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.tabPrerequisites}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('COMPETENCIES')}
            className={`px-3.5 py-2 text-xs font-bold border-b-2 transition-all shrink-0 ${
              activeTab === 'COMPETENCIES'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.tabCompetencies}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('TRAINER')}
            className={`px-3.5 py-2 text-xs font-bold border-b-2 transition-all shrink-0 ${
              activeTab === 'TRAINER'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.tabTrainer}
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* TAB 1: OVERVIEW & OBJECTIVES */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="space-y-2">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Course Summary
                </h4>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  {course.description}
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  {t.objectivesTitle}
                </h4>
                <div className="space-y-2">
                  {(course.objectives || []).map((obj, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700">
                      <div className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <span className="leading-relaxed">{obj}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SYLLABUS & MODULES */}
          {activeTab === 'SYLLABUS' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              {(course.modules || []).map((mod) => {
                const isExpanded = expandedModule === mod.id || expandedModule === null;
                return (
                  <div
                    key={mod.id}
                    className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs"
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedModule(isExpanded ? '' : mod.id)}
                      className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/60 transition-colors"
                    >
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-black text-slate-900">{mod.title}</h4>
                        {mod.description && (
                          <p className="text-[11px] text-slate-500">{mod.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-slate-400">
                        <span className="text-[11px] font-semibold">
                          {mod.lessons?.length || 0} Lessons
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </button>

                    {isExpanded && mod.lessons && (
                      <div className="px-4 pb-3 border-t border-slate-100 divide-y divide-slate-100">
                        {mod.lessons.map((les) => (
                          <div
                            key={les.id}
                            className="py-2.5 flex items-center justify-between text-xs gap-3"
                          >
                            <div className="flex items-center gap-2">
                              <PlayCircle className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <span className="font-semibold text-slate-800">{les.title}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400 shrink-0">
                              <span>{les.durationMinutes} mins</span>
                              {les.isPreview && (
                                <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[9px] font-bold">
                                  {t.previewLesson}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: PREREQUISITES */}
          {activeTab === 'PREREQUISITES' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {course.prerequisites && course.prerequisites.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500 font-medium">{t.prerequisitesRequired}</p>
                  <div className="space-y-2">
                    {course.prerequisites.map((p) => (
                      <div
                        key={p.id}
                        className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                      >
                        <div className="space-y-0.5">
                          <p className="font-extrabold text-slate-900">{p.title}</p>
                          <p className="text-[11px] text-slate-500">
                            Domain: {formatCategory(p.category)}
                          </p>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200">
                          {p.difficulty}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-black text-emerald-900">Open Enrollment Track</h4>
                    <p className="text-xs text-emerald-700">{t.noPrerequisites}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: COMPETENCY OUTCOMES */}
          {activeTab === 'COMPETENCIES' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                {t.competenciesTitle}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(course.competencies || []).map((comp) => (
                  <div
                    key={comp.id}
                    className="p-3.5 rounded-2xl bg-slate-50/60 border border-slate-200 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-400 font-bold">
                        {comp.code}
                      </span>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        Level {comp.targetLevel}
                      </span>
                    </div>
                    <p className="text-xs font-black text-slate-800">{comp.name}</p>
                    <p className="text-[11px] text-slate-500">
                      {t.targetLevel}: Level {comp.targetLevel}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: TRAINER PROFILE */}
          {activeTab === 'TRAINER' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-base shrink-0">
                  <User className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-slate-900">{course.trainer.name}</h4>
                  <p className="text-xs font-semibold text-blue-700">
                    {course.trainer.designation}
                  </p>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>{course.trainer.organizationName}</span>
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Accredited training faculty member under the Ministry of Earth Sciences and World
                Meteorological Organization capacity-building network.
              </p>
            </div>
          )}
        </div>

        {/* Modal Bottom Action Bar */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            {t.close}
          </button>

          {course.isEnrolled ? (
            <div className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>{t.alreadyEnrolled}</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onEnrollPrompt(course)}
              disabled={isEnrolling}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0B192C] hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              <span>{t.enrollNow}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
