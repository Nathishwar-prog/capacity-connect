'use client';

import React from 'react';
import { AlertCircle, CheckCircle2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface RevisionWeights {
  topicWeaknessWeight: number;
  topicForgettingWeight: number;
  topicImportanceWeight: number;
  topicDependencyWeight: number;
  topicErrorWeight: number;
  topicUncertaintyWeight: number;
  topicRecencyWeight: number;
}

interface RevisionWeightsEditorProps {
  weights: RevisionWeights;
  onChange: (weights: RevisionWeights) => void;
}

const DEFAULT_WEIGHTS: RevisionWeights = {
  topicWeaknessWeight: 0.35,
  topicForgettingWeight: 0.18,
  topicImportanceWeight: 0.12,
  topicDependencyWeight: 0.12,
  topicErrorWeight: 0.10,
  topicUncertaintyWeight: 0.08,
  topicRecencyWeight: 0.05,
};

const WEIGHT_DEFINITIONS = [
  { key: 'topicWeaknessWeight', label: 'Weakness (W)', color: '#ef4444', desc: 'Prioritizes topics where learner score is lowest (100 - score).' },
  { key: 'topicForgettingWeight', label: 'Forgetting Risk (F)', color: '#f97316', desc: 'Predictive retention decay based on memory half-life.' },
  { key: 'topicImportanceWeight', label: 'Structural Importance (I)', color: '#3b82f6', desc: 'Curriculum role importance weight assigned to topic.' },
  { key: 'topicDependencyWeight', label: 'Dependency Impact (D)', color: '#8b5cf6', desc: 'Blocks downstream competency acquisition if unmastered.' },
  { key: 'topicErrorWeight', label: 'Error Severity (E)', color: '#ec4899', desc: 'Penalizes recurring error patterns and misconceptions.' },
  { key: 'topicUncertaintyWeight', label: 'Urgency & Uncertainty (U)', color: '#eab308', desc: 'Days elapsed without active practice evaluation.' },
  { key: 'topicRecencyWeight', label: 'Remedial Readiness (R)', color: '#10b981', desc: 'Bonus when root prerequisites are satisfied.' },
] as const;

export const RevisionWeightsEditor: React.FC<RevisionWeightsEditorProps> = ({
  weights,
  onChange,
}) => {
  const sum = Object.values(weights).reduce((acc, val) => acc + (Number(val) || 0), 0);
  const roundedSum = Math.round(sum * 100);
  const isValid = roundedSum === 100;

  const handleWeightChange = (key: keyof RevisionWeights, rawVal: number) => {
    const val = Math.max(0, Math.min(1, Math.round(rawVal * 100) / 100));
    onChange({
      ...weights,
      [key]: val,
    });
  };

  const handleReset = () => {
    onChange({ ...DEFAULT_WEIGHTS });
  };

  return (
    <div className="space-y-4 p-5 rounded-2xl bg-slate-50 border border-slate-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Adaptive Revision Algorithm Weights (7-Factor Model)
          </h4>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Deterministic learner model prioritization formula: TP = Σ(Wᵢ × Fᵢ). Must sum to 1.00 (100%).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold border ${
              isValid
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
            }`}
          >
            {isValid ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            )}
            <span>Total: {roundedSum}%</span>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="text-[11px] font-bold text-slate-700 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Reset Default
          </Button>
        </div>
      </div>

      {/* Visual Distribution Bar */}
      <div className="space-y-1.5">
        <div className="h-3 w-full rounded-full overflow-hidden flex bg-slate-200 shadow-inner">
          {WEIGHT_DEFINITIONS.map((def) => {
            const w = weights[def.key] || 0;
            const pct = Math.max(0, (w / (sum || 1)) * 100);
            if (pct <= 0) return null;
            return (
              <div
                key={def.key}
                style={{ width: `${pct}%`, backgroundColor: def.color }}
                title={`${def.label}: ${Math.round(w * 100)}%`}
                className="h-full transition-all duration-200 first:rounded-l-full last:rounded-r-full"
              />
            );
          })}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-[10px] text-slate-600">
          {WEIGHT_DEFINITIONS.map((def) => (
            <div key={def.key} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: def.color }} />
              <span className="font-semibold">{def.label.split(' ')[0]}</span>
              <span className="text-slate-400">({Math.round((weights[def.key] || 0) * 100)}%)</span>
            </div>
          ))}
        </div>
      </div>

      {/* Weight Sliders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        {WEIGHT_DEFINITIONS.map((def) => {
          const val = weights[def.key] || 0;
          return (
            <div
              key={def.key}
              className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-2"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">{def.label}</span>
                  <span className="text-[10px] text-slate-500 line-clamp-1">{def.desc}</span>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={val}
                    onChange={(e) => handleWeightChange(def.key, parseFloat(e.target.value) || 0)}
                    className="w-16 py-1 px-2 text-right rounded-lg border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-600"
                  />
                  <span className="text-xs font-bold text-slate-400">%</span>
                </div>
              </div>

              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={val}
                onChange={(e) => handleWeightChange(def.key, parseFloat(e.target.value) || 0)}
                className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-100 rounded-lg"
              />
            </div>
          );
        })}
      </div>

      {!isValid && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2 text-xs text-amber-800">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Invalid Weight Sum: </span>
            <span>
              The algorithm weights currently total {roundedSum}%. Please adjust the sliders so they sum to exactly 100% (1.00) before saving.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
