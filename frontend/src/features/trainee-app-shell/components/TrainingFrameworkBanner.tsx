'use client';

import React, { useState } from 'react';
import { ShieldCheck, ChevronDown } from 'lucide-react';
import { useLanguageStore } from '@/store/language';
import { getTranslation } from '@/features/trainee-dashboard/utils/i18n';

export const TrainingFrameworkBanner: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { language } = useLanguageStore();
  const t = getTranslation(language);

  return (
    <div className="mb-6 rounded-2xl bg-gradient-to-r from-[#07172C] via-[#0B2447] to-[#143C6D] border border-sky-900/50 p-4 text-white shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left Badge & Framework Description */}
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-400/30 text-amber-400 flex items-center justify-center shrink-0 shadow-inner">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
          </div>

          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-extrabold tracking-wider uppercase text-white">
                {t.frameworkTitle}
              </span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-sky-400/20 text-sky-200 border border-sky-400/30 tracking-tight">
                {t.frameworkStandard}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-medium truncate">{t.frameworkSubtitle}</p>
          </div>
        </div>

        {/* Right: View Workflow Button */}
        <div className="shrink-0 flex items-center gap-2 self-end sm:self-center">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-semibold text-white transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:outline-none"
            aria-expanded={isExpanded}
          >
            <span>{t.viewWorkflow}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                isExpanded ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* Expandable Workflow Lifecycle Explanation */}
      {isExpanded && (
        <div className="mt-4 pt-3.5 border-t border-white/10 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs animate-in fade-in duration-200">
          <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
            <span className="text-[10px] font-bold text-sky-300 uppercase block">Phase 1</span>
            <span className="font-bold text-white block mt-0.5">Foundational Induction</span>
            <p className="text-[10px] text-slate-300 mt-1">
              Observational fundamentals, BIP-M WMO compliance, and core synoptic analysis.
            </p>
          </div>
          <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
            <span className="text-[10px] font-bold text-sky-300 uppercase block">Phase 2</span>
            <span className="font-bold text-white block mt-0.5">NWP & Remote Sensing</span>
            <p className="text-[10px] text-slate-300 mt-1">
              Numerical model interpretation, Doppler weather radar analysis & INSAT imagery.
            </p>
          </div>
          <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
            <span className="text-[10px] font-bold text-sky-300 uppercase block">Phase 3</span>
            <span className="font-bold text-white block mt-0.5">Active Simulation</span>
            <p className="text-[10px] text-slate-300 mt-1">
              Live severe weather early warning, cyclone tracking & hydrology alert simulations.
            </p>
          </div>
          <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
            <span className="text-[10px] font-bold text-sky-300 uppercase block">Phase 4</span>
            <span className="font-bold text-white block mt-0.5">Competency Certification</span>
            <p className="text-[10px] text-slate-300 mt-1">
              Final institutional evaluation, Forecaster Competency credentialing and sign-off.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainingFrameworkBanner;
