'use client';

import React, { useEffect, useState } from 'react';
import { SettingsLayout } from '@/features/settings/components/SettingsLayout';
import { settingsApi } from '@/features/settings/api/settingsApi';
import { SystemSettingsData } from '@/features/settings/types/settings.types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/Toast';
import { Shield, Lock, Clock, KeyRound, ShieldAlert, CheckCircle2, XCircle } from 'lucide-react';

const RBAC_MATRIX = [
  { module: 'User Management', read: ['ADMIN', 'SUPER_ADMIN'], write: ['ADMIN', 'SUPER_ADMIN'], approve: ['ADMIN', 'SUPER_ADMIN'] },
  { module: 'Course Authoring', read: ['TRAINEE', 'TRAINER', 'ADMIN'], write: ['TRAINER', 'ADMIN'], approve: ['ADMIN', 'SUPER_ADMIN'] },
  { module: 'Course Publishing', read: ['ALL'], write: ['ADMIN', 'SUPER_ADMIN'], approve: ['ADMIN', 'SUPER_ADMIN'] },
  { module: 'Assessments', read: ['TRAINEE', 'TRAINER', 'ADMIN'], write: ['TRAINER', 'ADMIN'], approve: ['TRAINER', 'ADMIN'] },
  { module: 'Learning Resources', read: ['TRAINEE', 'TRAINER', 'ADMIN'], write: ['TRAINER', 'ADMIN'], approve: ['ADMIN'] },
  { module: 'Executive Analytics', read: ['ADMIN', 'SUPER_ADMIN'], write: ['ADMIN', 'SUPER_ADMIN'], approve: ['ADMIN'] },
  { module: 'Announcements', read: ['ALL'], write: ['ADMIN', 'SUPER_ADMIN'], approve: ['ADMIN', 'SUPER_ADMIN'] },
  { module: 'System Settings', read: ['ADMIN', 'SUPER_ADMIN'], write: ['ADMIN', 'SUPER_ADMIN'], approve: ['SUPER_ADMIN'] },
];

