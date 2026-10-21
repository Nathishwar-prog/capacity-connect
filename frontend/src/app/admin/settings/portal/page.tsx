'use client';

import React, { useEffect, useState } from 'react';
import { SettingsLayout } from '@/features/settings/components/SettingsLayout';
import { DangerousConfirmModal } from '@/features/settings/components/DangerousConfirmModal';
import { settingsApi } from '@/features/settings/api/settingsApi';
import { SystemSettingsData } from '@/features/settings/types/settings.types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/Toast';
import { Building2, Palette, AlertTriangle, Phone, Mail, Globe, ShieldAlert } from 'lucide-react';

export default function PortalSettingsPage() {
  const { showToast } = useToast();
  const [initialData, setInitialData] = useState<SystemSettingsData | null>(null);
  const [form, setForm] = useState<Partial<SystemSettingsData>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);

  useEffect(() => {
    settingsApi
      .getSettings()
      .then((data) => {
        setInitialData(data);
        setForm(data);
      })
      .catch(() => showToast('Failed to load portal settings.', 'error'))
      .finally(() => setIsLoading(false));
  }, []);

  const handleChange = (field: keyof SystemSettingsData, value: any) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      setIsDirty(true);
      return next;
    });
  };

  const handleStatusToggle = (newStatus: 'ACTIVE' | 'MAINTENANCE') => {
    if (newStatus === 'MAINTENANCE' && form.portalStatus !== 'MAINTENANCE') {
      setShowMaintenanceModal(true);
    } else {
      handleChange('portalStatus', newStatus);
    }
  };

  const confirmMaintenanceMode = () => {
    handleChange('portalStatus', 'MAINTENANCE');
    setShowMaintenanceModal(false);
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
      const updated = await settingsApi.updatePortalSettings(form);
      setInitialData(updated);
      setForm(updated);
      setIsDirty(false);
      showToast('Portal configuration saved and audit record written successfully.', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to save portal settings.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SettingsLayout
      title="Portal & Branding Settings"
      description="Configure platform identification, official branding assets, contact coordinates, and maintenance status."
      isDirty={isDirty}
      isLoading={isLoading}
      isSaving={isSaving}
      onSave={handleSave}
      onReset={handleReset}
    >
      <div className="space-y-6">
        {/* General Information Card */}
        <Card className="border-slate-200/90 shadow-2xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-600" />
              <span>General Institutional Identification</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-900 block mb-1">
                  Portal Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.portalName || ''}
                  onChange={(e) => handleChange('portalName', e.target.value)}
                  placeholder="e.g. Capacity Connect"
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-900 block mb-1">
                  Organization / Consortium Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.organizationName || ''}
                  onChange={(e) => handleChange('organizationName', e.target.value)}
                  placeholder="e.g. Capacity Connect Consortium"
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-900 block mb-1">Portal Description</label>
              <textarea
                rows={2}
                value={form.portalDescription || ''}
                onChange={(e) => handleChange('portalDescription', e.target.value)}
                placeholder="Institutional description displayed in headers and platform metadata..."
                className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-indigo-600"
              />
            </div>
          </CardContent>
        </Card>

        {/* Branding & Theme Card */}
        <Card className="border-slate-200/90 shadow-2xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Palette className="w-4 h-4 text-indigo-600" />
              <span>Visual Branding & Theme Controls</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-900 block mb-1">Main Logo URL</label>
                <input
                  type="text"
                  value={form.logoUrl || ''}
                  onChange={(e) => handleChange('logoUrl', e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white font-mono text-[11px] text-slate-800 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-900 block mb-1">Favicon URL</label>
                <input
                  type="text"
                  value={form.faviconUrl || ''}
                  onChange={(e) => handleChange('faviconUrl', e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white font-mono text-[11px] text-slate-800 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-900 block mb-1">Login Screen Logo</label>
                <input
                  type="text"
                  value={form.loginLogoUrl || ''}
                  onChange={(e) => handleChange('loginLogoUrl', e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white font-mono text-[11px] text-slate-800 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-900 block mb-1">Email Template Logo</label>
                <input
                  type="text"
                  value={form.emailLogoUrl || ''}
                  onChange={(e) => handleChange('emailLogoUrl', e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white font-mono text-[11px] text-slate-800 focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="font-bold text-slate-900 block mb-1">Primary Theme Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.primaryColor || '#4f46e5'}
                    onChange={(e) => handleChange('primaryColor', e.target.value)}
                    className="w-10 h-9 p-0.5 rounded-lg border border-slate-200 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={form.primaryColor || '#4f46e5'}
                    onChange={(e) => handleChange('primaryColor', e.target.value)}
                    className="w-32 py-2 px-3 rounded-xl border border-slate-200 font-mono text-xs uppercase font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-900 block mb-1">Default Platform Theme</label>
                <select
                  value={form.defaultTheme || 'light'}
                  onChange={(e) => handleChange('defaultTheme', e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 cursor-pointer"
                >
                  <option value="light">Light Theme (Default)</option>
                  <option value="dark">Dark Theme</option>
                  <option value="system">Follow System Preferences</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Portal Status & Maintenance Mode Card */}
        <Card className="border-slate-200/90 shadow-2xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-extrabold text-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-indigo-600" />
                <span>Portal Status & Maintenance Mode</span>
              </div>
              <span
                className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${
                  form.portalStatus === 'MAINTENANCE'
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                }`}
              >
                ● {form.portalStatus === 'MAINTENANCE' ? 'Maintenance Active' : 'Operational'}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <span className="font-bold text-slate-900 block">Platform Availability Mode</span>
                <p className="text-[11px] text-slate-500">
                  When maintenance mode is active, non-admin users see the maintenance screen while admins retain governance access.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleStatusToggle('ACTIVE')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    form.portalStatus === 'ACTIVE'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusToggle('MAINTENANCE')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    form.portalStatus === 'MAINTENANCE'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Maintenance
                </button>
              </div>
            </div>

            {form.portalStatus === 'MAINTENANCE' && (
              <div className="space-y-3 p-4 rounded-xl bg-amber-50/70 border border-amber-200 animate-in fade-in duration-150">
                <div>
                  <label className="font-bold text-amber-950 block mb-1">Maintenance Banner Title</label>
                  <input
                    type="text"
                    value={form.maintenanceTitle || ''}
                    onChange={(e) => handleChange('maintenanceTitle', e.target.value)}
                    className="w-full py-2 px-3 rounded-xl border border-amber-300 bg-white text-slate-900 font-semibold"
                  />
                </div>

                <div>
                  <label className="font-bold text-amber-950 block mb-1">Maintenance Public Notice</label>
                  <textarea
                    rows={2}
                    value={form.maintenanceMessage || ''}
                    onChange={(e) => handleChange('maintenanceMessage', e.target.value)}
                    className="w-full py-2 px-3 rounded-xl border border-amber-300 bg-white text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-amber-950 block mb-1">Estimated Maintenance End Time</label>
                  <input
                    type="datetime-local"
                    value={form.estimatedMaintenanceEnd ? form.estimatedMaintenanceEnd.slice(0, 16) : ''}
                    onChange={(e) => handleChange('estimatedMaintenanceEnd', e.target.value ? new Date(e.target.value).toISOString() : null)}
                    className="py-1.5 px-3 rounded-xl border border-amber-300 bg-white font-semibold text-slate-800"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Support & Contact Coordinates Card */}
        <Card className="border-slate-200/90 shadow-2xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Phone className="w-4 h-4 text-indigo-600" />
              <span>Institutional Contact & Legal URL Endpoints</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-900 block mb-1">Support Email</label>
                <input
                  type="email"
                  value={form.supportEmail || ''}
                  onChange={(e) => handleChange('supportEmail', e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white text-slate-800"
                />
              </div>

              <div>
                <label className="font-bold text-slate-900 block mb-1">Support Helpline Phone</label>
                <input
                  type="text"
                  value={form.supportPhone || ''}
                  onChange={(e) => handleChange('supportPhone', e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white text-slate-800"
                />
              </div>

              <div>
                <label className="font-bold text-slate-900 block mb-1">Technical Support Desk Email</label>
                <input
                  type="email"
                  value={form.technicalContact || ''}
                  onChange={(e) => handleChange('technicalContact', e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white text-slate-800"
                />
              </div>

              <div>
                <label className="font-bold text-slate-900 block mb-1">Official Support Website</label>
                <input
                  type="url"
                  value={form.supportWebsite || ''}
                  onChange={(e) => handleChange('supportWebsite', e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-900 block mb-1">Consortium Headquarters Address</label>
              <input
                type="text"
                value={form.organizationAddress || ''}
                onChange={(e) => handleChange('organizationAddress', e.target.value)}
                className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white text-slate-800"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="font-bold text-slate-900 block mb-1">Help Center URL</label>
                <input
                  type="url"
                  value={form.helpCenterUrl || ''}
                  onChange={(e) => handleChange('helpCenterUrl', e.target.value)}
                  className="w-full py-1.5 px-3 rounded-xl border border-slate-200 text-[11px]"
                />
              </div>

              <div>
                <label className="font-bold text-slate-900 block mb-1">Privacy Policy URL</label>
                <input
                  type="url"
                  value={form.privacyPolicyUrl || ''}
                  onChange={(e) => handleChange('privacyPolicyUrl', e.target.value)}
                  className="w-full py-1.5 px-3 rounded-xl border border-slate-200 text-[11px]"
                />
              </div>

              <div>
                <label className="font-bold text-slate-900 block mb-1">Terms of Service URL</label>
                <input
                  type="url"
                  value={form.termsOfServiceUrl || ''}
                  onChange={(e) => handleChange('termsOfServiceUrl', e.target.value)}
                  className="w-full py-1.5 px-3 rounded-xl border border-slate-200 text-[11px]"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <DangerousConfirmModal
        isOpen={showMaintenanceModal}
        title="Enable Maintenance Mode?"
        message="Enabling maintenance mode will restrict access across the platform for normal Trainees and Trainers. Only Administrators will be able to manage the portal until maintenance is deactivated."
        confirmLabel="Enable Maintenance Mode"
        onConfirm={confirmMaintenanceMode}
        onCancel={() => setShowMaintenanceModal(false)}
      />
    </SettingsLayout>
  );
}
