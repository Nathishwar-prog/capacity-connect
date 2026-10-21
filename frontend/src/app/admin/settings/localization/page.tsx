'use client';

import React, { useEffect, useState } from 'react';
import { SettingsLayout } from '@/features/settings/components/SettingsLayout';
import { settingsApi } from '@/features/settings/api/settingsApi';
import { SystemSettingsData } from '@/features/settings/types/settings.types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/Toast';
import { Globe, Clock, Calendar, CheckCircle2 } from 'lucide-react';

const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
];

const TIMEZONES = [
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST - UTC+05:30)' },
  { value: 'UTC', label: 'Coordinated Universal Time (UTC)' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (GST - UTC+04:00)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT - UTC+08:00)' },
  { value: 'Europe/London', label: 'Europe/London (GMT/BST)' },
];

export default function LocalizationSettingsPage() {
  const { showToast } = useToast();
  const [initialData, setInitialData] = useState<SystemSettingsData | null>(null);
  const [form, setForm] = useState<Partial<SystemSettingsData>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    settingsApi
      .getSettings()
      .then((data) => {
        setInitialData(data);
        setForm(data);
      })
      .catch(() => showToast('Failed to load localization settings.', 'error'))
      .finally(() => setIsLoading(false));
  }, []);

  const handleChange = (field: keyof SystemSettingsData, value: any) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      setIsDirty(true);
      return next;
    });
  };

  const handleLanguageToggle = (code: string) => {
    const current = form.availableLanguages || ['en'];
    if (current.includes(code)) {
      if (current.length <= 1) {
        showToast('At least one platform language must remain enabled.', 'warning');
        return;
      }
      if (form.defaultLanguage === code) {
        showToast('Cannot disable the current default language. Switch default first.', 'warning');
        return;
      }
      handleChange('availableLanguages', current.filter((c) => c !== code));
    } else {
      handleChange('availableLanguages', [...current, code]);
    }
  };

  const handleReset = () => {
    if (initialData) {
      setForm(initialData);
      setIsDirty(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated = await settingsApi.updateLocalizationSettings(form);
      setInitialData(updated);
      setForm(updated);
      setIsDirty(false);
      showToast('Localization and regional formatting saved successfully.', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to save localization settings.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SettingsLayout
      title="Localization & Regional Settings"
      description="Configure supported platform languages, time zone display offsets, and date/time formatting."
      isDirty={isDirty}
      isLoading={isLoading}
      isSaving={isSaving}
      onSave={handleSave}
      onReset={handleReset}
    >
      <div className="space-y-6">
        {/* Language Configuration Card */}
        <Card className="border-slate-200/90 shadow-2xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-600" />
              <span>Multi-Lingual Platform Configuration</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-900 block mb-1">Default System Language</label>
              <select
                value={form.defaultLanguage || 'en'}
                onChange={(e) => handleChange('defaultLanguage', e.target.value)}
                className="w-full sm:w-72 py-2 px-3 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 cursor-pointer"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.label} ({lang.native})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-900 block mb-2">Available Languages</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {SUPPORTED_LANGUAGES.map((lang) => {
                  const isChecked = (form.availableLanguages || []).includes(lang.code);
                  const isDefault = form.defaultLanguage === lang.code;

                  return (
                    <div
                      key={lang.code}
                      onClick={() => handleLanguageToggle(lang.code)}
                      className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-indigo-50/70 border-indigo-200 text-indigo-950 font-bold'
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border ${isChecked ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'}`}>
                          {isChecked && <CheckCircle2 className="w-3 h-3" />}
                        </span>
                        <div>
                          <span className="block leading-tight">{lang.label}</span>
                          <span className="text-[10px] text-slate-400 font-normal">{lang.native}</span>
                        </div>
                      </div>

                      {isDefault && (
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-indigo-200 text-indigo-900">
                          Default
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timezone & Date/Time Formats Card */}
        <Card className="border-slate-200/90 shadow-2xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span>Timezone & Date / Time Formatting</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-900 block mb-1">Standard Platform Timezone</label>
                <select
                  value={form.defaultTimezone || 'Asia/Kolkata'}
                  onChange={(e) => handleChange('defaultTimezone', e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 cursor-pointer"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  All announcements, audit logs, and assessment windows standardize to this offset.
                </p>
              </div>

              <div>
                <label className="font-bold text-slate-900 block mb-1">Date Format</label>
                <select
                  value={form.dateFormat || 'DD/MM/YYYY'}
                  onChange={(e) => handleChange('dateFormat', e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 cursor-pointer"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 05/10/2026 - Standard)</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 10/05/2026)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-10-05 - ISO)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-900 block mb-1">Time Format</label>
                <select
                  value={form.timeFormat || '12h'}
                  onChange={(e) => handleChange('timeFormat', e.target.value as any)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 cursor-pointer"
                >
                  <option value="12h">12-Hour Format (e.g. 05:40 PM)</option>
                  <option value="24h">24-Hour Format (e.g. 17:40)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-900 block mb-1">Default Platform Currency</label>
                <input
                  type="text"
                  value={form.currency || 'INR'}
                  onChange={(e) => handleChange('currency', e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 uppercase"
                />
              </div>
            </div>

            {/* Live Timestamp Preview */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-slate-800">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span className="font-bold">Display Preview with Current Settings:</span>
              </div>
              <span className="font-mono text-xs font-bold px-3 py-1 rounded-lg bg-white border border-slate-200 text-indigo-700">
                05/10/2026, 05:45 PM (Asia/Kolkata)
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </SettingsLayout>
  );
}
