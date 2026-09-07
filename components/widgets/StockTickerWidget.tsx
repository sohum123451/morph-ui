'use client';

import React, { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { TrendingUp, TrendingDown, DollarSign, Activity, BarChart2 } from 'lucide-react';

export interface StockTickerProps {
  data?: {
    symbol?: string;
    name?: string;
    price?: string;
    change?: string;
    changePercent?: string;
    isPositive?: boolean;
    volume?: string;
    marketCap?: string;
    history?: Array<{ time: string; price: number }>;
  };
}

export const StockTickerWidget = memo(function StockTickerWidget({ data }: StockTickerProps) {
  const {
    symbol = 'MRPH',
    name = 'MorphUI Intelligence',
    price = '$184.50',
    change = '+$4.20',
    changePercent = '+2.33%',
    isPositive = true,
    volume = '2.4M',
    marketCap = '$48.2B',
    history = [
      { time: '9:30', price: 180.2 },
      { time: '11:00', price: 182.4 },
      { time: '12:30', price: 181.8 },
      { time: '14:00', price: 183.9 },
      { time: '16:00', price: 184.5 },
    ],
  } = data || {};

  const [activeTimeframe, setActiveTimeframe] = useState<'1D' | '1W' | '1M'>('1D');
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);

  return (
    <div className="w-[440px] bg-[#0A131F] border border-emerald-500/40 rounded-2xl p-4 shadow-xl text-slate-100 font-sans backdrop-blur-md">
      <Handle type="target" position={Position.Left} className="!bg-emerald-400 !w-3 !h-3 !border-2 !border-slate-900" />
      <Handle type="source" position={Position.Right} className="!bg-emerald-400 !w-3 !h-3 !border-2 !border-slate-900" />

      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <BarChart2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="font-bold text-sm tracking-wide text-white">{symbol}</h4>
              <span className="text-[10px] text-slate-400 font-mono">[{name}]</span>
            </div>
          </div>
        </div>

        <div className="flex bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-[10px] font-mono">
          {(['1D', '1W', '1M'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setActiveTimeframe(tf)}
              className={`px-2 py-0.5 rounded-md transition-colors ${activeTimeframe === tf ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Price section */}
      <div className="mt-3 flex items-baseline justify-between">
        <div>
          <span className="text-2xl font-extrabold text-white tracking-tight">{price}</span>
          <div className={`flex items-center gap-1 text-xs font-mono font-semibold mt-0.5 ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
            {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            <span>{change} ({changePercent})</span>
          </div>
        </div>
        <div className="text-right text-[10px] font-mono text-slate-400 space-y-0.5">
          <div>Vol: <span className="text-slate-200">{volume}</span></div>
          <div>MCap: <span className="text-slate-200">{marketCap}</span></div>
        </div>
      </div>

      {/* Interactive sparkline / history points */}
      <div className="mt-3.5 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
        <div className="text-[10px] font-mono text-slate-400 mb-1.5 flex justify-between">
          <span>Intraday Performance</span>
          {selectedPoint !== null && (
            <span className="text-emerald-300 font-bold">
              {history[selectedPoint]?.time}: ${history[selectedPoint]?.price}
            </span>
          )}
        </div>
        <div className="flex items-end justify-between h-14 gap-1.5 pt-1">
          {history.map((h, i) => {
            const min = Math.min(...history.map((x) => x.price));
            const max = Math.max(...history.map((x) => x.price));
            const heightPct = Math.max(15, Math.min(100, ((h.price - min) / (max - min || 1)) * 100));

            return (
              <div
                key={i}
                onMouseEnter={() => setSelectedPoint(i)}
                onMouseLeave={() => setSelectedPoint(null)}
                className="flex-1 flex flex-col items-center group cursor-pointer"
              >
                <div
                  style={{ height: `${heightPct}%` }}
                  className={`w-full rounded-t transition-all ${selectedPoint === i ? 'bg-emerald-400 shadow-lg shadow-emerald-500/50' : 'bg-emerald-500/40 group-hover:bg-emerald-500/70'}`}
                />
                <span className="text-[8px] font-mono text-slate-500 mt-1">{h.time}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

export default StockTickerWidget;
