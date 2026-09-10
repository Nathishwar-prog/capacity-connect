'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Sparkles, Brain, RotateCcw, MessageSquareCode, ArrowRight } from 'lucide-react';

export const FuturePlaceholders: React.FC = () => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Intelligent Learning Accelerators
        </h3>
        <span className="text-[11px] text-indigo-600 font-bold">Integrated AI Tools</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. AI Skill Gap Analysis */}
        <Link href="/trainee/skill-gaps" className="group block">
          <Card className="h-full border-slate-200/80 bg-white hover:border-indigo-300 hover:shadow-md transition-all duration-200 rounded-2xl p-5 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:scale-105 transition-transform">
                  <Brain className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Active
                </span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  AI Skill Gap Analysis
                </h4>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Real-time diagnostic evaluations pinpoint subtle competency deviations against WMO / IMD operational cadre standards.
                </p>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-100 mt-3 flex items-center justify-between text-xs font-bold text-indigo-600">
              <span>View Gap Matrix</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Card>
        </Link>

        {/* 2. Adaptive Revision */}
        <Link href="/trainee/revision" className="group block">
          <Card className="h-full border-slate-200/80 bg-white hover:border-purple-300 hover:shadow-md transition-all duration-200 rounded-2xl p-5 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 group-hover:scale-105 transition-transform">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                  Active
                </span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                  Smart Adaptive Revision
                </h4>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Memory-decay modeling schedules high-impact retrieval checks on volatile concepts like Doppler polarimetry and NWP parameterization.
                </p>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-100 mt-3 flex items-center justify-between text-xs font-bold text-purple-600">
              <span>Launch Revision</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Card>
        </Link>

        {/* 3. Learning Assistant */}
        <Link href="/trainee/assistant" className="group block">
          <Card className="h-full border-slate-200/80 bg-white hover:border-cyan-300 hover:shadow-md transition-all duration-200 rounded-2xl p-5 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-cyan-50 flex items-center justify-center text-cyan-600 group-hover:scale-105 transition-transform">
                  <MessageSquareCode className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200">
                  Active
                </span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-cyan-600 transition-colors">
                  Atmospheric Learning Copilot
                </h4>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Institutional conversational AI answers queries on official WMO guidelines, cyclone forecast SOPs, and radar calibration mathematics.
                </p>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-100 mt-3 flex items-center justify-between text-xs font-bold text-cyan-600">
              <span>Consult Assistant</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
};

export default FuturePlaceholders;
