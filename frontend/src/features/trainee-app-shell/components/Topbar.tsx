'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, Search, Bell, ChevronDown, HelpCircle, LayoutGrid, Sparkles } from 'lucide-react';
import { TraineeNotification, TraineeUserProfile } from '../types/trainee-app-shell.types';
import { NotificationPanel } from './NotificationPanel';
import { ProfileMenu } from './ProfileMenu';

interface TopbarProps {
  onToggleMobileSidebar: () => void;
  userProfile: TraineeUserProfile;
  notifications: TraineeNotification[];
  onMarkAllAsRead: () => void;
  onMarkAsRead: (id: string) => void;
  onLogout: () => void;
  isLoggingOut?: boolean;
}

export const Topbar: React.FC<TopbarProps> = ({
  onToggleMobileSidebar,
  userProfile,
  notifications,
  onMarkAllAsRead,
  onMarkAsRead,
  onLogout,
  isLoggingOut = false,
}) => {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [activeLanguage, setActiveLanguage] = useState<'हिन्दी' | 'Eng' | 'தமிழ்'>('Eng');

  const unreadCount = notifications.filter((n) => !n.read).length;

  const initials =
    userProfile.name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('') || 'YS';

  return (
    <header className="h-16 border-b border-slate-200 bg-white flex items-center px-4 sm:px-6 justify-between shrink-0 sticky top-0 z-40 shadow-2xs">
      {/* Left: Hamburger (Mobile) + Branding + Government Subtitles */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          aria-label="Open navigation menu"
          className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors lg:hidden focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Brand & Organization */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/trainee/dashboard"
            className="flex items-center gap-2.5 group focus-visible:outline-none"
            title="Capacity Connect - MoES / IMD"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0B192C] to-[#1E3E62] text-white flex items-center justify-center font-black text-sm shadow-xs group-hover:opacity-95 transition-opacity">
              <Sparkles className="w-4 h-4 text-sky-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black tracking-tight text-[#0B192C] leading-none">
                CAPACITY CONNECT
              </span>
              <span className="text-[10px] text-sky-600 font-bold tracking-wide mt-0.5 leading-none">
                Learn • Develop • Grow
              </span>
            </div>
          </Link>

          {/* Vertical Divider */}
          <div className="hidden md:block h-7 w-px bg-slate-200 mx-1" />

          {/* Ministry & IMD Subtitles */}
          <div className="hidden md:flex flex-col min-w-0">
            <span className="text-xs font-bold text-slate-800 leading-tight">
              Ministry of Earth Sciences
            </span>
            <span className="text-[11px] text-slate-500 font-medium leading-none mt-0.5">
              India Meteorological Department
            </span>
          </div>
        </div>
      </div>

      {/* Center: Search UI Placeholder */}
      <div className="hidden lg:flex items-center flex-1 max-w-xl mx-6">
        <div
          role="search"
          aria-label="Search courses, trainees, assessments, resources"
          className="w-full flex items-center gap-2.5 px-4 py-2 rounded-full border border-slate-200 bg-slate-50/90 text-slate-400 text-xs hover:border-slate-300 hover:bg-white transition-all cursor-text focus-within:border-sky-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-sky-100"
        >
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            readOnly
            placeholder="Search courses, trainees, assessments, resources..."
            className="w-full bg-transparent border-none text-slate-800 placeholder:text-slate-400 text-xs focus:outline-none cursor-pointer"
            aria-label="Search courses placeholder"
          />
          <kbd className="hidden xl:inline-flex text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-500 shadow-2xs">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right: Language switcher, Notifications, Help, Apps, Profile */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Language selector segmented pill */}
        <div className="hidden xl:flex items-center p-0.5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-600">
          {(['हिन्दी', 'Eng', 'தமிழ்'] as const).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setActiveLanguage(lang)}
              className={`px-2.5 py-1 rounded text-xs transition-all ${
                activeLanguage === lang
                  ? 'bg-[#0B192C] text-white shadow-xs font-bold'
                  : 'hover:text-slate-900 text-slate-600'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>

        {/* Notifications Icon with red badge count */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setNotificationsOpen(!notificationsOpen);
              setProfileOpen(false);
            }}
            aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
            aria-expanded={notificationsOpen}
            className={`p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors relative focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none ${
              notificationsOpen ? 'bg-slate-100 text-slate-900' : ''
            }`}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-extrabold flex items-center justify-center absolute -top-1 -right-1 ring-2 ring-white">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          <NotificationPanel
            isOpen={notificationsOpen}
            onClose={() => setNotificationsOpen(false)}
            notifications={notifications}
            onMarkAllAsRead={onMarkAllAsRead}
            onMarkAsRead={onMarkAsRead}
          />
        </div>

        {/* Help Question Mark Icon */}
        <button
          type="button"
          aria-label="Portal Documentation & Help"
          title="MoES / IMD Training Guidelines & Support"
          className="hidden sm:flex p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* 9-Dot App Switcher Grid Icon */}
        <button
          type="button"
          aria-label="Institutional Applications & Services"
          title="MoES / IMD Services Grid"
          className="hidden sm:flex p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none"
        >
          <LayoutGrid className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-slate-200 mx-0.5 hidden sm:block" />

        {/* Trainee Profile Trigger */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setProfileOpen(!profileOpen);
              setNotificationsOpen(false);
            }}
            aria-label="Trainee profile menu"
            aria-expanded={profileOpen}
            className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1.5 rounded-2xl hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none"
          >
            {/* Avatar with online dot */}
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0B192C] to-[#1E3E62] text-white flex items-center justify-center font-bold text-xs shadow-2xs shrink-0 border border-slate-300">
                {initials}
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>

            {/* Trainee Name & Role */}
            <div className="hidden sm:flex flex-col text-left min-w-0">
              <span className="text-xs font-bold text-slate-900 leading-tight truncate">
                {userProfile.name}
              </span>
              <span className="text-[10px] font-semibold text-slate-500 leading-none">
                {userProfile.role}
              </span>
            </div>

            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 hidden sm:block" />
          </button>

          {/* Profile Dropdown Menu */}
          <ProfileMenu
            isOpen={profileOpen}
            onClose={() => setProfileOpen(false)}
            userProfile={userProfile}
            onLogout={onLogout}
            isLoggingOut={isLoggingOut}
          />
        </div>
      </div>
    </header>
  );
};

export default Topbar;
