'use client';

import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Table, Info } from 'lucide-react';

interface ComparisonTableWidgetProps {
  data: {
    title: string;
    headers?: string[];
    rows?: Record<string, string>[];
    summary?: string;
  };
}

export const ComparisonTableWidget = memo(function ComparisonTableWidget({ data }: ComparisonTableWidgetProps) {
  const title = data?.title || 'Comparison Table';
  const headers = Array.isArray(data?.headers) ? data.headers : [];
  const rows = Array.isArray(data?.rows) ? data.rows : [];
  const summary = data?.summary;

  return (
    <div className="w-[480px] min-h-[460px] bg-slate-900/95 border border-slate-800 rounded-xl p-5 shadow-2xl flex flex-col text-slate-100 backdrop-blur">
      <Handle type="target" position={Position.Left} className="!bg-sky-500 !w-3 !h-3" />
      <Handle type="source" position={Position.Right} className="!bg-indigo-500 !w-3 !h-3" />

      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Table className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-base tracking-tight text-white line-clamp-1">{title}</h3>
            <span className="text-xs text-slate-400">Comparison Matrix</span>
          </div>
        </div>
        {rows.length > 0 && (
          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-slate-800 text-sky-300 border border-slate-700">
            {rows.length} {rows.length === 1 ? 'entry' : 'entries'}
          </span>
        )}
      </div>

      {/* Table Area */}
      <div className="flex-1 overflow-auto max-h-[300px] rounded-lg border border-slate-800/80 bg-slate-950/40">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="sticky top-0 bg-slate-900/90 backdrop-blur border-b border-slate-800 text-slate-300 uppercase font-semibold text-[11px] tracking-wider z-10">
            <tr>
              {headers.map((header, idx) => (
                <th key={idx} className="p-3 font-semibold text-slate-200">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={headers.length || 1} className="p-4 text-center text-slate-500 italic">
                  No table records available
                </td>
              </tr>
            ) : (
              rows.map((row, rIdx) => (
                <tr
                  key={rIdx}
                  className={`hover:bg-slate-800/60 transition-colors ${
                    rIdx % 2 === 1 ? 'bg-slate-800/40' : ''
                  }`}
                >
                  {headers.map((header, hIdx) => {
                    const val = row[header] ?? Object.values(row)[hIdx] ?? '-';
                    return (
                      <td key={hIdx} className="p-3 text-slate-300 font-medium">
                        {String(val)}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Optional Summary */}
      {summary && (
        <div className="mt-4 p-3 rounded-lg bg-sky-950/40 border border-sky-800/40 text-xs text-sky-200 flex items-start gap-2">
          <Info className="w-4 h-4 text-sky-400 mt-0.5 shrink-0" />
          <p className="leading-relaxed line-clamp-3">{summary}</p>
        </div>
      )}
    </div>
  );
});
