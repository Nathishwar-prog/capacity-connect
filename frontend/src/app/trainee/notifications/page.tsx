'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Bell,
  CheckCheck,
  Calendar,
  ClipboardList,
  Award,
  Radio,
  ExternalLink,
  ArrowRight,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';
import { useLanguageStore } from '@/store/language';

export interface TraineeNotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  category: 'training' | 'assessment' | 'certificate' | 'announcement';
  actionUrl?: string;
  actionLabel?: string;
  priority?: 'high' | 'normal';
}

const INITIAL_NOTIFICATIONS: TraineeNotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Severe Weather Radar Nowcasting Workshop Scheduled',
    message:
      'Live operational training session with Dr. S. K. Roy (Radar Division) scheduled for tomorrow at 10:00 AM IST. Please review DWR reflectivity calibration notes.',
    timestamp: '15m ago',
    read: false,
    category: 'training',
    actionUrl: '/learning/course-1',
    actionLabel: 'Go to Course',
    priority: 'high',
  },
  {
    id: 'notif-2',
    title: 'NWP WRF Numerical Modeling Assessment Assigned',
    message:
      'Numerical Weather Prediction (NWP) Module 2 practical assessment is now available for evaluation. Target completion deadline: Friday, 17:00 IST.',
    timestamp: '2h ago',
    read: false,
    category: 'assessment',
    actionUrl: '/trainee/assessments',
    actionLabel: 'View Assessment',
    priority: 'high',
  },
  {
    id: 'notif-3',
    title: 'Official Circular: Revised WMO-258 Forecasting Standards',
    message:
      'Director General of Meteorology (DGM) bulletin regarding updated tropical cyclone warning nomenclature and radar velocity azimuth display (VAD) guidelines.',
    timestamp: '5h ago',
    read: false,
    category: 'announcement',
    actionUrl: '/trainee/courses',
    actionLabel: 'Read Circular',
  },
  {
    id: 'notif-4',
    title: 'WMO-258 Satellite Meteorology Credential Issued',
    message:
      'Your qualification in INSAT-3DR Multispectral Imagery & Rapid-Scan Nowcasting has been verified by the MoES Capacity Building Board.',
    timestamp: 'Yesterday',
    read: true,
    category: 'certificate',
    actionUrl: '/trainee/certificates',
    actionLabel: 'View Certificate',
  },
  {
    id: 'notif-5',
    title: 'Synoptic Observation Practice Session Completed',
    message:
      'Surface Weather Observation exercise evaluation submitted by Pune Training Center. Score: 92/100 (Excellence in METAR/SPECI coding).',
    timestamp: '2 days ago',
    read: true,
    category: 'training',
    actionUrl: '/trainee/progress',
    actionLabel: 'View Trajectory',
  },
  {
    id: 'notif-6',
    title: 'Upcoming Monsoon Forecaster Briefing',
    message:
      'Pre-monsoon synoptic diagnostics review session will be held at National Weather Forecasting Centre (NWFC) auditorium and via tele-education.',
    timestamp: '3 days ago',
    read: true,
    category: 'announcement',
    actionUrl: '/trainee/dashboard',
    actionLabel: 'Dashboard',
  },
];

