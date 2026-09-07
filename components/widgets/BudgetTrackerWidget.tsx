'use client';

import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Wallet, DollarSign, PieChart } from 'lucide-react';

interface BudgetTrackerWidgetProps {
  data: {
    title: string;
    currency?: string;
    total?: number;
    items?: Array<{
      category: string;
      name: string;
      cost: number;
    }>;
  };
}

export const BudgetTrackerWidget = memo(function BudgetTrackerWidget({ data }: BudgetTrackerWidgetProps) {
  const title = data?.title || 'Budget Tracker';
  const currency = data?.currency || '$';
  const items = Array.isArray(data?.items) ? data.items : [];
  
  // Calculate or use provided total
  const calculatedTotal = items.reduce((acc, item) => acc + (Number(item?.cost) || 0), 0);
  const displayTotal = data?.total !== undefined && data.total !== null ? Number(data.total) : calculatedTotal;

  // Category breakdown for summary footer
  const categoryCounts = items.reduce((acc, item) => {
    const cat = item.category || 'General';
    acc[cat] = (acc[cat] || 0) + (Number(item?.cost) || 0);
    return acc;
  }, {} as Record<string, number>);

  const uniqueCategories = Object.keys(categoryCounts);

  return (
    <div className="w-[480px] min-h-[460px] bg-slate-900/95 border border-slate-800 rounded-xl p-5 shadow-2xl flex flex-col text-slate-100 backdrop-blur">
      <Handle type="target" position={Position.Left} className="!bg-sky-500 !w-3 !h-3" />
      <Handle type="source" position={Position.Right} className="!bg-indigo-500 !w-3 !h-3" />

      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-base tracking-tight text-white line-clamp-1">{title}</h3>
            <span className="text-xs text-slate-400">Financial Ledger</span>
          </div>
        </div>

        <div className="px-3 py-1 rounded-lg bg-emerald-950/60 border border-emerald-800/50 flex items-center gap-1.5 shadow-inner">
          <DollarSign className="w-4 h-4 text-emerald-400 -mr-1" />
          <span className="font-bold text-sm text-emerald-300">
            {currency} {displayTotal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Scrollable Itemized Ledger */}
      <div className="flex-1 overflow-y-auto max-h-[290px] pr-1 rounded-lg border border-slate-800/80 bg-slate-950/40 divide-y divide-slate-800/60">
        {items.length === 0 ? (
          <div className="p-8 text-center text-slate-500 italic text-sm">
            No line items available
          </div>
        ) : (
          items.map((item, idx) => (
            <div
              key={idx}
              className={`p-3 flex items-center justify-between gap-3 text-xs transition-colors hover:bg-slate-800/50 ${
                idx % 2 === 1 ? 'bg-slate-800/30' : ''
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="shrink-0 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                  {item.category || 'Expense'}
                </span>
                <span className="font-medium text-slate-200 truncate">{item.name}</span>
              </div>
              <div className="shrink-0 font-semibold text-slate-100">
                {currency} {Number(item.cost || 0).toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary Footer */}
      <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <PieChart className="w-3.5 h-3.5 text-emerald-400" />
          <span>{items.length} itemized {items.length === 1 ? 'entry' : 'entries'}</span>
        </div>
        <div className="flex items-center gap-2">
          {uniqueCategories.slice(0, 2).map((cat, i) => (
            <span key={i} className="text-[11px] px-2 py-0.5 rounded bg-slate-800/60 text-slate-300">
              {cat}: {currency}{categoryCounts[cat].toLocaleString()}
            </span>
          ))}
          {uniqueCategories.length > 2 && (
            <span className="text-[11px] text-slate-500">+{uniqueCategories.length - 2} more</span>
          )}
        </div>
      </div>
    </div>
  );
});
