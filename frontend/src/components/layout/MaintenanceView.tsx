'use client';

import React from 'react';
import { AlertTriangle, Clock, Wrench, ShieldAlert } from 'lucide-react';
import { PublicPortalSettings } from '@/features/settings/types/settings.types';

interface MaintenanceViewProps {
  settings: PublicPortalSettings;
}

export const MaintenanceView: React.FC<MaintenanceViewProps> = ({ settings }) => {
  const formatDate = (isoStr?: string | null) => {
    if (!isoStr) return null;
    try {
      return new Date(isoStr).toLocaleString('en-IN', {
        timeZone: settings.defaultTimezone || 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return isoStr;
    }
  };

  const formattedEnd = formatDate(settings.estimatedMaintenanceEnd);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 selection:bg-indigo-500 selection:text-white">
      <div className="max-w-lg w-full text-center space-y-6 animate-in fade-in duration-300">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-2xl">
          <Wrench className="w-10 h-10 animate-bounce" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold uppercase tracking-wider">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Scheduled System Maintenance</span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            {settings.maintenanceTitle || 'Capacity Connect is temporarily unavailable'}
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
            {settings.maintenanceMessage ||
              'We are currently performing scheduled maintenance and performance optimizations across the learning portal. Please check back shortly.'}
          </p>
        </div>

        {formattedEnd && (
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center gap-2 text-xs font-semibold text-slate-300">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Estimated Availability: </span>
            <span className="font-mono text-white font-bold">{formattedEnd}</span>
          </div>
        )}

        <div className="pt-6 border-t border-slate-800 text-xs text-slate-400 space-y-1">
          <p className="font-semibold text-slate-300">{settings.organizationName || 'Capacity Connect'}</p>
          {settings.supportEmail && (
            <p>
              For urgent operational inquiries, contact:{' '}
              <a
                href={`mailto:${settings.supportEmail}`}
                className="text-indigo-400 hover:text-indigo-300 underline font-semibold"
              >
                {settings.supportEmail}
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
