'use client';

import React, { useEffect, useState } from 'react';
import { SettingsLayout } from '@/features/settings/components/SettingsLayout';
import { settingsApi } from '@/features/settings/api/settingsApi';
import { SystemSettingsData } from '@/features/settings/types/settings.types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/Toast';
import { Bell, Megaphone, BookOpen, GraduationCap, CheckCircle2, ShieldCheck, Mail } from 'lucide-react';

export default function NotificationSettingsPage() {
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
      .catch(() => showToast('Failed to load notification settings.', 'error'))
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
      const updated = await settingsApi.updateNotificationSettings(form);
      setInitialData(updated);
      setForm(updated);
      setIsDirty(false);
      showToast('Notification distribution policies saved successfully.', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to save notification settings.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SettingsLayout
      title="Notification Policies & Delivery"
      description="Configure event notification triggers, broadcast target audiences, and message delivery channels."
      isDirty={isDirty}
      isLoading={isLoading}
      isSaving={isSaving}
      onSave={handleSave}
      onReset={handleReset}
    >
      <div className="space-y-6">
        {/* Delivery Channels Card */}
        <Card className="border-slate-200/90 shadow-2xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Bell className="w-4 h-4 text-indigo-600" />
              <span>Platform Delivery Channels</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.enableInAppNotifications ?? true}
                  onChange={(e) => handleChange('enableInAppNotifications', e.target.checked)}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="font-bold text-slate-900 block">In-App Notification Bell System</span>
                  <span className="text-[11px] text-slate-500">
                    Live notifications rendered in header popover with instant real-time polling.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.enableEmailNotifications ?? false}
                  onChange={(e) => handleChange('enableEmailNotifications', e.target.checked)}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                    <span>Email Notification Relay</span>
                    <span className="text-[10px] px-2 py-0.2 rounded bg-amber-100 text-amber-800 font-extrabold">
                      Optional
                    </span>
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Dispatches asynchronous SMTP emails for high-priority announcements and course notices.
                  </span>
                </div>
              </label>
            </div>

            {/* Lifecycle Preserved Alert */}
            <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-3 text-indigo-950">
              <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-xs">In-App Deletion Lifecycle Maintained: </span>
                <p className="text-[11px] text-indigo-900/80 mt-0.5 leading-relaxed">
                  Notice → Bell Badge → Notification Popover → Mark as Read → Notification record deleted from database.
                  Settings preserve this zero-bloat user inbox model.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Announcement Broadcasting Card */}
        <Card className="border-slate-200/90 shadow-2xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-indigo-600" />
              <span>Announcement Broadcasting Rules</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 text-xs">
            <div className="space-y-3">
              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.enableAnnouncementNotifications ?? true}
                  onChange={(e) => handleChange('enableAnnouncementNotifications', e.target.checked)}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="font-bold text-slate-900 block">Enable Announcement Notifications</span>
                  <span className="text-[11px] text-slate-500">
                    When an administrator posts a platform announcement, dispatch notification to targeted audience.
                  </span>
                </div>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-4 border-l-2 border-slate-200">
                <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={!form.enableAnnouncementNotifications}
                    checked={form.notifyTraineesOnAnnouncement ?? true}
                    onChange={(e) => handleChange('notifyTraineesOnAnnouncement', e.target.checked)}
                    className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">Deliver to Trainees</span>
                    <span className="text-[11px] text-slate-500">Trainees receive announcement alerts.</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={!form.enableAnnouncementNotifications}
                    checked={form.notifyTrainersOnAnnouncement ?? true}
                    onChange={(e) => handleChange('notifyTrainersOnAnnouncement', e.target.checked)}
                    className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">Deliver to Trainers</span>
                    <span className="text-[11px] text-slate-500">Faculty trainers receive announcement alerts.</span>
                  </div>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Course & Learning Events Trigger Card */}
        <Card className="border-slate-200/90 shadow-2xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <span>Course & Learning Event Triggers</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.notifyCourseApproved ?? true}
                  onChange={(e) => handleChange('notifyCourseApproved', e.target.checked)}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="font-bold text-slate-900 block">Course Approved</span>
                  <span className="text-[11px] text-slate-500">Notify trainer when course is approved by admin.</span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.notifyCourseRejected ?? true}
                  onChange={(e) => handleChange('notifyCourseRejected', e.target.checked)}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="font-bold text-slate-900 block">Course Rejected</span>
                  <span className="text-[11px] text-slate-500">Notify trainer if course review requires changes.</span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.notifyCourseEnrollment ?? true}
                  onChange={(e) => handleChange('notifyCourseEnrollment', e.target.checked)}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="font-bold text-slate-900 block">Enrollment Confirmation</span>
                  <span className="text-[11px] text-slate-500">Notify trainee when enrolled in course.</span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.notifyAssessmentResult ?? true}
                  onChange={(e) => handleChange('notifyAssessmentResult', e.target.checked)}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="font-bold text-slate-900 block">Assessment Result</span>
                  <span className="text-[11px] text-slate-500">Notify learner upon attempt scoring completion.</span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.notifyCourseCompletion ?? true}
                  onChange={(e) => handleChange('notifyCourseCompletion', e.target.checked)}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="font-bold text-slate-900 block">Course Completion & Certificate</span>
                  <span className="text-[11px] text-slate-500">Notify trainee when reaching passing completion standard.</span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.notifyRevisionReminder ?? true}
                  onChange={(e) => handleChange('notifyRevisionReminder', e.target.checked)}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="font-bold text-slate-900 block">Adaptive Revision Reminder</span>
                  <span className="text-[11px] text-slate-500">Periodic nudge when topic forgetting risk peaks.</span>
                </div>
              </label>
            </div>
          </CardContent>
        </Card>
      </div>
    </SettingsLayout>
  );
}
