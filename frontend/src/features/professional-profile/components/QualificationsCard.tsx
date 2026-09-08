'use client';

import React, { useState } from 'react';
import { GraduationCap, Plus, Edit2, Trash2, Calendar, Building } from 'lucide-react';
import { Qualification, QualificationInput } from '../types/professional-profile.types';
import { AddEditQualificationModal } from './AddEditQualificationModal';
import { useLanguageStore } from '@/store/language';
import { useProfileTranslation } from '../utils/i18n';

interface Props {
  qualifications: Qualification[];
  onAdd: (data: QualificationInput) => Promise<any>;
  onUpdate: (id: string, data: Partial<QualificationInput>) => Promise<any>;
  onDelete: (id: string) => Promise<any>;
  isAdding: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

export const QualificationsCard: React.FC<Props> = ({
  qualifications,
  onAdd,
  onUpdate,
  onDelete,
  isAdding,
  isUpdating,
  isDeleting,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedQualification, setSelectedQualification] = useState<Qualification | null>(null);

  const { language } = useLanguageStore();
  const t = useProfileTranslation(language);

  const handleOpenAdd = () => {
    setSelectedQualification(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (qual: Qualification) => {
    setSelectedQualification(qual);
    setModalOpen(true);
  };

  const handleSave = async (data: QualificationInput) => {
    if (selectedQualification) {
      await onUpdate(selectedQualification.id, data);
    } else {
      await onAdd(data);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this qualification?')) {
      await onDelete(id);
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              {t.qualificationsTitle}
            </h2>
            <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {qualifications.length}
            </span>
          </div>
          <p className="text-xs text-slate-500 max-w-xl">{t.qualificationsDesc}</p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#0B192C] hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors shrink-0 shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{t.addQualification}</span>
        </button>
      </div>

      {/* Qualifications List */}
      {qualifications.length === 0 ? (
        <div className="py-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 space-y-2">
          <GraduationCap className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-xs text-slate-500">{t.noQualifications}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {qualifications.map((qual) => (
            <div
              key={qual.id}
              className="p-4 sm:p-5 rounded-2xl border border-slate-200/80 bg-slate-50/40 hover:bg-white hover:border-blue-200 transition-all space-y-2.5 group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                    {qual.degree}
                  </h3>
                  <p className="text-xs font-semibold text-blue-700">{qual.fieldOfStudy}</p>
                </div>

                <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(qual)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title={t.editAction}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(qual.id)}
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
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  <span>{qual.institution}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{qual.endDate ? new Date(qual.endDate).getFullYear() : 'Completed'}</span>
                </span>
              </div>

              {qual.description && (
                <p className="text-xs text-slate-600 pt-1 leading-relaxed border-t border-slate-200/60">
                  {qual.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <AddEditQualificationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        qualificationToEdit={selectedQualification}
        onSave={handleSave}
        isLoading={isAdding || isUpdating}
      />
    </div>
  );
};
