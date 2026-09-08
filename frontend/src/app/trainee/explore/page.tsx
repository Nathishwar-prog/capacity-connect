'use client';

import React, { useState } from 'react';
import {
  Compass,
  Search,
  Filter,
  Clock,
  Award,
  BookOpen,
  CheckCircle,
  Plus,
  Building2,
} from 'lucide-react';
import { useLanguageStore } from '@/store/language';

interface CatalogCourse {
  id: string;
  title: string;
  domain: string;
  institute: string;
  durationHours: number;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Operational';
  wmoStandard: string;
  description: string;
  isEnrolled?: boolean;
}

const catalogData: CatalogCourse[] = [
  {
    id: 'cat-1',
    title: 'Mesoscale Atmospheric Modeling with WRF-ARW',
    domain: 'NUMERICAL_MODELING',
    institute: 'National Centre for Medium Range Weather Forecasting (NCMRWF)',
    durationHours: 45,
    level: 'Advanced',
    wmoStandard: 'WMO-258 BIP-M Section 4.2',
    description:
      'In-depth boundary layer parameterization, microphysics schemes, and domain nesting for high-resolution numerical weather prediction over the Indian subcontinent.',
  },
  {
    id: 'cat-2',
    title: 'Advanced Nowcasting of Severe Convective Storms',
    domain: 'SEVERE_WEATHER',
    institute: 'National Weather Forecasting Centre, IMD New Delhi',
    durationHours: 30,
    level: 'Operational',
    wmoStandard: 'WMO Severe Weather Guidance',
    description:
      'Integration of rapid-scan INSAT-3DR satellite imagery, Doppler radar reflectivity cores, and surface thermodynamic indices for 0-3 hour thunderstorm warnings.',
  },
  {
    id: 'cat-3',
    title: 'Dual-Polarimetric Radar Meteorology & Hydrometeor Classification',
    domain: 'RADAR_METEOROLOGY',
    institute: 'IMD Central Training Institute, Pashan, Pune',
    durationHours: 36,
    level: 'Operational',
    wmoStandard: 'WMO-258 Radar Specialist',
    description:
      'Practical analysis of differential reflectivity (ZDR), correlation coefficient (CC), and specific differential phase (KDP) for hail detection and rain-rate estimation.',
  },
  {
    id: 'cat-4',
    title: 'Ocean-Atmosphere Coupled Dynamics & Indian Ocean Dipole',
    domain: 'OCEAN_SCIENCES',
    institute: 'Indian National Centre for Ocean Information Services (INCOIS)',
    durationHours: 40,
    level: 'Advanced',
    wmoStandard: 'MoES Earth System Framework',
    description:
      'Thermodynamic coupling between equatorial sea surface temperature anomalies, Madden-Julian Oscillation, and southwest monsoon onset.',
  },
  {
    id: 'cat-5',
    title: 'Aerosol-Cloud Interactions & Climate Radiative Forcing',
    domain: 'CLIMATE_SCIENCE',
    institute: 'Indian Institute of Tropical Meteorology (IITM) Pune',
    durationHours: 32,
    level: 'Intermediate',
    wmoStandard: 'WMO-GAW Global Atmosphere Watch',
    description:
      'Measurement of aerosol optical depth (AOD), cloud condensation nuclei, and long-term trends in South Asian atmospheric chemistry.',
  },
  {
    id: 'cat-6',
    title: 'Tropical Cyclone Genesis & Track Prediction Verification',
    domain: 'CYCLONE_WARNING',
    institute: 'Cyclone Warning Division, IMD HQ New Delhi',
    durationHours: 28,
    level: 'Operational',
    wmoStandard: 'WMO Tropical Cyclone Programme',
    description:
      'Operational techniques for Dvorak intensity estimation, multi-model consensus cone plotting, and storm surge modeling for coastal warning systems.',
  },
];

