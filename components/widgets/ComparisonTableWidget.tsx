'use client';

import React, { memo, useState, useMemo } from 'react';
import { Handle, Position } from '@xyflow/react';
import {
  GraduationCap,
  Apple,
  Smartphone,
  Car,
  Code2,
  Plane,
  Scale,
  Award,
  BarChart3,
  Table as TableIcon,
  Search,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { ComparisonPoint, WidgetImage } from '@/types/morphui';

interface ComparisonTableWidgetProps {
  data: {
    title?: string;
    category?: string;
    entity_a?: string;
    entity_b?: string;
    comparison_points?: ComparisonPoint[];
    verdict_summary?: string;
    headers?: string[];
    rows?: Record<string, string>[];
    summary?: string;
    images?: WidgetImage[];
  };
}

/**
 * Helper to extract numeric values for comparative progress bars
 */
function parseNumericValue(val: string): number | null {
  if (!val || val === 'N/A' || val === '-') return null;
  // Match first number (with optional decimals)
  const clean = val.replace(/,/g, '');
  const match = clean.match(/[-+]?\d*\.?\d+/);
  if (!match) return null;
  const num = parseFloat(match[0]);
  return isNaN(num) ? null : num;
}

/**
 * Category-aware styling and icons
 */
function getCategoryMeta(categoryName = '') {
  const cat = categoryName.toLowerCase();
  if (cat.includes('university') || cat.includes('college') || cat.includes('education')) {
    return {
      icon: GraduationCap,
      label: 'University Comparison',
      gradient: 'from-blue-500/20 via-sky-500/10 to-transparent',
      accentColor: 'text-sky-400',
      badgeBg: 'bg-sky-500/10 border-sky-500/20 text-sky-300',
      barA: 'bg-sky-500',
      barB: 'bg-indigo-500',
    };
  }
  if (cat.includes('fruit') || cat.includes('food') || cat.includes('nutrition')) {
    return {
      icon: Apple,
      label: 'Nutritional Comparison',
      gradient: 'from-emerald-500/20 via-lime-500/10 to-transparent',
      accentColor: 'text-emerald-400',
      badgeBg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300',
      barA: 'bg-emerald-500',
      barB: 'bg-amber-500',
    };
  }
  if (cat.includes('phone') || cat.includes('tech') || cat.includes('hardware')) {
    return {
      icon: Smartphone,
      label: 'Tech Specifications',
      gradient: 'from-purple-500/20 via-violet-500/10 to-transparent',
      accentColor: 'text-purple-400',
      badgeBg: 'bg-purple-500/10 border-purple-500/20 text-purple-300',
      barA: 'bg-purple-500',
      barB: 'bg-pink-500',
    };
  }
  if (cat.includes('car') || cat.includes('auto')) {
    return {
      icon: Car,
      label: 'Automotive Benchmark',
      gradient: 'from-amber-500/20 via-orange-500/10 to-transparent',
      accentColor: 'text-amber-400',
      badgeBg: 'bg-amber-500/10 border-amber-500/20 text-amber-300',
      barA: 'bg-amber-500',
      barB: 'bg-red-500',
    };
  }
  if (cat.includes('software') || cat.includes('framework') || cat.includes('code')) {
    return {
      icon: Code2,
      label: 'Software Comparison',
      gradient: 'from-cyan-500/20 via-teal-500/10 to-transparent',
      accentColor: 'text-cyan-400',
      badgeBg: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-300',
      barA: 'bg-cyan-500',
      barB: 'bg-teal-500',
    };
  }
  if (cat.includes('travel') || cat.includes('destination') || cat.includes('trip')) {
    return {
      icon: Plane,
      label: 'Travel Matrix',
      gradient: 'from-sky-500/20 via-indigo-500/10 to-transparent',
      accentColor: 'text-sky-400',
      badgeBg: 'bg-sky-500/10 border-sky-500/20 text-sky-300',
      barA: 'bg-sky-500',
      barB: 'bg-violet-500',
    };
  }
  return {
    icon: Scale,
    label: categoryName || 'Comparison Matrix',
    gradient: 'from-indigo-500/20 via-sky-500/10 to-transparent',
    accentColor: 'text-indigo-400',
    badgeBg: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300',
    barA: 'bg-indigo-500',
    barB: 'bg-cyan-500',
  };
}

export const ComparisonTableWidget = memo(function ComparisonTableWidget({
  data,
}: ComparisonTableWidgetProps) {
  const [viewMode, setViewMode] = useState<'table' | 'bars'>('table');
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Normalize comparison points from either the new schema or legacy rows/headers
  const points: ComparisonPoint[] = useMemo(() => {
    if (Array.isArray(data?.comparison_points) && data.comparison_points.length > 0) {
      return data.comparison_points;
    }
    // Fallback: construct from rows & headers
    if (Array.isArray(data?.rows) && data.rows.length > 0 && Array.isArray(data?.headers)) {
      const hA = data.headers[1] || 'Entity A';
      const hB = data.headers[2] || 'Entity B';
      const fHeader = data.headers[0] || 'Feature';
      return data.rows.map((row) => ({
        feature_name: row[fHeader] || Object.values(row)[0] || 'Metric',
        entity_a_value: row[hA] ?? Object.values(row)[1] ?? 'N/A',
        entity_b_value: row[hB] ?? Object.values(row)[2] ?? 'N/A',
      }));
    }
    return [];
  }, [data?.comparison_points, data?.rows, data?.headers]);

  const entityA = data?.entity_a || data?.headers?.[1] || 'Entity A';
  const entityB = data?.entity_b || data?.headers?.[2] || 'Entity B';
  const category = data?.category || 'Comparative Analysis';
  const verdictSummary = data?.verdict_summary || data?.summary;
  const title = data?.title || `${entityA} vs ${entityB}`;
  const images = Array.isArray(data?.images) ? data.images : [];

  const categoryMeta = useMemo(() => getCategoryMeta(category), [category]);
  const CategoryIcon = categoryMeta.icon;

  // Filter points based on search input
  const filteredPoints = useMemo(() => {
    if (!searchTerm.trim()) return points;
    const term = searchTerm.toLowerCase();
    return points.filter(
      (p) =>
        p.feature_name.toLowerCase().includes(term) ||
        p.entity_a_value.toLowerCase().includes(term) ||
        p.entity_b_value.toLowerCase().includes(term)
    );
  }, [points, searchTerm]);

  return (
    <div className="w-[580px] min-h-[520px] bg-slate-900/95 border border-slate-800/90 rounded-2xl p-5 shadow-2xl flex flex-col text-slate-100 backdrop-blur-xl relative overflow-hidden transition-all duration-200">
      {/* Dynamic Category Gradient Accent */}
      <div
        className={`absolute top-0 left-0 right-0 h-24 bg-gradient-to-b ${categoryMeta.gradient} pointer-events-none opacity-60`}
      />

      <Handle type="target" position={Position.Left} className="!bg-sky-500 !w-3.5 !h-3.5 !border-2 !border-slate-900" />
      <Handle type="source" position={Position.Right} className="!bg-indigo-500 !w-3.5 !h-3.5 !border-2 !border-slate-900" />

      {/* Header Section */}
      <div className="relative z-10 flex items-start justify-between pb-3.5 border-b border-slate-800/80 mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 shadow-inner">
            <CategoryIcon className={`w-5 h-5 ${categoryMeta.accentColor}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-md border ${categoryMeta.badgeBg}`}>
                {categoryMeta.label}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                {points.length} {points.length === 1 ? 'Data Point' : 'Data Points'}
              </span>
            </div>
            <h3 className="font-bold text-base tracking-tight text-white mt-0.5 line-clamp-1">
              {title}
            </h3>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-md text-xs font-medium transition-all ${
              viewMode === 'table'
                ? 'bg-slate-800 text-sky-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Table View"
          >
            <TableIcon className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('bars')}
            className={`p-1.5 rounded-md text-xs font-medium transition-all ${
              viewMode === 'bars'
                ? 'bg-slate-800 text-sky-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Metric Progress Bars"
          >
            <BarChart3 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Visual Image Strip (if images provided) */}
      {images.length > 0 && (
        <div className="relative z-10 mb-3 p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-around gap-2">
          {images.map((img, i) => (
            <div key={i} className="flex flex-col items-center gap-1 flex-1 max-w-[220px]">
              <div className="w-full h-20 rounded-lg overflow-hidden border border-slate-700/70 bg-slate-900 relative shadow-inner">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.label || `Subject ${i + 1}`}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-900/80 text-sky-300 border border-sky-500/30">
                  {i === 0 ? entityA : entityB}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Search & Filter */}
      {points.length > 5 && (
        <div className="relative z-10 mb-2.5">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Search ${points.length} features (e.g. fees, calories, camera)...`}
              className="w-full bg-slate-950/60 border border-slate-800/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500/50"
            />
          </div>
        </div>
      )}

      {/* Entity Columns Subheader */}
      <div className="relative z-10 grid grid-cols-12 gap-2 px-3 py-2 rounded-lg bg-slate-950/80 border border-slate-800/90 text-xs font-semibold uppercase tracking-wider mb-2">
        <div className="col-span-4 text-slate-400">Feature / Metric</div>
        <div className="col-span-4 text-sky-400 flex items-center gap-1 truncate">
          <span className="w-2 h-2 rounded-full bg-sky-400" />
          <span className="truncate">{entityA}</span>
        </div>
        <div className="col-span-4 text-indigo-400 flex items-center gap-1 truncate">
          <span className="w-2 h-2 rounded-full bg-indigo-400" />
          <span className="truncate">{entityB}</span>
        </div>
      </div>

      {/* Main Dynamic Rendering Area */}
      <div className="relative z-10 flex-1 overflow-auto max-h-[290px] rounded-xl border border-slate-800/80 bg-slate-950/50 p-1 divide-y divide-slate-800/50">
        {filteredPoints.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
            <HelpCircle className="w-6 h-6 text-slate-600" />
            <span>No matching comparison points found</span>
          </div>
        ) : viewMode === 'table' ? (
          // 1. Table View
          filteredPoints.map((pt, idx) => {
            const isNA_A = pt.entity_a_value === 'N/A';
            const isNA_B = pt.entity_b_value === 'N/A';

            return (
              <div
                key={idx}
                className="grid grid-cols-12 gap-2 p-2.5 text-xs hover:bg-slate-800/40 rounded-lg transition-colors items-center"
              >
                {/* Feature Name */}
                <div className="col-span-4 font-medium text-slate-200 pr-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-600 shrink-0" />
                  <span className="line-clamp-2">{pt.feature_name}</span>
                </div>

                {/* Entity A Value */}
                <div className="col-span-4 pr-1">
                  {isNA_A ? (
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-500 border border-slate-700/50">
                      N/A
                    </span>
                  ) : (
                    <span className="text-slate-300 font-medium leading-relaxed line-clamp-3">
                      {pt.entity_a_value}
                    </span>
                  )}
                </div>

                {/* Entity B Value */}
                <div className="col-span-4">
                  {isNA_B ? (
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-500 border border-slate-700/50">
                      N/A
                    </span>
                  ) : (
                    <span className="text-slate-300 font-medium leading-relaxed line-clamp-3">
                      {pt.entity_b_value}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          // 2. Metric Progress Bars View
          filteredPoints.map((pt, idx) => {
            const valA = parseNumericValue(pt.entity_a_value);
            const valB = parseNumericValue(pt.entity_b_value);
            const hasNumeric = valA !== null && valB !== null && (valA > 0 || valB > 0);

            // Compute relative percentage for progress bar
            let pctA = 50;
            let pctB = 50;
            if (hasNumeric && valA !== null && valB !== null) {
              const sum = valA + valB;
              pctA = sum > 0 ? Math.round((valA / sum) * 100) : 50;
              pctB = 100 - pctA;
            }

            return (
              <div
                key={idx}
                className="p-3 text-xs hover:bg-slate-800/40 rounded-lg transition-colors flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">{pt.feature_name}</span>
                  {hasNumeric && (
                    <span className="text-[10px] text-slate-400 font-mono">
                      {pctA}% vs {pctB}%
                    </span>
                  )}
                </div>

                {hasNumeric ? (
                  <div className="space-y-1">
                    {/* Comparative Dual Progress Bar */}
                    <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden flex">
                      <div
                        style={{ width: `${pctA}%` }}
                        className={`${categoryMeta.barA} transition-all duration-500`}
                        title={`${entityA}: ${pt.entity_a_value}`}
                      />
                      <div
                        style={{ width: `${pctB}%` }}
                        className={`${categoryMeta.barB} transition-all duration-500`}
                        title={`${entityB}: ${pt.entity_b_value}`}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-0.5">
                      <span className="text-sky-300 font-medium truncate max-w-[48%]">
                        {pt.entity_a_value}
                      </span>
                      <span className="text-indigo-300 font-medium truncate max-w-[48%] text-right">
                        {pt.entity_b_value}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="p-2 rounded bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300">
                      <span className="block text-[10px] text-sky-400 font-medium mb-0.5">{entityA}:</span>
                      {pt.entity_a_value}
                    </div>
                    <div className="p-2 rounded bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300">
                      <span className="block text-[10px] text-indigo-400 font-medium mb-0.5">{entityB}:</span>
                      {pt.entity_b_value}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Verdict Summary Card */}
      {verdictSummary && (
        <div className="relative z-10 mt-3.5 p-3 rounded-xl bg-slate-950/80 border border-sky-500/20 shadow-inner flex items-start gap-2.5">
          <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 shrink-0 mt-0.5">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-sky-300 mb-0.5 flex items-center gap-1.5">
              <span>Verdict & Synthesis</span>
              <CheckCircle2 className="w-3 h-3 text-sky-400" />
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
              {verdictSummary}
            </p>
          </div>
        </div>
      )}
    </div>
  );
});
