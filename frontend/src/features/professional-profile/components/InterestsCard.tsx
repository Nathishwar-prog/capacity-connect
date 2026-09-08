'use client';

import React, { useState } from 'react';
import { Compass, Plus, X, Sparkles } from 'lucide-react';
import { domainSuggestedInterests } from '../utils/mockData';
import { useLanguageStore } from '@/store/language';
import { useProfileTranslation } from '../utils/i18n';

interface Props {
  interests: string[];
  onAddInterest: (name: string) => Promise<any>;
  onRemoveInterest: (name: string) => Promise<any>;
}

export const InterestsCard: React.FC<Props> = ({ interests, onAddInterest, onRemoveInterest }) => {
  const [newInterestInput, setNewInterestInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { language } = useLanguageStore();
  const t = useProfileTranslation(language);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInterestInput.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddInterest(newInterestInput.trim());
      setNewInterestInput('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddSuggested = async (suggested: string) => {
    setIsSubmitting(true);
    try {
      await onAddInterest(suggested);
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableSuggestions = domainSuggestedInterests.filter(
    (suggested) => !interests.some((i) => i.toLowerCase() === suggested.toLowerCase()),
  );

  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <h2 className="text-lg font-black text-slate-900 tracking-tight">{t.interestsTitle}</h2>
            <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {interests.length}
            </span>
          </div>
          <p className="text-xs text-slate-500 max-w-xl">{t.interestsDesc}</p>
        </div>
      </div>

      {/* Input to add interest */}
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          value={newInterestInput}
          onChange={(e) => setNewInterestInput(e.target.value)}
          placeholder={t.typeInterestPlaceholder}
          className="flex-1 px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        />
        <button
          type="submit"
          disabled={!newInterestInput.trim() || isSubmitting}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0B192C] hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors shadow-2xs shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{t.addInterest}</span>
        </button>
      </form>

      {/* Active Interests Chips */}
      {interests.length === 0 ? (
        <div className="py-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 space-y-2">
          <Compass className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-xs text-slate-500">{t.noInterests}</p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2 pt-1">
          {interests.map((interest) => (
            <span
              key={interest}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50/80 text-blue-900 border border-blue-200/80 group hover:border-blue-300 hover:bg-blue-100/70 transition-all shadow-2xs"
            >
              <span>{interest}</span>
              <button
                type="button"
                onClick={() => onRemoveInterest(interest)}
                className="text-blue-400 hover:text-red-600 rounded-full p-0.5 hover:bg-white transition-colors"
                title="Remove interest"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Suggested Domain Research Interests */}
      {availableSuggestions.length > 0 && (
        <div className="pt-4 border-t border-slate-100 space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>{t.suggestedInterests}</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {availableSuggestions.map((sug) => (
              <button
                key={sug}
                type="button"
                onClick={() => handleAddSuggested(sug)}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-50 text-slate-700 border border-slate-200 hover:bg-blue-50 hover:text-blue-800 hover:border-blue-300 transition-colors"
              >
                <Plus className="w-3 h-3 text-blue-600" />
                <span>{sug}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
