'use client';

import React, { useState } from 'react';
import useAuthStore from '@/store/auth';
import { useLogout } from '@/features/auth';
import { TraineeNotification, TraineeUserProfile } from '../types/trainee-app-shell.types';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MobileNavigation } from './MobileNavigation';
import { TrainingFrameworkBanner } from './TrainingFrameworkBanner';

interface AppShellProps {
  children: React.ReactNode;
}

const DEFAULT_NOTIFICATIONS: TraineeNotification[] = [
  {
    id: 'notif-1',
    title: 'Severe Weather Radar Nowcasting Workshop Scheduled',
    message:
      'Live operational training session with Dr. S. K. Roy (Radar Division) scheduled for tomorrow at 10:00 AM IST.',
    timestamp: '15m ago',
    read: false,
    category: 'training',
    actionUrl: '/learning/course-1',
  },
  {
    id: 'notif-2',
    title: 'NWP WRF Numerical Modeling Assessment Assigned',
    message:
      'Numerical Weather Prediction (NWP) Module 2 practical assessment is now available for evaluation.',
    timestamp: '2h ago',
    read: false,
    category: 'assessment',
    actionUrl: '/trainee/assessments',
  },
  {
    id: 'notif-3',
    title: 'Official Circular: Revised WMO-258 Forecasting Standards',
    message:
      'Director General of Meteorology bulletin regarding updated tropical cyclone warning nomenclature.',
    timestamp: '5h ago',
    read: false,
    category: 'announcement',
    actionUrl: '/trainee/notifications',
  },
  {
    id: 'notif-4',
    title: 'WMO-258 Satellite Meteorology Credential Issued',
    message:
      'Credential verified: Satellite Meteorology & INSAT-3DR Multispectral Imagery course completion.',
    timestamp: 'Yesterday',
    read: true,
    category: 'certificate',
    actionUrl: '/trainee/certificates',
  },
  {
    id: 'notif-5',
    title: 'Synoptic Observation Practice Session Completed',
    message:
      'Surface Weather Observation exercise evaluation submitted by Pune Training Center (Score: 92/100).',
    timestamp: '2 days ago',
    read: true,
    category: 'training',
    actionUrl: '/trainee/progress',
  },
];

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { user } = useAuthStore();
  const { mutate: logout, isPending: isLoggingOut } = useLogout();

  // Navigation collapse & mobile drawer states
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Notification states
  const [notifications, setNotifications] = useState<TraineeNotification[]>(DEFAULT_NOTIFICATIONS);

  // User Profile information
  const userProfile: TraineeUserProfile = {
    name: user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Yoga S.',
    email: user?.email || 'yoga.s@imd.gov.in',
    role: 'Trainee',
    designation: user?.traineeProfile?.designation || 'Met. Observer Trainee',
    department: user?.departmentName || 'National Weather Forecasting Centre (NWFC)',
    organization: 'India Meteorological Department',
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const handleLogout = () => {
    logout();
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="flex flex-col h-screen w-full bg-[#f8fafc] text-slate-900 font-sans overflow-hidden">
      {/* 1. Full-Width Topbar at the very top */}
      <Topbar
        onToggleMobileSidebar={() => setIsMobileOpen(true)}
        userProfile={userProfile}
        notifications={notifications}
        onMarkAllAsRead={handleMarkAllAsRead}
        onMarkAsRead={handleMarkAsRead}
        onLogout={handleLogout}
        isLoggingOut={isLoggingOut}
      />

      {/* 2. Main Body Container: Sidebar (Left) + Content (Right) */}
      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        {/* Mobile Drawer Backdrop */}
        {isMobileOpen && (
          <div
            role="presentation"
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden transition-opacity duration-200"
          />
        )}

        {/* Desktop Sidebar (visible on lg+) */}
        <div className="hidden lg:flex h-full shrink-0">
          <Sidebar
            isCollapsed={isCollapsed}
            onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
            onLogout={handleLogout}
            isLoggingOut={isLoggingOut}
            unreadNotificationsCount={unreadCount}
          />
        </div>

        {/* Mobile Slide-Out Drawer (visible when isMobileOpen on < lg) */}
        <div
          className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-2xl transition-transform duration-300 ease-in-out lg:hidden ${
            isMobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <Sidebar
            isCollapsed={false}
            onToggleCollapse={() => {}}
            onCloseMobile={() => setIsMobileOpen(false)}
            onLogout={handleLogout}
            isLoggingOut={isLoggingOut}
            unreadNotificationsCount={unreadCount}
          />
        </div>

        {/* Scrollable Main Content Area */}
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 focus:outline-none bg-[#f8fafc]"
        >
          <div className="max-w-7xl mx-auto">
            {/* IMD Meteorological Training Framework Banner */}
            <TrainingFrameworkBanner />

            {/* Injected Page Module Content */}
            {children}
          </div>
        </main>
      </div>

      {/* Fixed Mobile Bottom Navigation */}
      <MobileNavigation unreadNotificationsCount={unreadCount} />
    </div>
  );
};

export default AppShell;
