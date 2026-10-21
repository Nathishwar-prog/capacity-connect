'use client';

import React, { useEffect, useState } from 'react';
import { SettingsLayout } from '@/features/settings/components/SettingsLayout';
import { RevisionWeightsEditor, RevisionWeights } from '@/features/settings/components/RevisionWeightsEditor';
import { settingsApi } from '@/features/settings/api/settingsApi';
import { SystemSettingsData } from '@/features/settings/types/settings.types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/Toast';
import { BookOpen, Award, Users, Library, CheckSquare, BrainCircuit, Sliders } from 'lucide-react';

const RESOURCE_TYPES = ['VIDEO', 'PDF', 'DOCUMENT', 'PRESENTATION', 'LINK', 'IMAGE'];

export default function LearningSettingsPage() {
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
      .catch(() => showToast('Failed to load learning settings.', 'error'))
      .finally(() => setIsLoading(false));
  }, []);

  const handleChange = (field: keyof SystemSettingsData, value: any) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      setIsDirty(true);
      return next;
    });
  };

  const handleResourceTypeToggle = (type: string) => {
    const current = form.allowedResourceTypes || [];
    const updated = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type];

    if (updated.length === 0) {
      showToast('At least one resource type must be allowed.', 'warning');
      return;
    }
    handleChange('allowedResourceTypes', updated);
  };

  const handleWeightsChange = (weights: RevisionWeights) => {
    setForm((prev) => ({
      ...prev,
      ...weights,
    }));
    setIsDirty(true);
  };

  const handleReset = () => {
    if (initialData) {
      setForm(initialData);
      setIsDirty(false);
    }
  };

  const handleSave = async () => {
    // Validate revision weights sum
    const sum =
      (form.topicWeaknessWeight || 0) +
      (form.topicForgettingWeight || 0) +
      (form.topicImportanceWeight || 0) +
      (form.topicDependencyWeight || 0) +
      (form.topicErrorWeight || 0) +
      (form.topicUncertaintyWeight || 0) +
      (form.topicRecencyWeight || 0);

    if (Math.abs(sum - 1.0) > 0.05) {
      showToast('Revision algorithm weights must sum to exactly 1.0 (100%) before saving.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const updated = await settingsApi.updateLearningSettings(form);
      setInitialData(updated);
      setForm(updated);
      setIsDirty(false);
      showToast('Learning policies and revision algorithm weights updated successfully.', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to save learning settings.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const currentWeights: RevisionWeights = {
    topicWeaknessWeight: form.topicWeaknessWeight ?? 0.35,
    topicForgettingWeight: form.topicForgettingWeight ?? 0.18,
    topicImportanceWeight: form.topicImportanceWeight ?? 0.12,
    topicDependencyWeight: form.topicDependencyWeight ?? 0.12,
    topicErrorWeight: form.topicErrorWeight ?? 0.10,
    topicUncertaintyWeight: form.topicUncertaintyWeight ?? 0.08,
    topicRecencyWeight: form.topicRecencyWeight ?? 0.05,
  };

  return (
    <SettingsLayout
      title="Learning & Curriculum Policies"
      description="Configure course review workflows, completion criteria, enrollment boundaries, assessment parameters, and the revision engine."
      isDirty={isDirty}
      isLoading={isLoading}
      isSaving={isSaving}
      onSave={handleSave}
      onReset={handleReset}
    >
      <div className="space-y-6">
        {/* Course Authoring & Approval Workflow Card */}
        <Card className="border-slate-200/90 shadow-2xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <span>Course Authoring & Governance Workflow</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100 text-indigo-950 font-medium">
              <span className="font-bold">Established Production Lifecycle: </span>
              <span>Trainer creates course → Submits for review → Administrator evaluates & approves → Administrator publishes to catalog.</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.allowTrainerCourseCreation ?? true}
                  onChange={(e) => handleChange('allowTrainerCourseCreation', e.target.checked)}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="font-bold text-slate-900 block">Allow Trainer Course Creation</span>
                  <span className="text-[11px] text-slate-500">Trainers can draft modules, syllabus structures, and lessons.</span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.requireCourseApproval ?? true}
                  onChange={(e) => handleChange('requireCourseApproval', e.target.checked)}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="font-bold text-slate-900 block">Require Admin Course Approval</span>
                  <span className="text-[11px] text-slate-500">Submitted courses must be validated by an administrator before publishing.</span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.requireCoursePublishing ?? true}
                  onChange={(e) => handleChange('requireCoursePublishing', e.target.checked)}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="font-bold text-slate-900 block">Admin Exclusive Publishing</span>
                  <span className="text-[11px] text-slate-500">Only authorized administrators can publish courses to the trainee catalog.</span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.allowCourseUnpublishing ?? true}
                  onChange={(e) => handleChange('allowCourseUnpublishing', e.target.checked)}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="font-bold text-slate-900 block">Allow Course Unpublishing</span>
                  <span className="text-[11px] text-slate-500">Permits reverting active published courses to draft for revisions.</span>
                </div>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Course Completion & Passing Standards Card */}
        <Card className="border-slate-200/90 shadow-2xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-indigo-600" />
              <span>Completion Thresholds & Passing Standards</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <label className="font-bold text-slate-900 block mb-1">
                  Course Completion Threshold (%)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={form.completionPercentage ?? 80}
                    onChange={(e) => handleChange('completionPercentage', parseInt(e.target.value, 10) || 80)}
                    className="w-full py-1.5 px-3 rounded-lg border border-slate-200 bg-white font-extrabold text-slate-800"
                  />
                  <span className="font-bold text-slate-400">%</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Standard requirement is 80% lesson progress to complete.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <label className="font-bold text-slate-900 block mb-1">
                  Assessment Passing Score (%)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.assessmentPassingScore ?? 60}
                    onChange={(e) => handleChange('assessmentPassingScore', parseInt(e.target.value, 10) || 60)}
                    className="w-full py-1.5 px-3 rounded-lg border border-slate-200 bg-white font-extrabold text-slate-800"
                  />
                  <span className="font-bold text-slate-400">%</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Minimum test score required to achieve passing grade.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <label className="font-bold text-slate-900 block mb-1">
                  Certificate Eligibility Score (%)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.certificateEligibility ?? 75}
                    onChange={(e) => handleChange('certificateEligibility', parseInt(e.target.value, 10) || 75)}
                    className="w-full py-1.5 px-3 rounded-lg border border-slate-200 bg-white font-extrabold text-slate-800"
                  />
                  <span className="font-bold text-slate-400">%</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Overall grade required to award automated completion certificate.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enrollment & Capacity Policies Card */}
        <Card className="border-slate-200/90 shadow-2xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>Enrollment Policies & Trainee Limits</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.allowSelfEnrollment ?? true}
                  onChange={(e) => handleChange('allowSelfEnrollment', e.target.checked)}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="font-bold text-slate-900 block">Allow Trainee Self-Enrollment</span>
                  <span className="text-[11px] text-slate-500">Trainees can directly browse the catalog and enroll in published courses.</span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.allowReenrollment ?? true}
                  onChange={(e) => handleChange('allowReenrollment', e.target.checked)}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="font-bold text-slate-900 block">Allow Re-enrollment</span>
                  <span className="text-[11px] text-slate-500">Permit trainees to re-enroll in previously dropped or completed courses.</span>
                </div>
              </label>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="font-bold text-slate-900 block">Maximum Active Courses Per Trainee</span>
                <span className="text-[11px] text-slate-500">Prevents overloading by restricting simultaneous active enrollments.</span>
              </div>
              <input
                type="number"
                min="1"
                max="20"
                value={form.maxActiveCoursesPerTrainee ?? 5}
                onChange={(e) => handleChange('maxActiveCoursesPerTrainee', parseInt(e.target.value, 10) || 5)}
                className="w-24 py-1.5 px-3 rounded-xl border border-slate-200 bg-white font-extrabold text-slate-800 text-center"
              />
            </div>
          </CardContent>
        </Card>

        {/* Learning Resource Management Card */}
        <Card className="border-slate-200/90 shadow-2xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Library className="w-4 h-4 text-indigo-600" />
              <span>Learning Resource & Media Distribution Policies</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-900 block mb-2">Permitted Resource Formats</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                {RESOURCE_TYPES.map((type) => {
                  const isChecked = (form.allowedResourceTypes || []).includes(type);
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleResourceTypeToggle(type)}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-extrabold'
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-slate-900 block">Maximum Upload File Size</span>
                  <span className="text-[11px] text-slate-500">Max size for PDF, videos, and presentations.</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="5"
                    max="500"
                    value={form.maxFileSizeMb ?? 50}
                    onChange={(e) => handleChange('maxFileSizeMb', parseInt(e.target.value, 10) || 50)}
                    className="w-20 py-1.5 px-3 rounded-xl border border-slate-200 bg-white font-extrabold text-slate-800 text-center"
                  />
                  <span className="font-bold text-slate-500">MB</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-slate-900 block">External Resource URLs</span>
                  <span className="text-[11px] text-slate-500">Allow linking external cloud docs and streams.</span>
                </div>
                <input
                  type="checkbox"
                  checked={form.allowExternalUrls ?? true}
                  onChange={(e) => handleChange('allowExternalUrls', e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Adaptive Revision Engine Configuration Card */}
        <Card className="border-slate-200/90 shadow-2xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-indigo-600" />
              <span>Adaptive Competency-Based Revision Engine Parameters</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-900 block">Mastery Threshold</span>
                <span className="text-[10px] text-slate-500 block mb-2">Score to graduate topic</span>
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={form.revisionMasteryThreshold ?? 85}
                  onChange={(e) => handleChange('revisionMasteryThreshold', parseFloat(e.target.value) || 85)}
                  className="w-full py-1.5 px-3 rounded-lg border border-slate-200 bg-white font-bold"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-900 block">Revision Cooldown</span>
                <span className="text-[10px] text-slate-500 block mb-2">Hours between reviews</span>
                <input
                  type="number"
                  min="1"
                  max="168"
                  value={form.revisionCooldownHours ?? 24}
                  onChange={(e) => handleChange('revisionCooldownHours', parseInt(e.target.value, 10) || 24)}
                  className="w-full py-1.5 px-3 rounded-lg border border-slate-200 bg-white font-bold"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-900 block">Max Topics / Session</span>
                <span className="text-[10px] text-slate-500 block mb-2">Session length limit</span>
                <input
                  type="number"
                  min="1"
                  max="15"
                  value={form.revisionMaxTopicsPerSession ?? 6}
                  onChange={(e) => handleChange('revisionMaxTopicsPerSession', parseInt(e.target.value, 10) || 6)}
                  className="w-full py-1.5 px-3 rounded-lg border border-slate-200 bg-white font-bold"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-900 block">Diagnostic Confidence</span>
                <span className="text-[10px] text-slate-500 block mb-2">Confidence threshold (0-1)</span>
                <input
                  type="number"
                  step="0.05"
                  min="0.1"
                  max="0.9"
                  value={form.revisionDiagnosticConfidenceThreshold ?? 0.4}
                  onChange={(e) => handleChange('revisionDiagnosticConfidenceThreshold', parseFloat(e.target.value) || 0.4)}
                  className="w-full py-1.5 px-3 rounded-lg border border-slate-200 bg-white font-bold"
                />
              </div>
            </div>

            {/* Live Interactive Weight Editor */}
            <RevisionWeightsEditor
              weights={currentWeights}
              onChange={handleWeightsChange}
            />
          </CardContent>
        </Card>
      </div>
    </SettingsLayout>
  );
}