export default function TraineeNotificationsPage() {
  const { language } = useLanguageStore();

  const [notifications, setNotifications] =
    useState<TraineeNotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  const t = {
    en: {
      pageTitle: 'Notifications & Operational Dispatches',
      pageSubtitle:
        'Official circulars, training schedule alerts, assessment assignments, and credential verifications from MoES and IMD faculty.',
      markAllRead: 'Mark All as Read',
      all: 'All',
      unread: 'Unread',
      training: 'Training Sessions',
      assessments: 'Assessments',
      certificates: 'Certificates',
      bulletins: 'Bulletins & Circulars',
      emptyTitle: 'No notifications found',
      emptySub: 'You are all caught up with your training trajectory and announcements.',
      markRead: 'Mark read',
    },
    hi: {
      pageTitle: 'अधिसूचनाएं एवं परिचालन प्रेषण',
      pageSubtitle:
        'MoES और IMD संकाय से आधिकारिक परिपत्र, प्रशिक्षण कार्यक्रम अलर्ट, मूल्यांकन कार्य और प्रमाणपत्र सत्यापन।',
      markAllRead: 'सभी को पढ़ा हुआ चिह्नित करें',
      all: 'सभी',
      unread: 'अपठित',
      training: 'प्रशिक्षण सत्र',
      assessments: 'मूल्यांकन',
      certificates: 'प्रमाणपत्र',
      bulletins: 'बुलेटिन एवं परिपत्र',
      emptyTitle: 'कोई अधिसूचना नहीं मिली',
      emptySub: 'आप अपने प्रशिक्षण पथ और घोषणाओं के साथ पूरी तरह अद्यतित हैं।',
      markRead: 'पढ़ा हुआ चिह्नित करें',
    },
    ta: {
      pageTitle: 'அறிவிப்புகள் மற்றும் செயல்பாட்டு சுற்றறிக்கைகள்',
      pageSubtitle:
        'MoES மற்றும் IMD ஆசிரியர்களிடமிருந்து அதிகாரப்பூர்வ சுற்றறிக்கைகள், பயிற்சி அட்டவணை எச்சரிக்கைகள் மற்றும் சான்றிதழ் சரிபார்ப்புகள்.',
      markAllRead: 'அனைத்தையும் படித்ததாகக் குறிக்கவும்',
      all: 'அனைத்தும்',
      unread: 'படிக்காதவை',
      training: 'பயிற்சி அமர்வுகள்',
      assessments: 'மதிப்பீடுகள்',
      certificates: 'சான்றிதழ்கள்',
      bulletins: 'சுற்றறிக்கைகள்',
      emptyTitle: 'அறிவிப்புகள் எதுவும் இல்லை',
      emptySub:
        'உங்கள் பயிற்சிப் பாதை மற்றும் அறிவிப்புகளுடன் நீங்கள் புதுப்பித்த நிலையில் உள்ளீர்கள்.',
      markRead: 'படித்ததாகக் குறி',
    },
  }[language];

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleToggleRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n)));
  };

  const filtered = notifications.filter((n) => {
    if (filterCategory === 'UNREAD') return !n.read;
    if (filterCategory !== 'ALL') return n.category === filterCategory;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getCategoryBadge = (category: TraineeNotificationItem['category']) => {
    switch (category) {
      case 'training':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            <Calendar className="w-3 h-3 text-blue-600" />
            <span>Training</span>
          </span>
        );
      case 'assessment':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
            <ClipboardList className="w-3 h-3 text-purple-600" />
            <span>Assessment</span>
          </span>
        );
      case 'certificate':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Award className="w-3 h-3 text-emerald-600" />
            <span>Certificate</span>
          </span>
        );
      case 'announcement':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
            <Radio className="w-3 h-3 text-amber-600" />
            <span>Bulletin</span>
          </span>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{t.pageTitle}</h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
              {t.pageSubtitle}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors shadow-2xs"
              >
                <CheckCheck className="w-4 h-4 text-slate-600" />
                <span>{t.markAllRead}</span>
              </button>
            )}

            <div className="p-3 bg-rose-50 rounded-2xl border border-rose-100 flex items-center gap-2.5">
              <Bell className="w-5 h-5 text-rose-600" />
              <div className="text-right">
                <p className="text-[10px] font-black uppercase text-rose-700">Unread</p>
                <p className="text-xs font-black text-slate-900">{unreadCount} Alerts</p>
              </div>
            </div>
          </div>
        </div>

        {/* Category Pill Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          {[
            { key: 'ALL', label: `${t.all} (${notifications.length})` },
            { key: 'UNREAD', label: `${t.unread} (${unreadCount})` },
            { key: 'training', label: t.training },
            { key: 'assessment', label: t.assessments },
            { key: 'certificate', label: t.certificates },
            { key: 'announcement', label: t.bulletins },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilterCategory(tab.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                filterCategory === tab.key
                  ? 'bg-[#0B192C] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-3xl p-10 text-center space-y-3 shadow-xs">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h3 className="text-base font-black text-slate-800">{t.emptyTitle}</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">{t.emptySub}</p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className={`p-5 rounded-3xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group ${
                !item.read
                  ? 'bg-white border-blue-200/90 shadow-sm hover:border-blue-400'
                  : 'bg-white/70 border-slate-200/70 hover:bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-start gap-3.5 min-w-0">
                {/* Read indicator dot */}
                <button
                  type="button"
                  onClick={() => handleToggleRead(item.id)}
                  title={item.read ? 'Mark as unread' : 'Mark as read'}
                  className="mt-1 shrink-0 p-1 text-slate-400 hover:text-blue-600 transition-colors"
                >
                  <span
                    className={`block w-2.5 h-2.5 rounded-full ${
                      !item.read ? 'bg-blue-600 ring-4 ring-blue-100' : 'bg-slate-300'
                    }`}
                  />
                </button>

                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {getCategoryBadge(item.category)}
                    {item.priority === 'high' && (
                      <span className="text-[10px] font-black uppercase px-2 py-0.2 rounded-md bg-rose-50 text-rose-600 border border-rose-200">
                        Priority Alert
                      </span>
                    )}
                    <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{item.timestamp}</span>
                    </span>
                  </div>

                  <h3
                    className={`text-sm font-black leading-snug ${
                      !item.read ? 'text-slate-900' : 'text-slate-700'
                    }`}
                  >
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">{item.message}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                {item.actionUrl && (
                  <Link
                    href={item.actionUrl}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 text-xs font-bold transition-colors shadow-2xs"
                  >
                    <span>{item.actionLabel || 'View'}</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
