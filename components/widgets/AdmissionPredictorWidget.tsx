'use client';

import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { GraduationCap, Target, Sparkles } from 'lucide-react';

interface AdmissionPredictorWidgetProps {
  data: {
    title: string;
    institutions?: Array<{
      name: string;
      probability: 'High' | 'Medium' | 'Low' | string;
      cutoff?: string;
      recommendation?: string;
    }>;
  };
}

export const AdmissionPredictorWidget = memo(function AdmissionPredictorWidget({ data }: AdmissionPredictorWidgetProps) {
  const title = data?.title || 'Admission Predictor';
  const institutions = Array.isArray(data?.institutions) ? data.institutions : [];

  const getProbabilityBadge = (prob: string) => {
    const p = String(prob || '').toLowerCase();
    if (p.includes('high') || p.includes('strong') || p.includes('safe')) {
      return (
        <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-950/70 text-emerald-300 border border-emerald-700/60 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          High Probability
        </span>
      );
    }
    if (p.includes('medium') || p.includes('moderate') || p.includes('target')) {
      return (
        <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-950/70 text-amber-300 border border-amber-700/60 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
          Medium Probability
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-rose-950/70 text-rose-300 border border-rose-700/60 flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
        Low / Reach
      </span>
    );
  };

  return (
    <div className="w-[480px] min-h-[460px] bg-slate-900/95 border border-slate-800 rounded-xl p-5 shadow-2xl flex flex-col text-slate-100 backdrop-blur">
      <Handle type="target" position={Position.Left} className="!bg-sky-500 !w-3 !h-3" />
      <Handle type="source" position={Position.Right} className="!bg-indigo-500 !w-3 !h-3" />

      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-base tracking-tight text-white line-clamp-1">{title}</h3>
            <span className="text-xs text-slate-400">Predictive Assessment</span>
          </div>
        </div>
        {institutions.length > 0 && (
          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-slate-800 text-indigo-300 border border-slate-700">
            {institutions.length} {institutions.length === 1 ? 'target' : 'targets'}
          </span>
        )}
      </div>

      {/* Institutional Cards */}
      <div className="flex-1 overflow-y-auto max-h-[360px] pr-1 space-y-3">
        {institutions.length === 0 ? (
          <div className="p-8 text-center text-slate-500 italic text-sm">
            No institutional predictions available
          </div>
        ) : (
          institutions.map((inst, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-lg bg-slate-950/40 border border-slate-800/70 hover:border-slate-700/80 transition-all flex flex-col gap-2 relative pl-4 border-l-4 border-l-indigo-500"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-sm text-slate-100">{inst.name}</h4>
                  {inst.cutoff && (
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-400">
                      <Target className="w-3.5 h-3.5 text-slate-400" />
                      <span>Cutoff / Threshold: <span className="text-slate-200 font-medium">{inst.cutoff}</span></span>
                    </div>
                  )}
                </div>
                <div className="shrink-0">
                  {getProbabilityBadge(inst.probability)}
                </div>
              </div>

              {inst.recommendation && (
                <div className="mt-1 pt-2 border-t border-slate-800/60 flex items-start gap-1.5 text-xs text-slate-300">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400 mt-0.5 shrink-0" />
                  <p className="leading-relaxed">{inst.recommendation}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
});
