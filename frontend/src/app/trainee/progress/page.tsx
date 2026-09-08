'use client';

import React from 'react';
import {
  TrendingUp,
  Award,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Target,
  Layers,
  Calendar,
} from 'lucide-react';
import { useLanguageStore } from '@/store/language';

interface CompetencyItem {
  id: string;
  name: string;
  level: string;
  score: number;
  wmoBenchmark: number;
  status: 'Proficient' | 'Developing' | 'Exceeding';
}

const competencies: CompetencyItem[] = [
  {
    id: 'comp-1',
    name: 'Aviation Meteorological Reports (METAR / TAF / SIGMET)',
    level: 'Advanced',
    score: 92,
    wmoBenchmark: 80,
    status: 'Exceeding',
  },
  {
    id: 'comp-2',
    name: 'Synoptic Weather Chart Analysis & Pressure Systems',
    level: 'Proficient',
    score: 88,
    wmoBenchmark: 75,
    status: 'Proficient',
  },
  {
    id: 'comp-3',
    name: 'Tropical Cyclone Genesis & Intensity (Dvorak Technique)',
    level: 'Proficient',
    score: 82,
    wmoBenchmark: 75,
    status: 'Proficient',
  },
  {
    id: 'comp-4',
    name: 'Severe Convective Storm Nowcasting (0-3 Hours)',
    level: 'Proficient',
    score: 75,
    wmoBenchmark: 70,
    status: 'Proficient',
  },
  {
    id: 'comp-5',
    name: 'NWP Model Output Interpretation (WRF / GFS Ensembles)',
    level: 'Developing',
    score: 62,
    wmoBenchmark: 70,
    status: 'Developing',
  },
  {
    id: 'comp-6',
    name: 'Doppler Weather Radar (DWR) Radial Velocity De-aliasing',
    level: 'Developing',
    score: 58,
    wmoBenchmark: 70,
    status: 'Developing',
  },
];

const milestones = [
  {
    date: 'March 2024',
    title: 'WMO-258 BIP-M Phase I Accreditation Cleared',
    issuer: 'WMO Regional Training Centre Pune / IMD',
    status: 'COMPLETED',
  },
  {
    date: 'November 2023',
    title: 'Doppler Radar Operations & Calibration Field Check',
    issuer: 'IMD Central Training Institute Pashan',
    status: 'COMPLETED',
  },
  {
    date: 'May 2023',
    title: 'INSAT-3DR Multispectral Imagery Lab Certified',
    issuer: 'Space Applications Centre (ISRO) & MoES',
    status: 'COMPLETED',
  },
  {
    date: 'December 2022',
    title: 'Surface Observations & Radiosonde Sounding Protocol',
    issuer: 'Regional Meteorological Centre Chennai',
    status: 'COMPLETED',
  },
];

