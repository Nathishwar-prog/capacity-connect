'use client';

import React, { useState } from 'react';
import { Award, CheckCircle, ExternalLink, Calendar, ShieldCheck } from 'lucide-react';
import { TraineeCertificate } from '../types/professional-profile.types';
import { ViewCertificateModal } from './ViewCertificateModal';
import { useLanguageStore } from '@/store/language';
import { useProfileTranslation } from '../utils/i18n';

interface Props {
  certificates: TraineeCertificate[];
}

export const CertificatesCard: React.FC<Props> = ({ certificates }) => {
  const [selectedCert, setSelectedCert] = useState<TraineeCertificate | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { language } = useLanguageStore();
  const t = useProfileTranslation(language);

  const handleOpenCert = (cert: TraineeCertificate) => {
    setSelectedCert(cert);
    setModalOpen(true);
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
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              {t.certificatesTitle}
            </h2>
            <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {certificates.length}
            </span>
          </div>
          <p className="text-xs text-slate-500 max-w-xl">{t.certificatesDesc}</p>
        </div>
      </div>

      {/* List */}
      {certificates.length === 0 ? (
        <div className="py-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 space-y-2">
          <Award className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-xs text-slate-500">{t.noCertificates}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {certificates.map((cert) => (
            <div
              key={cert.id}
              className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/40 hover:bg-white hover:border-amber-200 transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                    <span>{t.verified}</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 font-bold">
                    {cert.credentialId?.split('-').slice(0, 2).join('-') || 'ID'}
                  </span>
                </div>

                <h3 className="text-sm font-extrabold text-slate-900 tracking-tight leading-snug">
                  {cert.title}
                </h3>

                <p className="text-xs text-slate-600 font-medium">{cert.issuingOrganization}</p>
              </div>

              <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{formatDate(cert.issueDate)}</span>
                </span>

                <button
                  type="button"
                  onClick={() => handleOpenCert(cert)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-900 group-hover:underline"
                >
                  <span>{t.viewCertificate}</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Certificate Modal */}
      <ViewCertificateModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        certificate={selectedCert}
      />
    </div>
  );
};
