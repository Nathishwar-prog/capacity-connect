'use client';

import React, { useEffect, useState } from 'react';
import { SettingsLayout } from '@/features/settings/components/SettingsLayout';
import { DangerousConfirmModal } from '@/features/settings/components/DangerousConfirmModal';
import { settingsApi } from '@/features/settings/api/settingsApi';
import { SystemSettingsData } from '@/features/settings/types/settings.types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/Toast';
import { Brain, Sparkles, Key, ShieldCheck, BarChart3, Database } from 'lucide-react';

export default function AiAnalyticsSettingsPage() {
  const { showToast } = useToast();
  const [initialData, setInitialData] = useState<SystemSettingsData | null>(null);
  const [form, setForm] = useState<Partial<SystemSettingsData> & { apiKeyUpdate?: string }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showDisableAiModal, setShowDisableAiModal] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');

  useEffect(() => {
    settingsApi
      .getSettings()
      .then((data) => {
        setInitialData(data);
        setForm(data);
      })
      .catch(() => showToast('Failed to load AI settings.', 'error'))
      .finally(() => setIsLoading(false));
  }, []);

  const handleChange = (field: keyof SystemSettingsData, value: any) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      setIsDirty(true);
      return next;
    });
  };

  const handleAiMasterToggle = (checked: boolean) => {
    if (!checked && form.enableAiFeatures) {
      setShowDisableAiModal(true);
    } else {
      handleChange('enableAiFeatures', checked);
    }
  };

  const confirmDisableAi = () => {
    handleChange('enableAiFeatures', false);
    setShowDisableAiModal(false);
  };

  const handleUpdateApiKey = () => {
    if (!tempApiKey || tempApiKey.length < 10) {
      showToast('Please enter a valid API key string.', 'warning');
      return;
    }
    setForm((prev) => ({
      ...prev,
      apiKeyUpdate: tempApiKey,
      aiApiKeyMasked: '••••••••••••••••' + tempApiKey.slice(-4),
    }));
    setIsDirty(true);
    setShowApiKeyModal(false);
    setTempApiKey('');
    showToast('API credential staged. Click Save Changes to commit securely.', 'info');
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
      const updated = await settingsApi.updateAiSettings(form);
      setInitialData(updated);
      setForm(updated);
      setIsDirty(false);
      showToast('AI & Analytics model configuration updated successfully.', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to save AI settings.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SettingsLayout
      title="AI Engine & Analytics Intelligence"
      description="Configure generative model parameters, autonomous skill-gap diagnostic features, and strict privacy guards."
      isDirty={isDirty}
      isLoading={isLoading}
      isSaving={isSaving}
      onSave={handleSave}
      onReset={handleReset}
    >
      <div className="space-y-6">
        {/* Master AI Feature Toggles Card */}
        <Card className="border-slate-200/90 shadow-2xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-extrabold text-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-indigo-600" />
                <span>Platform AI Capabilities</span>
              </div>
              <span
                className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${
                  form.enableAiFeatures
                    ? 'bg-purple-100 text-purple-900 border border-purple-200'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                ● {form.enableAiFeatures ? 'AI Subsystem Active' : 'AI Offline'}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-100 flex items-center justify-between gap-3">
              <div>
                <span className="font-extrabold text-purple-950 block">Master AI Platform Gateway</span>
                <span className="text-[11px] text-purple-900/80">
                  Global kill-switch for all generative and analytical AI features across Capacity Connect.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.enableAiFeatures ?? true}
                  onChange={(e) => handleAiMasterToggle(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                  !form.enableAiFeatures
                    ? 'opacity-50 pointer-events-none bg-slate-50 border-slate-200'
                    : 'bg-white border-slate-200 hover:bg-slate-50 cursor-pointer'
                }`}
              >
                <input
                  type="checkbox"
                  disabled={!form.enableAiFeatures}
                  checked={form.enableAiSkillGapAnalyzer ?? true}
                  onChange={(e) => handleChange('enableAiSkillGapAnalyzer', e.target.checked)}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="font-bold text-slate-900 block">AI Skill Gap Diagnostic Analyzer</span>
                  <span className="text-[11px] text-slate-500">Autonomous competency prerequisite breakdown.</span>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                  !form.enableAiFeatures
                    ? 'opacity-50 pointer-events-none bg-slate-50 border-slate-200'
                    : 'bg-white border-slate-200 hover:bg-slate-50 cursor-pointer'
                }`}
              >
                <input
                  type="checkbox"
                  disabled={!form.enableAiFeatures}
                  checked={form.enableAiCourseRecommendations ?? true}
                  onChange={(e) => handleChange('enableAiCourseRecommendations', e.target.checked)}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="font-bold text-slate-900 block">AI Course Recommendations</span>
                  <span className="text-[11px] text-slate-500">ML course ranker based on competency gaps.</span>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                  !form.enableAiFeatures
                    ? 'opacity-50 pointer-events-none bg-slate-50 border-slate-200'
                    : 'bg-white border-slate-200 hover:bg-slate-50 cursor-pointer'
                }`}
              >
                <input
                  type="checkbox"
                  disabled={!form.enableAiFeatures}
                  checked={form.enableAiRevisionAssistant ?? true}
                  onChange={(e) => handleChange('enableAiRevisionAssistant', e.target.checked)}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="font-bold text-slate-900 block">AI Revision Educational Explainer</span>
                  <span className="text-[11px] text-slate-500">Generates adaptive explanations for missed items.</span>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                  !form.enableAiFeatures
                    ? 'opacity-50 pointer-events-none bg-slate-50 border-slate-200'
                    : 'bg-white border-slate-200 hover:bg-slate-50 cursor-pointer'
                }`}
              >
                <input
                  type="checkbox"
                  disabled={!form.enableAiFeatures}
                  checked={form.enableAiAnalyticsAssistant ?? true}
                  onChange={(e) => handleChange('enableAiAnalyticsAssistant', e.target.checked)}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="font-bold text-slate-900 block">AI Analytics Assistant</span>
                  <span className="text-[11px] text-slate-500">Natural language executive queries & chart generator.</span>
                </div>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Model Configuration Card */}
        <Card className="border-slate-200/90 shadow-2xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Model Hyperparameters & Credentials</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-900 block mb-1">AI Provider</label>
                <select
                  value={form.aiProvider || 'Google Gemini'}
                  onChange={(e) => handleChange('aiProvider', e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800"
                >
                  <option value="Google Gemini">Google Gemini (Default)</option>
                  <option value="Anthropic Claude">Anthropic Claude</option>
                  <option value="OpenAI GPT-4">OpenAI GPT-4</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-900 block mb-1">Base Model</label>
                <input
                  type="text"
                  value={form.aiModel || 'gemini-1.5-pro'}
                  onChange={(e) => handleChange('aiModel', e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="font-bold text-slate-900 block mb-1">
                  Temperature: <span className="text-indigo-600 font-extrabold">{form.aiTemperature ?? 0.7}</span>
                </label>
                <input
                  type="range"
                  min="0.0"
                  max="1.5"
                  step="0.05"
                  value={form.aiTemperature ?? 0.7}
                  onChange={(e) => handleChange('aiTemperature', parseFloat(e.target.value) || 0.7)}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <span className="text-[10px] text-slate-400">Lower values produce strictly deterministic output.</span>
              </div>

              <div>
                <label className="font-bold text-slate-900 block mb-1">Max Response Length (Tokens)</label>
                <input
                  type="number"
                  min="256"
                  max="8192"
                  value={form.aiMaxTokens ?? 2048}
                  onChange={(e) => handleChange('aiMaxTokens', parseInt(e.target.value, 10) || 2048)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800"
                />
              </div>
            </div>

            {/* Secure API Key Management */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-slate-500" />
                  <span>API Authentication Credential</span>
                </span>
                <span className="font-mono text-xs text-slate-600 block mt-0.5">
                  {form.aiApiKeyMasked || '••••••••••••••••'}
                </span>
                <span className="text-[10px] text-slate-400">
                  Secret credentials are never exposed to browser context and encrypted at rest.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowApiKeyModal(true)}
                className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-800 font-bold hover:bg-slate-100 transition-colors text-xs cursor-pointer"
              >
                Update Credential
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Analytics Assistant & SQL Boundary Card */}
        <Card className="border-slate-200/90 shadow-2xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              <span>AI Analytics Assistant & Security Isolation</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 text-xs">
            {/* Architecture guarantee banner */}
            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-950 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-xs">Architectural Security Guarantee: </span>
                <p className="text-[11px] text-emerald-900/80 mt-0.5 leading-relaxed">
                  Admin AI Assistant strictly maps natural language queries to predefined, parameterized service calls in{' '}
                  <code className="bg-emerald-100 px-1 rounded font-mono">AdminAnalyticsService</code>. Arbitrary SQL execution or schema injection is mathematically blocked.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-900 block mb-1">Max Query Complexity</label>
                <select
                  value={form.aiAnalyticsMaxQueryComplexity || 'STANDARD'}
                  onChange={(e) => handleChange('aiAnalyticsMaxQueryComplexity', e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800"
                >
                  <option value="BASIC">Basic (Single Metric Summaries)</option>
                  <option value="STANDARD">Standard (Multi-dimensional drilldowns)</option>
                  <option value="ADVANCED">Advanced (Full cohort distributions)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-900 block mb-1">Analytics Date Range Limit</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="30"
                    max="1825"
                    value={form.aiAnalyticsDateRangeLimitDays ?? 365}
                    onChange={(e) => handleChange('aiAnalyticsDateRangeLimitDays', parseInt(e.target.value, 10) || 365)}
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800"
                  />
                  <span className="font-bold text-slate-500">Days</span>
                </div>
              </div>
            </div>

            <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={form.aiAnalyticsEnableChartGen ?? true}
                onChange={(e) => handleChange('aiAnalyticsEnableChartGen', e.target.checked)}
                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <span className="font-bold text-slate-900 block">Dynamic Visual Chart Generation</span>
                <span className="text-[11px] text-slate-500">
                  Allow AI assistant to output dynamic bar, line, and radar chart configurations.
                </span>
              </div>
            </label>
          </CardContent>
        </Card>
      </div>

      {/* Dangerous Confirmation: Disabling AI */}
      <DangerousConfirmModal
        isOpen={showDisableAiModal}
        title="Disable AI Engine Platform-Wide?"
        message="Disabling the AI platform gateway will turn off all AI Skill Gap analyzers, course recommendation algorithms, and the Executive Analytics natural language assistant."
        confirmLabel="Disable AI Engine"
        onConfirm={confirmDisableAi}
        onCancel={() => setShowDisableAiModal(false)}
      />

      {/* Update Credential Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-extrabold text-slate-900">Update AI Provider API Key</h3>
            <p className="mt-1 text-xs text-slate-500">
              Provide the new API key for {form.aiProvider || 'Google Gemini'}. It will be transmitted via TLS and safely masked.
            </p>
            <div className="mt-4">
              <input
                type="password"
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
                placeholder="AIzaSy... / sk-..."
                className="w-full py-2 px-3 rounded-xl border border-slate-300 font-mono text-xs"
              />
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowApiKeyModal(false);
                  setTempApiKey('');
                }}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateApiKey}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 cursor-pointer"
              >
                Apply Key
              </button>
            </div>
          </div>
        </div>
      )}
    </SettingsLayout>
  );
}
