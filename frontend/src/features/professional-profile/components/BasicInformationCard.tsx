'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Building2,
  FileBadge,
  Edit3,
  Check,
  X,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { BasicInformation, UpdateBasicInfoInput } from '../types/professional-profile.types';
import {
  basicInfoFormSchema,
  BasicInfoFormValues,
} from '../validation/professionalProfile.validation';
import { useLanguageStore } from '@/store/language';
import { useProfileTranslation } from '../utils/i18n';

interface Props {
  basicInfo: BasicInformation;
  onSave: (data: UpdateBasicInfoInput) => Promise<any>;
  isSaving: boolean;
}

export const BasicInformationCard: React.FC<Props> = ({ basicInfo, onSave, isSaving }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState(false);

  const { language } = useLanguageStore();
  const t = useProfileTranslation(language);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BasicInfoFormValues>({
    resolver: zodResolver(basicInfoFormSchema),
    defaultValues: {
      firstName: basicInfo.firstName || '',
      lastName: basicInfo.lastName || '',
      email: basicInfo.email || '',
      phone: basicInfo.phone || '',
      age: basicInfo.age || 28,
      location: basicInfo.location || '',
      moesEmployeeId: basicInfo.moesEmployeeId || '',
      imdEmployeeId: basicInfo.imdEmployeeId || '',
      designation: basicInfo.designation || '',
      departmentName: basicInfo.departmentName || '',
      organizationName: basicInfo.organizationName || '',
      bio: basicInfo.bio || '',
    },
  });

  const onSubmit = async (values: BasicInfoFormValues) => {
    setServerError(null);
    try {
      await onSave(values);
      setIsEditing(false);
      setSuccessToast(true);
      setTimeout(() => setSuccessToast(false), 3000);
    } catch (err: any) {
      setServerError(err?.message || 'Failed to update basic information.');
    }
  };

  const handleCancel = () => {
    reset();
    setIsEditing(false);
    setServerError(null);
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <h2 className="text-lg font-black text-slate-900 tracking-tight">{t.basicInfoTitle}</h2>
          </div>
          <p className="text-xs text-slate-500 max-w-xl">{t.basicInfoDesc}</p>
        </div>

        {!isEditing ? (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors shrink-0"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{t.edit}</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span>{t.cancel}</span>
            </button>
            <button
              type="button"
              onClick={handleSubmit(onSubmit)}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#0B192C] hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors shadow-2xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : t.save}</span>
            </button>
          </div>
        )}
      </div>

      {serverError && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      {successToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{t.savedSuccess}</span>
        </div>
      )}

      {/* VIEW MODE */}
      {!isEditing ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider flex items-center gap-1">
                <User className="w-3 h-3" />
                <span>{t.fullName}</span>
              </span>
              <p className="text-sm font-bold text-slate-800">
                {basicInfo.firstName} {basicInfo.lastName || ''}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider flex items-center gap-1">
                <Mail className="w-3 h-3" />
                <span>{t.email}</span>
              </span>
              <p className="text-sm font-semibold text-slate-800">{basicInfo.email}</p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider flex items-center gap-1">
                <Phone className="w-3 h-3" />
                <span>{t.phone}</span>
              </span>
              <p className="text-sm font-semibold text-slate-800">
                {basicInfo.phone || 'Not provided'}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{t.age}</span>
              </span>
              <p className="text-sm font-semibold text-slate-800">
                {basicInfo.age ? `${basicInfo.age} Years` : '28 Years'}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span>{t.location}</span>
              </span>
              <p className="text-sm font-semibold text-slate-800">
                {basicInfo.location || 'New Delhi, India'}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider flex items-center gap-1">
                <FileBadge className="w-3 h-3" />
                <span>{t.moesId}</span>
              </span>
              <p className="text-sm font-mono font-bold text-blue-700">
                {basicInfo.moesEmployeeId || 'MoES-TR-2026-089'}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider flex items-center gap-1">
                <FileBadge className="w-3 h-3" />
                <span>{t.imdId}</span>
              </span>
              <p className="text-sm font-mono font-bold text-slate-700">
                {basicInfo.imdEmployeeId || 'IMD-FC-4492'}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                <span>{t.designation}</span>
              </span>
              <p className="text-sm font-semibold text-slate-800">
                {basicInfo.designation || 'Forecaster Grade I (Operational Trainee)'}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                <span>{t.department}</span>
              </span>
              <p className="text-sm font-semibold text-slate-800">
                {basicInfo.departmentName || 'National Weather Forecasting Centre (NWFC)'}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-1.5">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider flex items-center gap-1">
              <FileText className="w-3 h-3" />
              <span>{t.bio}</span>
            </span>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
              {basicInfo.bio ||
                'Operational meteorological forecaster specializing in mesoscale convective systems, numerical weather prediction interpretation, and Doppler radar velocity de-aliasing.'}
            </p>
          </div>
        </div>
      ) : (
        /* EDIT FORM MODE */
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t.firstName} *</label>
              <input
                type="text"
                {...register('firstName')}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              {errors.firstName && (
                <p className="text-[11px] text-red-600 mt-1">{errors.firstName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t.lastName}</label>
              <input
                type="text"
                {...register('lastName')}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t.email} *</label>
              <input
                type="email"
                {...register('email')}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 cursor-not-allowed"
                readOnly
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t.phone}</label>
              <input
                type="text"
                {...register('phone')}
                placeholder="+91 98401 23456"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              {errors.phone && (
                <p className="text-[11px] text-red-600 mt-1">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t.age}</label>
              <input
                type="number"
                {...register('age', { valueAsNumber: true })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              {errors.age && <p className="text-[11px] text-red-600 mt-1">{errors.age.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t.location}</label>
              <input
                type="text"
                {...register('location')}
                placeholder="Mausam Bhawan, New Delhi"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t.moesId}</label>
              <input
                type="text"
                {...register('moesEmployeeId')}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t.imdId}</label>
              <input
                type="text"
                {...register('imdEmployeeId')}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t.designation}</label>
              <input
                type="text"
                {...register('designation')}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">{t.department}</label>
              <input
                type="text"
                {...register('departmentName')}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t.bio}</label>
            <textarea
              rows={3}
              {...register('bio')}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            {errors.bio && <p className="text-[11px] text-red-600 mt-1">{errors.bio.message}</p>}
          </div>
        </form>
      )}
    </div>
  );
};
