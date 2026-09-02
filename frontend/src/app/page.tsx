'use client';

import React from 'react';
import AppShell from '@/components/layout/AppShell';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { ShieldCheck, Activity, Server } from 'lucide-react';

export default function HomePage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-100">Capacity Connect Platform</h2>
            <p className="text-slate-400 text-sm mt-1">
              Enterprise Digital Capacity Building, Competency Mapping & Learning Management Portal.
            </p>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Backend API</p>
                  <h3 className="text-lg font-bold text-slate-100">Express + Prisma</h3>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-3">
                Connected at http://localhost:5000/api/v1
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Auth Engine</p>
                  <h3 className="text-lg font-bold text-slate-100">JWT & RBAC</h3>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-3">HttpOnly refresh cookie & role guards</p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Frontend Engine</p>
                  <h3 className="text-lg font-bold text-slate-100">Next.js App Router</h3>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-3">
                TypeScript, Tailwind CSS & TanStack Query
              </p>
            </div>
          </div>

          {/* Feature Overview Section */}
          <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/30">
            <h3 className="text-base font-semibold text-slate-200 mb-2">
              Folder Architecture Ready
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              All feature modules (<code className="text-indigo-400 font-mono">src/features/</code>
              ), reusable UI components (
              <code className="text-indigo-400 font-mono">src/components/</code>), state management
              (<code className="text-indigo-400 font-mono">src/store/</code>), and HTTP client
              adapters (<code className="text-indigo-400 font-mono">src/api/</code>) are preserved
              and ready for rapid enterprise development.
            </p>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
