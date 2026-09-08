import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTrainerDashboard } from '@/features/dashboard/hooks/useDashboard';
import {
  Users,
  BookOpen,
  CheckCircle2,
  Clock,
  BarChart3,
  Calendar,
  PlusCircle,
  UploadCloud,
  FileCheck,
  Lightbulb,
  ArrowRight,
  Cpu,
  Satellite,
  Code2,
  UserCheck,
  Building2,
  Briefcase,
  Radio,
  Star,
  ChevronRight,
  Sparkles,
  TrendingUp,
  AlertCircle,
  Eye,
  Layers,
  Globe,
  MoreVertical,
  MoreHorizontal,
  Target,
  ChevronDown,
  FileText,
  Check,
  Award
} from 'lucide-react';
import { TrainerProfileData, Trainee, Course, Assessment } from '@/features/trainer/ui/types/trainer';
import { initialTrainerProfile, mockTrainerProfile } from '@/features/trainer/ui/data/mockData';
import { useLanguage } from '@/features/trainer/ui/i18n/LanguageContext';
import { MeteorologyStudio } from '@/features/trainer/ui/dashboard/MeteorologyStudio';

interface TrainerDashboardProps {
  trainer?: TrainerProfileData;
  trainees?: Trainee[];
  courses?: Course[];
  assessments?: Assessment[];
  onNavigate?: (tab: string, extraData?: any) => void;
  onNavigateToTab?: (tab: string, extraData?: any) => void;
  onSelectTrainee?: (trainee: Trainee) => void;
  onOpenTraineeDrawer?: (trainee: Trainee) => void;
  onQuickUploadModal?: () => void;
  onOpenCourseBuilder?: (courseId?: string) => void;
}

