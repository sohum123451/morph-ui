'use client';

import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Zap } from 'lucide-react';

export interface DivergenceLedgerProps {
  data?: {
    category?: string;
    deltas?: Array<{
      metric: string;
      disparity_pct: number;
      entity_a_val: string;
      entity_b_val: string;
      critical_driver?: string;
    }>;
    summary?: string;
  };
}

export const DivergenceLedgerWidget = memo(function DivergenceLedgerWidget({ data }: DivergenceLedgerProps) {
  const { category = 'Comparative Divergence', deltas = [], summary = '' } = data || {};

  return (
    <div className="w-[460px] bg-[#0B1120] border border-amber-500/40 rounded-2xl p-4 shadow-xl text-slate-100 font-sans backdrop-blur-md">
      <Handle type="target" position={Position.Left} className="!bg-amber-400 !w-3 !h-3 !border-2 !border-slate-900" />
      <Handle type="source" position={Position.Right} className="!bg-amber-400 !w-3 !h-3 !border-2 !border-slate-900" />

      <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-amber-300">Maximum Divergence Ledger</h4>
            <span className="text-[10px] text-slate-400 font-mono">{category}</span>
          </div>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
          Critical Deltas
        </span>
      </div>

      <div className="mt-2.5 space-y-2 max-h-[220px] overflow-y-auto pr-1">
        {deltas.length === 0 ? (
          <div className="p-4 text-center text-slate-500 text-xs italic">
            No critical disparities detected under current threshold.
          </div>
        ) : (
          deltas.map((d, i) => (
            <div key={i} className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200 truncate max-w-[260px]">{d.metric}</span>
                <span className="font-mono text-[10px] text-amber-400 font-bold px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-800/60">
                  +{d.disparity_pct}% Disparity
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                <div className="p-1.5 rounded bg-slate-950/80 border border-slate-800/80 text-sky-300 truncate">
                  {d.entity_a_val}
                </div>
                <div className="p-1.5 rounded bg-slate-950/80 border border-slate-800/80 text-indigo-300 truncate">
                  {d.entity_b_val}
                </div>
              </div>
              {d.critical_driver && (
                <p className="text-[10px] text-slate-400 italic pt-0.5">{d.critical_driver}</p>
              )}
            </div>
          ))
        )}
      </div>

      {summary && (
        <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-[11px] text-slate-300 leading-relaxed font-mono">
          {summary}
        </div>
      )}
    </div>
  );
});

export default DivergenceLedgerWidget;
