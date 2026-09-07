'use client';

import React, { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Activity, Sliders, TrendingUp, Layers } from 'lucide-react';

export interface InteractiveGraphProps {
  data?: {
    title?: string;
    metrics?: Array<{ label: string; valueA: number; valueB: number; unit?: string }>;
    entityA?: string;
    entityB?: string;
  };
}

export const InteractiveGraphWidget = memo(function InteractiveGraphWidget({ data }: InteractiveGraphProps) {
  const {
    title = 'Dynamic Telemetry Graph',
    metrics = [
      { label: 'Performance', valueA: 85, valueB: 62 },
      { label: 'Efficiency', valueA: 68, valueB: 92 },
      { label: 'Reliability', valueA: 90, valueB: 75 },
      { label: 'Price Value', valueA: 55, valueB: 95 },
    ],
    entityA = 'Entity A',
    entityB = 'Entity B',
  } = data || {};

  const [weightMultiplier, setWeightMultiplier] = useState<number>(1.0);
  const [filterMode, setFilterMode] = useState<'all' | 'entityA' | 'entityB'>('all');

  return (
    <div className="w-[460px] bg-[#0D1527] border border-indigo-500/40 rounded-2xl p-4 shadow-xl text-slate-100 font-sans backdrop-blur-md">
      <Handle type="target" position={Position.Left} className="!bg-indigo-400 !w-3 !h-3 !border-2 !border-slate-900" />
      <Handle type="source" position={Position.Right} className="!bg-indigo-400 !w-3 !h-3 !border-2 !border-slate-900" />

      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-300">{title}</h4>
            <span className="text-[10px] text-slate-400 font-mono">Interactive Disparity Chart</span>
          </div>
        </div>

        <div className="flex bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-[10px] font-mono">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-2 py-0.5 rounded-md transition-colors ${filterMode === 'all' ? 'bg-indigo-500/20 text-indigo-300 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Both
          </button>
          <button
            onClick={() => setFilterMode('entityA')}
            className={`px-2 py-0.5 rounded-md transition-colors ${filterMode === 'entityA' ? 'bg-indigo-500/20 text-indigo-300 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
          >
            {entityA}
          </button>
          <button
            onClick={() => setFilterMode('entityB')}
            className={`px-2 py-0.5 rounded-md transition-colors ${filterMode === 'entityB' ? 'bg-indigo-500/20 text-indigo-300 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
          >
            {entityB}
          </button>
        </div>
      </div>

      {/* Slider Control */}
      <div className="mt-3 flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
        <div className="flex items-center gap-1.5 text-slate-300 font-mono text-[11px]">
          <Sliders className="w-3.5 h-3.5 text-indigo-400" />
          <span>Weight Factor:</span>
          <span className="font-bold text-indigo-300">{weightMultiplier.toFixed(1)}x</span>
        </div>
        <input
          type="range"
          min="0.5"
          max="2.0"
          step="0.1"
          value={weightMultiplier}
          onChange={(e) => setWeightMultiplier(parseFloat(e.target.value))}
          className="w-32 accent-indigo-400 cursor-pointer"
        />
      </div>

      {/* Bar Chart Bars */}
      <div className="mt-3.5 space-y-3">
        {metrics.map((m, i) => {
          const adjA = Math.min(100, Math.round(m.valueA * weightMultiplier));
          const adjB = Math.min(100, Math.round(m.valueB * weightMultiplier));

          return (
            <div key={i} className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono text-slate-300">
                <span>{m.label}</span>
                <span className="text-slate-400">
                  {entityA}: {adjA} | {entityB}: {adjB}
                </span>
              </div>
              <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden flex p-0.5 gap-0.5 border border-slate-800">
                {(filterMode === 'all' || filterMode === 'entityA') && (
                  <div
                    style={{ width: `${adjA}%` }}
                    className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full transition-all duration-300"
                    title={`${entityA}: ${adjA}`}
                  />
                )}
                {(filterMode === 'all' || filterMode === 'entityB') && (
                  <div
                    style={{ width: `${adjB}%` }}
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-300"
                    title={`${entityB}: ${adjB}`}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default InteractiveGraphWidget;
