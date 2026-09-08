'use client';

import React, { useState } from 'react';
import {
  Award,
  CheckCircle,
  ExternalLink,
  Calendar,
  ShieldCheck,
  Download,
  Filter,
  Search,
  BadgeCheck,
} from 'lucide-react';
import { useLanguageStore } from '@/store/language';
import { ViewCertificateModal } from '@/features/professional-profile/components/ViewCertificateModal';
import { TraineeCertificate } from '@/features/professional-profile/types/professional-profile.types';

const mockCertificatesData: TraineeCertificate[] = [
  {
    id: 'cert-1',
    title: 'WMO-258 Basic Instruction Package for Meteorologists (BIP-M)',
    issuingOrganization: 'WMO Regional Training Centre (RTC) Pune & IMD',
    credentialId: 'WMO-RTC-2024-BIPM-0182',
    issueDate: '2024-03-15T00:00:00.000Z',
    expiryDate: '2029-03-15T00:00:00.000Z',
    certificateUrl: 'https://capacity-connect.moes.gov.in/verify/WMO-RTC-2024-BIPM-0182',
    verificationStatus: 'VERIFIED',
  },
  {
    id: 'cert-2',
    title: 'Advanced Doppler Weather Radar Operations & Velocity De-aliasing',
    issuingOrganization: 'India Meteorological Department Central Training Institute (CTI) Pashan',
    credentialId: 'IMD-CTI-DWR-2023-8891',
    issueDate: '2023-11-20T00:00:00.000Z',
    expiryDate: null,
    certificateUrl: 'https://capacity-connect.moes.gov.in/verify/IMD-CTI-DWR-2023-8891',
    verificationStatus: 'VERIFIED',
  },
  {
    id: 'cert-3',
    title: 'INSAT-3DR Multispectral Imagery and Severe Storm Nowcasting',
    issuingOrganization: 'Space Applications Centre (ISRO) & Ministry of Earth Sciences',
    credentialId: 'ISRO-SAC-MoES-2023-402',
    issueDate: '2023-05-10T00:00:00.000Z',
    expiryDate: null,
    certificateUrl: 'https://capacity-connect.moes.gov.in/verify/ISRO-SAC-MoES-2023-402',
    verificationStatus: 'VERIFIED',
  },
  {
    id: 'cert-4',
    title: 'Numerical Weather Prediction (NWP) Mesoscale Modeling with WRF',
    issuingOrganization: 'National Centre for Medium Range Weather Forecasting (NCMRWF) & MoES',
    credentialId: 'NCMRWF-WRF-2023-1104',
    issueDate: '2023-02-18T00:00:00.000Z',
    expiryDate: '2028-02-18T00:00:00.000Z',
    certificateUrl: 'https://capacity-connect.moes.gov.in/verify/NCMRWF-WRF-2023-1104',
    verificationStatus: 'VERIFIED',
  },
];

export default function TraineeCertificatesPage() {
  const { language } = useLanguageStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCert, setSelectedCert] = useState<TraineeCertificate | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [downloadToast, setDownloadToast] = useState<string | null>(null);

  const t = {
    en: {
      pageTitle: 'Certificates & Digital Credentials',
      pageSubtitle:
        'Digitally signed and cryptographically verified certifications accredited under WMO-258 standards and MoES Training Council.',
      verifiedCount: '4 Accredited Credentials',
      searchPlaceholder: 'Search certificate by title, credential ID, or issuing body...',
      viewCert: 'View Certificate',
      downloadPdf: 'Download PDF',
      issuedOn: 'Issued On',
      credentialId: 'Credential ID',
      verified: 'Verified Credential',
      downloading: 'Certificate PDF downloaded successfully.',
    },
    hi: {
      pageTitle: 'प्रमाणपत्र एवं डिजिटल साख',
      pageSubtitle:
        'WMO-258 मानकों और MoES प्रशिक्षण परिषद के तहत डिजिटल रूप से हस्ताक्षरित और सत्यापित आधिकारिक प्रमाणपत्र।',
      verifiedCount: '4 प्रमाणित क्रेडेंशियल',
      searchPlaceholder: 'शीर्षक, क्रेडेंशियल आईडी या जारीकर्ता द्वारा खोजें...',
      viewCert: 'प्रमाणपत्र देखें',
      downloadPdf: 'PDF डाउनलोड करें',
      issuedOn: 'जारी किया गया',
      credentialId: 'क्रेडेंशियल आईडी',
      verified: 'सत्यापित प्रमाणपत्र',
      downloading: 'प्रमाणपत्र PDF सफलतापूर्वक डाउनलोड हो गया।',
    },
    ta: {
      pageTitle: 'சான்றிதழ்கள் மற்றும் டிஜிட்டல் சான்றுகள்',
      pageSubtitle:
        'WMO-258 தரநிலைகள் மற்றும் MoES பயிற்சி கவுன்சிலின் கீழ் டிஜிட்டல் முறையில் சரிபார்க்கப்பட்ட சான்றிதழ்கள்.',
      verifiedCount: '4 சரிபார்க்கப்பட்ட சான்றுகள்',
      searchPlaceholder: 'தலைப்பு, சான்றளிப்பு எண் அல்லது அமைப்பின் மூலம் தேடவும்...',
      viewCert: 'சான்றிதழைப் பார்க்கவும்',
      downloadPdf: 'PDF பதிவிறக்கவும்',
      issuedOn: 'வழங்கப்பட்டது',
      credentialId: 'சான்றளிப்பு எண்',
      verified: 'சரிபார்க்கப்பட்ட சான்றிதழ்',
      downloading: 'சான்றிதழ் PDF வெற்றிகரமாக பதிவிறக்கப்பட்டது.',
    },
  }[language];

  const filteredCerts = mockCertificatesData.filter(
    (c) =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.issuingOrganization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.credentialId && c.credentialId.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  const handleDownload = (title: string) => {
    setDownloadToast(`${title} - ${t.downloading}`);
    setTimeout(() => setDownloadToast(null), 3000);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{t.pageTitle}</h1>
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {t.verifiedCount}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">{t.pageSubtitle}</p>
          </div>

          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/80 flex items-center gap-3 shrink-0">
            <Award className="w-8 h-8 text-amber-600" />
            <div>
              <p className="text-[10px] font-extrabold uppercase text-amber-700">
                WMO-258 Standards
              </p>
              <p className="text-xs font-black text-slate-800">BIP-M Certified</p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="pt-2 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-slate-50/50"
            />
          </div>
        </div>
      </div>

      {downloadToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2 animate-in fade-in">
          <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{downloadToast}</span>
        </div>
      )}

      {/* Certificate Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredCerts.map((cert) => (
          <div
            key={cert.id}
            className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs hover:border-amber-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                  <span>{t.verified}</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400 font-bold">
                  {cert.credentialId?.split('-').slice(0, 2).join('-')}
                </span>
              </div>

              <h3 className="text-base font-black text-slate-900 leading-snug group-hover:text-blue-700 transition-colors">
                {cert.title}
              </h3>

              <p className="text-xs text-slate-600 font-medium">{cert.issuingOrganization}</p>
            </div>

            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                <span className="flex items-center gap-1 font-medium text-[11px]">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{formatDate(cert.issueDate)}</span>
                </span>
                <span className="font-mono text-[10px] text-right text-slate-400 truncate">
                  {cert.credentialId}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCert(cert);
                    setModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900"
                >
                  <span>{t.viewCert}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => handleDownload(cert.title)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0B192C] hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{t.downloadPdf}</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* View Certificate Modal */}
      <ViewCertificateModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        certificate={selectedCert}
      />
    </div>
  );
}