export const TrainerDashboard: React.FC<TrainerDashboardProps> = (props) => {
  const {
    trainer,
    trainees = [],
    courses = [],
    assessments = [],
    onNavigate,
    onNavigateToTab,
    onSelectTrainee,
    onOpenTraineeDrawer,
    onQuickUploadModal,
    onOpenCourseBuilder
  } = props;

  const { data: dashboard, isLoading, isError, refetch } = useTrainerDashboard();
  const router = useRouter();

  const { language, setLanguage, t } = useLanguage();
  const [showMeteorologyStudio, setShowMeteorologyStudio] = useState<boolean>(false);
  const [progressPeriod, setProgressPeriod] = useState<string>('6months');
  const [assessmentPeriod, setAssessmentPeriod] = useState<string>('thisMonth');

  const currentTrainer = trainer || initialTrainerProfile || mockTrainerProfile;

  const navigate = (tab: string, extraData?: any) => {
    const normalized =
      tab === 'my-courses' ? 'courses' :
        tab === 'competency-gaps' ? 'competencies' :
          tab === 'trainer-profile' ? 'profile' :
            tab === 'technology-updates' ? 'notifications' :
              tab;
    if (onNavigate) onNavigate(normalized, extraData);
    else if (onNavigateToTab) onNavigateToTab(normalized, extraData);
    else router.push(`/trainer/${normalized}`);
  };

  const handleOpenTrainee = (trainee: Trainee) => {
    if (onOpenTraineeDrawer) onOpenTraineeDrawer(trainee);
    else if (onSelectTrainee) onSelectTrainee(trainee);
    else navigate('trainees', { traineeId: trainee.id });
  };

  // Trainees Requiring Attention (Matching Reference Image)
  const traineesRequiringAttention = [
    {
      id: 't-1',
      name: 'Ananya R.',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      course: 'Radar Meteorology',
      level: t.levelIntermediate || 'Intermediate',
      gap: 'High',
      gapClass: 'text-rose-600 font-bold',
      status: 'At Risk',
      statusBadge: 'bg-rose-50 text-rose-700 border-rose-200',
      score: '42%',
      originalTrainee: trainees[0]
    },
    {
      id: 't-2',
      name: 'Vikram S.',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      course: 'Data Analysis',
      level: t.levelBeginner || 'Beginner',
      gap: 'Medium',
      gapClass: 'text-amber-600 font-bold',
      status: 'Needs Attention',
      statusBadge: 'bg-amber-50 text-amber-700 border-amber-200',
      score: '58%',
      originalTrainee: trainees[1]
    },
    {
      id: 't-3',
      name: 'Priya M.',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      course: 'Satellite Meteorology',
      level: t.levelIntermediate || 'Intermediate',
      gap: 'Medium',
      gapClass: 'text-amber-600 font-bold',
      status: 'Needs Attention',
      statusBadge: 'bg-amber-50 text-amber-700 border-amber-200',
      score: '62%',
      originalTrainee: trainees[2]
    },
    {
      id: 't-4',
      name: 'Rahul K.',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      course: 'Numerical Modelling',
      level: t.levelBeginner || 'Beginner',
      gap: 'High',
      gapClass: 'text-rose-600 font-bold',
      status: 'At Risk',
      statusBadge: 'bg-rose-50 text-rose-700 border-rose-200',
      score: '46%',
      originalTrainee: trainees[3]
    },
    {
      id: 't-5',
      name: 'Sneha P.',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      course: 'Weather Forecasting',
      level: t.levelAdvanced || 'Advanced',
      gap: 'Low',
      gapClass: 'text-emerald-600 font-bold',
      status: 'On Track',
      statusBadge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      score: '88%',
      originalTrainee: trainees[4]
    }
  ];

  // Upcoming Training & Assessments (Matching Reference Image)
  const upcomingTrainings = [
    {
      title: 'Polar Meteorology Basics',
      type: 'Training',
      typeBadge: 'bg-blue-100 text-blue-800',
      icon: 'training',
      date: '25 Oct 2024',
      trainees: 18,
      status: 'Upcoming',
      statusBadge: 'bg-sky-50 text-sky-700 border-sky-200'
    },
    {
      title: 'Radar Data Interpretation',
      type: 'Assessment',
      typeBadge: 'bg-purple-100 text-purple-800',
      icon: 'assessment',
      date: '28 Oct 2024',
      trainees: 12,
      status: 'Scheduled',
      statusBadge: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    {
      title: 'Climate Model Analysis',
      type: 'Training',
      typeBadge: 'bg-blue-100 text-blue-800',
      icon: 'training',
      date: '30 Oct 2024',
      trainees: 20,
      status: 'Upcoming',
      statusBadge: 'bg-sky-50 text-sky-700 border-sky-200'
    },
    {
      title: 'Weather Forecasting MCQ',
      type: 'Assessment',
      typeBadge: 'bg-purple-100 text-purple-800',
      icon: 'assessment',
      date: '02 Nov 2024',
      trainees: 24,
      status: 'Scheduled',
      statusBadge: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    {
      title: 'Monsoon Dynamics',
      type: 'Training',
      typeBadge: 'bg-blue-100 text-blue-800',
      icon: 'training',
      date: '05 Nov 2024',
      trainees: 15,
      status: 'Upcoming',
      statusBadge: 'bg-sky-50 text-sky-700 border-sky-200'
    }
  ];

  return (
    <div className="space-y-5 pb-12 max-w-[1600px] mx-auto">
      {/* 1. Top Language / Translation Switcher Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <Globe className="w-4 h-4 text-[#004b9b]" />
          <span className="font-semibold text-slate-800">Language / भाषा / மொழி:</span>
          <span className="text-slate-500">Switch dashboard translation</span>
        </div>

        <div className="inline-flex items-center rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setLanguage('hi')}
            className={`px-3 py-1 rounded-md transition-all cursor-pointer ${language === 'hi'
              ? 'bg-[#004b9b] text-white shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            Hindi (हिन्दी)
          </button>
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`px-3 py-1 rounded-md transition-all cursor-pointer ${language === 'en'
              ? 'bg-[#004b9b] text-white shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => setLanguage('ta')}
            className={`px-3 py-1 rounded-md transition-all cursor-pointer ${language === 'ta'
              ? 'bg-[#004b9b] text-white shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            Tamil (தமிழ்)
          </button>
        </div>
      </div>

      {/* 2. Top Row: Hero Banner (Left ~72%) + Quick Actions (Right ~28%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Left Column: Hero Banner */}
        <div className="lg:col-span-8 xl:col-span-9 relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-50/90 via-sky-50/70 to-blue-100/60 border border-blue-200/80 shadow-2xs p-5 sm:p-6 flex flex-col justify-between">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative z-10">
            {/* Left side: Avatar + Welcome text + Badges */}
            <div className="flex items-start sm:items-center gap-4.5">
              {/* Avatar with click to profile */}
              <div
                onClick={() => navigate('profile')}
                className="relative cursor-pointer group shrink-0"
                title="View Trainer Profile"
              >
                <img
                  src={currentTrainer.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80'}
                  alt="Vijay V."
                  className="w-18 h-18 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-white shadow-md ring-2 ring-blue-200 group-hover:ring-blue-400 transition-all"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80';
                  }}
                />
                <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full shadow-xs" title="Online / Active" />
              </div>

              {/* Text info */}
              <div className="space-y-1">
                <div className="text-xs sm:text-sm text-slate-500 font-semibold">
                  {t.welcomeBack}
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                  {currentTrainer.name || 'Vijay V.'} !
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-xl">
                  {t.togetherSubtitle}
                </p>

                {/* 3 Pills from reference image */}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 text-slate-700 text-xs font-semibold border border-slate-200/90 shadow-2xs">
                    <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>{t.badgeMetOfficer}</span>
                  </div>

                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 text-slate-700 text-xs font-semibold border border-slate-200/90 shadow-2xs">
                    <Building2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>{t.badgeImd}</span>
                  </div>

                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 text-slate-700 text-xs font-semibold border border-slate-200/90 shadow-2xs">
                    <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                    <span>{t.badgeExperience}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side: Date Pill + Inspiring Motto Quote */}
            <div className="hidden md:flex flex-col items-end gap-3 shrink-0 self-start">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/90 border border-blue-200/80 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>Monday, 24 October 2024</span>
              </div>

              <div className="max-w-[210px] text-right bg-white/60 backdrop-blur-xs p-2.5 rounded-xl border border-blue-100 text-[11px] font-medium text-slate-700 leading-snug">
                <span className="italic">{t.mottoBuildingQuote}</span>
                <div className="text-[10px] font-bold text-blue-800 mt-1 uppercase tracking-wider">
                  IMD MoES
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Quick Actions Card */}
        <div className="lg:col-span-4 xl:col-span-3 bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900">{t.quickActions}</h3>
            <button
              onClick={() => navigate('courses')}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
            >
              {t.viewAll}
            </button>
          </div>

          {/* 5 Quick Action Buttons in Grid (matching reference image) */}
          <div className="grid grid-cols-3 gap-2">
            {/* 1. Create Course */}
            <button
              onClick={() => {
                if (onOpenCourseBuilder) onOpenCourseBuilder();
                else navigate('course-builder');
              }}
              className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-blue-50/80 hover:bg-blue-100/90 text-blue-800 border border-blue-100 transition-all cursor-pointer text-center group"
            >
              <BookOpen className="w-5 h-5 text-blue-600 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-bold leading-tight">{t.actionCreateCourse}</span>
            </button>

            {/* 2. Create Assessment */}
            <button
              onClick={() => navigate('assessments')}
              className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-emerald-50/80 hover:bg-emerald-100/90 text-emerald-800 border border-emerald-100 transition-all cursor-pointer text-center group"
            >
              <FileCheck className="w-5 h-5 text-emerald-600 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-bold leading-tight">{t.actionCreateAssessment}</span>
            </button>

            {/* 3. Upload Material */}
            <button
              onClick={() => {
                if (onQuickUploadModal) onQuickUploadModal();
                else navigate('learning-materials');
              }}
              className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-purple-50/80 hover:bg-purple-100/90 text-purple-800 border border-purple-100 transition-all cursor-pointer text-center group"
            >
              <UploadCloud className="w-5 h-5 text-purple-600 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-bold leading-tight">{t.actionUploadMaterial}</span>
            </button>

            {/* 4. View Trainees */}
            <button
              onClick={() => navigate('trainees')}
              className="col-span-1 sm:col-span-1 flex flex-col items-center justify-center p-2.5 rounded-xl bg-amber-50/80 hover:bg-amber-100/90 text-amber-800 border border-amber-100 transition-all cursor-pointer text-center group"
            >
              <Users className="w-5 h-5 text-amber-600 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-bold leading-tight">{t.actionViewTrainees}</span>
            </button>

            {/* 5. View Analytics */}
            <button
              onClick={() => navigate('analytics')}
              className="col-span-2 sm:col-span-2 flex flex-col items-center justify-center p-2.5 rounded-xl bg-cyan-50/80 hover:bg-cyan-100/90 text-cyan-800 border border-cyan-100 transition-all cursor-pointer text-center group"
            >
              <BarChart3 className="w-5 h-5 text-cyan-600 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-bold leading-tight">{t.actionViewAnalytics}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Metrics Row: 6 Stat Cards Across (Matching Reference Image) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Stat 1: Assigned Trainees */}
        <div
          onClick={() => navigate('trainees')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
        >
          <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
            <Users className="w-4.5 h-4.5" />
          </div>
          <div className="text-xs font-semibold text-slate-500">{t.assignedTrainees}</div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-slate-900 leading-none">24</span>
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">↑ 12%</span>
          </div>
          <div className="text-[11px] text-slate-400 font-medium mt-1.5">{t.acrossCourses}</div>
        </div>

        {/* Stat 2: Active Courses */}
        <div
          onClick={() => navigate('courses')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
        >
          <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2">
            <BookOpen className="w-4.5 h-4.5" />
          </div>
          <div className="text-xs font-semibold text-slate-500">{t.activeCourses}</div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-slate-900 leading-none">6</span>
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">↑ 20%</span>
          </div>
          <div className="text-[11px] text-slate-400 font-medium mt-1.5">3 {t.published} | 3 {t.drafts}</div>
        </div>

        {/* Stat 3: Completed Trainings */}
        <div
          onClick={() => navigate('courses')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
        >
          <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
            <CheckCircle2 className="w-4.5 h-4.5" />
          </div>
          <div className="text-xs font-semibold text-slate-500">{t.completedTrainings}</div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-slate-900 leading-none">42</span>
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">↑ 15%</span>
          </div>
          <div className="text-[11px] text-slate-400 font-medium mt-1.5">{t.totalCompletions}</div>
        </div>

        {/* Stat 4: Pending Assessments */}
        <div
          onClick={() => navigate('assessments')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
        >
          <div className="w-9 h-9 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mb-2">
            <Clock className="w-4.5 h-4.5" />
          </div>
          <div className="text-xs font-semibold text-slate-500">{t.pendingAssessments}</div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-slate-900 leading-none">8</span>
            <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">↓ 10%</span>
          </div>
          <div className="text-[11px] text-slate-400 font-medium mt-1.5">{t.across5Courses}</div>
        </div>

        {/* Stat 5: Average Score */}
        <div
          onClick={() => navigate('analytics')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
        >
          <div className="w-9 h-9 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-center mb-2">
            <BarChart3 className="w-4.5 h-4.5" />
          </div>
          <div className="text-xs font-semibold text-slate-500">{t.averageScore}</div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-slate-900 leading-none">76%</span>
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">↑ 8%</span>
          </div>
          <div className="text-[11px] text-slate-400 font-medium mt-1.5">{t.overallPerformance}</div>
        </div>

        {/* Stat 6: Course Completion */}
        <div
          onClick={() => navigate('courses')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
        >
          <div className="w-9 h-9 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center mb-2">
            <Target className="w-4.5 h-4.5" />
          </div>
          <div className="text-xs font-semibold text-slate-500">{t.courseCompletion}</div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-slate-900 leading-none">68%</span>
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">↑ 12%</span>
          </div>
          <div className="text-[11px] text-slate-400 font-medium mt-1.5">{t.fromLastMonthShort}</div>
        </div>
      </div>

      {/* 4. Middle Section: 3 Charts Across (Matching Reference Image) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Chart 1: Training Progress Overview (~42% width) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-4.5 border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">{t.trainingProgress}</h3>
              <div className="relative">
                <select
                  value={progressPeriod}
                  onChange={(e) => setProgressPeriod(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="6months">{t.last6Months}</option>
                  <option value="3months">{t.last3Months}</option>
                  <option value="year">{t.thisYear}</option>
                </select>
              </div>
            </div>

            {/* Legend with colored dots */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600 mb-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                <span>{t.courseCompletion}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span>{t.assessmentParticipation}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>{t.averageScore}</span>
              </span>
            </div>

            {/* SVG Line Chart with Y-axis markers */}
            <div className="h-44 w-full relative flex">
              {/* Y-axis markers */}
              <div className="flex flex-col justify-between text-[10px] text-slate-400 font-mono pr-2 select-none">
                <span>100%</span>
                <span>75%</span>
                <span>50%</span>
                <span>25%</span>
                <span>0%</span>
              </div>

              {/* Chart SVG */}
              <div className="flex-1 relative">
                <svg viewBox="0 0 320 120" className="w-full h-full overflow-visible">
                  {/* Grid Lines */}
                  <line x1="0" y1="5" x2="320" y2="5" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3,3" />
                  <line x1="0" y1="32" x2="320" y2="32" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3,3" />
                  <line x1="0" y1="60" x2="320" y2="60" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3,3" />
                  <line x1="0" y1="88" x2="320" y2="88" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3,3" />
                  <line x1="0" y1="115" x2="320" y2="115" stroke="#e2e8f0" strokeWidth="1" />

                  {/* Course Completion (Blue Line) */}
                  <polyline
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points="20,85 75,70 135,55 195,50 255,42 310,22"
                  />
                  <circle cx="20" cy="85" r="3.5" fill="#2563eb" />
                  <circle cx="75" cy="70" r="3.5" fill="#2563eb" />
                  <circle cx="135" cy="55" r="3.5" fill="#2563eb" />
                  <circle cx="195" cy="50" r="3.5" fill="#2563eb" />
                  <circle cx="255" cy="42" r="3.5" fill="#2563eb" />
                  <circle cx="310" cy="22" r="4" fill="#2563eb" />

                  {/* Assessment Participation (Orange Line) */}
                  <polyline
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points="20,95 75,82 135,74 195,68 255,62 310,50"
                  />
                  <circle cx="20" cy="95" r="3" fill="#f59e0b" />
                  <circle cx="75" cy="82" r="3" fill="#f59e0b" />
                  <circle cx="135" cy="74" r="3" fill="#f59e0b" />
                  <circle cx="195" cy="68" r="3" fill="#f59e0b" />
                  <circle cx="255" cy="62" r="3" fill="#f59e0b" />
                  <circle cx="310" cy="50" r="3.5" fill="#f59e0b" />

                  {/* Average Score (Emerald Line) */}
                  <polyline
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points="20,102 75,92 135,85 195,78 255,72 310,60"
                  />
                  <circle cx="20" cy="102" r="3" fill="#10b981" />
                  <circle cx="75" cy="92" r="3" fill="#10b981" />
                  <circle cx="135" cy="85" r="3" fill="#10b981" />
                  <circle cx="195" cy="78" r="3" fill="#10b981" />
                  <circle cx="255" cy="72" r="3" fill="#10b981" />
                  <circle cx="310" cy="60" r="3.5" fill="#10b981" />
                </svg>

                {/* X-axis labels */}
                <div className="flex justify-between text-[11px] text-slate-400 font-medium mt-2 px-2">
                  <span>May</span>
                  <span>Jun</span>
                  <span>Jul</span>
                  <span>Aug</span>
                  <span>Sep</span>
                  <span>Oct</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chart 2: Course Completion Status (~26% width) */}
        <div className="lg:col-span-3 bg-white rounded-2xl p-4.5 border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-900">{t.courseCompletionStatus}</h3>
              <button
                onClick={() => navigate('courses')}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
              >
                {t.viewDetails}
              </button>
            </div>

            {/* Donut & Legend Container */}
            <div className="flex flex-col items-center justify-center py-2">
              {/* SVG Donut */}
              <div className="relative w-32 h-32 my-1 flex items-center justify-center">
                <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                  {/* Background Circle */}
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="4"
                  />
                  {/* Completed (68%) */}
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="4.5"
                    strokeDasharray="68, 100"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-black text-slate-900 leading-none">68%</span>
                  <span className="text-[10px] text-slate-400 font-semibold mt-0.5">{t.courseCompletion}</span>
                </div>
              </div>

              {/* Legend List */}
              <div className="w-full space-y-2 mt-2 px-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-slate-600 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span>{t.completed}</span>
                  </span>
                  <span className="font-bold text-slate-900 font-mono">42</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-slate-600 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                    <span>{t.inProgress}</span>
                  </span>
                  <span className="font-bold text-slate-900 font-mono">16</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-slate-600 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
                    <span>{t.notStarted}</span>
                  </span>
                  <span className="font-bold text-slate-900 font-mono">6</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chart 3: Assessment Performance (~32% width) */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-4.5 border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">{t.assessmentPerformance}</h3>
              <select
                value={assessmentPeriod}
                onChange={(e) => setAssessmentPeriod(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="thisMonth">{t.thisMonth}</option>
                <option value="lastMonth">{t.lastMonth}</option>
                <option value="allTime">{t.allTime}</option>
              </select>
            </div>

            {/* Bar Chart Container */}
            <div className="h-44 w-full flex">
              {/* Y-axis markers */}
              <div className="flex flex-col justify-between text-[10px] text-slate-400 font-mono pr-2 pb-6 select-none">
                <span>100%</span>
                <span>75%</span>
                <span>50%</span>
                <span>25%</span>
                <span>0%</span>
              </div>

              {/* 5 Vertical Bars with score pills on top (Matching Reference Image) */}
              <div className="flex-1 flex flex-col justify-between">
                <div className="flex-1 flex items-end justify-between gap-2.5 pt-4 pb-2 border-b border-slate-200">
                  {[
                    { label: 'Radar Met.', score: '85%', height: '85%', color: 'bg-blue-600' },
                    { label: 'NWP Mod.', score: '72%', height: '72%', color: 'bg-amber-500' },
                    { label: 'Sat. Met.', score: '78%', height: '78%', color: 'bg-blue-600' },
                    { label: 'Climate Serv.', score: '65%', height: '65%', color: 'bg-amber-500' },
                    { label: 'Data Anal.', score: '80%', height: '80%', color: 'bg-blue-600' },
                  ].map((bar, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group">
                      <span className="text-[10px] font-bold text-slate-600 mb-1">
                        {bar.score}
                      </span>
                      <div className="w-full max-w-[28px] bg-slate-100 rounded-t-md h-full flex items-end overflow-hidden">
                        <div
                          className={`w-full ${bar.color} rounded-t-md transition-all duration-300 group-hover:opacity-90`}
                          style={{ height: bar.height }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* X-axis labels */}
                <div className="flex justify-between text-[10px] text-slate-500 font-medium pt-1">
                  <span className="flex-1 text-center truncate">Radar</span>
                  <span className="flex-1 text-center truncate">NWP</span>
                  <span className="flex-1 text-center truncate">Satellite</span>
                  <span className="flex-1 text-center truncate">Climate</span>
                  <span className="flex-1 text-center truncate">Data</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Bottom Row: 3 Columns (Trainees Attention + Upcoming + Stacked Cards) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Column 1: Trainees Requiring Attention (~42% width) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-4.5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900">{t.traineesAttentionTitle}</h3>
            <button
              onClick={() => navigate('trainees')}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
            >
              {t.viewAll}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400">
                  <th className="pb-2.5 pr-2">{t.colName}</th>
                  <th className="pb-2.5 px-2">{t.colCourse}</th>
                  <th className="pb-2.5 px-2 hidden sm:table-cell">{t.colCompetencyLevel}</th>
                  <th className="pb-2.5 px-2">{t.colGap}</th>
                  <th className="pb-2.5 px-2">{t.colStatus}</th>
                  <th className="pb-2.5 pl-2 text-right">{t.colAction}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {traineesRequiringAttention.map((trainee) => (
                  <tr key={trainee.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 pr-2">
                      <div className="flex items-center gap-2">
                        <img
                          src={trainee.avatar}
                          alt={trainee.name}
                          className="w-7 h-7 rounded-full object-cover shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <span className="font-bold text-slate-800 truncate">{trainee.name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-slate-600 truncate max-w-[120px]">{trainee.course}</td>
                    <td className="py-2.5 px-2 text-slate-500 hidden sm:table-cell">{trainee.level}</td>
                    <td className="py-2.5 px-2">
                      <span className={trainee.gapClass}>{trainee.gap}</span>
                    </td>
                    <td className="py-2.5 px-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${trainee.statusBadge}`}>
                        {trainee.status}
                      </span>
                    </td>
                    <td className="py-2.5 pl-2 text-right">
                      <button
                        onClick={() => handleOpenTrainee(trainee.originalTrainee)}
                        className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                        title="View trainee record"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Column 2: Upcoming Training & Assessments (~33% width) */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-4.5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900">{t.upcomingTitle}</h3>
            <button
              onClick={() => navigate('courses')}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
            >
              {t.viewAll}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400">
                  <th className="pb-2.5 pr-2">{t.colTitle}</th>
                  <th className="pb-2.5 px-2">{t.colType}</th>
                  <th className="pb-2.5 px-2">{t.colDate}</th>
                  <th className="pb-2.5 px-2">{t.colTrainees}</th>
                  <th className="pb-2.5 pl-2 text-right">{t.colStatus}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {upcomingTrainings.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 pr-2">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800 truncate max-w-[140px]">
                        {item.icon === 'training' ? (
                          <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        ) : (
                          <FileCheck className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                        )}
                        <span className="truncate">{item.title}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.typeBadge}`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-slate-500 whitespace-nowrap">{item.date}</td>
                    <td className="py-2.5 px-2 font-mono font-bold text-slate-700">{item.trainees}</td>
                    <td className="py-2.5 pl-2 text-right">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${item.statusBadge}`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Column 3: Stacked Cards (Technology Updates + Recent Activities) (~25% width) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Card A: Technology Updates */}
          <div className="bg-white rounded-2xl p-4.5 border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">{t.technologyUpdates}</h3>
              <button
                onClick={() => navigate('notifications')}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
              >
                {t.viewAll}
              </button>
            </div>

            <div className="space-y-3">
              {/* Update 1 */}
              <div
                onClick={() => navigate('notifications')}
                className="flex items-start gap-2.5 p-1.5 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Satellite className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate">Next-Gen Weather Satellites</div>
                  <div className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-snug">
                    Latest developments in geostationary satellite sensors and data products.
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 font-medium">22 Oct 2024</div>
                </div>
              </div>

              {/* Update 2 */}
              <div
                onClick={() => navigate('notifications')}
                className="flex items-start gap-2.5 p-1.5 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Cpu className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate">AI in Weather Prediction</div>
                  <div className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-snug">
                    New research on AI/ML models for improved forecasting accuracy.
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 font-medium">20 Oct 2024</div>
                </div>
              </div>

              {/* Update 3 */}
              <div
                onClick={() => navigate('notifications')}
                className="flex items-start gap-2.5 p-1.5 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Code2 className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate">Updated IMD Data Portal</div>
                  <div className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-snug">
                    Access to new high-resolution climate datasets.
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 font-medium">18 Oct 2024</div>
                </div>
              </div>
            </div>
          </div>

          {/* Card B: Recent Activities */}
          <div className="bg-white rounded-2xl p-4.5 border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">{t.recentActivitiesTitle}</h3>
              <button
                onClick={() => navigate('notifications')}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
              >
                {t.viewAll}
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                  <UploadCloud className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1">
                  <div className="text-slate-800 font-medium leading-snug">You uploaded a new learning material</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">2 hours ago</div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                  <FileCheck className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1">
                  <div className="text-slate-800 font-medium leading-snug">Assessment submitted by Ananya R.</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">5 hours ago</div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Users className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1">
                  <div className="text-slate-800 font-medium leading-snug">New trainee Vikram S. enrolled in Radar Meteorology</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">1 day ago</div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0 mt-0.5">
                  <BookOpen className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1">
                  <div className="text-slate-800 font-medium leading-snug">You published the course Climate Data Analysis</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">1 day ago</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Dedicated Interactive Meteorology Studio Drawer / Simulation Toggle */}
      <div className="mt-6 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Radio className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-slate-800">{t.simulationLab}</span>
            <span className="text-slate-400 hidden sm:inline">• Live Doppler Weather Radar (DWR) & INSAT-3DS Imagery</span>
          </div>

          <button
            onClick={() => setShowMeteorologyStudio(!showMeteorologyStudio)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200 transition-colors cursor-pointer"
          >
            <span>{showMeteorologyStudio ? t.hideStudio : t.openStudio}</span>
            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showMeteorologyStudio ? 'rotate-90' : ''}`} />
          </button>
        </div>

        {showMeteorologyStudio && (
          <div className="mt-4 animate-in fade-in-50 duration-300">
            <MeteorologyStudio onNavigateTab={(tab) => navigate(tab as any)} />
          </div>
        )}
      </div>
    </div>
  );
};
