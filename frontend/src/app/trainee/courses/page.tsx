'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  PlayCircle,
  CheckCircle,
  Clock,
  User,
  Search,
  Filter,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { useLanguageStore } from '@/store/language';

interface CourseItem {
  id: string;
  title: string;
  category: string;
  trainer: string;
  progress: number;
  totalModules: number;
  completedModules: number;
  durationHours: number;
  status: 'IN_PROGRESS' | 'COMPLETED';
}

const initialCourses: CourseItem[] = [
  {
    id: 'course-1',
    title: 'Satellite Meteorology & INSAT-3DR Image Interpretation',
    category: 'SATELLITE_METEOROLOGY',
    trainer: 'Prof. A. Sharma (SAC/ISRO)',
    progress: 75,
    totalModules: 24,
    completedModules: 18,
    durationHours: 32,
    status: 'IN_PROGRESS',
  },
  {
    id: 'course-2',
    title: 'Numerical Weather Prediction & Ensemble Modeling (WRF/GFS)',
    category: 'NUMERICAL_MODELING',
    trainer: 'Dr. K. Radhakrishnan (NCMRWF)',
    progress: 40,
    totalModules: 25,
    completedModules: 10,
    durationHours: 40,
    status: 'IN_PROGRESS',
  },
  {
    id: 'course-3',
    title: 'Doppler Weather Radar (DWR) Calibration & Velocity De-aliasing',
    category: 'RADAR_METEOROLOGY',
    trainer: 'Smt. P. Verma (IMD CTI)',
    progress: 20,
    totalModules: 20,
    completedModules: 4,
    durationHours: 28,
    status: 'IN_PROGRESS',
  },
  {
    id: 'course-4',
    title: 'Synoptic Meteorology & Surface Chart Analysis Fundamentals',
    category: 'SYNOPTIC_METEOROLOGY',
    trainer: 'Dr. M. Mohapatra (IMD DG)',
    progress: 100,
    totalModules: 20,
    completedModules: 20,
    durationHours: 24,
    status: 'COMPLETED',
  },
  {
    id: 'course-5',
    title: 'Aviation Meteorological Observation & METAR/SPECI Coding',
    category: 'AVIATION_METEOROLOGY',
    trainer: 'Dr. S. K. Roy (Aviation Met)',
    progress: 100,
    totalModules: 15,
    completedModules: 15,
    durationHours: 18,
    status: 'COMPLETED',
  },
];

