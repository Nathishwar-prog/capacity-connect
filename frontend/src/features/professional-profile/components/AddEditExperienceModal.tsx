'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Briefcase } from 'lucide-react';
import { WorkExperience, ExperienceInput } from '../types/professional-profile.types';
import {
  experienceFormSchema,
  ExperienceFormValues,
} from '../validation/professionalProfile.validation';
import { useLanguageStore } from '@/store/language';
import { useProfileTranslation } from '../utils/i18n';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  experienceToEdit?: WorkExperience | null;
  onSave: (data: ExperienceInput) => Promise<any>;
  isLoading: boolean;
}

export const AddEditExperienceModal: React.FC<Props> = ({
  isOpen,
  onClose,
  experienceToEdit,
  onSave,
  isLoading,
}) => {
  const { language } = useLanguageStore();
  const t = useProfileTranslation(language);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ExperienceFormValues>({
    resolver: zodResolver(experienceFormSchema),
    defaultValues: {
      companyName: '',
      jobTitle: '',
      startDate: '',
      endDate: '',
      isCurrent: false,
      description: '',
    },
  });

  const isCurrent = watch('isCurrent');

  useEffect(() => {
    if (experienceToEdit) {
      reset({
        companyName: experienceToEdit.companyName,
        jobTitle: experienceToEdit.jobTitle,
        startDate: experienceToEdit.startDate ? experienceToEdit.startDate.substring(0, 10) : '',
        endDate: experienceToEdit.endDate ? experienceToEdit.endDate.substring(0, 10) : '',
        isCurrent: experienceToEdit.isCurrent,
        description: experienceToEdit.description || '',
      });
    } else {
      reset({
        companyName: '',
        jobTitle: '',
        startDate: '',
        endDate: '',
        isCurrent: false,
        description: '',
      });
    }
  }, [experienceToEdit, reset, isOpen]);

  if (!isOpen) return null;

  const onSubmit = async (values: ExperienceFormValues) => {
    await onSave({
      ...values,
      endDate: values.isCurrent ? null : values.endDate,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
            <Briefcase className="w-5 h-5 text-indigo-600" />
            <span>{experienceToEdit ? t.modalEditExperience : t.modalAddExperience}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t.companyName} *</label>
            <input
              type="text"
              placeholder="e.g. National Weather Forecasting Centre, IMD"
              {...register('companyName')}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            {errors.companyName && (
              <p className="text-[11px] text-red-600 mt-1">{errors.companyName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t.jobTitle} *</label>
            <input
              type="text"
              placeholder="e.g. Operational Forecaster Trainee (Grade I)"
              {...register('jobTitle')}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            {errors.jobTitle && (
              <p className="text-[11px] text-red-600 mt-1">{errors.jobTitle.message}</p>
            )}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isCurrent"
              {...register('isCurrent')}
              onChange={(e) => {
                setValue('isCurrent', e.target.checked);
                if (e.target.checked) {
                  setValue('endDate', '');
                }
              }}
              className="w-4 h-4 text-blue-600 rounded-md border-slate-300 focus:ring-blue-500"
            />
            <label htmlFor="isCurrent" className="text-xs font-bold text-slate-700 cursor-pointer">
              {t.currentPosition}
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t.startDate} *</label>
              <input
                type="date"
                {...register('startDate')}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              {errors.startDate && (
                <p className="text-[11px] text-red-600 mt-1">{errors.startDate.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t.endDate} {isCurrent ? '(Present)' : '*'}
              </label>
              <input
                type="date"
                disabled={isCurrent}
                {...register('endDate')}
                className={`w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
                  isCurrent ? 'bg-slate-100 cursor-not-allowed text-slate-400' : ''
                }`}
              />
              {errors.endDate && (
                <p className="text-[11px] text-red-600 mt-1">{errors.endDate.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t.description}</label>
            <textarea
              rows={3}
              placeholder="Operational responsibilities, instruments handled, forecasting shifts..."
              {...register('description')}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Actions */}
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
