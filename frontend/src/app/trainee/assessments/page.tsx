'use client';

import React, { useState } from 'react';
import {
  ClipboardList,
  Clock,
  Calendar,
  CheckCircle,
  AlertCircle,
  Play,
  FileCheck,
  Search,
  Award,
  X,
} from 'lucide-react';
import { useLanguageStore } from '@/store/language';

interface Assessment {
  id: string;
  title: string;
  course: string;
  dueDate: string;
  durationMinutes: number;
  totalMarks: number;
  status: 'URGENT' | 'UPCOMING' | 'COMPLETED';
  score?: number;
  grade?: string;
  evaluator?: string;
}

const assessmentsData: Assessment[] = [
  {
    id: 'asm-1',
    title: 'NWP Ensemble Data Assimilation & Model Physics Exam',
    course: 'Numerical Weather Prediction & Ensemble Modeling',
    dueDate: '2026-09-12T10:00:00.000Z',
    durationMinutes: 60,
    totalMarks: 50,
    status: 'URGENT',
  },
  {
    id: 'asm-2',
    title: 'Satellite Pattern Recognition & Cloud Texture Lab Evaluation',
    course: 'Satellite Meteorology & INSAT-3DR Image Interpretation',
    dueDate: '2026-09-16T14:30:00.000Z',
    durationMinutes: 45,
    totalMarks: 40,
    status: 'UPCOMING',
  },
  {
    id: 'asm-3',
    title: 'Doppler Radar Velocity De-aliasing & Mesocyclone Identification',
    course: 'Doppler Weather Radar (DWR) Operations',
    dueDate: '2026-09-23T11:00:00.000Z',
    durationMinutes: 60,
    totalMarks: 50,
    status: 'UPCOMING',
  },
  {
    id: 'asm-4',
    title: 'Synoptic Chart Surface Trough Analysis Test',
    course: 'Synoptic Meteorology & Surface Chart Analysis',
    dueDate: '2024-02-10T10:00:00.000Z',
    durationMinutes: 60,
    totalMarks: 50,
    score: 46,
    grade: 'Distinction (92%)',
    evaluator: 'Dr. M. Mohapatra (IMD DG)',
    status: 'COMPLETED',
  },
  {
    id: 'asm-5',
    title: 'Aviation METAR / TAF Decoding & Severe Turbulence Practical',
    course: 'Aviation Meteorological Observation',
    dueDate: '2024-01-20T14:00:00.000Z',
    durationMinutes: 45,
    totalMarks: 50,
    score: 44,
    grade: 'Passed (88%)',
    evaluator: 'Dr. S. K. Roy (Aviation Met)',
    status: 'COMPLETED',
  },
  {
    id: 'asm-6',
    title: 'Upper-Air Radiosonde Sounding & Tephigram Convective Indices',
    course: 'Surface & Upper-Air Observations',
    dueDate: '2023-11-15T09:30:00.000Z',
    durationMinutes: 60,
    totalMarks: 50,
    score: 47,
    grade: 'Distinction (94%)',
    evaluator: 'Smt. P. Verma (IMD CTI)',
    status: 'COMPLETED',
  },
];

