'use client';

import React from 'react';
import { X, Award, CheckCircle, ExternalLink, ShieldCheck, Calendar } from 'lucide-react';
import { TraineeCertificate } from '../types/professional-profile.types';
import { useLanguageStore } from '@/store/language';
import { useProfileTranslation } from '../utils/i18n';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  certificate: TraineeCertificate | null;
}

export const ViewCertificateModal: React.FC<Props> = ({ isOpen, onClose, certificate }) => {
  const { language } = useLanguageStore();
  const t = useProfileTranslation(language);

  if (!isOpen || !certificate) return null;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Lifetime / Permanent';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
            <Award className="w-5 h-5 text-amber-600" />
            <span>{t.modalCertificateDetails}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Certificate Card Content */}
        <div className="p-6 space-y-5">
          <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <CheckCircle className="w-3 h-3 text-emerald-600" />
                <span>{t.verified}</span>
              </span>
              <span className="text-[10px] font-mono text-slate-500 font-bold">
                WMO-258 STANDARD
              </span>
            </div>

            <h3 className="text-base font-black text-slate-900 leading-tight">
              {certificate.title}
            </h3>

            <p className="text-xs font-semibold text-slate-700">
              {certificate.issuingOrganization}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60 space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-slate-400">
                {t.credentialId}
              </span>
              <p className="font-mono font-bold text-slate-800 text-[11px] break-all">
                {certificate.credentialId || 'N/A'}
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60 space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-slate-400">
                {t.issuedOn}
              </span>
              <p className="font-semibold text-slate-800 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>{formatDate(certificate.issueDate)}</span>
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200/60 flex items-start gap-2.5 text-xs text-blue-900">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed text-[11px]">
              This accreditation is cryptographically verified under the Ministry of Earth Sciences
              and World Meteorological Organization RTC registry.
            </p>
          </div>

          {/* Action */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              {t.closeModal}
            </button>
            {certificate.certificateUrl && (
              <a
                href={certificate.certificateUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#0B192C] hover:bg-slate-800 rounded-xl transition-colors shadow-xs"
              >
                <span>Verify on Registry</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
