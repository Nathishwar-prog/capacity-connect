'use client';

import React, { useState } from 'react';
import { Briefcase, Plus, Edit2, Trash2, Calendar, Building2, BadgeCheck } from 'lucide-react';
import { WorkExperience, ExperienceInput } from '../types/professional-profile.types';
import { AddEditExperienceModal } from './AddEditExperienceModal';
import { useLanguageStore } from '@/store/language';
import { useProfileTranslation } from '../utils/i18n';

interface Props {
  experiences: WorkExperience[];
  onAdd: (data: ExperienceInput) => Promise<any>;
  onUpdate: (id: string, data: Partial<ExperienceInput>) => Promise<any>;
  onDelete: (id: string) => Promise<any>;
  isAdding: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

export const ExperienceCard: React.FC<Props> = ({
  experiences,
  onAdd,
  onUpdate,
  onDelete,
  isAdding,
  isUpdating,
  isDeleting,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedExperience, setSelectedExperience] = useState<WorkExperience | null>(null);

  const { language } = useLanguageStore();
  const t = useProfileTranslation(language);

  const handleOpenAdd = () => {
    setSelectedExperience(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (exp: WorkExperience) => {
    setSelectedExperience(exp);
    setModalOpen(true);
  };

  const handleSave = async (data: ExperienceInput) => {
    if (selectedExperience) {
      await onUpdate(selectedExperience.id, data);
    } else {
      await onAdd(data);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this experience record?')) {
      await onDelete(id);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-600" />
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              {t.experienceTitle}
            </h2>
            <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {experiences.length}
            </span>
          </div>
          <p className="text-xs text-slate-500 max-w-xl">{t.experienceDesc}</p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#0B192C] hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors shrink-0 shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{t.addExperience}</span>
        </button>
      </div>

      {/* Experience List */}
      {experiences.length === 0 ? (
        <div className="py-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 space-y-2">
          <Briefcase className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-xs text-slate-500">{t.noExperience}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {experiences.map((exp) => (
            <div
              key={exp.id}
              className="p-4 sm:p-5 rounded-2xl border border-slate-200/80 bg-slate-50/40 hover:bg-white hover:border-indigo-200 transition-all space-y-2.5 group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                      {exp.jobTitle}
                    </h3>
                    {exp.isCurrent && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <BadgeCheck className="w-3 h-3 text-emerald-600" />
                        <span>{t.present}</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-indigo-700">{exp.companyName}</p>
                </div>

                <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(exp)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title={t.editAction}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(exp.id)}
                    disabled={isDeleting}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title={t.delete}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>{exp.companyName}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {formatDate(exp.startDate)} —{' '}
                    {exp.isCurrent ? t.present : formatDate(exp.endDate)}
                  </span>
                </span>
              </div>

              {exp.description && (
                <p className="text-xs text-slate-600 pt-1 leading-relaxed border-t border-slate-200/60">
                  {exp.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <AddEditExperienceModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        experienceToEdit={selectedExperience}
        onSave={handleSave}
        isLoading={isAdding || isUpdating}
      />
    </div>
  );
};