export default function TraineeCoursesPage() {
  const { language } = useLanguageStore();
  const [courses, setCourses] = useState<CourseItem[]>(initialCourses);
  const [activeTab, setActiveTab] = useState<'ALL' | 'IN_PROGRESS' | 'COMPLETED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const t = {
    en: {
      pageTitle: 'My Enrolled Courses',
      pageSubtitle:
        'Access active operational training modules, interactive meteorology labs, and track completion progress across your specialized capacity building tracks.',
      allTab: 'All Courses',
      inProgressTab: 'In Progress',
      completedTab: 'Completed',
      continueLearning: 'Continue Learning',
      reviewCourse: 'Review Course',
      searchPlaceholder: 'Search course by title, discipline, or trainer...',
      hours: 'Hours',
      modules: 'modules completed',
    },
    hi: {
      pageTitle: 'मेरे नामांकित पाठ्यक्रम',
      pageSubtitle:
        'सक्रिय परिचालन प्रशिक्षण मॉड्यूल, इंटरैक्टिव मौसम विज्ञान प्रयोगशालाओं तक पहुंचें और अपने विशेषज्ञता ट्रैक में पूर्णता की प्रगति ट्रैक करें।',
      allTab: 'सभी पाठ्यक्रम',
      inProgressTab: 'प्रगति पर',
      completedTab: 'पूर्ण',
      continueLearning: 'अध्ययन जारी रखें',
      reviewCourse: 'पाठ्यक्रम समीक्षा',
      searchPlaceholder: 'शीर्षक, विषय या प्रशिक्षक द्वारा पाठ्यक्रम खोजें...',
      hours: 'घंटे',
      modules: 'मॉड्यूल पूर्ण',
    },
    ta: {
      pageTitle: 'எனது சேர்க்கப்பட்ட பாடநெறிகள்',
      pageSubtitle:
        'செயல்பாட்டு பயிற்சி தொகுதிகள், ஊடாடும் வானிலை ஆய்வகங்களை அணுகி, உங்கள் திறன் மேம்பாட்டு முன்னேற்றத்தை கண்காணிக்கவும்.',
      allTab: 'அனைத்து பாடங்கள்',
      inProgressTab: 'நடைபெறுகிறது',
      completedTab: 'நிறைவடைந்தது',
      continueLearning: 'கற்றலைத் தொடரவும்',
      reviewCourse: 'பாடத்தை மதிப்பாய்வு செய்க',
      searchPlaceholder: 'தலைப்பு, களம் அல்லது பயிற்றுவிப்பாளர் மூலம் தேடவும்...',
      hours: 'மணிநேரம்',
      modules: 'தொகுதிகள் நிறைவடைந்தன',
    },
  }[language];

  const handleAdvance = (id: string) => {
    setCourses((prev) =>
      prev.map((c) => {
        if (c.id === id && c.status === 'IN_PROGRESS') {
          const nextCompleted = Math.min(c.totalModules, c.completedModules + 1);
          const nextProg = Math.round((nextCompleted / c.totalModules) * 100);
          return {
            ...c,
            completedModules: nextCompleted,
            progress: nextProg,
            status: nextProg === 100 ? 'COMPLETED' : 'IN_PROGRESS',
          };
        }
        return c;
      }),
    );
  };

  const filtered = courses.filter((c) => {
    if (activeTab === 'IN_PROGRESS' && c.status !== 'IN_PROGRESS') return false;
    if (activeTab === 'COMPLETED' && c.status !== 'COMPLETED') return false;
    if (
      searchQuery &&
      !c.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !c.trainer.toLowerCase().includes(searchQuery.toLowerCase())
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
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{t.pageTitle}</h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">{t.pageSubtitle}</p>
          </div>

          <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                activeTab === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.allTab} ({courses.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('IN_PROGRESS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                activeTab === 'IN_PROGRESS'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.inProgressTab} ({courses.filter((c) => c.status === 'IN_PROGRESS').length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('COMPLETED')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                activeTab === 'COMPLETED'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.completedTab} ({courses.filter((c) => c.status === 'COMPLETED').length})
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
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50"
            />
          </div>
        </div>
      </div>

      {/* Course Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((course) => (
          <div
            key={course.id}
            className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80">
                  {course.category.replace('_', ' ')}
                </span>
                <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                  <Clock className="w-3 h-3" />
                  <span>
                    {course.durationHours} {t.hours}
                  </span>
                </span>
              </div>

              <h3 className="text-sm font-black text-slate-900 leading-snug group-hover:text-blue-700 transition-colors">
                {course.title}
              </h3>

              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span className="truncate">{course.trainer}</span>
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-slate-100">
              {/* Progress meter */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[11px] font-semibold text-slate-500">
                    {course.completedModules}/{course.totalModules} {t.modules}
                  </span>
                  <span className="font-extrabold text-blue-700">{course.progress}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      course.progress === 100
                        ? 'bg-emerald-500'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600'
                    }`}
                    style={{ width: `${course.progress}%` }}
                  />
                </div>
              </div>

              {/* Action Button */}
              {course.status === 'IN_PROGRESS' ? (
                <button
                  type="button"
                  onClick={() => handleAdvance(course.id)}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#0B192C] hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors shadow-2xs"
                >
                  <PlayCircle className="w-3.5 h-3.5 text-blue-400" />
                  <span>{t.continueLearning}</span>
                </button>
              ) : (
                <div className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{t.reviewCourse}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
