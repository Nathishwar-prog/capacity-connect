'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, GraduationCap } from 'lucide-react';
import { Qualification, QualificationInput } from '../types/professional-profile.types';
import {
  qualificationFormSchema,
  QualificationFormValues,
} from '../validation/professionalProfile.validation';
import { useLanguageStore } from '@/store/language';
import { useProfileTranslation } from '../utils/i18n';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  qualificationToEdit?: Qualification | null;
  onSave: (data: QualificationInput) => Promise<any>;
  isLoading: boolean;
}

export const AddEditQualificationModal: React.FC<Props> = ({
  isOpen,
  onClose,
  qualificationToEdit,
  onSave,
  isLoading,
}) => {
  const { language } = useLanguageStore();
  const t = useProfileTranslation(language);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<QualificationFormValues>({
    resolver: zodResolver(qualificationFormSchema),
    defaultValues: {
      degree: '',
      fieldOfStudy: '',
      institution: '',
      startDate: '',
      endDate: '',
      description: '',
    },
  });

  useEffect(() => {
    if (qualificationToEdit) {
      reset({
        degree: qualificationToEdit.degree,
        fieldOfStudy: qualificationToEdit.fieldOfStudy,
        institution: qualificationToEdit.institution,
        startDate: qualificationToEdit.startDate
          ? qualificationToEdit.startDate.substring(0, 10)
          : '',
        endDate: qualificationToEdit.endDate ? qualificationToEdit.endDate.substring(0, 10) : '',
        description: qualificationToEdit.description || '',
      });
    } else {
      reset({
        degree: '',
        fieldOfStudy: '',
        institution: '',
        startDate: '',
        endDate: '',
        description: '',
      });
    }
  }, [qualificationToEdit, reset, isOpen]);

  if (!isOpen) return null;

  const onSubmit = async (values: QualificationFormValues) => {
    await onSave(values);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
            <GraduationCap className="w-5 h-5 text-blue-600" />
            <span>{qualificationToEdit ? t.modalEditQualification : t.modalAddQualification}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t.degree} *</label>
            <input
              type="text"
              placeholder="e.g. M.Sc. in Meteorology"
              {...register('degree')}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            {errors.degree && (
              <p className="text-[11px] text-red-600 mt-1">{errors.degree.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t.fieldOfStudy} *
            </label>
            <input
              type="text"
              placeholder="e.g. Tropical Meteorology & Cyclone Modeling"
              {...register('fieldOfStudy')}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            {errors.fieldOfStudy && (
              <p className="text-[11px] text-red-600 mt-1">{errors.fieldOfStudy.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t.institution} *</label>
            <input
              type="text"
              placeholder="e.g. Cochin University of Science and Technology"
              {...register('institution')}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            {errors.institution && (
              <p className="text-[11px] text-red-600 mt-1">{errors.institution.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t.startDate}</label>
              <input
                type="date"
                {...register('startDate')}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t.endDate} *</label>
              <input
                type="date"
                {...register('endDate')}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              {errors.endDate && (
                <p className="text-[11px] text-red-600 mt-1">{errors.endDate.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t.description}</label>
            <textarea
              rows={2}
              placeholder="Key subjects, thesis focus, honors or distinction..."
              {...register('description')}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-xs font-bold text-white bg-[#0B192C] hover:bg-slate-800 rounded-xl transition-colors shadow-xs"
            >
              {isLoading ? 'Saving...' : t.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
