'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { User, Settings, LogOut, Loader2, Shield } from 'lucide-react';
import { TraineeUserProfile } from '../types/trainee-app-shell.types';

interface ProfileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: TraineeUserProfile;
  onLogout: () => void;
  isLoggingOut?: boolean;
}

export const ProfileMenu: React.FC<ProfileMenuProps> = ({
  isOpen,
  onClose,
  userProfile,
  onLogout,
  isLoggingOut = false,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const initials =
    userProfile.name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('') || 'YS';

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-orientation="vertical"
      aria-label="Trainee Profile Options"
      className="absolute right-0 mt-2 w-72 rounded-2xl bg-white border border-slate-200 shadow-xl z-50 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150"
    >
      {/* User Information Header */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/70">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-extrabold text-sm shadow-2xs shrink-0">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <span className="block text-xs font-bold text-slate-900 truncate">
              {userProfile.name}
            </span>
            <span className="block text-[11px] text-slate-500 truncate font-medium">
              {userProfile.email}
            </span>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-200/60">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600">
            <Shield className="w-3 h-3 text-sky-600 shrink-0" />
            <span className="truncate">
              {userProfile.organization || 'India Meteorological Department'}
            </span>
          </div>
          <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
            {userProfile.role}
          </span>
        </div>
      </div>

      {/* Menu Options */}
      <div className="p-2 space-y-1">
        <Link
          href="/trainee/profile"
          onClick={onClose}
          role="menuitem"
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none"
        >
          <User className="w-4 h-4 text-slate-500" />
          <span>My Profile</span>
        </Link>

        <Link
          href="/trainee/settings"
          onClick={onClose}
          role="menuitem"
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:outline-none"
        >
          <Settings className="w-4 h-4 text-slate-500" />
          <span>Settings</span>
        </Link>
      </div>

      {/* Sign Out Action */}
      <div className="p-2 border-t border-slate-100 bg-slate-50/40">
        <button
          type="button"
          onClick={onLogout}
          disabled={isLoggingOut}
          role="menuitem"
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
        >
          {isLoggingOut ? (
            <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
          ) : (
            <LogOut className="w-4 h-4 text-slate-500 hover:text-rose-600" />
          )}
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );
};

export default ProfileMenu;
