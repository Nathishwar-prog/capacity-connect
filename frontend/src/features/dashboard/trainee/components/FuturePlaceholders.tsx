'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Brain, RotateCcw, MessageSquareCode } from 'lucide-react';

export const FuturePlaceholders: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* 1. AI Skill Insights */}
      <Card className="border-indigo-100 bg-linear-to-br from-indigo-50/50 via-white to-slate-50/60 shadow-2xs">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5 text-indigo-600" />
              <span>AI Skill Insights</span>
            </CardTitle>
            <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 text-[9px] font-extrabold uppercase">
              Coming Soon
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            AI-powered analytics will identify subtle competency gaps and personalize learning
            trajectories based on your assessment performance.
          </p>
        </CardContent>
      </Card>

      {/* 2. Smart Revision */}
      <Card className="border-indigo-100 bg-linear-to-br from-indigo-50/50 via-white to-slate-50/60 shadow-2xs">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5 text-indigo-600" />
              <span>Smart Revision</span>
            </CardTitle>
            <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 text-[9px] font-extrabold uppercase">
              Coming Soon
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Adaptive practice sessions targeted at challenging meteorological concepts where review
            or reinforcement is recommended.
          </p>
        </CardContent>
      </Card>

      {/* 3. Learning Assistant */}
      <Card className="border-indigo-100 bg-linear-to-br from-indigo-50/50 via-white to-slate-50/60 shadow-2xs">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <MessageSquareCode className="w-3.5 h-3.5 text-indigo-600" />
              <span>Learning Assistant</span>
            </CardTitle>
            <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 text-[9px] font-extrabold uppercase">
              Coming Soon
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Interactive AI assistant capable of answering questions regarding official WMO manuals,
            cyclone SOPs, and radar physics.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default FuturePlaceholders;
