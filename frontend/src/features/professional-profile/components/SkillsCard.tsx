'use client';

import React, { useState } from 'react';
import { Wrench, Plus, X, Sparkles } from 'lucide-react';
import { ProfessionalSkill } from '../types/professional-profile.types';
import { domainSuggestedSkills } from '../utils/mockData';
import { useLanguageStore } from '@/store/language';
import { useProfileTranslation } from '../utils/i18n';

interface Props {
  skills: ProfessionalSkill[];
  onAddSkill: (name: string) => Promise<any>;
  onRemoveSkill: (id: string) => Promise<any>;
}

export const SkillsCard: React.FC<Props> = ({ skills, onAddSkill, onRemoveSkill }) => {
  const [newSkillInput, setNewSkillInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { language } = useLanguageStore();
  const t = useProfileTranslation(language);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillInput.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddSkill(newSkillInput.trim());
      setNewSkillInput('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddSuggested = async (suggested: string) => {
    setIsSubmitting(true);
    try {
      await onAddSkill(suggested);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter out suggestions that are already in the trainee's skill list
  const availableSuggestions = domainSuggestedSkills.filter(
    (suggested) => !skills.some((s) => s.name.toLowerCase() === suggested.toLowerCase()),
  );

  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            <h2 className="text-lg font-black text-slate-900 tracking-tight">{t.skillsTitle}</h2>
            <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {skills.length}
            </span>
          </div>
          <p className="text-xs text-slate-500 max-w-xl">{t.skillsDesc}</p>
        </div>
      </div>

      {/* Input to add skill */}
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          value={newSkillInput}
          onChange={(e) => setNewSkillInput(e.target.value)}
          placeholder={t.typeSkillPlaceholder}
          className="flex-1 px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
        />
        <button
          type="submit"
          disabled={!newSkillInput.trim() || isSubmitting}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0B192C] hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors shadow-2xs shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{t.addSkill}</span>
        </button>
      </form>

      {/* Active Skills Chips */}
      {skills.length === 0 ? (
        <div className="py-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 space-y-2">
          <Wrench className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-xs text-slate-500">{t.noSkills}</p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2 pt-1">
          {skills.map((skill) => (
            <span
              key={skill.id}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100/80 text-slate-800 border border-slate-200/80 group hover:border-slate-300 hover:bg-slate-200/60 transition-all shadow-2xs"
            >
              <span>{skill.name}</span>
              <button
                type="button"
                onClick={() => onRemoveSkill(skill.id)}
                className="text-slate-400 hover:text-red-600 rounded-full p-0.5 hover:bg-white transition-colors"
                title="Remove skill"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Suggested Domain Skills */}
      {availableSuggestions.length > 0 && (
        <div className="pt-4 border-t border-slate-100 space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t.suggestedSkills}</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {availableSuggestions.map((sug) => (
              <button
                key={sug}
                type="button"
                onClick={() => handleAddSuggested(sug)}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50/60 text-emerald-800 border border-emerald-200/60 hover:bg-emerald-100 hover:border-emerald-300 transition-colors"
              >
                <Plus className="w-3 h-3 text-emerald-600" />
                <span>{sug}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