export default function TraineeAssessmentsPage() {
  const { language } = useLanguageStore();
  const [activeTab, setActiveTab] = useState<'UPCOMING' | 'COMPLETED'>('UPCOMING');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeExamModal, setActiveExamModal] = useState<Assessment | null>(null);

  const t = {
    en: {
      pageTitle: 'Assessments & Operational Evaluations',
      pageSubtitle:
        'Formal competency testing, radar interpretation practicals, and numerical modeling assessments accredited under WMO-258 capacity standards.',
      upcomingTab: 'Upcoming Evaluations',
      completedTab: 'Completed & Graded',
      searchPlaceholder: 'Search by test title or related course...',
      dueOn: 'Due Date',
      duration: 'Duration',
      mins: 'Mins',
      marks: 'Marks',
      startExam: 'Start Assessment',
      viewScorecard: 'View Scorecard',
      evaluator: 'Evaluator',
      urgentTag: 'Urgent — Due Soon',
      upcomingTag: 'Upcoming',
      completedTag: 'Verified Pass',
    },
    hi: {
      pageTitle: 'मूल्यांकन एवं परिचालन परीक्षाएं',
      pageSubtitle:
        'औपचारिक योग्यता परीक्षण, रडार व्याख्या व्यावहारिक और संख्यात्मक मॉडलिंग मूल्यांकन WMO-258 क्षमता मानकों के तहत मान्यता प्राप्त हैं।',
      upcomingTab: 'आगामी परीक्षाएं',
      completedTab: 'पूर्ण एवं मूल्यांकित',
      searchPlaceholder: 'शीर्षक या संबंधित पाठ्यक्रम द्वारा खोजें...',
      dueOn: 'अंतिम तिथि',
      duration: 'अवधि',
      mins: 'मिनट',
      marks: 'अंक',
      startExam: 'परीक्षा प्रारंभ करें',
      viewScorecard: 'स्कोरकार्ड देखें',
      evaluator: 'परीक्षक',
      urgentTag: 'अतिशीघ्र देय',
      upcomingTag: 'आगामी',
      completedTag: 'सत्यापित उत्तीर्ण',
    },
    ta: {
      pageTitle: 'மதிப்பீடுகள் மற்றும் செயல்பாட்டுத் தேர்வுகள்',
      pageSubtitle:
        'WMO-258 திறன் தரநிலைகளின் கீழ் முறைசார்ந்த திறன் தேர்வுகள், ரேடார் விளக்க செய்முறைகள் மற்றும் வானிலை மாதிரி மதிப்பீடுகள்.',
      upcomingTab: 'வரவிருக்கும் தேர்வுகள்',
      completedTab: 'முடிவடைந்தவை',
      searchPlaceholder: 'தேர்வு அல்லது பாடம் மூலம் தேடவும்...',
      dueOn: 'கடைசி தேதி',
      duration: 'கால அளவு',
      mins: 'நிமிடங்கள்',
      marks: 'மதிப்பெண்கள்',
      startExam: 'தேர்வைத் தொடங்கவும்',
      viewScorecard: 'மதிப்பெண் அட்டை',
      evaluator: 'மதிப்பீட்டாளர்',
      urgentTag: 'விரைவில் முடிவடையும்',
      upcomingTag: 'வரவிருப்பது',
      completedTag: 'தேர்ச்சி பெற்றது',
    },
  }[language];

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const filtered = assessmentsData.filter((a) => {
    if (activeTab === 'UPCOMING' && a.status === 'COMPLETED') return false;
    if (activeTab === 'COMPLETED' && a.status !== 'COMPLETED') return false;
    if (
      searchQuery &&
      !a.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !a.course.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{t.pageTitle}</h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">{t.pageSubtitle}</p>
          </div>

          <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => setActiveTab('UPCOMING')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                activeTab === 'UPCOMING'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.upcomingTab} ({assessmentsData.filter((a) => a.status !== 'COMPLETED').length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('COMPLETED')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                activeTab === 'COMPLETED'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.completedTab} ({assessmentsData.filter((a) => a.status === 'COMPLETED').length})
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="pt-2">
          <div className="relative">
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

      {/* Assessment Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((asm) => (
          <div
            key={asm.id}
            className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs hover:border-amber-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                    asm.status === 'URGENT'
                      ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                      : asm.status === 'UPCOMING'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {asm.status === 'URGENT'
                    ? t.urgentTag
                    : asm.status === 'UPCOMING'
                      ? t.upcomingTag
                      : t.completedTag}
                </span>

                <span className="text-xs font-bold text-slate-400">
                  {asm.totalMarks} {t.marks}
                </span>
              </div>

              <h3 className="text-base font-black text-slate-900 leading-snug group-hover:text-amber-800 transition-colors">
                {asm.title}
              </h3>

              <p className="text-xs font-semibold text-blue-700">{asm.course}</p>
            </div>

            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1 text-[11px]">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{formatDate(asm.dueDate)}</span>
                </span>
                <span className="flex items-center gap-1 text-[11px]">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {asm.durationMinutes} {t.mins}
                  </span>
                </span>
              </div>

              {asm.status === 'COMPLETED' ? (
                <div className="space-y-1.5 p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200/80">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-emerald-800">{asm.grade}</span>
                    <span className="font-black text-emerald-900">
                      {asm.score}/{asm.totalMarks}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium truncate">
                    {t.evaluator}: {asm.evaluator}
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveExamModal(asm)}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#0B192C] hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors shadow-2xs"
                >
                  <Play className="w-3 h-3 text-amber-400" />
                  <span>{t.startExam}</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Simulated Exam Instructions Modal */}
      {activeExamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
                <ClipboardList className="w-5 h-5 text-amber-600" />
                <span>Assessment Instructions</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveExamModal(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-black text-slate-900">{activeExamModal.title}</h3>
              <p className="text-xs text-slate-500">{activeExamModal.course}</p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 text-xs text-slate-700 space-y-1.5 leading-relaxed">
              <p>
                • <strong>Duration:</strong> {activeExamModal.durationMinutes} Minutes strictly
                timed.
              </p>
              <p>
                • <strong>Total Marks:</strong> {activeExamModal.totalMarks} points (Passing
                threshold: 75%).
              </p>
              <p>
                • <strong>Accreditation:</strong> Aligned with WMO-258 Operational Forecaster
                Evaluation standards.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveExamModal(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  alert('Launching secure examination cockpit environment for MoES Trainee...');
                  setActiveExamModal(null);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-[#0B192C] hover:bg-slate-800 rounded-xl shadow-xs"
              >
                Proceed to Exam Environment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