export default function TraineeExplorePage() {
  const { language } = useLanguageStore();
  const [courses, setCourses] = useState<CatalogCourse[]>(catalogData);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('ALL');
  const [enrolledToast, setEnrolledToast] = useState<string | null>(null);

  const t = {
    en: {
      pageTitle: 'Explore Meteorological Curricula',
      pageSubtitle:
        'Browse accredited programs across Meteorology, Climate Science, NWP, Radar, and Earth Observation from MoES autonomous institutes and IMD training centers.',
      searchPlaceholder: 'Search by course title, scientific domain, or institute...',
      enrollAction: 'Enroll in Track',
      enrolledBadge: 'Enrolled',
      filterAll: 'All Domains',
      wmoTag: 'WMO-258 Aligned',
      enrolledSuccess: 'Successfully enrolled in',
    },
    hi: {
      pageTitle: 'मौसम विज्ञान पाठ्यक्रम खोजें',
      pageSubtitle:
        'MoES के स्वायत्त संस्थानों और IMD प्रशिक्षण केंद्रों से मौसम विज्ञान, जलवायु विज्ञान, NWP और पृथ्वी अवलोकन के मान्यता प्राप्त कार्यक्रम ब्राउज़ करें।',
      searchPlaceholder: 'शीर्षक, वैज्ञानिक विषय या संस्थान द्वारा खोजें...',
      enrollAction: 'पाठ्यक्रम में नामांकन करें',
      enrolledBadge: 'नामांकित',
      filterAll: 'सभी विषय',
      wmoTag: 'WMO-258 संरेखित',
      enrolledSuccess: 'सफलतापूर्वक नामांकित किया गया:',
    },
    ta: {
      pageTitle: 'வானிலை பாடத்திட்டங்களை ஆராயுங்கள்',
      pageSubtitle:
        'MoES நிறுவனங்கள் மற்றும் IMD பயிற்சி மையங்களில் இருந்து வானிலை, காலநிலை அறிவியல், NWP மற்றும் புவி கண்காணிப்பு திட்டங்களை உலாவவும்.',
      searchPlaceholder: 'தலைப்பு, களம் அல்லது நிறுவனம் மூலம் தேடவும்...',
      enrollAction: 'சேர்க்கை பெறவும்',
      enrolledBadge: 'சேர்க்கப்பட்டது',
      filterAll: 'அனைத்து களங்கள்',
      wmoTag: 'WMO-258 தரநிலை',
      enrolledSuccess: 'வெற்றிகரமாக சேர்க்கப்பட்டது:',
    },
  }[language];

  const handleEnroll = (id: string, title: string) => {
    setCourses((prev) => prev.map((c) => (c.id === id ? { ...c, isEnrolled: !c.isEnrolled } : c)));
    setEnrolledToast(`${t.enrolledSuccess} ${title}`);
    setTimeout(() => setEnrolledToast(null), 3000);
  };

  const filtered = courses.filter((c) => {
    if (selectedDomain !== 'ALL' && c.domain !== selectedDomain) return false;
    if (
      searchQuery &&
      !c.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !c.institute.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !c.description.toLowerCase().includes(searchQuery.toLowerCase())
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
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{t.pageTitle}</h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">{t.pageSubtitle}</p>
          </div>

          <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center gap-3 shrink-0">
            <Compass className="w-7 h-7 text-indigo-600" />
            <div>
              <p className="text-[10px] font-extrabold uppercase text-indigo-700">
                Course Discovery
              </p>
              <p className="text-xs font-black text-slate-800">
                {courses.length} Available Programs
              </p>
            </div>
          </div>
        </div>

        {/* Search and Domain Pill Filters */}
        <div className="space-y-3 pt-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {[
              'ALL',
              'NUMERICAL_MODELING',
              'SEVERE_WEATHER',
              'RADAR_METEOROLOGY',
              'OCEAN_SCIENCES',
              'CLIMATE_SCIENCE',
              'CYCLONE_WARNING',
            ].map((domainKey) => (
              <button
                key={domainKey}
                type="button"
                onClick={() => setSelectedDomain(domainKey)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors ${
                  selectedDomain === domainKey
                    ? 'bg-[#0B192C] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {domainKey === 'ALL' ? t.filterAll : domainKey.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {enrolledToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{enrolledToast}</span>
        </div>
      )}

      {/* Course Catalog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((course) => (
          <div
            key={course.id}
            className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                  {course.domain.replace('_', ' ')}
                </span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  {course.level}
                </span>
              </div>

              <h3 className="text-base font-black text-slate-900 leading-snug group-hover:text-indigo-700 transition-colors">
                {course.title}
              </h3>

              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="line-clamp-1">{course.institute}</span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                {course.description}
              </p>
            </div>

            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1 text-[11px] font-semibold">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{course.durationHours} Hours</span>
                </span>
                <span className="text-[10px] font-mono font-bold text-blue-700">
                  {course.wmoStandard}
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleEnroll(course.id, course.title)}
                className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                  course.isEnrolled
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-[#0B192C] hover:bg-slate-800 text-white shadow-2xs'
                }`}
              >
                {course.isEnrolled ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{t.enrolledBadge}</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>{t.enrollAction}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
