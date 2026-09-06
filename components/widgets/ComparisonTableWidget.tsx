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
  Footprints,
} from 'lucide-react';
import { ComparisonPoint, WidgetImage, VerifiedMetric, EntityVerdict } from '@/types/morphui';

interface ComparisonTableWidgetProps {
  data: {
    title?: string;
    category?: string;
    entity_a?: string | EntityVerdict;
    entity_b?: string | EntityVerdict;
    categories?: Record<string, VerifiedMetric[]>;
    comparison_points?: ComparisonPoint[];
    verified_metrics?: VerifiedMetric[];
    verdict_summary?: string;
    headers?: string[];
    rows?: Record<string, string>[];
    summary?: string;
    images?: WidgetImage[];
  };
}

function isMissingValue(val: any): boolean {
  if (val === null || val === undefined) return true;
  const str = String(val).trim();
  if (!str) return true;
  return /^(n\/?a|not specified.*|none|null|-|unknown)$/i.test(str);
}

function renderValueWithFallback(val: any, fallbackText = 'Not specified') {
  if (isMissingValue(val)) {
    return <span className="text-slate-500 italic text-xs sm:text-sm">{fallbackText}</span>;
  }
  return val;
}

function parseNumericValue(val: string): number | null {
  if (isMissingValue(val)) return null;
  const clean = String(val).replace(/,/g, '');
  const match = clean.match(/[-+]?\d*\.?\d+/);
  if (!match) return null;
  const num = parseFloat(match[0]);
  return isNaN(num) ? null : num;
}

