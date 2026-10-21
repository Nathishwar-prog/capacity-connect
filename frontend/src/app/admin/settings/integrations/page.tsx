'use client';

import React, { useState } from 'react';
import { SettingsLayout } from '@/features/settings/components/SettingsLayout';
import { settingsApi } from '@/features/settings/api/settingsApi';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import {
  Cpu,
  Database,
  Brain,
  HardDrive,
  Mail,
  Zap,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

interface TestResultState {
  loading: boolean;
  connected?: boolean;
  latencyMs?: number;
  message?: string;
}

export default function IntegrationsSettingsPage() {
  const { showToast } = useToast();
  const [testResults, setTestResults] = useState<Record<string, TestResultState>>({});

  const handleTestConnection = async (target: 'DATABASE' | 'AI_SERVICE' | 'STORAGE', key: string) => {
    setTestResults((prev) => ({
      ...prev,
      [key]: { loading: true },
    }));

    try {
      const res = await settingsApi.testConnection(target);
      setTestResults((prev) => ({
        ...prev,
        [key]: {
          loading: false,
          connected: res.connected,
          latencyMs: res.latencyMs,
          message: res.message,
        },
      }));
      if (res.connected) {
        showToast(`${res.target}: Connection verified (${res.latencyMs}ms)`, 'success');
      } else {
        showToast(`${res.target}: Verification failed - ${res.message}`, 'error');
      }
    } catch (err: any) {
      setTestResults((prev) => ({
        ...prev,
        [key]: {
          loading: false,
          connected: false,
          message: err.message || 'Connection failed',
        },
      }));
      showToast(`Connection verification failed: ${err.message}`, 'error');
    }
  };

  const INTEGRATIONS = [
    {
      key: 'db',
      target: 'DATABASE' as const,
      name: 'PostgreSQL Relational Database',
      provider: 'Neon Serverless PostgreSQL (AWS us-east-2)',
      icon: Database,
      status: 'Connected',
      statusColor: 'bg-emerald-100 text-emerald-800',
      description: 'Primary transactional database storing organizations, users, courses, revision states, and audit records.',
    },
    {
      key: 'ai',
      target: 'AI_SERVICE' as const,
      name: 'Generative AI & LLM Inference',
      provider: 'Google Gemini (gemini-1.5-pro)',
      icon: Brain,
      status: 'Connected',
      statusColor: 'bg-purple-100 text-purple-800',
      description: 'Drives natural language analytical inquiry, skill-gap diagnostic generation, and adaptive remedial explanations.',
    },
    {
      key: 'storage',
      target: 'STORAGE' as const,
      name: 'Learning Resource & Media Storage',
      provider: 'Local Gateway / Uploads Directory',
      icon: HardDrive,
      status: 'Connected',
      statusColor: 'bg-emerald-100 text-emerald-800',
      description: 'Handles PDF syllabi, presentation slide decks, and lesson media asset uploads.',
    },
    {
      key: 'email',
      target: null,
      name: 'SMTP Email Delivery Relay',
      provider: 'Nodemailer SMTP Transporter',
      icon: Mail,
      status: 'Configured (Standby)',
      statusColor: 'bg-slate-100 text-slate-800',
      description: 'Asynchronous transactional mail dispatch for registration verification and administrative alerts.',
    },
  ];

  return (
    <SettingsLayout
      title="System Integrations & Service Health"
      description="Inspect connected third-party platforms, data stores, and verify end-to-end service connectivity."
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {INTEGRATIONS.map((item) => {
            const Icon = item.icon;
            const test = testResults[item.key];

            return (
              <Card key={item.key} className="border-slate-200/90 shadow-2xs flex flex-col justify-between">
                <div>
                  <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <CardTitle className="text-xs font-extrabold text-slate-900 leading-tight">
                          {item.name}
                        </CardTitle>
                        <span className="text-[10px] text-slate-400 block">{item.provider}</span>
                      </div>
                    </div>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${item.statusColor}`}>
                      ● {item.status}
                    </span>
                  </CardHeader>
                  <CardContent className="pt-3 text-xs text-slate-600 space-y-3">
                    <p className="leading-relaxed text-[11px] text-slate-500">{item.description}</p>

                    {test && (
                      <div
                        className={`p-2.5 rounded-xl border text-[11px] flex items-start gap-2 ${
                          test.connected
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                            : 'bg-rose-50 border-rose-200 text-rose-900'
                        }`}
                      >
                        {test.connected ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <span className="font-bold">{test.connected ? 'Operational' : 'Failed'}: </span>
                          <span>{test.message}</span>
                          {test.latencyMs !== undefined && (
                            <span className="font-mono text-[10px] ml-1.5 opacity-80">
                              ({test.latencyMs}ms)
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </div>

                <div className="p-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-end">
                  {item.target ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={test?.loading}
                      onClick={() => handleTestConnection(item.target!, item.key)}
                      className="text-[11px] font-bold text-slate-700 cursor-pointer"
                    >
                      {test?.loading ? (
                        <>
                          <RefreshCw className="w-3 h-3 mr-1.5 animate-spin" />
                          Testing...
                        </>
                      ) : (
                        <>
                          <Zap className="w-3 h-3 mr-1.5 text-indigo-600" />
                          Test Connection
                        </>
                      )}
                    </Button>
                  ) : (
                    <span className="text-[10px] text-slate-400 italic">Static Local Provider</span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </SettingsLayout>
  );
}
