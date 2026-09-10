'use client';

import React, { useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import {
  Settings,
  Clock,
  Sparkles,
  Bell,
  CheckCircle2,
  Brain,
  Layers,
  Compass,
  Sliders,
  RotateCcw,
} from 'lucide-react';

export default function TraineePreferencesPage() {
  const { showToast } = useToast();

  const [dailyTarget, setDailyTarget] = useState(20);
  const [selectedDomains, setSelectedDomains] = useState<string[]>([
    'Doppler Weather Radar',
    'Hydrology & Flash Floods',
    'NWP Data Assimilation',
  ]);
  const [notifyRevision, setNotifyRevision] = useState(true);
  const [notifyAssessments, setNotifyAssessments] = useState(true);
  const [notifyMentors, setNotifyMentors] = useState(true);
  const [revisionMode, setRevisionMode] = useState<'BALANCED' | 'RETRIEVAL' | 'REBUILD'>('BALANCED');
  const [saving, setSaving] = useState(false);

  const toggleDomain = (domain: string) => {
    setSelectedDomains((prev) =>
      prev.includes(domain) ? prev.filter((d) => d !== domain) : [...prev, domain]
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      showToast('Learning preferences saved successfully.', 'success');
    }, 400);
  };

  const domainOptions = [
    'Doppler Weather Radar',
    'Hydrology & Flash Floods',
    'NWP Data Assimilation',
    'Satellite Meteorology (INSAT)',
    'Tropical Cyclone Forecasting',
    'Surface Observational Networks (AWS)',
    'Climate Variability & Monsoon Teleconnections',
  ];

  return (
    <ProtectedRoute allowedRoles={['TRAINEE', 'ADMIN', 'SUPER_ADMIN']}>
      <AppShell>
        <div className="max-w-4xl mx-auto space-y-6 pb-16">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200 flex items-center gap-1">
                  <Settings className="w-3.5 h-3.5 text-indigo-600" />
                  Learning Preferences
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 mt-1">
                Personalized Learning Configuration
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Customize your daily capacity goals, focus domains, adaptive revision pacing, and notifications.
              </p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            {/* 1. Daily Study Target */}
            <Card className="p-6 sm:p-7 bg-white border-slate-200 rounded-3xl shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Daily Study Target</h3>
                  <p className="text-xs text-slate-500">
                    Targeted study duration for your daily dashboard recommendations.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {[15, 20, 30, 45].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDailyTarget(mins)}
                    className={`p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                      dailyTarget === mins
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 font-bold shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-lg font-black block">{mins} min</span>
                    <span className="text-[10px] text-slate-500">
                      {mins === 20 ? 'Recommended Pacing' : mins < 20 ? 'Light Session' : 'Intensive Study'}
                    </span>
                  </button>
                ))}
              </div>
            </Card>

            {/* 2. Meteorological Focus Domains */}
            <Card className="p-6 sm:p-7 bg-white border-slate-200 rounded-3xl shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Priority Focus Areas</h3>
                  <p className="text-xs text-slate-500">
                    Highlight specialized scientific disciplines for AI recommendations and revision priority.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {domainOptions.map((domain) => {
                  const isSelected = selectedDomains.includes(domain);
                  return (
                    <button
                      key={domain}
                      type="button"
                      onClick={() => toggleDomain(domain)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                      <span>{domain}</span>
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* 3. Adaptive Revision Mode */}
            <Card className="p-6 sm:p-7 bg-white border-slate-200 rounded-3xl shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Adaptive Revision Strategy</h3>
                  <p className="text-xs text-slate-500">
                    Controls how the system schedules and structures memory reinforcement sessions.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                {[
                  {
                    id: 'BALANCED',
                    label: 'Balanced Pacing',
                    desc: 'Mixes brief concept recap with immediate active retrieval testing.',
                  },
                  {
                    id: 'RETRIEVAL',
                    label: 'Active Retrieval Focus',
                    desc: 'Maximizes diagnostic test questions and flash quizzes to test memory retention.',
                  },
                  {
                    id: 'REBUILD',
                    label: 'Deep Rebuild Mode',
                    desc: 'Provides full worked examples and step-by-step guidance before self-testing.',
                  },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setRevisionMode(mode.id as any)}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      revisionMode === mode.id
                        ? 'border-purple-600 bg-purple-50/60 text-purple-950 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-xs font-bold block text-slate-900">{mode.label}</span>
                    <span className="text-[11px] text-slate-500 mt-1 block leading-relaxed">{mode.desc}</span>
                  </button>
                ))}
              </div>
            </Card>

            {/* 4. Notification Alerts */}
            <Card className="p-6 sm:p-7 bg-white border-slate-200 rounded-3xl shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Notification Alerts</h3>
                  <p className="text-xs text-slate-500">
                    Institutional notifications regarding deadlines, recommendations, and mentor responses.
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <label className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      Adaptive Revision Reminders
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Notify me when a high forgetting-risk concept requires review.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyRevision}
                    onChange={(e) => setNotifyRevision(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 accent-indigo-600 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      Assessment & Practical Exam Deadlines
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Alerts for assigned evaluation tests and due dates.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyAssessments}
                    onChange={(e) => setNotifyAssessments(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 accent-indigo-600 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      Mentor & Trainer Feedback
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Direct guidance and feedback from assigned lead scientists.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyMentors}
                    onChange={(e) => setNotifyMentors(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 accent-indigo-600 cursor-pointer"
                  />
                </label>
              </div>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-7 py-2.5 rounded-xl shadow-xs"
              >
                {saving ? 'Saving...' : 'Save Preferences'}
              </Button>
            </div>
          </form>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