function getCategoryMeta(categoryName = '') {
  const cat = categoryName.toLowerCase();
  if (cat.includes('shoe') || cat.includes('footwear') || cat.includes('sneaker')) {
    return {
      icon: Footprints,
      label: 'Footwear & Athletic Gear',
      gradient: 'from-amber-500/20 via-orange-500/10 to-transparent',
      accentColor: 'text-amber-400',
      badgeBg: 'bg-amber-500/10 border-amber-500/20 text-amber-300',
      barA: 'bg-amber-500',
      barB: 'bg-orange-500',
    };
  }
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
  if (cat.includes('fruit') || cat.includes('food') || cat.includes('nutrition') || cat.includes('produce')) {
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
  if (cat.includes('phone') || cat.includes('tech') || cat.includes('hardware') || cat.includes('smartphone') || cat.includes('audio') || cat.includes('headphone')) {
    return {
      icon: Smartphone,
      label: 'Tech & Audio Specs',
      gradient: 'from-purple-500/20 via-violet-500/10 to-transparent',
      accentColor: 'text-purple-400',
      badgeBg: 'bg-purple-500/10 border-purple-500/20 text-purple-300',
      barA: 'bg-purple-500',
      barB: 'bg-pink-500',
    };
  }
  if (cat.includes('car') || cat.includes('auto') || cat.includes('automobile')) {
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
  if (cat.includes('software') || cat.includes('framework') || cat.includes('code') || cat.includes('app')) {
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

  const entityAName = typeof data?.entity_a === 'object' && data?.entity_a?.name
    ? data.entity_a.name
    : typeof data?.entity_a === 'string'
    ? data.entity_a
    : data?.headers?.[1] || 'Entity A';

  const entityBName = typeof data?.entity_b === 'object' && data?.entity_b?.name
    ? data.entity_b.name
    : typeof data?.entity_b === 'string'
    ? data.entity_b
    : data?.headers?.[2] || 'Entity B';

  const category = data?.category || 'Comparative Analysis';
  const verdictSummary = data?.verdict_summary || data?.summary;
  const title = data?.title || `${entityAName} vs ${entityBName}`;
  const images = Array.isArray(data?.images) ? data.images : [];

  const categoriesMap: Record<string, VerifiedMetric[]> = useMemo(() => {
    if (data?.categories && Object.keys(data.categories).length > 0) {
      return data.categories;
    }
    if (Array.isArray(data?.verified_metrics) && data.verified_metrics.length > 0) {
      return { [category || 'Key Metrics']: data.verified_metrics };
    }
    if (Array.isArray(data?.comparison_points) && data.comparison_points.length > 0) {
      return {
        [category || 'Key Metrics']: data.comparison_points.map((cp) => ({
          metric: cp.feature_name,
          entity_a: cp.entity_a_value,
          entity_b: cp.entity_b_value,
          source_type: 'official' as const,
        })),
      };
    }
    if (Array.isArray(data?.rows) && data.rows.length > 0 && Array.isArray(data?.headers)) {
      const hA = data.headers[1] || 'Entity A';
      const hB = data.headers[2] || 'Entity B';
      const fHeader = data.headers[0] || 'Feature';
      return {
        [category || 'Key Metrics']: data.rows.map((row) => ({
          metric: row[fHeader] || Object.values(row)[0] || 'Metric',
          entity_a: row[hA] ?? Object.values(row)[1] ?? 'N/A',
          entity_b: row[hB] ?? Object.values(row)[2] ?? 'N/A',
          source_type: 'official' as const,
        })),
      };
    }
    return {};
  }, [data?.categories, data?.verified_metrics, data?.comparison_points, data?.rows, data?.headers, category]);

  const allMetricsCount = useMemo(() => {
    return Object.values(categoriesMap).reduce((acc, curr) => acc + curr.length, 0);
  }, [categoriesMap]);

  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) return categoriesMap;
    const term = searchTerm.toLowerCase();
    const result: Record<string, VerifiedMetric[]> = {};

    for (const [catName, metrics] of Object.entries(categoriesMap)) {
      const matchingMetrics = metrics.filter(
        (m) =>
          m.metric.toLowerCase().includes(term) ||
          m.entity_a.toLowerCase().includes(term) ||
          m.entity_b.toLowerCase().includes(term)
      );
      if (matchingMetrics.length > 0) {
        result[catName] = matchingMetrics;
      }
    }
    return result;
  }, [categoriesMap, searchTerm]);

  const categoryMeta = useMemo(() => getCategoryMeta(category), [category]);
  const CategoryIcon = categoryMeta.icon;

  return (
    <div className="w-[580px] min-h-min h-auto bg-slate-900/95 border border-slate-800/90 rounded-2xl p-5 shadow-2xl flex flex-col text-slate-100 backdrop-blur-xl relative overflow-hidden transition-all duration-200">
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
                {allMetricsCount} {allMetricsCount === 1 ? 'Data Point' : 'Data Points'}
              </span>
            </div>
            <h3 className="font-bold text-base tracking-tight text-white mt-0.5 whitespace-normal break-words">
              {title}
            </h3>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-lg border border-slate-800 shrink-0">
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

      {/* Visual Image Strip */}
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
                  {i === 0 ? entityAName : entityBName}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Search & Filter */}
      {allMetricsCount > 5 && (
        <div className="relative z-10 mb-2.5">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Filter ${allMetricsCount} dynamic metrics...`}
              className="w-full bg-slate-950/60 border border-slate-800/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500/50"
            />
          </div>
        </div>
      )}

      {/* Entity Columns Subheader */}
      <div className="relative z-10 grid grid-cols-12 gap-2 px-3 py-2 rounded-lg bg-slate-950/80 border border-slate-800/90 text-xs font-semibold uppercase tracking-wider mb-2">
        <div className="col-span-4 text-slate-400">Metric / Attribute</div>
        <div className="col-span-4 text-sky-400 flex items-center gap-1 whitespace-normal break-words">
          <span className="w-2 h-2 rounded-full bg-sky-400 shrink-0" />
          <span>{entityAName}</span>
        </div>
        <div className="col-span-4 text-indigo-400 flex items-center gap-1 whitespace-normal break-words">
          <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" />
          <span>{entityBName}</span>
        </div>
      </div>

      {/* Main Dynamic Table Loop with Full Word Wrapping */}
      <div className="relative z-10 flex-1 space-y-2 rounded-xl border border-slate-800/80 bg-slate-950/50 p-1">
        {Object.keys(filteredCategories).length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
            <HelpCircle className="w-6 h-6 text-slate-600" />
            <span>No matching comparison points found</span>
          </div>
        ) : (
          Object.entries(filteredCategories).map(([categoryName, metrics]) => (
            <div key={categoryName} className="rounded-lg bg-slate-900/60 border border-slate-800/60 overflow-hidden">
              <div className="px-3 py-1.5 bg-slate-950/70 border-b border-slate-800/60 text-[11px] font-bold text-slate-300 flex items-center justify-between whitespace-normal break-words">
                <span>{categoryName}</span>
                <span className="text-[10px] font-mono text-slate-500 ml-2 shrink-0">({metrics.length})</span>
              </div>

              <div className="divide-y divide-slate-800/40">
                {viewMode === 'table'
                  ? metrics.map((m, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-12 gap-2 p-2.5 text-xs hover:bg-slate-800/40 transition-colors items-start"
                      >
                        <div className="col-span-4 font-medium text-slate-200 pr-1 flex items-start gap-1.5 whitespace-normal break-words leading-relaxed">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-600 shrink-0 mt-1.5" />
                          <span>{m.metric}</span>
                        </div>
                        <div className="col-span-4 pr-1 text-slate-300 font-medium leading-relaxed whitespace-normal break-words">
                          {renderValueWithFallback(m.entity_a)}
                        </div>
                        <div className="col-span-4 text-slate-300 font-medium leading-relaxed whitespace-normal break-words">
                          {renderValueWithFallback(m.entity_b)}
                        </div>
                      </div>
                    ))
                  : metrics.map((m, idx) => {
                      const valA = parseNumericValue(m.entity_a);
                      const valB = parseNumericValue(m.entity_b);
                      const hasNumeric = valA !== null && valB !== null && (valA > 0 || valB > 0);

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
                          className="p-3 text-xs hover:bg-slate-800/40 transition-colors flex flex-col gap-1.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-slate-200 whitespace-normal break-words">{m.metric}</span>
                            {hasNumeric && (
                              <span className="text-[10px] text-slate-400 font-mono shrink-0">
                                {pctA}% vs {pctB}%
                              </span>
                            )}
                          </div>

                          {hasNumeric ? (
                            <div className="space-y-1">
                              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
                                <div
                                  style={{ width: `${pctA}%` }}
                                  className={`${categoryMeta.barA} transition-all duration-500`}
                                />
                                <div
                                  style={{ width: `${pctB}%` }}
                                  className={`${categoryMeta.barB} transition-all duration-500`}
                                />
                              </div>
                              <div className="flex items-start justify-between text-[11px] gap-2 pt-0.5">
                                <span className="text-sky-300 font-medium whitespace-normal break-words leading-relaxed flex-1">
                                  {m.entity_a}
                                </span>
                                <span className="text-indigo-300 font-medium whitespace-normal break-words leading-relaxed flex-1 text-right">
                                  {m.entity_b}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-2 pt-1">
                              <div className="p-2 rounded bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 whitespace-normal break-words leading-relaxed">
                                <span className="block text-[10px] text-sky-400 font-medium mb-0.5">{entityAName}:</span>
                                {renderValueWithFallback(m.entity_a)}
                              </div>
                              <div className="p-2 rounded bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 whitespace-normal break-words leading-relaxed">
                                <span className="block text-[10px] text-indigo-400 font-medium mb-0.5">{entityBName}:</span>
                                {renderValueWithFallback(m.entity_b)}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
              </div>
            </div>
          ))
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
            <p className="text-xs text-slate-300 leading-relaxed whitespace-normal break-words">
              {verdictSummary}
            </p>
          </div>
        </div>
      )}
    </div>
  );
});
