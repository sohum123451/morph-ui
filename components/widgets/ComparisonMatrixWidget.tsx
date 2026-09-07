'use client';

import React, { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Grid, Filter, CheckCircle, Info } from 'lucide-react';

export interface ComparisonMatrixProps {
  data?: {
    title?: string;
    entityA?: string;
    entityB?: string;
    rows?: Array<{ category: string; metric: string; valA: string; valB: string; winner?: 'A' | 'B' | 'Tie' }>;
  };
}

export const ComparisonMatrixWidget = memo(function ComparisonMatrixWidget({ data }: ComparisonMatrixProps) {
  const {
    title = 'Comparative Feature Matrix',
    entityA = 'Option A',
    entityB = 'Option B',
    rows = [
      { category: 'Core Specs', metric: 'Engine / Power', valA: '2.0L Turbo (150 HP)', valB: '1.2L DualJet (89 HP)', winner: 'A' },
      { category: 'Core Specs', metric: 'Fuel Efficiency', valA: '14.2 km/l', valB: '22.5 km/l', winner: 'B' },
      { category: 'Safety & Tech', metric: 'Airbags & ABS', valA: '6 Airbags + ESP', valB: '2 Airbags + ABS', winner: 'A' },
      { category: 'Dimensions', metric: 'Ground Clearance', valA: '226 mm', valB: '170 mm', winner: 'A' },
    ],
  } = data || {};

  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', ...Array.from(new Set(rows.map((r) => r.category)))];
  const filteredRows = selectedCategory === 'All' ? rows : rows.filter((r) => r.category === selectedCategory);

  return (
    <div className="w-[520px] bg-[#0E1626] border border-blue-500/40 rounded-2xl p-4 shadow-xl text-slate-100 font-sans backdrop-blur-md">
      <Handle type="target" position={Position.Left} className="!bg-blue-400 !w-3 !h-3 !border-2 !border-slate-900" />
      <Handle type="source" position={Position.Right} className="!bg-blue-400 !w-3 !h-3 !border-2 !border-slate-900" />

      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Grid className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-blue-300">{title}</h4>
            <span className="text-[10px] text-slate-400 font-mono">{entityA} vs {entityB}</span>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-1 overflow-x-auto max-w-[200px] text-[10px] font-mono no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2 py-0.5 rounded-md whitespace-nowrap transition-colors ${selectedCategory === cat ? 'bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30' : 'bg-slate-900 text-slate-400 hover:text-slate-200'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Matrix Table */}
      <div className="mt-3 border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60">
        <div className="grid grid-cols-3 bg-slate-900/90 border-b border-slate-800 p-2 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
          <div>Metric</div>
          <div>{entityA}</div>
          <div>{entityB}</div>
        </div>

        <div className="divide-y divide-slate-800/80 max-h-[200px] overflow-y-auto">
          {filteredRows.map((r, i) => (
            <div key={i} className="grid grid-cols-3 p-2 text-xs items-center hover:bg-slate-900/40 transition-colors">
              <div className="font-medium text-slate-200 pr-1">{r.metric}</div>
              <div className={`p-1 rounded text-[11px] truncate ${r.winner === 'A' ? 'bg-emerald-500/10 text-emerald-300 font-semibold border border-emerald-500/20' : 'text-slate-300'}`}>
                {r.valA}
              </div>
              <div className={`p-1 rounded text-[11px] truncate ${r.winner === 'B' ? 'bg-emerald-500/10 text-emerald-300 font-semibold border border-emerald-500/20' : 'text-slate-300'}`}>
                {r.valB}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

export default ComparisonMatrixWidget;
