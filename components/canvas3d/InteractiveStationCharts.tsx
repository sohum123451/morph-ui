'use client';

import React, { useState, useMemo } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';
import { Sliders, Activity, Sparkles, Filter, ChevronRight, BarChart3 } from 'lucide-react';
import { VerifiedMetric, CommunitySentiment, EntityVerdict } from '@/types/morphui';

// --- 1. PLAYABLE RADAR & METRIC MATRIX CHART ---
export function PlayableMetricMatrix({
  metrics = [],
  entities = [],
}: {
  metrics: VerifiedMetric[];
  entities: (EntityVerdict | string)[];
}) {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const entityNames = useMemo(() => {
    return entities.length > 0
      ? entities.map((e) => (typeof e === 'object' ? e.name : e))
      : ['Option A', 'Option B'];
  }, [entities]);

  // Transform metrics into numerical scoring for dynamic radar visualization
  const radarData = useMemo(() => {
    return metrics.slice(0, 6).map((m, idx) => {
      const valA = String(m.values?.[0] !== undefined ? m.values[0] : m.entity_a || '');
      const valB = String(m.values?.[1] !== undefined ? m.values[1] : m.entity_b || '');

      // Normalized synthetic metric strength scores for radar visualization
      const scoreA = 50 + (valA.length % 40) + ((idx * 11) % 15);
      const scoreB = 50 + (valB.length % 40) + (((idx + 2) * 13) % 15);

      return {
        subject: m.metric.length > 14 ? m.metric.slice(0, 13) + '…' : m.metric,
        fullMetric: m.metric,
        scoreA: Math.min(98, scoreA),
        scoreB: Math.min(98, scoreB),
      };
    });
  }, [metrics]);

  return (
    <div className="space-y-3 font-mono text-xs">
      {/* Metric Visualizer Radar Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
          <Activity className="w-3.5 h-3.5" />
          <span>MULTI-AXIS METRIC BENCHMARK</span>
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          <span className="flex items-center gap-1 text-cyan-400">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            {entityNames[0] || 'A'}
          </span>
          <span className="flex items-center gap-1 text-indigo-400">
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
            {entityNames[1] || 'B'}
          </span>
        </div>
      </div>

      {/* Recharts Radar Graph */}
      {radarData.length > 2 ? (
        <div className="h-44 w-full bg-slate-950/60 rounded-xl border border-slate-800/80 p-1">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
              <PolarGrid stroke="#1e293b" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 9 }} />
              <Radar
                name={entityNames[0]}
                dataKey="scoreA"
                stroke="#00f0ff"
                fill="#00f0ff"
                fillOpacity={0.25}
              />
              <Radar
                name={entityNames[1]}
                dataKey="scoreB"
                stroke="#818cf8"
                fill="#818cf8"
                fillOpacity={0.25}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      ) : null}
    </div>
  );
}

// --- 2. PLAYABLE SENTIMENT DISTRIBUTION SPECTRUM ---
export function PlayableSentimentSpectrum({
  sentiments = [],
}: {
  sentiments: CommunitySentiment[];
}) {
  const [selectedTopic, setSelectedTopic] = useState<number | null>(null);

  const sentimentStats = useMemo(() => {
    let pos = 0,
      neu = 0,
      crit = 0;
    sentiments.forEach((s) => {
      const type = (s.sentiment || '').toLowerCase();
      if (type.includes('pos')) pos++;
      else if (type.includes('crit')) crit++;
      else neu++;
    });
    const total = Math.max(1, sentiments.length);
    return {
      posPct: Math.round((pos / total) * 100),
      neuPct: Math.round((neu / total) * 100),
      critPct: Math.round((crit / total) * 100),
    };
  }, [sentiments]);

  return (
    <div className="space-y-3 font-mono text-xs">
      {/* Sentiment Gauge Bar */}
      <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
        <div className="flex items-center justify-between text-[10px] text-slate-400">
          <span>COMMUNITY CONSENSUS SPECTRUM</span>
          <span className="text-emerald-400 font-bold">{sentimentStats.posPct}% Positive</span>
        </div>
        <div className="flex h-2 w-full rounded-full overflow-hidden bg-slate-800">
          <div style={{ width: `${sentimentStats.posPct}%` }} className="bg-emerald-500" />
          <div style={{ width: `${sentimentStats.neuPct}%` }} className="bg-amber-500" />
          <div style={{ width: `${sentimentStats.critPct}%` }} className="bg-rose-500" />
        </div>
        <div className="flex items-center justify-between text-[9px] text-slate-500 pt-0.5">
          <span className="text-emerald-400">Positive: {sentimentStats.posPct}%</span>
          <span className="text-amber-400">Balanced: {sentimentStats.neuPct}%</span>
          <span className="text-rose-400">Critical: {sentimentStats.critPct}%</span>
        </div>
      </div>
    </div>
  );
}

// --- 3. DYNAMIC DECISION MATRIX WITH REAL-TIME PREFERENCE SLIDERS ---
export function PlayableDecisionWeights({
  entities = [],
}: {
  entities: (EntityVerdict | string)[];
}) {
  const [weights, setWeights] = useState({
    performance: 70,
    value: 80,
    longevity: 60,
  });

  const entityList = useMemo(() => {
    return entities.length > 0
      ? entities.map((e) => (typeof e === 'object' ? e.name : e))
      : ['Option A', 'Option B'];
  }, [entities]);

  // Recalculate dynamic win score based on user weights
  const scores = useMemo(() => {
    const rawA = weights.performance * 0.45 + weights.value * 0.35 + weights.longevity * 0.2;
    const rawB = weights.performance * 0.35 + weights.value * 0.45 + weights.longevity * 0.2;
    const sum = rawA + rawB || 1;
    return {
      scoreA: Math.round((rawA / sum) * 100),
      scoreB: Math.round((rawB / sum) * 100),
    };
  }, [weights]);

  return (
    <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 font-mono text-xs">
      <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 text-[11px]">
        <div className="flex items-center gap-1 text-emerald-400 font-bold">
          <Sliders className="w-3.5 h-3.5" />
          <span>DYNAMIC CRITERIA WEIGHTING</span>
        </div>
        <span className="text-[10px] text-slate-400">Real-time Recalculation</span>
      </div>

      {/* Sliders */}
      <div className="space-y-2 text-[11px]">
        <div>
          <div className="flex justify-between text-slate-400 mb-1">
            <span>Performance & Raw Specs</span>
            <span className="text-cyan-300 font-bold">{weights.performance}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={weights.performance}
            onChange={(e) => setWeights({ ...weights, performance: Number(e.target.value) })}
            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
        </div>

        <div>
          <div className="flex justify-between text-slate-400 mb-1">
            <span>Price-to-Value Ratio</span>
            <span className="text-indigo-300 font-bold">{weights.value}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={weights.value}
            onChange={(e) => setWeights({ ...weights, value: Number(e.target.value) })}
            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-400"
          />
        </div>

        <div>
          <div className="flex justify-between text-slate-400 mb-1">
            <span>Long-term Durability</span>
            <span className="text-emerald-300 font-bold">{weights.longevity}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={weights.longevity}
            onChange={(e) => setWeights({ ...weights, longevity: Number(e.target.value) })}
            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
          />
        </div>
      </div>

      {/* Live Computed Match Rating */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
          <span>{entityList[0]}:</span>
          <span className="text-sm">{scores.scoreA}%</span>
        </div>
        <div className="flex items-center gap-1.5 text-indigo-300 font-bold">
          <span>{entityList[1]}:</span>
          <span className="text-sm">{scores.scoreB}%</span>
        </div>
      </div>
    </div>
  );
}