export default function SecuritySettingsPage() {
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
      .catch(() => showToast('Failed to load security settings.', 'error'))
      .finally(() => setIsLoading(false));
  }, []);

  const handleChange = (field: keyof SystemSettingsData, value: any) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      setIsDirty(true);
      return next;
    });
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
      const updated = await settingsApi.updateSecuritySettings(form);
      setInitialData(updated);
      setForm(updated);
      setIsDirty(false);
      showToast('Security and session policies saved successfully.', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to save security settings.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SettingsLayout
      title="Security & Access Governance"
      description="Configure session expiration policies, authentication rate limits, onboarding policies, and verify RBAC authorizations."
      isDirty={isDirty}
      isLoading={isLoading}
      isSaving={isSaving}
      onSave={handleSave}
      onReset={handleReset}
    >
      <div className="space-y-6">
        {/* Session Invalidation Policies Card */}
        <Card className="border-slate-200/90 shadow-2xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span>Session Invalidation & JWT Expiration Policies</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <label className="font-bold text-slate-900 block mb-1">Session Inactivity Timeout</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="5"
                    max="1440"
                    value={form.sessionTimeoutMinutes ?? 30}
                    onChange={(e) => handleChange('sessionTimeoutMinutes', parseInt(e.target.value, 10) || 30)}
                    className="w-full py-1.5 px-3 rounded-lg border border-slate-200 bg-white font-extrabold text-slate-800"
                  />
                  <span className="font-bold text-slate-500">Mins</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Forces re-authentication after client inactivity.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <label className="font-bold text-slate-900 block mb-1">JWT Access Token Lifespan</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="5"
                    max="1440"
                    value={form.jwtAccessExpirationMinutes ?? 15}
                    onChange={(e) => handleChange('jwtAccessExpirationMinutes', parseInt(e.target.value, 10) || 15)}
                    className="w-full py-1.5 px-3 rounded-lg border border-slate-200 bg-white font-extrabold text-slate-800"
                  />
                  <span className="font-bold text-slate-500">Mins</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Short-lived cryptographic bearer authorization.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <label className="font-bold text-slate-900 block mb-1">Refresh Token Retention</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={form.jwtRefreshExpirationDays ?? 7}
                    onChange={(e) => handleChange('jwtRefreshExpirationDays', parseInt(e.target.value, 10) || 7)}
                    className="w-full py-1.5 px-3 rounded-lg border border-slate-200 bg-white font-extrabold text-slate-800"
                  />
                  <span className="font-bold text-slate-500">Days</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">HttpOnly cookie rotation renewal limit.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Password Security & Account Protection Card */}
        <Card className="border-slate-200/90 shadow-2xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-indigo-600" />
              <span>Password Complexity & Brute-Force Rate Limiting</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.requireStrongPassword ?? true}
                  onChange={(e) => handleChange('requireStrongPassword', e.target.checked)}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="font-bold text-slate-900 block">Enforce Strong Password Complexity</span>
                  <span className="text-[11px] text-slate-500">Requires uppercase, lowercase, numbers, and symbols.</span>
                </div>
              </label>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-slate-900 block">Minimum Password Length</span>
                  <span className="text-[11px] text-slate-500">Characters required for account passwords.</span>
                </div>
                <input
                  type="number"
                  min="6"
                  max="32"
                  value={form.passwordMinLength ?? 8}
                  onChange={(e) => handleChange('passwordMinLength', parseInt(e.target.value, 10) || 8)}
                  className="w-20 py-1.5 px-3 rounded-xl border border-slate-200 bg-white font-extrabold text-slate-800 text-center"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-slate-900 block">Max Failed Login Attempts</span>
                  <span className="text-[11px] text-slate-500">Threshold before temporary account lockout.</span>
                </div>
                <input
                  type="number"
                  min="3"
                  max="15"
                  value={form.maxLoginAttempts ?? 5}
                  onChange={(e) => handleChange('maxLoginAttempts', parseInt(e.target.value, 10) || 5)}
                  className="w-20 py-1.5 px-3 rounded-xl border border-slate-200 bg-white font-extrabold text-slate-800 text-center"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-slate-900 block">Lockout Duration (Minutes)</span>
                  <span className="text-[11px] text-slate-500">Duration account remains locked following threshold.</span>
                </div>
                <input
                  type="number"
                  min="1"
                  max="1440"
                  value={form.lockoutDurationMinutes ?? 15}
                  onChange={(e) => handleChange('lockoutDurationMinutes', parseInt(e.target.value, 10) || 15)}
                  className="w-20 py-1.5 px-3 rounded-xl border border-slate-200 bg-white font-extrabold text-slate-800 text-center"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Public Registration Policy Card */}
        <Card className="border-slate-200/90 shadow-2xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-indigo-600" />
              <span>Public Registration & Staff Onboarding Policy</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <span className="font-bold text-slate-900 block">New User Account Onboarding State</span>
                <p className="text-[11px] text-slate-500">
                  Controls default account verification status upon self-registration on the public portal.
                </p>
              </div>
              <select
                value={form.publicRegistrationPolicy || 'APPROVAL_REQUIRED'}
                onChange={(e) => handleChange('publicRegistrationPolicy', e.target.value as any)}
                className="py-2 px-3 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 cursor-pointer"
              >
                <option value="APPROVAL_REQUIRED">Requires Admin Approval (PENDING status)</option>
                <option value="AUTO_ACTIVE">Auto-Active (Internal Network Approved)</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* RBAC Enforcement Matrix Card */}
        <Card className="border-slate-200/90 shadow-2xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-600" />
              <span>Role-Based Access Control (RBAC) Authorizations</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3 text-xs">
            <p className="text-[11px] text-slate-500">
              Active server-side middleware enforces these permissions across REST API gateways:
            </p>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                    <th className="py-2.5 px-4">Functional Subsystem</th>
                    <th className="py-2.5 px-4">Read Access</th>
                    <th className="py-2.5 px-4">Create / Edit</th>
                    <th className="py-2.5 px-4">Approve & Publish</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {RBAC_MATRIX.map((row) => (
                    <tr key={row.module} className="hover:bg-slate-50/50">
                      <td className="py-2 px-4 font-bold text-slate-900">{row.module}</td>
                      <td className="py-2 px-4 font-mono text-[10px] text-indigo-700">
                        {row.read.join(', ')}
                      </td>
                      <td className="py-2 px-4 font-mono text-[10px] text-slate-700">
                        {row.write.join(', ')}
                      </td>
                      <td className="py-2 px-4 font-mono text-[10px] text-emerald-700 font-bold">
                        {row.approve.join(', ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </SettingsLayout>
  );
}
