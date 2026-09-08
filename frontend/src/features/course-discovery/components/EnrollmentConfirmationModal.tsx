'use client';

import React from 'react';
import { BookOpen, CheckCircle, AlertCircle, X, ShieldCheck } from 'lucide-react';
import { CourseSummary } from '../types/course-discovery.types';
import { useLanguageStore } from '@/store/language';
import { useCourseDiscoveryTranslation } from '../utils/i18n';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  course: CourseSummary | null;
  onConfirm: (courseId: string) => Promise<any>;
  isLoading: boolean;
}

export const EnrollmentConfirmationModal: React.FC<Props> = ({
  isOpen,
  onClose,
  course,
  onConfirm,
  isLoading,
}) => {
  const { language } = useLanguageStore();
  const t = useCourseDiscoveryTranslation(language);

  if (!isOpen || !course) return null;

  const handleConfirm = async () => {
    await onConfirm(course.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden p-6 space-y-5 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">{t.confirmTitle}</h3>
              <p className="text-[11px] text-slate-400 font-medium">MoES / IMD Learning Registry</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message & Course Preview */}
        <div className="space-y-3">
          <p className="text-xs sm:text-sm font-bold text-slate-800 leading-snug">
            {t.confirmMessage}
          </p>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
              {course.category.replace(/_/g, ' ')}
            </span>
            <h4 className="text-xs font-black text-slate-900 leading-snug">{course.title}</h4>
            <p className="text-[11px] text-slate-500">
              {t.trainerBy}: {course.trainer.name}
            </p>
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed">{t.confirmSubtext}</p>
        </div>

        {/* Actions */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            {t.cancelAction}
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#0B192C] hover:bg-slate-800 rounded-xl transition-colors shadow-xs"
          >
            {isLoading ? (
              <span>{t.enrolling}</span>
            ) : (
              <>
                <CheckCircle className="w-3.5 h-3.5" />
                <span>{t.confirmAction}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
