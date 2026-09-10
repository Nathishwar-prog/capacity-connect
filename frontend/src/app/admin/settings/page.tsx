'use client';

import React, { useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import {
  Settings,
  Shield,
  Clock,
  Building2,
  Lock,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

export default function AdminSettingsPage() {
  const { showToast } = useToast();
  const [sessionTimeout, setSessionTimeout] = useState('15');
  const [registrationMode, setRegistrationMode] = useState('APPROVAL_REQUIRED');
  const [wmoStandard, setWmoStandard] = useState('WMO_1083');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Platform governance configuration saved successfully.', 'success');
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
      <AppShell>
        <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
          {/* Header */}
          <div className="border-b border-slate-200 pb-5">
            <div className="flex items-center gap-2 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-1">
              <Settings className="w-4 h-4" />
              <span>Platform Governance</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Portal Governance & System Settings
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure session policies, WMO institutional accreditation parameters, and user registration controls.
            </p>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            {/* Session Security */}
            <Card>
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-indigo-600" />
                  <span>Session Security & Invalidation Policies</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="font-bold text-slate-900 block">
                      JWT Access Token Expiration
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Standard duration before an automatic cryptographically hashed refresh is triggered.
                    </p>
                  </div>
                  <select
                    value={sessionTimeout}
                    onChange={(e) => setSessionTimeout(e.target.value)}
                    className="py-1.5 px-3 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 focus:outline-none focus:border-indigo-600 cursor-pointer"
                  >
                    <option value="15">15 Minutes (Strict)</option>
                    <option value="30">30 Minutes</option>
                    <option value="60">1 Hour</option>
                  </select>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  <div>
                    <span className="font-bold text-slate-900 block">
                      Public Registration Policy
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Controls staff onboarding status assignment upon self-registration.
                    </p>
                  </div>
                  <select
                    value={registrationMode}
                    onChange={(e) => setRegistrationMode(e.target.value)}
                    className="py-1.5 px-3 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 focus:outline-none focus:border-indigo-600 cursor-pointer"
                  >
                    <option value="APPROVAL_REQUIRED">
                      Requires Administrator Approval (Default)
                    </option>
                    <option value="AUTO_ACTIVE">Auto-Active (Internal Network Only)</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Accreditation Standards */}
            <Card>
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  <span>Institutional Accreditation Standards</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="font-bold text-slate-900 block">
                      Competency Classification Framework
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Standard syllabus compliance requirement applied across meteorological courses.
                    </p>
                  </div>
                  <select
                    value={wmoStandard}
                    onChange={(e) => setWmoStandard(e.target.value)}
                    className="py-1.5 px-3 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 focus:outline-none focus:border-indigo-600 cursor-pointer"
                  >
                    <option value="WMO_1083">WMO-No. 1083 (Meteorological Personnel)</option>
                    <option value="WMO_BIP_M">WMO BIP-M (Meteorologist Basic Instruction)</option>
                    <option value="IMD_CUSTOM">IMD Operational Standard 2026</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" size="default" className="text-xs font-bold">
                <Save className="w-4 h-4 mr-1.5" />
                <span>Save Governance Configuration</span>
              </Button>
            </div>
          </form>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
