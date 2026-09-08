'use client';

import React, { useState } from 'react';
import { Compass, CheckCircle2, AlertCircle } from 'lucide-react';
import { useCourseDiscovery } from '../hooks/useCourseDiscovery';
import { CourseSearch } from './CourseSearch';
import { CourseFilters } from './CourseFilters';
import { CourseGrid } from './CourseGrid';
import { CourseDetailsModal } from './CourseDetailsModal';
import { EnrollmentConfirmationModal } from './EnrollmentConfirmationModal';
import { CourseSummary, CourseDetails } from '../types/course-discovery.types';
import { useLanguageStore } from '@/store/language';
import { useCourseDiscoveryTranslation } from '../utils/i18n';

export const CourseDiscovery: React.FC = () => {
  const { language } = useLanguageStore();
  const t = useCourseDiscoveryTranslation(language);

  const {
    courses,
    total,
    totalPages,
    page,
    filtersMetadata,
    isLoading,
    isError,
    search,
    setSearch,
    category,
    setCategory,
    difficulty,
    setDifficulty,
    trainerId,
    setTrainerId,
    sortBy,
    setSortBy,
    setPage,
    clearFilters,
    activeFiltersCount,
    enrollInCourse,
    isEnrolling,
    getCourseById,
  } = useCourseDiscovery();

  // Modal states
  const [selectedCourseForDetails, setSelectedCourseForDetails] = useState<CourseDetails | null>(
    null,
  );
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedCourseForEnroll, setSelectedCourseForEnroll] = useState<CourseSummary | null>(
    null,
  );
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const handleOpenDetails = (courseId: string) => {
    const details = getCourseById(courseId);
    if (details) {
      setSelectedCourseForDetails(details);
    } else {
      const summary = courses.find((c) => c.id === courseId);
      if (summary) {
        setSelectedCourseForDetails({
          ...summary,
          objectives: [
            'Understand operational meteorological principles and scientific analysis.',
            'Apply observational satellite and radar tools for nowcasting and forecasting.',
            'Comply with WMO-258 standards in weather reporting and hazard verification.',
          ],
          modules: [],
          prerequisites: [],
          competencies: [],
          publishedAt: null,
        });
      }
    }
    setDetailsModalOpen(true);
  };

  const handleOpenEnrollPrompt = (course: CourseSummary) => {
    setSelectedCourseForEnroll(course);
    setConfirmModalOpen(true);
  };

  const handleConfirmEnrollment = async (courseId: string) => {
    try {
      await enrollInCourse(courseId);
      setSuccessToast(t.enrollSuccessToast);
      setTimeout(() => setSuccessToast(null), 3500);

      // If details modal is currently open for this course, update its isEnrolled status
      if (selectedCourseForDetails && selectedCourseForDetails.id === courseId) {
        setSelectedCourseForDetails((prev) =>
          prev ? { ...prev, isEnrolled: true, enrollmentStatus: 'ENROLLED' } : null,
        );
      }
    } catch {
      // Fallback
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Header Card */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{t.pageTitle}</h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">{t.pageSubtitle}</p>
          </div>

          <div className="p-3 bg-blue-50/80 rounded-2xl border border-blue-100 flex items-center gap-3 shrink-0">
            <Compass className="w-7 h-7 text-blue-600" />
            <div>
              <p className="text-[10px] font-extrabold uppercase text-blue-700">WMO-258 Catalog</p>
              <p className="text-xs font-black text-slate-800">{total} Programs Available</p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <CourseSearch search={search} onSearchChange={setSearch} onClear={() => setSearch('')} />

        {/* Multi-Faceted Filters Panel */}
        <div className="pt-2 border-t border-slate-100">
          <CourseFilters
            category={category}
            onCategoryChange={setCategory}
            difficulty={difficulty}
            onDifficultyChange={setDifficulty}
            trainerId={trainerId}
            onTrainerChange={setTrainerId}
            sortBy={sortBy}
            onSortByChange={setSortBy}
            onClearAll={clearFilters}
            activeCount={activeFiltersCount}
            totalResults={total}
            metadata={filtersMetadata}
          />
        </div>
      </div>

      {/* Success Notification Toast */}
      {successToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2.5 animate-in fade-in shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Course Cards Grid */}
      <CourseGrid
        courses={courses}
        isLoading={isLoading}
        onViewDetails={handleOpenDetails}
        onEnrollPrompt={handleOpenEnrollPrompt}
        onResetFilters={clearFilters}
        isEnrolling={isEnrolling}
      />

      {/* Pagination (if totalPages > 1) */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-xl text-xs font-bold transition-colors ${
                page === p
                  ? 'bg-[#0B192C] text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Course Details Modal */}
      <CourseDetailsModal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        course={selectedCourseForDetails}
        onEnrollPrompt={handleOpenEnrollPrompt}
        isEnrolling={isEnrolling}
      />

      {/* Enrollment Confirmation Modal */}
      <EnrollmentConfirmationModal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        course={selectedCourseForEnroll}
        onConfirm={handleConfirmEnrollment}
        isLoading={isEnrolling}
      />
    </div>
  );
};