export default function TraineeProgressPage() {
  const { language } = useLanguageStore();

  const t = {
    en: {
      pageTitle: 'My Learning Progress & Competencies',
      pageSubtitle:
        'Continuous evaluation loop measuring operational forecasting competencies, WMO-258 benchmark standards, and capacity transformation milestones.',
      overallStanding: 'Overall Competency Standing',
      targetForecaster: 'Level 3 Operational Forecaster',
      wmoFramework: 'WMO-258 & MoES Continuous Standards',
      benchmark: 'WMO Benchmark',
      hoursLogged: '142 Training Hours Logged',
      milestonesTitle: 'Capacity Building Milestones',
      competencyBreakdown: 'Core Meteorological Competencies',
    },
    hi: {
      pageTitle: 'मेरी अध्ययन प्रगति एवं दक्षता',
      pageSubtitle:
        'परिचालन पूर्वानुमान दक्षताओं, WMO-258 बेंचमार्क मानकों और क्षमता परिवर्तन के मील के पत्थरों को मापने वाला सतत मूल्यांकन लूप।',
      overallStanding: 'समग्र दक्षता स्थिति',
      targetForecaster: 'स्तर 3 परिचालन मौसम वैज्ञानिक',
      wmoFramework: 'WMO-258 एवं MoES सतत मानक',
      benchmark: 'WMO बेंचमार्क',
      hoursLogged: '142 प्रशिक्षण घंटे दर्ज',
      milestonesTitle: 'क्षमता निर्माण के मील के पत्थर',
      competencyBreakdown: 'प्रमुख मौसम विज्ञान दक्षताएं',
    },
    ta: {
      pageTitle: 'எனது கற்றல் முன்னேற்றம் & திறன்கள்',
      pageSubtitle:
        'வானிலை முன்னறிவிப்பு திறன்கள், WMO-258 தரநிலைகள் மற்றும் திறன் மேம்பாட்டு மைல்கற்களை அளவிடும் தொடர்ச்சியான மதிப்பீட்டு அமைப்பு.',
      overallStanding: 'ஒட்டுமொத்த திறன் நிலை',
      targetForecaster: 'நிலை 3 செயல்பாட்டு முன்னறிவிப்பாளர்',
      wmoFramework: 'WMO-258 & MoES தரநிலைகள்',
      benchmark: 'WMO இலக்கு',
      hoursLogged: '142 பயிற்சி மணிநேரம் பதிவு செய்யப்பட்டது',
      milestonesTitle: 'திறன் மேம்பாட்டு மைல்கற்கள்',
      competencyBreakdown: 'முக்கிய வானிலைத் திறன்கள்',
    },
  }[language];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Header Widget */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{t.pageTitle}</h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">{t.pageSubtitle}</p>
          </div>

          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200/80 flex items-center gap-3 shrink-0">
            <TrendingUp className="w-8 h-8 text-emerald-600" />
            <div>
              <p className="text-[10px] font-extrabold uppercase text-emerald-700">
                Competency Standing
              </p>
              <p className="text-sm font-black text-slate-900">74% Proficient</p>
            </div>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-extrabold uppercase text-slate-400">
              Current Standing
            </span>
            <p className="text-sm font-extrabold text-slate-800">{t.targetForecaster}</p>
            <p className="text-[11px] text-slate-500">{t.wmoFramework}</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-extrabold uppercase text-slate-400">
              Training Hours
            </span>
            <p className="text-sm font-extrabold text-blue-700">{t.hoursLogged}</p>
            <p className="text-[11px] text-slate-500">64h Shift Labs • 48h Theory • 30h Radar</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-extrabold uppercase text-slate-400">
              Milestones Reached
            </span>
            <p className="text-sm font-extrabold text-emerald-700">4 Certified Milestones</p>
            <p className="text-[11px] text-slate-500">100% on schedule for 2026</p>
          </div>
        </div>
      </div>

      {/* Competencies Progress Breakdown */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-base font-black text-slate-900 tracking-tight">
            {t.competencyBreakdown}
          </h2>
          <span className="text-xs font-bold text-slate-500">Benchmark: 70-80%</span>
        </div>

        <div className="space-y-4">
          {competencies.map((c) => (
            <div
              key={c.id}
              className="p-4 rounded-2xl bg-slate-50/50 border border-slate-200/60 space-y-2"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                <span className="font-extrabold text-slate-900">{c.name}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                      c.status === 'Exceeding'
                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                        : c.status === 'Proficient'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {c.status}
                  </span>
                  <span className="font-black text-slate-900">{c.score}%</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    c.score >= 80
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                      : c.score >= 70
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600'
                        : 'bg-gradient-to-r from-amber-500 to-orange-500'
                  }`}
                  style={{ width: `${c.score}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>WMO Baseline: {c.wmoBenchmark}%</span>
                <span>Level: {c.level}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Milestones Timeline */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
        <h2 className="text-base font-black text-slate-900 tracking-tight pb-3 border-b border-slate-100">
          {t.milestonesTitle}
        </h2>

        <div className="space-y-4">
          {milestones.map((m, idx) => (
            <div key={idx} className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-200">
                <CheckCircle2 className="w-4 h-4" />
              </div>

              <div className="flex-1 pb-4 border-b border-slate-100 last:border-b-0 space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs sm:text-sm font-extrabold text-slate-900">{m.title}</h3>
                  <span className="text-[11px] font-semibold text-slate-400">{m.date}</span>
                </div>
                <p className="text-xs text-slate-500 font-medium">{m.issuer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
