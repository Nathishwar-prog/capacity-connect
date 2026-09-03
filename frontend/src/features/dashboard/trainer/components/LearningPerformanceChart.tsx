'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PerformanceTrendPoint } from '@/features/trainer';
import { TrendingUp, Activity } from 'lucide-react';

interface LearningPerformanceChartProps {
  trendData?: PerformanceTrendPoint[];
}

export const LearningPerformanceChart: React.FC<LearningPerformanceChartProps> = ({
  trendData = [],
}) => {
  const [timeRange, setTimeRange] = useState<'7D' | '30D' | '90D' | '6M' | '1Y'>('30D');

  // Fallback data points if trendData is empty
  const points = trendData.length > 0 ? trendData : [
    { label: 'W1', activeLearners: 4, avgProgress: 25 },
    { label: 'W2', activeLearners: 8, avgProgress: 45 },
    { label: 'W3', activeLearners: 12, avgProgress: 68 },
    { label: 'W4', activeLearners: 18, avgProgress: 82 },
  ];

  // SVG dimensions
  const width = 560;
  const height = 180;
  const paddingX = 40;
  const paddingY = 25;

  const maxVal = 100;
  const minVal = 0;

  // Compute SVG coordinates
  const coords = points.map((p, i) => {
    const x = paddingX + (i / Math.max(1, points.length - 1)) * (width - paddingX * 2);
    const y = height - paddingY - (p.avgProgress / maxVal) * (height - paddingY * 2);
    return { x, y, ...p };
  });

  // Generate SVG path for line
  const linePath = coords.reduce((acc, curr, idx) => {
    return idx === 0 ? `M ${curr.x},${curr.y}` : `${acc} L ${curr.x},${curr.y}`;
  }, '');

  // Generate SVG path for area fill
  const areaPath = coords.length > 0
    ? `${linePath} L ${coords[coords.length - 1].x},${height - paddingY} L ${coords[0].x},${height - paddingY} Z`
    : '';

  return (
    <Card className="flex flex-col justify-between">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600" />
              <span>Learning Performance</span>
            </CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Trainee curriculum engagement and module completion velocity
            </p>
          </div>

          {/* Time range filter buttons */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl text-[11px] font-bold self-start sm:self-auto">
            {(['7D', '30D', '90D', '6M', '1Y'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setTimeRange(r)}
                className={`px-2 py-1 rounded-lg transition-all ${
                  timeRange === r
                    ? 'bg-white text-indigo-700 shadow-2xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        <div className="w-full overflow-hidden">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-44 text-indigo-600"
            role="img"
            aria-label="Learning performance line chart showing course completion trajectory"
          >
            <defs>
              <linearGradient id="learningGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Reference Gridlines */}
            {[0, 25, 50, 75, 100].map((val) => {
              const y = height - paddingY - (val / 100) * (height - paddingY * 2);
              return (
                <g key={val}>
                  <line
                    x1={paddingX}
                    y1={y}
                    x2={width - paddingX}
                    y2={y}
                    stroke="#e2e8f0"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  />
                  <text
                    x={paddingX - 10}
                    y={y + 3}
                    textAnchor="end"
                    fontSize="9"
                    fill="#94a3b8"
                    fontWeight="600"
                  >
                    {val}%
                  </text>
                </g>
              );
            })}

            {/* Area Fill */}
            {areaPath && <path d={areaPath} fill="url(#learningGradient)" />}

            {/* Line Stroke */}
            {linePath && (
              <path
                d={linePath}
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Data Dots */}
            {coords.map((c, i) => (
              <g key={i} className="group">
                <circle
                  cx={c.x}
                  cy={c.y}
                  r="4"
                  className="fill-white stroke-indigo-600 stroke-2 hover:r-5 transition-all"
                />
                <text
                  x={c.x}
                  y={height - 8}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#64748b"
                  fontWeight="600"
                >
                  {c.label}
                </text>
              </g>
            ))}
          </svg>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
            <span>Average Progress ({timeRange})</span>
          </div>
          <span className="text-slate-700 font-bold">
            Target Completion Benchmark: 75%
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default LearningPerformanceChart;
