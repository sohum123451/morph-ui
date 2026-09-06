'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback, memo } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import {
  Search,
  Scale,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  MessageSquare,
  Network,
  Maximize2,
  FileSpreadsheet,
  Award,
  Layers,
  ArrowLeftRight,
  ThumbsUp,
  AlertTriangle,
  History as HistoryIcon,
  Plus,
  Trash2,
  X,
  FileText,
  Loader2,
  Mic,
  MicOff,
  ImagePlus,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  ChevronsUpDown,
  Printer,
  Share2,
  Eye,
} from 'lucide-react';
import { ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  Node,
  Edge,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const Flow = ReactFlow as any;
const FlowProvider = ReactFlowProvider as any;
const FlowBackground = Background as any;
const FlowControls = Controls as any;
const FlowHandle = Handle as any;


import {
    VerifiedMetric,
  CommunitySentiment,
  GenerativeComparisonResponse,
  EntityVerdict,
} from '@/types/morphui';

type MorphTheme = 'dark' | 'light' | 'botanical' | 'pink';

const THEME_STYLES: Record<MorphTheme, {
  bg: string;
  card: string;
  cardInner: string;
  nav: string;
  input: string;
  tableHeader: string;
  tableRow: string;
  tableSection: string;
  badge: string;
  badgeSecondary: string;
  subtext: string;
  title: string;
  btnSecondary: string;
  pillActive: string;
  pillInactive: string;
  accentText: string;
  footer: string;
  sidebar: string;
  canvasBg: string;
  canvasDotColor: string;
}> = {
  dark: {
    bg: 'bg-[#0B0F17] text-slate-100 selection:bg-slate-800 selection:text-white',
    card: 'bg-[#111827]/90 border border-slate-800/90 text-slate-100 shadow-xl shadow-black/20 backdrop-blur-md',
    cardInner: 'bg-[#0B0F17]/80 border border-slate-800/80 text-slate-300',
    nav: 'bg-[#0B0F17]/90 border-b border-slate-800/80 text-white backdrop-blur-xl shadow-sm',
    input: 'bg-[#0B0F17] border border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500/40 focus:outline-none caret-sky-400',
    tableHeader: 'bg-slate-900/95 text-slate-300 border-b border-slate-800',
    tableRow: 'hover:bg-slate-800/40 border-b border-slate-800/60',
    tableSection: 'bg-slate-950/70 hover:bg-slate-950/90 border-t border-slate-800',
    badge: 'bg-slate-800 text-sky-400 border border-slate-700',
    badgeSecondary: 'bg-slate-800 text-slate-400 border border-slate-700',
    subtext: 'text-slate-400',
    title: 'text-white',
    btnSecondary: 'bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white',
    pillActive: 'bg-slate-800 text-sky-400 shadow-sm border border-slate-700 font-semibold',
    pillInactive: 'text-slate-400 hover:text-slate-200',
    accentText: 'text-sky-400',
    footer: 'border-t border-slate-800/80 bg-slate-900/40 text-slate-500',
    sidebar: 'bg-slate-900 border-r border-slate-800 text-slate-100',
    canvasBg: '#030712',
    canvasDotColor: '#1e293b',
  },
  light: {
    bg: 'bg-[#F8FAFC] text-slate-900 selection:bg-sky-100 selection:text-slate-900',
    card: 'bg-white border border-slate-200/90 text-slate-900 shadow-xl shadow-slate-200/50 backdrop-blur-md',
    cardInner: 'bg-slate-50 border border-slate-200 text-slate-800',
    nav: 'bg-white/95 border-b border-slate-200/90 text-slate-900 backdrop-blur-xl shadow-sm',
    input: 'bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30 focus:bg-white focus:outline-none caret-sky-600',
    tableHeader: 'bg-slate-100/90 text-slate-700 border-b border-slate-200',
    tableRow: 'hover:bg-slate-50/90 border-b border-slate-200/80',
    tableSection: 'bg-slate-100/80 hover:bg-slate-200/60 border-t border-slate-200',
    badge: 'bg-sky-50 text-sky-700 border border-sky-200',
    badgeSecondary: 'bg-slate-100 text-slate-600 border border-slate-200',
    subtext: 'text-slate-600',
    title: 'text-slate-900',
    btnSecondary: 'bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 shadow-xs',
    pillActive: 'bg-white text-slate-900 shadow-sm border border-slate-300 font-bold',
    pillInactive: 'text-slate-500 hover:text-slate-800',
    accentText: 'text-sky-600',
    footer: 'border-t border-slate-200 bg-white/80 text-slate-500',
    sidebar: 'bg-white border-r border-slate-200 text-slate-900',
    canvasBg: '#f1f5f9',
    canvasDotColor: '#cbd5e1',
  },
  botanical: {
    bg: 'bg-[#061e16] text-emerald-100 selection:bg-emerald-800 selection:text-white',
    card: 'bg-[#0a2f23]/95 border border-emerald-800/70 text-emerald-100 shadow-xl shadow-emerald-950/60 backdrop-blur-md',
    cardInner: 'bg-[#062219]/90 border border-emerald-900/60 text-emerald-200',
    nav: 'bg-[#061e16]/95 border-b border-emerald-800/80 text-emerald-100 backdrop-blur-xl shadow-sm',
    input: 'bg-[#062219] border border-emerald-800/60 text-emerald-100 placeholder:text-emerald-400/50 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30 focus:outline-none',
    tableHeader: 'bg-[#08281e] text-emerald-200 border-b border-emerald-800/60',
    tableRow: 'hover:bg-[#0c382a]/50 border-b border-emerald-900/50',
    tableSection: 'bg-[#07251c] hover:bg-[#0a3327] border-t border-emerald-800/60',
    badge: 'bg-emerald-900/70 text-emerald-300 border border-emerald-700',
    badgeSecondary: 'bg-emerald-950 text-emerald-400 border border-emerald-800',
    subtext: 'text-emerald-300/80',
    title: 'text-emerald-50',
    btnSecondary: 'bg-[#0a2f23] hover:bg-[#0e3d2e] border border-emerald-800/70 text-emerald-200 hover:text-white',
    pillActive: 'bg-emerald-700 text-white shadow-sm border border-emerald-600 font-semibold',
    pillInactive: 'text-emerald-300/70 hover:text-emerald-100',
    accentText: 'text-emerald-400',
    footer: 'border-t border-emerald-900/80 bg-[#061e16]/80 text-emerald-400/60',
    sidebar: 'bg-[#0a2f23] border-r border-emerald-800 text-emerald-100',
    canvasBg: '#03150e',
    canvasDotColor: '#064e3b',
  },
  pink: {
    bg: 'bg-[#0f0714] text-pink-50 selection:bg-pink-500 selection:text-white',
    card: 'bg-[#1a0c24]/95 border border-pink-900/50 text-pink-50 shadow-xl shadow-pink-950/50 backdrop-blur-md',
    cardInner: 'bg-[#12071a]/90 border border-pink-950/60 text-pink-200',
    nav: 'bg-[#0f0714]/95 border-b border-pink-900/60 text-pink-50 backdrop-blur-xl shadow-sm',
    input: 'bg-[#12071a] border border-pink-900/60 text-pink-50 placeholder:text-pink-400/50 focus:border-pink-500 focus:ring-1 focus:ring-pink-500/30 focus:outline-none',
    tableHeader: 'bg-[#200f2d] text-pink-200 border-b border-pink-900/50',
    tableRow: 'hover:bg-[#281338]/50 border-b border-pink-950/50',
    tableSection: 'bg-[#1c0d27] hover:bg-[#251134] border-t border-pink-900/50',
    badge: 'bg-pink-950/80 text-pink-300 border border-pink-800',
    badgeSecondary: 'bg-pink-950 text-pink-400 border border-pink-900',
    subtext: 'text-pink-300/80',
    title: 'text-pink-50',
    btnSecondary: 'bg-[#1a0c24] hover:bg-[#251134] border border-pink-900/60 text-pink-200 hover:text-white',
    pillActive: 'bg-pink-600 text-white shadow-sm border border-pink-500 font-semibold',
    pillInactive: 'text-pink-300/70 hover:text-pink-100',
    accentText: 'text-pink-400',
    footer: 'border-t border-pink-950 bg-[#0f0714]/80 text-pink-400/60',
    sidebar: 'bg-[#1a0c24] border-r border-pink-900 text-pink-50',
    canvasBg: '#0a030e',
    canvasDotColor: '#3b0764',
  },
};

interface UploadedVisual {
  data: string; // base64 string
  mimeType: string;
  name: string;
  previewUrl: string;
}

const ENTITY_BADGES = [
  { bg: 'bg-sky-500/10 text-sky-400 border-sky-500/20', dot: 'bg-sky-400', text: 'text-sky-400', label: 'Option A' },
  { bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', dot: 'bg-indigo-400', text: 'text-indigo-400', label: 'Option B' },
  { bg: 'bg-purple-500/10 text-purple-400 border-purple-500/20', dot: 'bg-purple-400', text: 'text-purple-400', label: 'Option C' },
  { bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-400', text: 'text-emerald-400', label: 'Option D' },
  { bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20', dot: 'bg-amber-400', text: 'text-amber-400', label: 'Option E' },
];

function isMissingValue(val: any): boolean {
  if (val === null || val === undefined) return true;
  const str = String(val).trim();
  if (!str) return true;
  return /^(n\/?a|not specified.*|none|null|-|unknown)$/i.test(str);
}

function renderValueWithFallback(val: any, fallbackText = 'Add specification...') {
  if (isMissingValue(val)) {
    return (
      <span className="inline-flex items-center gap-1 text-slate-400 italic text-xs bg-slate-800/30 px-2 py-0.5 rounded border border-slate-700/40 hover:border-sky-500/50 transition-colors cursor-text">
        <span>+ {fallbackText}</span>
      </span>
    );
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

// ============================================================================
// SPATIAL CANVAS NODES (Responsive, Auto-Sizing, Full Word-Wrap)
// ============================================================================

const SpecMatrixNode = memo(function SpecMatrixNode({ data }: any) {
  const { entities = [], category, metrics = [] } = data;
  const entityList: string[] = entities.length > 0 ? entities.map((e: any) => typeof e === 'object' ? e.name : e) : [data.entityA || 'Option A', data.entityB || 'Option B'];

  return (
    <div className="w-[340px] sm:w-[440px] min-h-min h-auto bg-slate-900/95 border border-slate-700/80 hover:border-sky-500/70 hover:shadow-sky-500/20 rounded-2xl p-4 sm:p-5 shadow-2xl text-slate-100 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] group">
      <div className="flex items-center gap-2 mb-1">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
        <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Live Matrix Stream</span>
      </div>
      <FlowHandle type="target" position={Position.Left} className="!bg-sky-500 !w-3 !h-3 !border-2 !border-slate-900" />
      <FlowHandle type="source" position={Position.Right} className="!bg-sky-500 !w-3 !h-3 !border-2 !border-slate-900" />
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-white">Verified Spec Matrix</h4>
            <span className="text-[10px] text-slate-400 font-mono whitespace-normal break-words">{category}</span>
          </div>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-sky-300 font-mono border border-slate-700 shrink-0">
          Node 1
        </span>
      </div>

      <div className="flex items-center divide-x divide-slate-800/80 text-[10px] uppercase font-mono text-slate-400 pb-1.5 border-b border-slate-800/60">
        <div className="w-28 shrink-0 pr-2">Metric</div>
        {entityList.map((name, i) => (
          <div key={i} className="flex-1 px-1.5 truncate text-sky-300 font-semibold">{name}</div>
        ))}
      </div>

      <div className="divide-y divide-slate-800/60 text-xs">
        {metrics.slice(0, 7).map((m: VerifiedMetric, idx: number) => (
          <div key={idx} className="flex items-start divide-x divide-slate-800/40 py-2">
            <div className="w-28 shrink-0 pr-2 text-slate-300 font-medium text-[11px] whitespace-normal break-words">
              {m.metric}
            </div>
            {entityList.map((_, i) => {
              const val = m.values?.[i] !== undefined ? m.values[i] : (i === 0 ? m.entity_a : m.entity_b);
              return (
                <div key={i} className="flex-1 px-1.5 text-slate-100 text-[11px] whitespace-normal break-words">
                  {renderValueWithFallback(val)}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
});

const SentimentBreakdownNode = memo(function SentimentBreakdownNode({ data }: any) {
  const { entities = [], sentiments = [] } = data;
  const entityList: string[] = entities.length > 0 ? entities.map((e: any) => typeof e === 'object' ? e.name : e) : [data.entityA || 'Option A', data.entityB || 'Option B'];

  return (
    <div className="w-[340px] sm:w-[460px] min-h-min h-auto bg-slate-900/95 border border-slate-700/80 hover:border-indigo-500/70 hover:shadow-indigo-500/20 rounded-2xl p-4 sm:p-5 shadow-2xl text-slate-100 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] group">
      <div className="flex items-center gap-2 mb-1">
        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse shrink-0" />
        <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">De-Biasing Pipeline</span>
      </div>
      <FlowHandle type="target" position={Position.Left} className="!bg-indigo-500 !w-3 !h-3 !border-2 !border-slate-900" />
      <FlowHandle type="source" position={Position.Right} className="!bg-indigo-500 !w-3 !h-3 !border-2 !border-slate-900" />
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-white">De-Biased Reddit Sentiment</h4>
            <span className="text-[10px] text-slate-400 font-mono">Consensus normalization</span>
          </div>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono border border-slate-700 shrink-0">
          Node 2
        </span>
      </div>

      <div className="space-y-3">
        {sentiments.slice(0, 4).map((s: CommunitySentiment, idx: number) => (
          <div key={idx} className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-200 whitespace-normal break-words">{s.topic}</span>
              <span
                className={`text-[9px] uppercase font-mono px-1.5 py-0.5 rounded ${
                  s.sentiment === 'Positive'
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/80'
                    : s.sentiment === 'Critical'
                    ? 'bg-rose-950/80 text-rose-300 border border-rose-800/80'
                    : 'bg-amber-950/80 text-amber-300 border border-amber-800/80'
                }`}
              >
                {s.sentiment || 'Consensus'}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300">
              {entityList.map((name, i) => {
                const con = s.consensuses?.[i] !== undefined ? s.consensuses[i] : (i === 0 ? s.entity_a_consensus : s.entity_b_consensus);
                return (
                  <div key={i} className="p-2 rounded bg-slate-900/60 border border-slate-800/60 whitespace-normal break-words">
                    <span className="text-[10px] font-mono text-indigo-400 block mb-0.5">{name}:</span>
                    {renderValueWithFallback(con)}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

const LedgerNode = memo(function LedgerNode({ data }: any) {
  const { entities = [], metrics = [] } = data;
  const entityList: string[] = entities.length > 0 ? entities.map((e: any) => typeof e === 'object' ? e.name : e) : [data.entityA || 'Option A', data.entityB || 'Option B'];

  return (
    <div className="w-[300px] sm:w-[380px] min-h-min h-auto bg-slate-900/95 border border-slate-700/80 hover:border-purple-500/70 hover:shadow-purple-500/20 rounded-2xl p-4 sm:p-5 shadow-2xl text-slate-100 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] group">
      <div className="flex items-center gap-2 mb-1">
        <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse shrink-0" />
        <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Ledger State</span>
      </div>
      <FlowHandle type="target" position={Position.Left} className="!bg-purple-500 !w-3 !h-3 !border-2 !border-slate-900" />
      <FlowHandle type="source" position={Position.Right} className="!bg-purple-500 !w-3 !h-3 !border-2 !border-slate-900" />
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-white">Delta Ledger</h4>
            <span className="text-[10px] text-slate-400 font-mono">Normalized attributes</span>
          </div>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-purple-300 font-mono border border-slate-700 shrink-0">
          Node 3
        </span>
      </div>

      <div className="space-y-2">
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-center">
          <span className="text-2xl font-black text-purple-400 font-mono block">{metrics.length}</span>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Total Verified Fields</span>
        </div>
        <div className="space-y-1 text-xs text-slate-300">
          {entityList.map((name, i) => (
            <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-950/40 border border-slate-800/40">
              <span className="font-medium text-purple-300 truncate">{name}</span>
              <span className="text-[10px] text-emerald-400 font-mono">Verified Baseline</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

const VerdictNode = memo(function VerdictNode({ data }: any) {
  const { entities = [], verdictSummary } = data;
  const entityList: string[] = entities.length > 0 ? entities.map((e: any) => typeof e === 'object' ? e.name : e) : [data.entityA || 'Option A', data.entityB || 'Option B'];

  return (
    <div className="w-[340px] sm:w-[480px] min-h-min h-auto bg-slate-900/95 border border-slate-700/80 hover:border-emerald-500/70 hover:shadow-emerald-500/20 rounded-2xl p-4 sm:p-5 shadow-2xl text-slate-100 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] group">
      <div className="flex items-center gap-2 mb-1">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
        <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Synthesis Engine</span>
      </div>
      <FlowHandle type="target" position={Position.Left} className="!bg-emerald-500 !w-3 !h-3 !border-2 !border-slate-900" />
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-white">Executive Verdict</h4>
            <span className="text-[10px] text-slate-400 font-mono">AI Dual-Engine Synthesis</span>
          </div>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-emerald-300 font-mono border border-slate-700 shrink-0">
          Node 4
        </span>
      </div>

      <p className="text-xs text-slate-200 leading-relaxed bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 mb-3.5 whitespace-normal break-words">
        {verdictSummary}
      </p>

      <div className="space-y-2">
        {entities.map((ent: any, idx: number) => {
          const name = typeof ent === 'object' ? ent.name : entityList[idx] || `Entity ${idx + 1}`;
          const pros = Array.isArray(ent?.pros) && ent.pros.length > 0 ? ent.pros : [`Optimal domain use cases for ${name}`];
          const badge = ENTITY_BADGES[idx % ENTITY_BADGES.length];

          return (
            <div key={idx} className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
              <span className={`text-[10px] font-bold uppercase font-mono ${badge.text} block`}>
                Choose {name} if:
              </span>
              <ul className="space-y-1 text-[11px] text-slate-300">
                {pros.map((p: string, pIdx: number) => (
                  <li key={pIdx} className="flex items-start gap-1.5 whitespace-normal break-words leading-relaxed">
                    <span className={`w-1.5 h-1.5 rounded-full ${badge.dot} shrink-0 mt-1`} />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
});

const nodeTypes = {
  spec_matrix: SpecMatrixNode,
  sentiment_breakdown: SentimentBreakdownNode,
  ledger_node: LedgerNode,
  verdict_node: VerdictNode,
};

// ============================================================================
// SPATIAL CANVAS WORKSPACE COMPONENT
// ============================================================================

interface SpatialCanvasViewProps {
  entities: EntityVerdict[];
  category: string;
  verifiedMetrics: VerifiedMetric[];
  communitySentiment: CommunitySentiment[];
  verdictSummary: string;
  theme?: MorphTheme;
}

function SpatialCanvasWorkspace({
  entities = [],
  category,
  verifiedMetrics,
  communitySentiment,
  verdictSummary,
  theme = 'dark',
}: SpatialCanvasViewProps) {
  const currentTheme = THEME_STYLES[theme] || THEME_STYLES.dark;
  const { fitView } = useReactFlow();

  const generatedNodes: Node[] = useMemo(() => {
    return [
      {
        id: 'node-spec-matrix',
        type: 'spec_matrix',
        position: { x: 50, y: 140 },
        data: {
          entities,
          category,
          metrics: verifiedMetrics,
        },
      },
      {
        id: 'node-sentiment',
        type: 'sentiment_breakdown',
        position: { x: 520, y: 140 },
        data: {
          entities,
          sentiments: communitySentiment,
        },
      },
      {
        id: 'node-ledger',
        type: 'ledger_node',
        position: { x: 1020, y: 140 },
        data: {
          entities,
          metrics: verifiedMetrics,
        },
      },
      {
        id: 'node-verdict',
        type: 'verdict_node',
        position: { x: 1460, y: 140 },
        data: {
          entities,
          verdictSummary,
        },
      },
    ];
  }, [entities, category, verifiedMetrics, communitySentiment, verdictSummary]);

  const generatedEdges: Edge[] = useMemo(() => {
    return [
      {
        id: 'edge-1-2',
        source: 'node-spec-matrix',
        target: 'node-sentiment',
        animated: true,
        style: { stroke: '#38bdf8', strokeWidth: 2 },
      },
      {
        id: 'edge-2-3',
        source: 'node-sentiment',
        target: 'node-ledger',
        animated: true,
        style: { stroke: '#818cf8', strokeWidth: 2 },
      },
      {
        id: 'edge-3-4',
        source: 'node-ledger',
        target: 'node-verdict',
        animated: true,
        style: { stroke: '#34d399', strokeWidth: 2 },
      },
    ];
  }, []);

  const [nodes, setNodes, onNodesChange] = useNodesState(generatedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(generatedEdges);

  useEffect(() => {
    setNodes(generatedNodes);
    setEdges(generatedEdges);
    setTimeout(() => {
      fitView({ padding: 0.2, duration: 600 });
    }, 150);
  }, [generatedNodes, generatedEdges, setNodes, setEdges, fitView]);

  const handleAutoLayout = useCallback(() => {
    fitView({ padding: 0.2, duration: 500 });
  }, [fitView]);

  return (
    <div
      style={{ backgroundColor: currentTheme.canvasBg }}
      className="relative w-full h-[60vh] sm:h-[70vh] md:h-[calc(100vh-140px)] min-h-[480px] rounded-2xl border border-slate-800/90 overflow-hidden shadow-2xl transition-colors duration-300"
    >
      <div className={`absolute top-3 left-3 sm:top-4 sm:left-4 z-10 flex flex-wrap items-center gap-2 ${currentTheme.card} p-1.5 rounded-xl shadow-lg text-xs`}>
        <div className={`flex items-center gap-1.5 px-2 py-1 ${currentTheme.accentText} font-semibold border-r border-slate-700/50`}>
          <Network className="w-3.5 h-3.5" />
          <span>Spatial Graph</span>
        </div>
        <button
          type="button"
          onClick={handleAutoLayout}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${currentTheme.btnSecondary} transition-all font-medium active:scale-95`}
          title="Reset Zoom & Auto-Center Graph"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span>Auto Center</span>
        </button>
      </div>

      <Flow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
        minZoom={0.2}
        maxZoom={1.8}
      >
        <FlowBackground variant={BackgroundVariant.Dots} gap={20} size={1} color={currentTheme.canvasDotColor} />
        <FlowControls className="!bg-slate-900 !border-slate-800 !text-slate-100 !rounded-xl !overflow-hidden !shadow-lg" />
      </Flow>
    </div>
  );
}

// ============================================================================
// COMPARISON SKELETON
// ============================================================================

function ComparisonSkeleton({ prompt, viewMode, theme = 'dark' }: { prompt: string; viewMode: 'spec' | 'canvas'; theme?: MorphTheme }) {
  const t = THEME_STYLES[theme] || THEME_STYLES.dark;

  if (viewMode === 'canvas') {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className={`w-full h-[65vh] min-h-[500px] ${t.card} rounded-2xl flex flex-col items-center justify-center space-y-4 p-8 text-center`}>
          <Loader2 className="w-10 h-10 text-sky-400 animate-spin" />
          <div className="space-y-2">
            <h3 className={`text-base font-bold ${t.title}`}>Building Spatial Graph Model...</h3>
            <p className={`text-xs ${t.subtext} font-mono`}>Extracting entities & connecting structural consensus nodes</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-pulse">
      <div className={`p-6 sm:p-8 rounded-2xl ${t.card} space-y-6`}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-700/40">
          <div className="space-y-2.5 w-full sm:w-1/3">
            <div className="h-4 w-24 bg-sky-500/20 rounded-md" />
            <div className="h-8 w-48 bg-slate-700/40 rounded-xl" />
          </div>
          <div className="w-12 h-12 rounded-full bg-slate-800/60 flex items-center justify-center shrink-0">
            <Loader2 className="w-5 h-5 text-sky-400 animate-spin" />
          </div>
          <div className="space-y-2.5 w-full sm:w-1/3 sm:text-right flex flex-col sm:items-end">
            <div className="h-4 w-24 bg-indigo-500/20 rounded-md" />
            <div className="h-8 w-48 bg-slate-700/40 rounded-xl" />
          </div>
        </div>

        <div className="space-y-3">
          <div className="h-5 w-44 bg-slate-700/40 rounded-md" />
          <div className="h-20 w-full bg-slate-800/30 rounded-xl" />
        </div>
      </div>

      <div className={`p-6 rounded-2xl ${t.card} space-y-4`}>
        <div className="h-6 w-56 bg-slate-700/40 rounded-md" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 w-full bg-slate-800/30 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT WITH FULL THEME & DUAL-ENGINE CAPABILITIES
// ============================================================================


// ============================================================================
// CLIENT-SIDE PARAMETRIC FALLBACK DICTIONARY FOR CUSTOM METRICS
// ============================================================================

const CUSTOM_METRIC_FALLBACKS: Record<string, Record<string, { entityA: string; entityB: string }>> = {
  'IIT Bombay vs IIT Delhi': {
    'Hostel Infrastructure & Facilities': {
      entityA: 'H1-H18 hostels, Powai lake views, recently upgraded gigabit LAN & common rooms',
      entityB: 'Aravali, Nilgiri, Vindhyachal blocks, robust campus intranet & active recreational spaces',
    },
    'Research Publications & Patents': {
      entityA: '1,500+ annual research publications, 150+ patents filed, robust SINE incubator portfolio',
      entityB: '1,400+ annual research publications, 120+ patents filed, active FITT technology transfer hub',
    },
    'Alumni Venture Capital Density': {
      entityA: 'Extensive Silicon Valley & Indian startup founder density (Ola, Zepto, InMobi, Gupshup)',
      entityB: 'Strong capital-region startup access and tech leadership (Flipkart founders, Zomato early leadership)',
    },
    'Interdisciplinary Minors': {
      entityA: 'Minors in AI & Data Science, Management (SJMSOM), Entrepreneurship (DSSE), and Quantum Computing',
      entityB: 'Minors in Machine Intelligence (ScAI), Atmospheric Sciences, Robotics, and Public Policy',
    },
  },
  'Nike Pegasus 41 vs Adidas Ultraboost Light': {
    'Lacing System & Tongue Padding': {
      entityA: 'Plush padded tongue with Dynamic Fit midfoot webbing band for secure lockdown',
      entityB: 'Integrated eyelet cage with seamless Primeknit+ sock wrap and minimal tongue padding',
    },
    'Wet Weather Traction': {
      entityA: 'Waffle-pattern carbon rubber outsole providing reliable wet asphalt grip',
      entityB: 'Continental™ Better Rubber compound delivering class-leading wet road traction',
    },
    'Long-Run Arch Support': {
      entityA: 'Neutral structured arch support with balanced lateral and medial stability',
      entityB: 'Linear Energy Push (LEP) torsion system supporting natural heel-to-midfoot transitions',
    },
    'Lifespan in Miles': {
      entityA: '400 - 500 miles of high-mileage daily durability',
      entityB: '450 - 550 miles supported by Continental™ outsole longevity',
    },
  },
  'React vs Vue': {
    'State Management Libraries': {
      entityA: 'Redux Toolkit, Zustand, Jotai, Recoil, and native Context API',
      entityB: 'Pinia (official modular store) and Vuex 4 legacy support',
    },
    'Server-Side Rendering (SSR) DX': {
      entityA: 'Next.js App Router with React Server Components (RSC) and streaming HTML',
      entityB: 'Nuxt 3 with Nitro server engine, auto-imports, and universal SSR/SSG',
    },
    'Memory Allocation Benchmarks': {
      entityA: 'Virtual DOM tree allocation overhead with optimized Fiber garbage collection',
      entityB: 'Low memory footprint using fine-grained reactive getter/setter proxies without VDOM recreation',
    },
    'Community Packages': {
      entityA: '2.5M+ npm packages, largest web component UI libraries (Radix, Shadcn, MUI)',
      entityB: 'Curated ecosystem with official router, pinia, VueUse composables, and Vuetify/PrimeVue',
    },
  },
  'Apple vs Mango': {
    'Glycemic Index (GI)': {
      entityA: 'Low GI (~36) providing slow-release glucose and high satiety',
      entityB: 'Moderate GI (~51) delivering quick natural energy from natural fructose',
    },
    'Antioxidant Profile (ORAC)': {
      entityA: 'Rich in quercetin, catechin, chlorogenic acid, and anthocyanins in peel',
      entityB: 'High in mangiferin (super-antioxidant), beta-carotene, and gallic acid',
    },
    'Harvest Seasonality': {
      entityA: 'Autumn harvest (Aug-Nov), storability in controlled atmosphere for 6-9 months',
      entityB: 'Summer tropical harvest (April-July), peak aroma during warm season',
    },
    'Storage Temperature Requirements': {
      entityA: '0°C to 4°C with 90-95% humidity for multi-month crispness',
      entityB: '10°C to 13°C (chilling injury occurs below 10°C), room temp to ripen',
    },
  },
  'Sony WH-1000XM5 vs Bose QC Ultra': {
    'Microphone Wind Noise Suppression': {
      entityA: '8-mic array with AI beamforming noise reduction mesh structure',
      entityB: 'Wind block algorithm and dedicated mic filters for clear outdoor calls',
    },
    'Multipoint Bluetooth Switching': {
      entityA: 'Seamless simultaneous dual-device Bluetooth connection with LDAC priority toggle',
      entityB: 'Smooth Bluetooth 5.3 multipoint audio handoff via Bose Music app',
    },
    'App EQ Customization': {
      entityA: 'Sony Headphones Connect app with 5-band custom EQ + Clear Bass slider',
      entityB: 'Bose Music app with 3-band EQ (Bass, Mid, Treble) and preset immersion modes',
    },
    'Weight & Clamping Force': {
      entityA: '~250g lightweight chassis with moderate continuous clamping force',
      entityB: '~253g foldable luxury build with ultra-gentle zero-fatigue clamp pressure',
    },
  },
};

function getClientCustomMetricFallback(metric: string, entityA: string, entityB: string): { valA: string; valB: string } | null {
  const normMetric = metric.trim().toLowerCase();
  const eANorm = entityA.trim().toLowerCase();
  const eBNorm = entityB.trim().toLowerCase();

  for (const [pairKey, metricMap] of Object.entries(CUSTOM_METRIC_FALLBACKS)) {
    const [pA, pB] = pairKey.split(' vs ').map((s) => s.trim().toLowerCase());
    const isForwardMatch = (eANorm.includes(pA) || pA.includes(eANorm)) && (eBNorm.includes(pB) || pB.includes(eBNorm));
    const isReverseMatch = (eANorm.includes(pB) || pB.includes(eANorm)) && (eBNorm.includes(pA) || pA.includes(eBNorm));

    if (isForwardMatch || isReverseMatch) {
      for (const [mName, values] of Object.entries(metricMap)) {
        if (mName.toLowerCase().includes(normMetric) || normMetric.includes(mName.toLowerCase())) {
          return isForwardMatch
            ? { valA: values.entityA, valB: values.entityB }
            : { valA: values.entityB, valB: values.entityA };
        }
      }
    }
  }

  return null;
}

export default function MorphUIPage() {
  return <MorphUIContent />;
}

function MorphUIContent() {
  const { data: session, status: authStatus } = useSession();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comparisonData, setComparisonData] = useState<GenerativeComparisonResponse | null>(null);

  // View mode: 'spec' (Table view) vs 'canvas' (Spatial React Flow Graph)
  const [viewMode, setViewMode] = useState<'spec' | 'canvas'>('spec');

  // Interactive Table Utilities
  const [activeTab, setActiveTab] = useState<'verified' | 'community'>('verified');
  const [isSwapped, setIsSwapped] = useState(false);
  const [highlightDiff, setHighlightDiff] = useState(false);
  const [tableSearch, setTableSearch] = useState('');
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [customMetricInput, setCustomMetricInput] = useState('');
  const [addingMetric, setAddingMetric] = useState(false);
  const [recentlyAddedMetric, setRecentlyAddedMetric] = useState<string | null>(null);

  // Multimedia state
  const [uploadedImages, setUploadedImages] = useState<UploadedVisual[]>([]);
  const [isListening, setIsListening] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // History state
  const [chatHistory, setChatHistory] = useState<Array<{ id: string; title: string; query?: string; created_at: string }>>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Functional Theme State
  const [theme, setTheme] = useState<MorphTheme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('morph-theme');
      if (saved === 'dark' || saved === 'light' || saved === 'botanical' || saved === 'pink') {
        return saved;
      }
    }
    return 'light';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('morph-theme', theme);
    }
  }, [theme]);

  const t = THEME_STYLES[theme] || THEME_STYLES.dark;
  const [activeModel, setActiveModel] = useState('Gemini 2.5 Flash + Web Retrieval');

  // Keyboard shortcut listener ('v' to toggle Spec Sheet / Canvas)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.key === 'v' || e.key === 'V') {
        setViewMode((prev) => (prev === 'spec' ? 'canvas' : 'spec'));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Dynamic Multi-Entity Resolution
  const rawEntities: EntityVerdict[] = useMemo(() => {
    if (comparisonData?.entities && comparisonData.entities.length > 0) {
      return comparisonData.entities;
    }
    if (comparisonData?.entity_a && comparisonData?.entity_b) {
      return [comparisonData.entity_a, comparisonData.entity_b];
    }
    return [];
  }, [comparisonData]);

  const displayEntities: EntityVerdict[] = useMemo(() => {
    if (rawEntities.length === 0) return [];
    if (isSwapped && rawEntities.length === 2) {
      return [rawEntities[1], rawEntities[0]];
    }
    return rawEntities;
  }, [rawEntities, isSwapped]);

  const displayEntityA = displayEntities[0]?.name || 'Option A';
  const displayEntityB = displayEntities[1]?.name || 'Option B';

  const category = comparisonData?.category || 'Comparative Analysis';
  const verdictSummary = comparisonData?.verdict_summary || '';
  const categories = comparisonData?.categories || {};
  const communitySentiment = comparisonData?.community_sentiment || [];
  const suggestedMetrics = comparisonData?.suggested_metrics || [];

  // Flattened verified metrics for spatial canvas & counts
  const flatVerifiedMetrics = useMemo(() => {
    const list: VerifiedMetric[] = [];
    Object.values(categories).forEach((arr) => {
      if (Array.isArray(arr)) list.push(...arr);
    });
    return list;
  }, [categories]);

  const normalizedCategories = useMemo(() => {
    const result: Record<string, VerifiedMetric[]> = {};
    for (const [catName, metrics] of Object.entries(categories)) {
      result[catName] = metrics.map((m) => {
        let values = m.values ? [...m.values] : [m.entity_a || '', m.entity_b || ''];
        if (isSwapped && values.length === 2) {
          values = [values[1], values[0]];
        }
        return {
          metric: m.metric,
          values,
          entity_a: values[0] || 'Not specified',
          entity_b: values[1] || 'Not specified',
          source_type: m.source_type,
        };
      });
    }
    return result;
  }, [categories, isSwapped]);

  const normalizedCommunitySentiment = useMemo(() => {
    return communitySentiment.map((s) => {
      let consensuses = s.consensuses ? [...s.consensuses] : [s.entity_a_consensus || '', s.entity_b_consensus || ''];
      if (isSwapped && consensuses.length === 2) {
        consensuses = [consensuses[1], consensuses[0]];
      }
      return {
        topic: s.topic,
        consensuses,
        entity_a_consensus: consensuses[0] || 'General consensus',
        entity_b_consensus: consensuses[1] || 'General consensus',
        sentiment: s.sentiment,
      };
    });
  }, [communitySentiment, isSwapped]);

  // Dynamic Filtered Categories
  const filteredCategories = useMemo(() => {
    if (!tableSearch.trim()) return normalizedCategories;
    const term = tableSearch.toLowerCase();
    const result: Record<string, VerifiedMetric[]> = {};

    for (const [catName, metrics] of Object.entries(normalizedCategories)) {
      if (catName.toLowerCase().includes(term)) {
        result[catName] = metrics;
        continue;
      }
      const matched = metrics.filter(
        (m) =>
          m.metric.toLowerCase().includes(term) ||
          m.values?.some((v) => v.toLowerCase().includes(term))
      );
      if (matched.length > 0) {
        result[catName] = matched;
      }
    }
    return result;
  }, [normalizedCategories, tableSearch]);

  const filteredCommunitySentiment = useMemo(() => {
    if (!tableSearch.trim()) return normalizedCommunitySentiment;
    const term = tableSearch.toLowerCase();
    return normalizedCommunitySentiment.filter(
      (s) =>
        s.topic.toLowerCase().includes(term) ||
        s.consensuses?.some((c) => c.toLowerCase().includes(term))
    );
  }, [normalizedCommunitySentiment, tableSearch]);

  // Fetch past chat history from Turso DB
  const fetchChatHistory = async () => {
    if (authStatus !== 'authenticated') {
      setChatHistory([]);
      return;
    }
    setLoadingHistory(true);
    try {
      const res = await fetch('/api/history');
      if (res.ok) {
        const data = await res.json();
        setChatHistory(data.history || []);
      } else if (res.status === 401) {
        setChatHistory([]);
      }
    } catch (e) {
      console.error('Failed to fetch chat history:', e);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (authStatus === 'authenticated') {
      fetchChatHistory();
    }
  }, [authStatus]);

  useEffect(() => {
    fetchChatHistory();
  }, []);

  const handleSelectChat = async (chatOrId: string | { id: string; title: string; query?: string }, explicitTitle?: string) => {
    const id = typeof chatOrId === 'string' ? chatOrId : chatOrId.id;
    const title = explicitTitle || (typeof chatOrId === 'object' ? (chatOrId.title || chatOrId.query) : '');
    const resolvedTitle = title || chatHistory.find((c) => c.id === id)?.title || chatHistory.find((c) => c.id === id)?.query || '';
    
    // a. Set main search input value state to exact title string immediately
    if (resolvedTitle) {
      setPrompt(resolvedTitle);
    }

    setIsSidebarOpen(false);

    // Guest execution supported seamlessly without blocking

    setLoading(true);
    setError(null);
    setActiveChatId(id);

    try {
      // b. Immediately load cached payload from database history or trigger search API
      const res = await fetch(`/api/history?id=${id}`);
      if (res.ok) {
        const rawJson = await res.json();
        const matrixData: GenerativeComparisonResponse = rawJson.data ? rawJson.data : rawJson;
        if (matrixData && (matrixData.categories || matrixData.verified_metrics || matrixData.entities)) {
          setComparisonData(matrixData);
          if (matrixData.model_used) {
            setActiveModel(matrixData.model_used);
          }
          return;
        }
      }

      // Fallback: trigger search compare API with the resolved title
      if (resolvedTitle) {
        await handleRunComparison(undefined, resolvedTitle);
      }
    } catch (err: any) {
      console.warn('History load fallback to search:', err);
      if (resolvedTitle) {
        await handleRunComparison(undefined, resolvedTitle);
      } else {
        setError(err.message || 'Could not load saved comparison.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChat = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await fetch(`/api/history?id=${id}`, { method: 'DELETE' });
      setChatHistory((prev) => prev.filter((c) => c.id !== id));
      if (activeChatId === id) {
        setActiveChatId(null);
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleNewComparison = () => {
    setComparisonData(null);
    setActiveChatId(null);
    setPrompt('');
    setUploadedImages([]);
    setError(null);
  };

  const handleRunComparison = async (e?: React.FormEvent, overridePrompt?: string) => {
    if (e) e.preventDefault();
    const queryToRun = (overridePrompt ?? prompt).trim();
    if (!queryToRun && uploadedImages.length === 0) return;

    // Guest execution supported seamlessly without blocking

    setLoading(true);
    setError(null);

    try {
      const payload: any = {
        prompt: queryToRun,
      };

      if (uploadedImages.length > 0) {
        payload.images = uploadedImages.map((img) => ({
          data: img.data,
          mimeType: img.mimeType,
        }));
      }

      const res = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Comparison failed with HTTP ${res.status}`);
      }

      const resJson = await res.json();
      const data: GenerativeComparisonResponse = resJson.data ? resJson.data : resJson;
      setComparisonData(data);
      if (data.chat_id || resJson.chat_id) {
        setActiveChatId(data.chat_id || resJson.chat_id);
        fetchChatHistory();
      }
      if (data.model_used) {
        setActiveModel(data.model_used);
      }
    } catch (err: any) {
      console.error('Comparison error:', err);
      setError(err.message || 'Failed to generate comparison. Please check input.');
    } finally {
      setLoading(false);
    }
  };

  // Image Upload Handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files).slice(0, 2 - uploadedImages.length);

    fileList.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64String = (event.target?.result as string).split(',')[1];
        setUploadedImages((prev) => [
          ...prev,
          {
            data: base64String,
            mimeType: file.type || 'image/jpeg',
            name: file.name,
            previewUrl: URL.createObjectURL(file),
          },
        ]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Voice Search Handler (Web Speech API)
  const toggleVoiceInput = () => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Voice input is not supported in this browser.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setPrompt(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error('Speech recognition error:', err);
      setIsListening(false);
    }
  };

  // Handle Dynamic Custom Metric Addition
  const handleAddCustomMetric = async (metricName?: string) => {
    const targetMetric = (metricName || customMetricInput).trim();
    if (!targetMetric || !comparisonData || displayEntities.length === 0) return;

    setAddingMetric(true);
    const categoryKey = 'Dynamic Specifications';

    // 1. Graceful Optimistic Expansion
    setComparisonData((prev) => {
      if (!prev) return prev;
      const currentCats = { ...(prev.categories || {}) };
      const currentList = currentCats[categoryKey] ? [...currentCats[categoryKey]] : [];

      if (!currentList.some((m) => m.metric.toLowerCase() === targetMetric.toLowerCase())) {
        currentList.push({
          metric: targetMetric,
          values: displayEntities.map(() => 'Fetching...'),
          entity_a: 'Fetching...',
          entity_b: 'Fetching...',
          source_type: 'official',
        });
      }

      return {
        ...prev,
        categories: {
          ...currentCats,
          [categoryKey]: currentList,
        },
      };
    });

    setRecentlyAddedMetric(targetMetric);
    setOpenSections((prev) => ({ ...prev, [categoryKey]: true }));
    if (!metricName) setCustomMetricInput('');

    try {
      // 1. Check client-side parametric knowledge map first for immediate high-accuracy response
      const clientFallback = getClientCustomMetricFallback(targetMetric, displayEntityA, displayEntityB);

      const res = await fetch('/api/custom-metric', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metric: targetMetric,
          entities: displayEntities.map((e) => e.name),
        }),
      });

      let resolvedValues: string[] = [];

      if (res.ok) {
        const data = await res.json();
        resolvedValues = Array.isArray(data.values) && data.values.length > 0
          ? data.values
          : [data.entity_a || data.entity_a_value || '', data.entity_b || data.entity_b_value || ''];
      }

      // If backend returned empty/missing values or error, apply client-side parametric knowledge fallback
      if ((!resolvedValues || resolvedValues.length === 0 || resolvedValues.every((v) => !v || v === 'Fetching...')) && clientFallback) {
        resolvedValues = [clientFallback.valA, clientFallback.valB];
      }

      if (!resolvedValues || resolvedValues.length === 0) {
        throw new Error('Could not retrieve fact for this metric.');
      }

      setComparisonData((prev) => {
        if (!prev) return prev;
        const currentCats = { ...(prev.categories || {}) };
        const currentList = currentCats[categoryKey] ? [...currentCats[categoryKey]] : [];
        const updatedList = currentList.map((m) => {
          if (m.metric.toLowerCase() === targetMetric.toLowerCase()) {
            return {
              ...m,
              values: resolvedValues,
              entity_a: resolvedValues[0] || 'Verified specification',
              entity_b: resolvedValues[1] || 'Verified specification',
            };
          }
          return m;
        });

        return {
          ...prev,
          categories: {
            ...currentCats,
            [categoryKey]: updatedList,
          },
        };
      });
    } catch (err: any) {
      console.warn('Custom metric lookup failure:', err?.message || err);
      // Resilient parametric fallback check before showing unavailable
      const clientFallback = getClientCustomMetricFallback(targetMetric, displayEntityA, displayEntityB);
      const fallbackValues = clientFallback
        ? [clientFallback.valA, clientFallback.valB]
        : displayEntities.map(() => 'Not available in current sources');

      setComparisonData((prev) => {
        if (!prev) return prev;
        const currentCats = { ...(prev.categories || {}) };
        const currentList = currentCats[categoryKey] ? [...currentCats[categoryKey]] : [];
        const updatedList = currentList.map((m) => {
          if (m.metric.toLowerCase() === targetMetric.toLowerCase()) {
            return {
              ...m,
              values: fallbackValues,
              entity_a: fallbackValues[0],
              entity_b: fallbackValues[1] || fallbackValues[0],
            };
          }
          return m;
        });

        return {
          ...prev,
          categories: {
            ...currentCats,
            [categoryKey]: updatedList,
          },
        };
      });
    } finally {
      setAddingMetric(false);
    }
  };

  const toggleAllSections = () => {
    const keys = Object.keys(filteredCategories);
    const areAllOpen = keys.every((k) => openSections[k] !== false);
    const nextState = !areAllOpen;
    const newOpen: Record<string, boolean> = {};
    keys.forEach((k) => {
      newOpen[k] = nextState;
    });
    setOpenSections(newOpen);
  };

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [id]: prev[id] === false ? true : false,
    }));
  };

  const handleExportPDF = () => {
    window.print();
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(
        `MorphUI Comparison: ${displayEntityA} vs ${displayEntityB}\nVerdict: ${verdictSummary}`
      );
      alert('Comparison summary copied to clipboard!');
    }
  };

  // 1. EMPTY / HERO LANDING STATE
  if (!comparisonData && !loading) {
    return (
      <div className={`min-h-screen ${t.bg} flex flex-col justify-between w-full transition-colors duration-300`}>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageUpload}
          accept="image/*"
          multiple
          className="hidden"
        />

        {/* History Sidebar Drawer */}
        <div
          className={`fixed inset-0 z-50 transition-opacity duration-300 ${
            isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
          />
          <aside
            className={`absolute top-0 left-0 bottom-0 w-80 max-w-[85vw] ${t.sidebar} p-4 flex flex-col justify-between transition-transform duration-300 ease-in-out shadow-2xl ${
              isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between pb-4 border-b border-slate-700/40">
                <div className="flex items-center gap-2">
                  <HistoryIcon className="w-4 h-4 text-sky-400" />
                  <span className={`font-bold text-sm ${t.title}`}>Comparison History</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(false)}
                  className={`p-1.5 rounded-lg ${t.btnSecondary}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="py-3">
                <button
                  type="button"
                  onClick={handleNewComparison}
                  className="w-full py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Comparison</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 text-xs">
                {loadingHistory ? (
                  <div className="flex items-center justify-center py-8 text-slate-500 gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
                    <span>Loading past chats...</span>
                  </div>
                ) : chatHistory.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <p>No previous comparisons saved.</p>
                    <p className="text-[11px] text-slate-400 mt-1">Comparisons are encrypted & saved automatically.</p>
                  </div>
                ) : (
                  chatHistory.map((chat) => (
                    <div
                      key={chat.id}
                      onClick={() => handleSelectChat(chat, chat.title)}
                      className={`group flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                        activeChatId === chat.id
                          ? 'bg-sky-500/10 border-sky-500/30 text-sky-400'
                          : `${t.btnSecondary}`
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Scale className="w-3.5 h-3.5 text-slate-400 shrink-0 group-hover:text-sky-400" />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate text-xs">{chat.title}</p>
                          <p className="text-[10px] text-slate-500">
                            {new Date(chat.created_at).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteChat(e, chat.id)}
                        title="Delete comparison"
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-rose-400 transition-all shrink-0 ml-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-3 border-t border-slate-700/40 text-[11px] text-slate-500 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> AES-256 Encrypted
                </span>
                <span className="text-[10px] font-mono text-slate-400">Turso DB</span>
              </div>
            </div>
          </aside>
        </div>

        {/* Hero Top Navbar */}
        <header className={`${t.nav} w-full transition-colors duration-300`}>
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-500 shadow-sm shrink-0">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <span className={`font-bold text-base sm:text-lg tracking-tight ${t.title}`}>MorphUI</span>
                <span className="text-[10px] ml-2 uppercase font-mono px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-500 border border-sky-500/20">
                  v2.0
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Theme Switcher in Hero */}
              <div className={`flex items-center p-1 rounded-xl ${t.cardInner} shadow-inner shrink-0`}>
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  title="Dark Mode"
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                    theme === 'dark' ? t.pillActive : t.pillInactive
                  }`}
                >
                  <span>🌙</span>
                  <span className="hidden sm:inline text-[11px]">Dark</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  title="Clean White Light Mode"
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                    theme === 'light' ? t.pillActive : t.pillInactive
                  }`}
                >
                  <span>☀️</span>
                  <span className="hidden sm:inline text-[11px]">Light</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('botanical')}
                  title="Botanical Forest Mode"
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                    theme === 'botanical' ? t.pillActive : t.pillInactive
                  }`}
                >
                  <span>🌸</span>
                  <span className="hidden sm:inline text-[11px]">Botanical</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsSidebarOpen(true);
                  fetchChatHistory();
                }}
                className={`px-2.5 py-1.5 rounded-xl ${t.btnSecondary} text-xs font-medium transition-all flex items-center gap-1.5 shadow-sm`}
                title="View Past Comparisons"
              >
                <HistoryIcon className="w-3.5 h-3.5 text-sky-400" />
                <span>History</span>
                {chatHistory.length > 0 && (
                  <span className="px-1.5 py-0.2 bg-sky-500/20 text-sky-400 rounded-full text-[10px] font-mono">
                    {chatHistory.length}
                  </span>
                )}
              </button>

              {authStatus === 'authenticated' && session?.user ? (
                <div className="flex items-center gap-2">
                  <div className={`flex items-center gap-1.5 px-2 py-1 rounded-xl ${t.cardInner} text-xs`}>
                    {session.user.image ? (
                      <img src={session.user.image} alt={session.user.name || 'User'} className="w-4 h-4 rounded-full" />
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-sky-500 text-white flex items-center justify-center text-[9px] font-bold">
                        {(session.user.name || session.user.email || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="hidden sm:inline font-medium truncate max-w-[90px]">{session.user.name || session.user.email}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => signOut()}
                    className={`px-2 py-1 rounded-xl ${t.btnSecondary} text-xs transition-all`}
                    title="Sign Out"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => signIn('google')}
                  className="px-2.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all shrink-0"
                  title="Sign in with Google"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.315 0-6-2.685-6-6s2.685-6 6-6c1.463 0 2.8.533 3.84 1.413l2.36-2.36C16.96 3.667 14.73 3 12.24 3 7.27 3 3.24 7.03 3.24 12s4.03 9 9 9c5.2 0 8.655-3.655 8.655-8.81 0-.61-.06-1.2-.175-1.765H12.24z" />
                  </svg>
                  <span className="hidden sm:inline">Sign in</span>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Main Clean Hero Landing Section */}
        <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-20 text-center space-y-6 sm:space-y-8 flex-1 flex flex-col justify-center items-center">
          {/* Badge */}
          <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full ${t.badge} text-xs shadow-sm`}>
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span className="font-semibold text-center">AI-Powered Entity Resolution & Reddit De-Biasing</span>
          </div>

          {/* Heading */}
          <div className="space-y-3 w-full">
            <h1 className={`text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight ${t.title} leading-tight`}>
              MorphUI: Real-Time Generative Comparisons
            </h1>
            <p className={`text-xs sm:text-sm md:text-base ${t.subtext} max-w-2xl mx-auto leading-relaxed`}>
              Compare any two entities across any domain. Get instant side-by-side spec sheets, de-biased consensus, and spatial graph models.
            </p>
          </div>

          {/* Uploaded Images Preview if any */}
          {uploadedImages.length > 0 && (
            <div className={`p-3 ${t.card} rounded-2xl flex flex-wrap items-center gap-3 w-full max-w-2xl text-left`}>
              <span className={`text-xs font-semibold ${t.subtext} flex items-center gap-1.5`}>
                <Eye className="w-4 h-4 text-sky-400" /> Visual Inputs ({uploadedImages.length}/2):
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {uploadedImages.map((img, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-2 ${t.cardInner} rounded-lg px-2 py-1 text-xs`}
                  >
                    <img src={img.previewUrl} alt={img.name} className="w-6 h-6 object-cover rounded" />
                    <span className="font-medium truncate max-w-[120px] sm:max-w-[160px]">{img.name}</span>
                    <button
                      type="button"
                      onClick={() => setUploadedImages((prev) => prev.filter((_, i) => i !== idx))}
                      className="text-slate-400 hover:text-rose-400"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Large Hero Search Input */}
          <div className="w-full max-w-2xl">
            <form onSubmit={handleRunComparison} className="relative flex items-center shadow-xl w-full">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 absolute left-3.5 sm:left-4 pointer-events-none" />
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Compare entities (e.g. Nike Pegasus vs Ultraboost, IIT Bombay vs IIT Delhi)..."
                className={`w-full ${t.input} rounded-2xl pl-10 sm:pl-12 pr-28 sm:pr-36 md:pr-40 py-3.5 sm:py-4 text-xs sm:text-base outline-none transition-all shadow-inner`}
              />

              <div className="absolute right-1.5 sm:right-2.5 flex items-center gap-1 sm:gap-1.5">
                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  title="Voice Search"
                  className={`p-1.5 sm:p-2 rounded-xl transition-colors ${
                    isListening
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'text-slate-400 hover:text-sky-400 hover:bg-slate-700/20'
                  }`}
                >
                  {isListening ? <MicOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Mic className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload image to compare"
                  className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-sky-400 hover:bg-slate-700/20 transition-colors"
                >
                  <ImagePlus className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>

                <button
                  type="submit"
                  disabled={!prompt.trim() && uploadedImages.length === 0}
                  className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs sm:text-sm active:scale-95 transition-all flex items-center gap-1.5 shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span className="hidden xs:inline">Compare</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>

          {/* Inspiration Query Chips */}
          <div className="space-y-2 pt-2 w-full">
            <span className={`text-xs ${t.subtext} font-medium block`}>Try a sample search:</span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {[
                { label: '👟 Nike Pegasus 41 vs Adidas Ultraboost', query: 'Nike Pegasus 41 vs Adidas Ultraboost Light' },
                { label: '🍎 Apple vs 🥭 Mango', query: 'Apple vs Mango: Nutrition & Shelf Life' },
                { label: '🎧 Sony WH-1000XM5 vs Bose QC Ultra', query: 'Sony WH-1000XM5 vs Bose QC Ultra' },
                { label: '🏛️ IIT Bombay vs IIT Delhi', query: 'IIT Bombay vs IIT Delhi for Computer Science' },
                { label: '⚡ React vs Vue', query: 'React vs Vue: Performance & DX' },
              ].map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setPrompt(item.query);
                    handleRunComparison(undefined, item.query);
                  }}
                  className={`px-3 py-1.5 rounded-full ${t.btnSecondary} text-xs transition-colors shadow-xs`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </main>

        <footer className={`${t.footer} py-6 text-center text-xs w-full transition-colors duration-300`}>
          <div className="w-full max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>MorphUI • Real-Time Generative Comparisons</span>
            <span>© 2026 MorphUI</span>
          </div>
        </footer>
      </div>
    );
  }

  // 2. GENERATIVE LOADING STATE WITH SKELETON UI
  const isLoading = loading;
  if (isLoading && !comparisonData) {
    return (
      <div className={`min-h-screen ${t.bg} pb-16 w-full transition-colors duration-300`}>
        <header className={`${t.nav} sticky top-0 z-40 w-full`}>
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4">
            <div className="flex items-center justify-between w-full md:w-auto gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-500 shadow-sm shrink-0">
                  <Scale className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold text-sm sm:text-base tracking-tight ${t.title}`}>MorphUI</span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-500 border border-sky-500/20">
                      Dual-Engine
                    </span>
                  </div>
                  <p className={`text-[11px] ${t.subtext} hidden sm:block`}>Spec Sheet & Spatial Graph Runtime</p>
                </div>
              </div>
            </div>

            <div className="w-full md:w-auto md:flex-1 max-w-2xl">
              <div className="relative w-full flex items-center">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  value={prompt}
                  readOnly
                  disabled
                  placeholder="Synthesizing comparison..."
                  className={`w-full ${t.input} rounded-xl pl-9 pr-12 py-2 text-xs sm:text-sm outline-none shadow-inner`}
                />
                <div className="absolute right-2 flex items-center">
                  <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
                </div>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 font-mono">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>Multi-Source Engine</span>
            </div>
          </div>
        </header>

        <main>
          <ComparisonSkeleton prompt={prompt} viewMode={viewMode} theme={theme} />
        </main>
      </div>
    );
  }

  // 3. ACTIVE COMPARISON VIEW
  return (
    <div className={`min-h-screen ${t.bg} pb-16 w-full transition-colors duration-300`}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        multiple
        className="hidden"
      />

      {/* History Sidebar Drawer */}
      <div
        className={`fixed inset-0 z-50 transition-opacity duration-300 ${
          isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
        <aside
          className={`absolute top-0 left-0 bottom-0 w-80 max-w-[85vw] ${t.sidebar} p-4 flex flex-col justify-between transition-transform duration-300 ease-in-out shadow-2xl ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between pb-4 border-b border-slate-700/40">
              <div className="flex items-center gap-2">
                <HistoryIcon className="w-4 h-4 text-sky-400" />
                <span className={`font-bold text-sm ${t.title}`}>Comparison History</span>
              </div>
              <button
                type="button"
                onClick={() => setIsSidebarOpen(false)}
                className={`p-1.5 rounded-lg ${t.btnSecondary}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-3">
              <button
                type="button"
                onClick={handleNewComparison}
                className="w-full py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Comparison</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 text-xs">
              {loadingHistory ? (
                <div className="flex items-center justify-center py-8 text-slate-500 gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
                  <span>Loading past chats...</span>
                </div>
              ) : chatHistory.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <p>No previous comparisons saved.</p>
                  <p className="text-[11px] text-slate-400 mt-1">Comparisons are encrypted & saved automatically.</p>
                </div>
              ) : (
                chatHistory.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => handleSelectChat(chat, chat.title)}
                    className={`group flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                      activeChatId === chat.id
                        ? 'bg-sky-500/10 border-sky-500/30 text-sky-400'
                        : `${t.btnSecondary}`
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Scale className="w-3.5 h-3.5 text-slate-400 shrink-0 group-hover:text-sky-400" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate text-xs">{chat.title}</p>
                        <p className="text-[10px] text-slate-500">
                          {new Date(chat.created_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteChat(e, chat.id)}
                      title="Delete comparison"
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-rose-400 transition-all shrink-0 ml-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-700/40 text-[11px] text-slate-500 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> AES-256 Encrypted
              </span>
              <span className="text-[10px] font-mono text-slate-400">Turso DB</span>
            </div>
          </div>
        </aside>
      </div>

      {/* Active Navigation Bar */}
      <header className={`${t.nav} sticky top-0 z-40 w-full transition-colors duration-300`}>
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4">
          <div className="flex items-center justify-between w-full md:w-auto gap-3 shrink-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsSidebarOpen(true);
                  fetchChatHistory();
                }}
                className={`p-2 rounded-xl ${t.btnSecondary} transition-all flex items-center gap-1.5 shadow-sm`}
                title="Open History Sidebar"
              >
                <HistoryIcon className="w-4 h-4 text-sky-400" />
                <span className="hidden lg:inline text-xs font-medium">History</span>
                {chatHistory.length > 0 && (
                  <span className="px-1.5 py-0.2 bg-sky-500/20 text-sky-400 rounded-full text-[10px] font-mono">
                    {chatHistory.length}
                  </span>
                )}
              </button>

              <div className="flex items-center gap-2 cursor-pointer" onClick={handleNewComparison} title="New Comparison">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-500 shadow-sm shrink-0">
                  <Scale className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold text-sm sm:text-base tracking-tight ${t.title}`}>MorphUI</span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-500 border border-sky-500/20">
                      Dual-Engine
                    </span>
                  </div>
                  <p className={`text-[11px] ${t.subtext} hidden sm:block`}>Spec Sheet & Spatial Graph Runtime</p>
                </div>
              </div>
            </div>

            {/* Mobile-visible View Switcher */}
            <div className={`flex md:hidden items-center p-1 rounded-xl ${t.cardInner} shadow-inner`}>
              <button
                type="button"
                onClick={() => setViewMode('spec')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                  viewMode === 'spec' ? t.pillActive : t.pillInactive
                }`}
                title="Spec Sheet View"
              >
                <FileText className="w-3 h-3 text-sky-400" />
                <span>Spec</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('canvas')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                  viewMode === 'canvas' ? t.pillActive : t.pillInactive
                }`}
                title="Spatial Canvas Graph View"
              >
                <Network className="w-3 h-3 text-indigo-400" />
                <span>Canvas</span>
              </button>
            </div>
          </div>

          {/* Central Search Input with Guaranteed Width & Crisp Visibility */}
          <div className="w-full md:flex-1 min-w-[260px] sm:min-w-[320px] max-w-2xl">
            <form onSubmit={handleRunComparison} className="relative w-full flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none z-10" />
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Compare entities (e.g. Nike Pegasus vs Ultraboost, IIT vs VIT)..."
                disabled={loading}
                className={`w-full h-10 ${t.input} rounded-xl pl-9 pr-24 sm:pr-28 py-2 text-xs sm:text-sm font-medium outline-none transition-all shadow-inner relative z-0`}
              />

              <div className="absolute right-1.5 flex items-center gap-1">
                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  title="Voice Search"
                  className={`p-1.5 rounded-lg transition-colors ${
                    isListening
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'text-slate-400 hover:text-sky-400 hover:bg-slate-700/20'
                  }`}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload image"
                  disabled={loading || uploadedImages.length >= 2}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-slate-700/20 transition-colors disabled:opacity-40"
                >
                  <ImagePlus className="w-4 h-4" />
                </button>

                <button
                  type="submit"
                  disabled={loading || (!prompt.trim() && uploadedImages.length === 0)}
                  title="Run Comparison"
                  className="p-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white active:scale-95 transition-all shadow-sm flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Desktop-only View Switcher & Theme Switcher */}
          <div className="hidden md:flex items-center gap-2 lg:gap-3 shrink-0">
            {/* Functional Theme Switcher */}
            <div className={`flex items-center p-1 rounded-xl ${t.cardInner} shadow-inner shrink-0`}>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                title="Dark Mode"
                className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                  theme === 'dark' ? t.pillActive : t.pillInactive
                }`}
              >
                <span>🌙</span>
                <span className="hidden xl:inline text-[11px]">Dark</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('light')}
                title="Clean White Light Mode"
                className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                  theme === 'light' ? t.pillActive : t.pillInactive
                }`}
              >
                <span>☀️</span>
                <span className="hidden xl:inline text-[11px]">Light</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('botanical')}
                title="Botanical Forest Mode"
                className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                  theme === 'botanical' ? t.pillActive : t.pillInactive
                }`}
              >
                <span>🌸</span>
                <span className="hidden xl:inline text-[11px]">Botanical</span>
              </button>
            </div>

            <div className={`flex items-center p-1 rounded-xl ${t.cardInner} shadow-inner shrink-0`}>
              <button
                type="button"
                onClick={() => setViewMode('spec')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  viewMode === 'spec' ? t.pillActive : t.pillInactive
                }`}
                title="Spec Sheet View (Press 'V' to flip)"
              >
                <FileText className="w-3.5 h-3.5 text-sky-400" />
                <span className="hidden lg:inline">Spec Sheet</span>
                <span className="lg:hidden">Spec</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('canvas')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  viewMode === 'canvas' ? t.pillActive : t.pillInactive
                }`}
                title="Spatial Canvas Graph View (Press 'V' to flip)"
              >
                <Network className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden lg:inline">Spatial Canvas</span>
                <span className="lg:hidden">Canvas</span>
              </button>
            </div>

            <div className={`text-[10px] font-mono ${t.subtext} hidden lg:block`}>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-500/20 border border-slate-500/30">V</kbd> toggle view
            </div>

            {authStatus === 'authenticated' && session?.user ? (
              <div className="flex items-center gap-2 shrink-0">
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-xl ${t.cardInner} text-xs`}>
                  {session.user.image ? (
                    <img src={session.user.image} alt={session.user.name || 'User'} className="w-4 h-4 rounded-full" />
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-sky-500 text-white flex items-center justify-center text-[9px] font-bold">
                      {(session.user.name || session.user.email || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="hidden xl:inline font-medium truncate max-w-[80px]">{session.user.name || session.user.email}</span>
                </div>
                <button
                  type="button"
                  onClick={() => signOut()}
                  className={`px-2 py-1 rounded-xl ${t.btnSecondary} text-xs transition-all`}
                  title="Sign Out"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => signIn('google')}
                className="px-2.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all shrink-0"
                title="Sign in with Google"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.315 0-6-2.685-6-6s2.685-6 6-6c1.463 0 2.8.533 3.84 1.413l2.36-2.36C16.96 3.667 14.73 3 12.24 3 7.27 3 3.24 7.03 3.24 12s4.03 9 9 9c5.2 0 8.655-3.655 8.655-8.81 0-.61-.06-1.2-.175-1.765H12.24z" />
                </svg>
                <span className="hidden sm:inline">Sign in</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Sub-Navbar for Theme Switcher */}
        <div className="flex md:hidden items-center justify-between px-4 pb-2.5 pt-1 w-full border-t border-slate-700/20">
          <div className={`flex items-center p-1 rounded-xl ${t.cardInner} shadow-inner`}>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`px-2 py-0.5 rounded-lg text-xs ${theme === 'dark' ? t.pillActive : t.pillInactive}`}
            >
              🌙 Dark
            </button>
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`px-2 py-0.5 rounded-lg text-xs ${theme === 'light' ? t.pillActive : t.pillInactive}`}
            >
              ☀️ Light
            </button>
            <button
              type="button"
              onClick={() => setTheme('botanical')}
              className={`px-2 py-0.5 rounded-lg text-xs ${theme === 'botanical' ? t.pillActive : t.pillInactive}`}
            >
              🌸 Botanical
            </button>
          </div>
          <span className={`text-[10px] font-mono ${t.subtext}`}>{activeModel.split(' ')[0]}</span>
        </div>
      </header>

      {/* VIEWPORT BODY: DUAL-VIEW */}
      {viewMode === 'canvas' ? (
        // VIEW 2: SPATIAL CANVAS GRAPH VIEW
        <main className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4">
          <FlowProvider>
            <SpatialCanvasWorkspace
              entities={displayEntities}
              category={category}
              verifiedMetrics={flatVerifiedMetrics}
              communitySentiment={normalizedCommunitySentiment}
              verdictSummary={verdictSummary}
              theme={theme}
            />
          </FlowProvider>
        </main>
      ) : (
        // VIEW 1: SPEC SHEET VIEW
        <main className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-6">
          {/* Uploaded Images Preview */}
          {uploadedImages.length > 0 && (
            <div className={`p-3 ${t.card} rounded-2xl flex flex-wrap items-center gap-3 w-full`}>
              <span className={`text-xs font-semibold ${t.subtext} flex items-center gap-1.5`}>
                <Eye className="w-4 h-4 text-sky-400" /> Visual Inputs ({uploadedImages.length}/2):
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {uploadedImages.map((img, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-2 ${t.cardInner} rounded-lg px-2 py-1 text-xs`}
                  >
                    <img src={img.previewUrl} alt={img.name} className="w-6 h-6 object-cover rounded" />
                    <span className="font-medium truncate max-w-[120px] sm:max-w-[160px]">{img.name}</span>
                    <button
                      type="button"
                      onClick={() => setUploadedImages((prev) => prev.filter((_, i) => i !== idx))}
                      className="text-slate-400 hover:text-rose-400"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error Alert Box */}
          {error && (
            <div className="p-3 sm:p-4 bg-rose-950/80 border border-rose-800/80 rounded-2xl text-xs sm:text-sm text-rose-200 flex items-center justify-between shadow-md w-full">
              <span className="whitespace-normal break-words">{error}</span>
              <button onClick={() => setError(null)} className="font-bold ml-3 text-rose-400 hover:text-rose-200 shrink-0">
                Dismiss
              </button>
            </div>
          )}

          {/* Main Entity Comparison Hero Card */}
          <section className={`w-full ${t.card} rounded-2xl p-4 sm:p-6 lg:p-8 shadow-xl relative overflow-hidden`}>
            {displayEntities.length <= 2 ? (
              <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4 sm:gap-6 pb-4 sm:pb-6 border-b border-slate-700/40">
                {/* Entity A */}
                <div className="flex-1 space-y-1.5 sm:space-y-2 w-full">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 shrink-0">
                      Option A
                    </span>
                    <span className={`text-xs ${t.subtext} whitespace-normal break-words`}>{category}</span>
                  </div>
                  <h1 className={`text-xl sm:text-2xl md:text-3xl font-bold tracking-tight ${t.title} whitespace-normal break-words leading-tight`}>
                    {displayEntityA}
                  </h1>
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${t.cardInner} text-xs font-medium`}>
                    <Award className="w-3.5 h-3.5 text-sky-400" />
                    <span>Verified Baseline</span>
                  </div>
                </div>

                {/* VS Badge */}
                <div className="flex flex-row md:flex-col items-center justify-center shrink-0 my-1 md:my-0">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full ${t.cardInner} flex items-center justify-center shadow-md font-bold font-mono text-xs sm:text-sm ${t.subtext}`}>
                    VS
                  </div>
                </div>

                {/* Entity B */}
                <div className="flex-1 space-y-1.5 sm:space-y-2 md:text-right w-full">
                  <div className="flex items-center gap-2 md:justify-end">
                    <span className={`text-xs ${t.subtext} whitespace-normal break-words`}>{category}</span>
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
                      Option B
                    </span>
                  </div>
                  <h1 className={`text-xl sm:text-2xl md:text-3xl font-bold tracking-tight ${t.title} whitespace-normal break-words leading-tight`}>
                    {displayEntityB}
                  </h1>
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${t.cardInner} text-xs font-medium`}>
                    <Award className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Verified Baseline</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative z-10 space-y-4 pb-4 sm:pb-6 border-b border-slate-700/40">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${t.subtext} uppercase tracking-wider`}>{category}</span>
                  <span className={`text-xs font-mono px-2 py-0.5 rounded ${t.cardInner}`}>
                    {displayEntities.length}-Way Comparison
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {displayEntities.map((ent, idx) => {
                    const badge = ENTITY_BADGES[idx % ENTITY_BADGES.length];
                    return (
                      <div key={idx} className={`p-3.5 rounded-xl ${t.cardInner} space-y-2`}>
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${badge.bg}`}>
                            {badge.label}
                          </span>
                          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                        </div>
                        <h2 className={`text-base sm:text-lg font-bold ${t.title} leading-snug break-words`}>{ent.name}</h2>
                        <div className={`text-[11px] ${t.subtext} flex items-center gap-1`}>
                          <Award className={`w-3 h-3 ${badge.text}`} />
                          <span>Verified Baseline</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Telemetry and Trust Badges */}
            <div className={`pt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs ${t.subtext} gap-2`}>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="whitespace-normal break-words">Reddit De-Biasing & Multi-Source Extraction Engine</span>
              </div>
              <div className="font-mono text-[11px]">
                {activeModel}
              </div>
            </div>
          </section>

          {/* Executive Verdict Card */}
          <section className={`w-full ${t.card} rounded-2xl p-4 sm:p-6 shadow-xl space-y-4 sm:space-y-5`}>
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-700/40">
              <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 shrink-0">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h3 className={`font-bold text-xs sm:text-sm ${t.title} tracking-tight`}>Executive Verdict & Synthesis</h3>
                <p className={`text-[11px] sm:text-xs ${t.subtext}`}>Synthesized takeaway balancing verified specs & community consensus</p>
              </div>
            </div>

            <p className={`text-xs sm:text-sm leading-relaxed ${t.cardInner} p-3.5 sm:p-4 rounded-xl whitespace-normal break-words`}>
              {verdictSummary}
            </p>

            {/* Dynamic Multi-Entity Pros Recommendation Grid */}
            <div className={`grid grid-cols-1 ${displayEntities.length > 2 ? 'md:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-2'} gap-3 sm:gap-4 w-full`}>
              {displayEntities.map((ent, entIdx) => {
                const badge = ENTITY_BADGES[entIdx % ENTITY_BADGES.length];
                const pros = ent.pros && ent.pros.length > 0 ? ent.pros : ['Key distinguishing strengths of ' + ent.name];
                return (
                  <div key={entIdx} className={`w-full ${t.cardInner} rounded-xl p-3.5 sm:p-4 space-y-2.5 sm:space-y-3`}>
                    <div className={`flex items-center gap-2 ${badge.text} font-semibold text-xs uppercase tracking-wider`}>
                      <CheckCircle2 className={`w-4 h-4 ${badge.text} shrink-0`} />
                      <span className="whitespace-normal break-words">Choose {ent.name} if:</span>
                    </div>
                    <ul className={`space-y-2 text-xs leading-relaxed`}>
                      {pros.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 whitespace-normal break-words">
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot} shrink-0 mt-1.5`} />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Partitioned Tabs & Utility Toolbar */}
          <section className="w-full space-y-3 no-print">
            <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${t.card} p-2 rounded-2xl w-full`}>
              <div className={`flex flex-col xs:flex-row items-stretch xs:items-center gap-1.5 p-1 ${t.cardInner} rounded-xl w-full sm:w-auto`}>
                <button
                  type="button"
                  onClick={() => setActiveTab('verified')}
                  className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 sm:gap-2 ${
                    activeTab === 'verified' ? t.pillActive : t.pillInactive
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="truncate">Verified Facts</span>
                  <span className={`text-[10px] sm:text-[11px] font-mono px-1.5 py-0.2 rounded ${t.cardInner}`}>
                    {flatVerifiedMetrics.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('community')}
                  className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 sm:gap-2 ${
                    activeTab === 'community' ? t.pillActive : t.pillInactive
                  }`}
                >
                  <MessageSquare className="w-4 h-4 text-sky-400 shrink-0" />
                  <span className="truncate">Reddit Sentiment</span>
                  <span className={`text-[10px] sm:text-[11px] font-mono px-1.5 py-0.2 rounded ${t.cardInner}`}>
                    {communitySentiment.length}
                  </span>
                </button>
              </div>

              {/* Quick Filter Search */}
              <div className="flex items-center gap-2 px-1 sm:px-2 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                    placeholder="Filter attributes & themes..."
                    className={`w-full ${t.input} rounded-xl pl-8 pr-3 py-1.5 text-xs outline-none`}
                  />
                </div>
              </div>
            </div>

            {/* Action Utilities */}
            <div className={`w-full ${t.card} rounded-2xl p-2.5 flex flex-wrap items-center justify-between gap-2 shadow-sm`}>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => setIsSwapped((prev) => !prev)}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-xl ${t.btnSecondary} text-xs font-medium transition-colors flex items-center gap-1.5`}
                  title="Swap Entity Columns"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5 text-sky-400" />
                  <span>Swap</span>
                </button>

                <button
                  type="button"
                  onClick={() => setHighlightDiff((prev) => !prev)}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    highlightDiff
                      ? 'bg-sky-500/10 border border-sky-500/40 text-sky-400 font-semibold'
                      : t.btnSecondary
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                  <span>Diff</span>
                </button>

                <button
                  type="button"
                  onClick={toggleAllSections}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-xl ${t.btnSecondary} text-xs font-medium transition-colors flex items-center gap-1.5`}
                >
                  <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden xs:inline">Expand / Collapse</span>
                  <span className="xs:hidden">Toggle</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={handleExportPDF}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-xl ${t.btnSecondary} text-xs font-medium transition-colors flex items-center gap-1.5`}
                >
                  <Printer className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden xs:inline">Export PDF</span>
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  className={`p-1.5 rounded-xl ${t.btnSecondary} transition-colors`}
                  title="Share comparison summary"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </section>

          {/* TAB 1: Verified Facts & Official Specs Table */}
          {activeTab === 'verified' && (
            <section className={`w-full ${t.card} rounded-2xl shadow-xl overflow-hidden print-clean`}>
              <div className="w-full overflow-x-auto whitespace-nowrap md:whitespace-normal">
                <div className="min-w-[650px] md:min-w-full">
                  {/* Table Header */}
                  <div className={`${t.tableHeader} px-4 sm:px-6 py-3.5 flex items-center text-xs font-bold uppercase tracking-wider shadow-sm gap-4`}>
                    <div className="w-1/3 min-w-[180px] shrink-0 flex items-center gap-1.5">
                      <FileSpreadsheet className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="truncate">Metric / Attribute</span>
                    </div>
                    {displayEntities.map((ent, idx) => {
                      const badge = ENTITY_BADGES[idx % ENTITY_BADGES.length];
                      return (
                        <div key={idx} className={`flex-1 min-w-[160px] ${badge.text} flex items-center gap-1.5 whitespace-normal break-words`}>
                          <span className={`w-2 h-2 rounded-full ${badge.dot} shrink-0`} />
                          <span>{ent.name}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Dynamic Categories Loop */}
                  <div className="divide-y divide-slate-700/30">
                    {Object.keys(filteredCategories).length === 0 ? (
                      <div className="p-8 sm:p-12 text-center text-slate-400 text-sm">
                        No verified metrics found for &quot;{tableSearch}&quot;.
                      </div>
                    ) : (
                      Object.entries(filteredCategories).map(([categoryName, metrics]) => {
                        const isOpen = openSections[categoryName] !== false;

                        return (
                          <div key={categoryName} className="transition-all">
                            <button
                              type="button"
                              onClick={() => toggleSection(categoryName)}
                              className={`w-full ${t.tableSection} px-4 sm:px-6 py-3 sm:py-3.5 flex items-center justify-between text-left transition-colors`}
                            >
                              <div className="flex items-center gap-2 whitespace-normal break-words">
                                <SlidersHorizontal className="w-4 h-4 text-sky-400 shrink-0" />
                                <span className={`font-bold text-xs sm:text-sm ${t.title} whitespace-normal break-words`}>
                                  {categoryName}
                                </span>
                                <span className={`text-[11px] ${t.subtext} font-mono shrink-0`}>
                                  ({metrics.length})
                                </span>
                              </div>
                              <div className={`${t.subtext} shrink-0 ml-2`}>
                                {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </div>
                            </button>

                            {isOpen && (
                              <div className="divide-y divide-slate-700/20">
                                {metrics.map((m, idx) => {
                                  const isNewlyAdded = recentlyAddedMetric === m.metric;
                                  const rawVals = m.values || [m.entity_a, m.entity_b];
                                  const isDifferent = rawVals.length > 1 && new Set(rawVals.map((v) => String(v).trim().toLowerCase())).size > 1;

                                  return (
                                    <div
                                      key={idx}
                                      className={`flex items-start gap-4 px-4 sm:px-6 py-3.5 sm:py-4 text-xs sm:text-sm ${t.tableRow} transition-all duration-300 ${
                                        isNewlyAdded
                                          ? 'bg-emerald-500/10 border-l-4 border-emerald-400'
                                          : highlightDiff && isDifferent
                                          ? 'bg-sky-500/5'
                                          : ''
                                      }`}
                                    >
                                      <div className="w-1/3 min-w-[180px] shrink-0 pr-2 align-top whitespace-normal break-words">
                                        <div className={`font-semibold ${t.title} leading-relaxed whitespace-normal break-words`}>
                                          {m.metric}
                                        </div>
                                        <div className="flex items-center gap-1.5 mt-1">
                                          <span className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded ${t.cardInner}`}>
                                            Official
                                          </span>
                                          {isNewlyAdded && (
                                            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                              Custom Added
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      {displayEntities.map((_, entIdx) => {
                                        const val = m.values?.[entIdx] !== undefined ? m.values[entIdx] : (entIdx === 0 ? m.entity_a : m.entity_b);
                                        return (
                                          <div key={entIdx} className="flex-1 min-w-[160px] leading-relaxed space-y-1.5 align-top whitespace-normal break-words">
                                            <div className="whitespace-normal break-words">{renderValueWithFallback(val)}</div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* TAB 2: Community & Reddit Sentiment Table */}
          {activeTab === 'community' && (
            <section className={`w-full ${t.card} rounded-2xl shadow-xl overflow-hidden print-clean`}>
              <div className={`p-3 sm:p-4 ${t.tableHeader} flex items-center justify-between text-xs`}>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" />
                  <span className="whitespace-normal break-words">
                    De-Biased Consensus: Hyperbolic & isolated personal rants stripped; consensus normalized.
                  </span>
                </div>
              </div>

              <div className="w-full overflow-x-auto whitespace-nowrap md:whitespace-normal">
                <div className="min-w-[650px] md:min-w-full">
                  {/* Sentiment Header */}
                  <div className={`${t.tableHeader} px-4 sm:px-6 py-3.5 flex items-center text-xs font-bold uppercase tracking-wider shadow-sm gap-4`}>
                    <div className="w-1/3 min-w-[180px] shrink-0 flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="truncate">Theme / Topic</span>
                    </div>
                    {displayEntities.map((ent, idx) => {
                      const badge = ENTITY_BADGES[idx % ENTITY_BADGES.length];
                      return (
                        <div key={idx} className={`flex-1 min-w-[160px] ${badge.text} flex items-center gap-1.5 whitespace-normal break-words`}>
                          <span className={`w-2 h-2 rounded-full ${badge.dot} shrink-0`} />
                          <span>{ent.name} Consensus</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Sentiment Rows */}
                  <div className="divide-y divide-slate-700/20">
                    {filteredCommunitySentiment.length === 0 ? (
                      <div className="p-8 sm:p-12 text-center text-slate-400 text-sm">
                        No community themes match &quot;{tableSearch}&quot;.
                      </div>
                    ) : (
                      filteredCommunitySentiment.map((s, idx) => (
                        <div
                          key={idx}
                          className={`flex items-start gap-4 px-4 sm:px-6 py-3.5 sm:py-4 text-xs sm:text-sm ${t.tableRow} transition-colors`}
                        >
                          <div className="w-1/3 min-w-[180px] shrink-0 pr-2 space-y-1.5 align-top whitespace-normal break-words">
                            <div className={`font-semibold ${t.title} leading-snug whitespace-normal break-words`}>{s.topic}</div>
                            <div>
                              <span
                                className={`inline-flex items-center gap-1 text-[10px] uppercase font-mono px-2 py-0.5 rounded border ${
                                  s.sentiment === 'Positive'
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                    : s.sentiment === 'Critical'
                                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                                    : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                                }`}
                              >
                                {s.sentiment === 'Positive' ? <ThumbsUp className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                                <span>{s.sentiment || 'Consensus'}</span>
                              </span>
                            </div>
                          </div>

                          {displayEntities.map((_, entIdx) => {
                            const con = s.consensuses?.[entIdx] !== undefined ? s.consensuses[entIdx] : (entIdx === 0 ? s.entity_a_consensus : s.entity_b_consensus);
                            return (
                              <div key={entIdx} className={`flex-1 min-w-[160px] leading-relaxed ${t.cardInner} p-2.5 sm:p-3 rounded-xl align-top whitespace-normal break-words`}>
                                {renderValueWithFallback(con)}
                              </div>
                            );
                          })}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Interactive Custom Metrics & AI Suggestions */}
          <section className={`w-full ${t.card} rounded-2xl p-4 sm:p-6 shadow-xl space-y-4 no-print`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-700/40">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
                <h3 className={`font-bold text-xs sm:text-sm ${t.title}`}>AI-Suggested Comparison Metrics</h3>
              </div>
              <span className={`text-[11px] sm:text-xs ${t.subtext}`}>Click any suggested chip to retrieve & append instantly</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {suggestedMetrics.map((sm, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAddCustomMetric(sm)}
                  disabled={addingMetric}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-xl ${t.btnSecondary} text-xs font-medium transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-40 shadow-xs`}
                >
                  <Plus className="w-3.5 h-3.5 text-sky-400" />
                  <span>{sm}</span>
                </button>
              ))}
            </div>

            <div className="pt-2">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddCustomMetric();
                }}
                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full max-w-xl"
              >
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={customMetricInput}
                    onChange={(e) => setCustomMetricInput(e.target.value)}
                    placeholder="+ Add custom metric (e.g. Midsole foam, Battery life, Lan speed)..."
                    disabled={addingMetric}
                    className={`w-full ${t.input} rounded-xl pl-3.5 pr-10 py-2 text-xs sm:text-sm outline-none transition-all shadow-inner`}
                  />
                </div>
                <button
                  type="submit"
                  disabled={addingMetric || !customMetricInput.trim()}
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-sky-600 hover:bg-sky-500 text-white active:scale-95 transition-all flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {addingMetric ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Adding...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Metric</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </section>
        </main>
      )}

      {/* Footer */}
      <footer className={`${t.footer} py-6 mt-8 sm:mt-12 text-center text-xs w-full transition-colors duration-300`}>
        <div className="w-full max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>MorphUI • Persistent Dual-View Spec Sheet & Spatial Graph Runtime</span>
          <span>© 2026 MorphUI</span>
        </div>
      </footer>
    </div>
  );
}
