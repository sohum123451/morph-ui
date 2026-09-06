'use client';

import '@xyflow/react/dist/style.css';
import React, { useState, useMemo, useRef, useEffect, useCallback, memo } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  BackgroundVariant,
  Handle,
  Position,
} from '@xyflow/react';
import {
  Sparkles,
  Search,
  ArrowLeftRight,
  Printer,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Building2,
  Scale,
  Award,
  SlidersHorizontal,
  ImagePlus,
  X,
  Eye,
  Loader2,
  Share2,
  ShieldCheck,
  FileSpreadsheet,
  Mic,
  MicOff,
  MessageSquare,
  Plus,
  ThumbsUp,
  AlertTriangle,
  FileText,
  Network,
  LayoutGrid,
  ArrowRight,
  History as HistoryIcon,
  Trash2,
} from 'lucide-react';
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
  btnPrimary: string;
  accentText: string;
  border: string;
  badge: string;
}> = {
  dark: {
    bg: 'bg-slate-950 text-slate-100 selection:bg-slate-800 selection:text-white',
    card: 'bg-slate-900 border-slate-800 text-slate-100 shadow-xl',
    cardInner: 'bg-slate-950/80 border-slate-800/80',
    nav: 'bg-slate-900/90 border-slate-800/80 text-white',
    input: 'bg-slate-950 border-slate-800 text-slate-100 focus:border-sky-500 placeholder-slate-500',
    btnPrimary: 'bg-sky-500 hover:bg-sky-400 text-white shadow-sky-500/20',
    accentText: 'text-sky-400',
    border: 'border-slate-800',
    badge: 'bg-slate-800 text-sky-400 border-slate-700',
  },
  light: {
    bg: 'bg-white text-slate-900 selection:bg-sky-100 selection:text-slate-900',
    card: 'bg-white border-slate-200 text-slate-900 shadow-xl shadow-slate-200/50',
    cardInner: 'bg-slate-50 border-slate-200',
    nav: 'bg-white/95 border-slate-200/90 text-slate-900 shadow-sm',
    input: 'bg-white border-slate-300 text-slate-900 focus:border-sky-500 placeholder-slate-400',
    btnPrimary: 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-600/20',
    accentText: 'text-sky-600',
    border: 'border-slate-200',
    badge: 'bg-slate-100 text-slate-700 border-slate-300',
  },
  botanical: {
    bg: 'bg-emerald-950 text-emerald-100 selection:bg-emerald-800 selection:text-white',
    card: 'bg-[#062c1e] border-emerald-800/80 text-emerald-100 shadow-xl shadow-emerald-950/50',
    cardInner: 'bg-[#041d14]/90 border-emerald-900/60',
    nav: 'bg-[#062c1e]/95 border-emerald-800/80 text-emerald-100 shadow-sm',
    input: 'bg-[#041d14] border-emerald-800/60 text-emerald-100 focus:border-emerald-400 placeholder-emerald-400/40',
    btnPrimary: 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-500/30',
    accentText: 'text-emerald-400',
    border: 'border-emerald-800/80',
    badge: 'bg-emerald-900/80 text-emerald-300 border-emerald-700',
  },
  pink: {
    bg: 'bg-[#0f0714] text-pink-50 selection:bg-pink-500 selection:text-white',
    card: 'bg-[#1a0c24] border-pink-950/80 text-pink-50 shadow-xl shadow-pink-950/40',
    cardInner: 'bg-[#0d0512]/90 border-pink-900/40',
    nav: 'bg-[#170a20]/95 border-pink-900/60 text-pink-50',
    input: 'bg-[#0d0512] border-pink-900/60 text-pink-50 focus:border-pink-500 placeholder-pink-400/40',
    btnPrimary: 'bg-pink-500 hover:bg-pink-400 text-white shadow-pink-500/30',
    accentText: 'text-pink-400',
    border: 'border-pink-900/60',
    badge: 'bg-pink-950 text-pink-300 border-pink-800',
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

function isMissingVerdictBullet(text: any): boolean {
  if (!text || typeof text !== 'string') return true;
  const clean = text.trim();
  if (!clean) return true;
  return /^(n\/?a|not specified.*|none|null|-|unknown)$/i.test(clean);
}

function renderValueWithFallback(val: any, fallbackText = 'Add specification...') {
  if (isMissingValue(val)) {
    return (
      <span className="inline-flex items-center gap-1 text-slate-400 dark:text-slate-500 italic text-xs bg-slate-800/30 px-2 py-0.5 rounded border border-slate-700/40 hover:border-sky-500/50 transition-colors cursor-text">
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
    <div className="w-[340px] sm:w-[440px] min-h-min h-auto bg-slate-900/95 dark:bg-slate-900/95 border border-slate-700/80 hover:border-sky-500/70 hover:shadow-sky-500/20 rounded-2xl p-4 sm:p-5 shadow-2xl text-slate-100 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] group">
      <div className="flex items-center gap-2 mb-1">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
        <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Live Matrix Stream</span>
      </div>
      <Handle type="target" position={Position.Left} className="!bg-sky-500 !w-3 !h-3 !border-2 !border-slate-900" />
      <Handle type="source" position={Position.Right} className="!bg-sky-500 !w-3 !h-3 !border-2 !border-slate-900" />
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
    <div className="w-[340px] sm:w-[460px] min-h-min h-auto bg-slate-900/95 dark:bg-slate-900/95 border border-slate-700/80 hover:border-indigo-500/70 hover:shadow-indigo-500/20 rounded-2xl p-4 sm:p-5 shadow-2xl text-slate-100 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] group">
      <div className="flex items-center gap-2 mb-1">
        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse shrink-0" />
        <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">De-Biasing Pipeline</span>
      </div>
      <Handle type="target" position={Position.Left} className="!bg-indigo-500 !w-3 !h-3 !border-2 !border-slate-900" />
      <Handle type="source" position={Position.Right} className="!bg-indigo-500 !w-3 !h-3 !border-2 !border-slate-900" />
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
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                    : s.sentiment === 'Critical'
                    ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                    : 'bg-amber-950/80 text-amber-300 border border-amber-800'
                }`}
              >
                {s.sentiment || 'Mixed'}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300 pt-1">
              {entityList.map((name, i) => {
                const con = s.consensuses?.[i] !== undefined ? s.consensuses[i] : (i === 0 ? s.entity_a_consensus : s.entity_b_consensus);
                const badge = ENTITY_BADGES[i % ENTITY_BADGES.length];
                return (
                  <div key={i} className="bg-slate-900/90 p-2 rounded-lg border border-slate-800 whitespace-normal break-words leading-relaxed">
                    <span className={`text-[10px] ${badge.text} font-semibold block mb-0.5`}>{name}:</span>
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

  const scores = useMemo(() => {
    return entityList.map((_, entIdx) => {
      let wins = 0;
      metrics.forEach((m: VerifiedMetric) => {
        const values = m.values || [m.entity_a, m.entity_b];
        const numVal = parseNumericValue(values[entIdx] || '');
        if (numVal !== null) {
          const isMax = values.every((otherVal, otherIdx) => {
            if (otherIdx === entIdx) return true;
            const otherNum = parseNumericValue(otherVal || '');
            return otherNum === null || numVal >= otherNum;
          });
          if (isMax) wins++;
        }
      });
      return wins;
    });
  }, [entityList, metrics]);

  return (
    <div className="w-[320px] sm:w-[400px] min-h-min h-auto bg-slate-900/95 border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-2xl text-slate-100 backdrop-blur-xl">
      <Handle type="target" position={Position.Left} className="!bg-emerald-500 !w-3 !h-3 !border-2 !border-slate-900" />
      <Handle type="source" position={Position.Right} className="!bg-emerald-500 !w-3 !h-3 !border-2 !border-slate-900" />
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-white">Comparative Score Ledger</h4>
            <span className="text-[10px] text-slate-400 font-mono">Verified Metric Differentials</span>
          </div>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-emerald-300 font-mono border border-slate-700 shrink-0">
          Node 3
        </span>
      </div>

      <div className={`grid grid-cols-${Math.min(entityList.length, 3)} gap-2.5 mb-4`}>
        {entityList.map((name, i) => {
          const badge = ENTITY_BADGES[i % ENTITY_BADGES.length];
          return (
            <div key={i} className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-center space-y-1">
              <span className={`text-[10px] ${badge.text} font-mono uppercase truncate block`}>{name}</span>
              <div className="text-xl font-black text-white">{scores[i]}</div>
              <span className="text-[9px] text-slate-400">Leading Points</span>
            </div>
          );
        })}
      </div>

      <div className="text-xs text-slate-400 leading-relaxed bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
        <span className="font-semibold text-slate-300">Analysis:</span> Multi-entity metrics benchmarked across comparative categories.
      </div>
    </div>
  );
});

const VerdictNode = memo(function VerdictNode({ data }: any) {
  const { entities = [], verdictSummary } = data;
  const entityList: EntityVerdict[] = entities.length > 0 ? entities : [
    { name: data.entityA || 'Option A', pros: data.prosA || [] },
    { name: data.entityB || 'Option B', pros: data.prosB || [] },
  ];

  return (
    <div className="w-[340px] sm:w-[460px] min-h-min h-auto bg-slate-900/95 border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-2xl text-slate-100 backdrop-blur-xl">
      <Handle type="target" position={Position.Left} className="!bg-amber-500 !w-3 !h-3 !border-2 !border-slate-900" />
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-white">Executive Synthesis</h4>
            <span className="text-[10px] text-slate-400 font-mono">Final Decision Matrix</span>
          </div>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-mono border border-slate-700 shrink-0">
          Node 4
        </span>
      </div>

      <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 mb-3 whitespace-normal break-words">
        {verdictSummary}
      </p>

      <div className={`grid grid-cols-1 sm:grid-cols-${Math.min(entityList.length, 3)} gap-2 text-xs`}>
        {entityList.map((ent, i) => {
          const badge = ENTITY_BADGES[i % ENTITY_BADGES.length];
          const pros = (Array.isArray(ent.pros) ? ent.pros : []).filter((p: string) => !isMissingVerdictBullet(p));
          return (
            <div key={i} className="p-2.5 bg-slate-950/70 rounded-lg border border-slate-800 whitespace-normal break-words leading-relaxed">
              <span className={`${badge.text} font-semibold block mb-1`}>Pick {ent.name}:</span>
              <span className="text-slate-300">{pros[0] || `Core domain baseline advantages for ${ent.name}`}</span>
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
  entityA?: string;
  entityB?: string;
  category: string;
  verifiedMetrics: VerifiedMetric[];
  communitySentiment: CommunitySentiment[];
  verdictSummary: string;
  prosA?: string[];
  prosB?: string[];
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
    <div className="relative w-full h-[60vh] sm:h-[70vh] md:h-[calc(100vh-140px)] min-h-[480px] bg-[#030712] rounded-2xl border border-slate-800/90 overflow-hidden shadow-2xl">
      <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10 flex flex-wrap items-center gap-2 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-700/80 shadow-lg text-xs">
        <div className="flex items-center gap-1.5 px-2 py-1 text-sky-400 font-semibold border-r border-slate-800">
          <Network className="w-3.5 h-3.5" />
          <span>Spatial Graph</span>
        </div>

        <button
          type="button"
          onClick={handleAutoLayout}
          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors flex items-center gap-1.5"
          title="Auto-Layout / Frame Canvas"
        >
          <LayoutGrid className="w-3.5 h-3.5 text-sky-400" />
          <span>Fit Graph</span>
        </button>

        <span className="text-[11px] font-mono text-slate-400 px-2 hidden sm:inline">
          4 Spatial Nodes
        </span>
      </div>

      <ReactFlow proOptions={{ hideAttribution: true }}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.2}
        maxZoom={1.6}
        defaultViewport={{ x: 0, y: 0, zoom: 0.75 }}
        className="w-full h-full"
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1.5} color="#1e293b" />
        <Controls position="bottom-right" className="!bg-slate-900 !border-slate-800 !text-slate-300" />
        <MiniMap
          nodeColor="#334155"
          maskColor="rgba(3, 7, 18, 0.7)"
          className="!bg-slate-950 !border-slate-800 rounded-xl overflow-hidden shadow-xl !hidden sm:!block"
        />
      </ReactFlow>
    </div>
  );
}

// ============================================================================
// MAIN COMPARISON APP COMPONENT
// ============================================================================

// ============================================================================
// GENERATIVE SKELETON UI (Mimics Spec Sheet & Spatial Canvas with Dynamic Tech Pulse)
// ============================================================================

function ComparisonSkeleton({ prompt, viewMode }: { prompt: string; viewMode: 'spec' | 'canvas' }) {
  const loadingSteps = [
    'Synthesizing live web data...',
    'Running multi-source extraction...',
    'De-biasing community sentiment...',
    'Normalizing dynamic metric matrices...',
    'Generating dual-view spatial graphs...',
  ];

  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % loadingSteps.length);
    }, 1200);
    return () => clearInterval(interval);
  }, [loadingSteps.length]);

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-6">
      {/* Tech-Focused Pulsing Loading Header */}
      <div className="relative p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-sky-950/50 via-indigo-950/50 to-slate-900/80 border border-sky-500/40 shadow-2xl backdrop-blur-xl overflow-hidden animate-pulse">
        <div className="absolute inset-0 bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-transparent animate-pulse" />
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 shrink-0">
              <Loader2 className="w-5 h-5 animate-spin text-sky-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider text-sky-300">
                  Live Extraction Pipeline Active
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2 justify-center sm:justify-start">
                <span>{loadingSteps[stepIndex]}</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-300 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800/80 max-w-sm truncate shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span className="truncate">{prompt ? `"${prompt}"` : 'Generative Multi-Source Comparison'}</span>
          </div>
        </div>
      </div>

      {viewMode === 'canvas' ? (
        /* Spatial Canvas Skeleton */
        <div className="relative w-full h-[60vh] sm:h-[70vh] md:h-[calc(100vh-180px)] min-h-[480px] bg-[#030712] rounded-2xl border border-slate-800/90 p-6 flex flex-col md:flex-row items-center justify-around gap-6 overflow-hidden animate-pulse">
          <div className="w-full sm:w-72 h-80 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="h-4 bg-slate-800 rounded w-1/2" />
              <div className="h-3 bg-slate-800/60 rounded w-12" />
            </div>
            <div className="h-3 bg-slate-800/60 rounded w-3/4" />
            <div className="space-y-3 pt-4">
              <div className="h-3.5 bg-slate-800/60 rounded" />
              <div className="h-3.5 bg-slate-800/50 rounded" />
              <div className="h-3.5 bg-slate-800/40 rounded" />
              <div className="h-3.5 bg-slate-800/30 rounded" />
            </div>
          </div>
          <div className="w-full sm:w-72 h-80 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="h-4 bg-slate-800 rounded w-1/2" />
              <div className="h-3 bg-slate-800/60 rounded w-12" />
            </div>
            <div className="h-3 bg-slate-800/60 rounded w-3/4" />
            <div className="space-y-3 pt-4">
              <div className="h-3.5 bg-slate-800/60 rounded" />
              <div className="h-3.5 bg-slate-800/50 rounded" />
              <div className="h-3.5 bg-slate-800/40 rounded" />
              <div className="h-3.5 bg-slate-800/30 rounded" />
            </div>
          </div>
          <div className="w-full sm:w-72 h-80 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="h-4 bg-slate-800 rounded w-1/2" />
              <div className="h-3 bg-slate-800/60 rounded w-12" />
            </div>
            <div className="h-3 bg-slate-800/60 rounded w-3/4" />
            <div className="space-y-3 pt-4">
              <div className="h-3.5 bg-slate-800/60 rounded" />
              <div className="h-3.5 bg-slate-800/50 rounded" />
              <div className="h-3.5 bg-slate-800/40 rounded" />
              <div className="h-3.5 bg-slate-800/30 rounded" />
            </div>
          </div>
        </div>
      ) : (
        /* Spec Sheet Skeleton */
        <div className="space-y-6 animate-pulse">
          {/* Skeleton Entity Hero Card */}
          <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 lg:p-8 space-y-6 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-6 border-b border-slate-800">
              <div className="flex-1 space-y-3">
                <div className="h-5 w-24 bg-slate-800 rounded-md" />
                <div className="h-8 w-48 sm:w-64 bg-slate-800 rounded-lg" />
                <div className="h-6 w-32 bg-slate-800/60 rounded-full" />
              </div>
              <div className="w-12 h-12 rounded-full bg-slate-800/80 mx-auto md:mx-0 flex items-center justify-center">
                <span className="font-mono text-xs text-slate-600 font-bold">VS</span>
              </div>
              <div className="flex-1 space-y-3 md:text-right flex flex-col md:items-end">
                <div className="h-5 w-24 bg-slate-800 rounded-md" />
                <div className="h-8 w-48 sm:w-64 bg-slate-800 rounded-lg" />
                <div className="h-6 w-32 bg-slate-800/60 rounded-full" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="h-4 w-40 bg-slate-800/60 rounded" />
              <div className="h-4 w-32 bg-slate-800/60 rounded" />
            </div>
          </div>

          {/* Skeleton Executive Verdict Card */}
          <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4 shadow-xl">
            <div className="h-6 w-48 bg-slate-800 rounded" />
            <div className="space-y-2 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
              <div className="h-4 w-full bg-slate-800/60 rounded" />
              <div className="h-4 w-5/6 bg-slate-800/60 rounded" />
              <div className="h-4 w-4/6 bg-slate-800/60 rounded" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-24 bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="h-4 w-32 bg-slate-800 rounded" />
                <div className="h-3 w-48 bg-slate-800/60 rounded" />
              </div>
              <div className="h-24 bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="h-4 w-32 bg-slate-800 rounded" />
                <div className="h-3 w-48 bg-slate-800/60 rounded" />
              </div>
            </div>
          </div>

          {/* Skeleton Table Section */}
          <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="w-full overflow-x-auto whitespace-nowrap md:whitespace-normal">
              <div className="min-w-[650px] md:min-w-full">
                <div className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-4 grid grid-cols-12 gap-4">
                  <div className="col-span-4 min-w-[150px]"><div className="h-4 w-28 bg-slate-800 rounded" /></div>
                  <div className="col-span-4 min-w-[150px]"><div className="h-4 w-36 bg-slate-800 rounded" /></div>
                  <div className="col-span-4 min-w-[150px]"><div className="h-4 w-36 bg-slate-800 rounded" /></div>
                </div>

                <div className="px-4 sm:px-6 py-3 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
                  <div className="h-4 w-40 bg-slate-800 rounded" />
                  <div className="h-4 w-6 bg-slate-800 rounded" />
                </div>

                <div className="divide-y divide-slate-800/60">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="grid grid-cols-12 gap-4 px-4 sm:px-6 py-4 items-center">
                      <div className="col-span-4 min-w-[150px] space-y-1.5">
                        <div className="h-4 bg-slate-800 rounded" style={{ width: `${60 + (i * 7) % 35}%` }} />
                        <div className="h-3 w-16 bg-slate-800/50 rounded" />
                      </div>
                      <div className="col-span-4 min-w-[150px] space-y-1.5">
                        <div className="h-4 bg-slate-800/80 rounded" style={{ width: `${70 + (i * 11) % 25}%` }} />
                        <div className="h-1.5 w-full bg-slate-800/40 rounded-full" />
                      </div>
                      <div className="col-span-4 min-w-[150px] space-y-1.5">
                        <div className="h-4 bg-slate-800/80 rounded" style={{ width: `${65 + (i * 13) % 30}%` }} />
                        <div className="h-1.5 w-full bg-slate-800/40 rounded-full" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


export default function ComparisonApp() {
  const [viewMode, setViewMode] = useState<'spec' | 'canvas'>('spec');

  // Initial State: 100% Clean & Empty
  const [prompt, setPrompt] = useState('');
  const [comparisonData, setComparisonData] = useState<GenerativeComparisonResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Spec Sheet Tab: "verified" vs "community"
  const [activeTab, setActiveTab] = useState<'verified' | 'community'>('verified');

  // Custom Metric Inline Input
  const [customMetricInput, setCustomMetricInput] = useState('');
  const [addingMetric, setAddingMetric] = useState(false);
  const [recentlyAddedMetric, setRecentlyAddedMetric] = useState<string | null>(null);

  // Multi-Modal Image Input
  const [uploadedImages, setUploadedImages] = useState<UploadedVisual[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Web Speech Recognition
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Table Controls
  const [isSwapped, setIsSwapped] = useState(false);
  const [highlightDiff, setHighlightDiff] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [tableSearch, setTableSearch] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{ id: string; title: string; created_at: string }>>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchChatHistory = useCallback(async () => {
    try {
      setLoadingHistory(true);
      const res = await fetch('/api/chats');
      if (res.ok) {
        const data = await res.json();
        setChatHistory(data.chats || []);
      }
    } catch (err) {
      console.warn('Failed to load chat history:', err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    fetchChatHistory();
  }, [fetchChatHistory]);

  const handleSelectChat = async (chatId: string) => {
    try {
      setLoading(true);
      setError(null);
      setActiveChatId(chatId);
      setIsSidebarOpen(false);
      const res = await fetch('/api/chats/' + chatId);
      if (!res.ok) throw new Error('Failed to load chat');
      const data = await res.json();

      const assistantMsg = data.messages?.find((m: any) => m.sender === 'assistant' && m.payload);
      const userMsg = data.messages?.find((m: any) => m.sender === 'user' && m.payload);

      if (userMsg?.payload?.prompt) {
        setPrompt(userMsg.payload.prompt);
      } else if (data.chat?.title) {
        setPrompt(data.chat.title);
      }

      if (assistantMsg?.payload) {
        const comp = assistantMsg.payload;
        let resolvedEntities: EntityVerdict[] = [];
        if (Array.isArray(comp.entities) && comp.entities.length > 0) {
          resolvedEntities = comp.entities.map((e: any, idx: number) => {
            const name = typeof e === 'object' && e?.name ? String(e.name) : typeof e === 'string' ? e : 'Option ' + String.fromCharCode(65 + idx);
            const pros = typeof e === 'object' && Array.isArray(e?.pros)
              ? e.pros.map(String).filter((p: string) => !isMissingVerdictBullet(p))
              : [];
            return {
              name,
              pros: pros.length > 0 ? pros : ['Key distinguishing features and strengths of ' + name],
            };
          });
        } else if (comp.entity_a && comp.entity_b) {
          resolvedEntities = [comp.entity_a, comp.entity_b];
        }

        let resolvedCategories = comp.categories || {};
        if (Object.keys(resolvedCategories).length === 0 && Array.isArray(comp.verified_metrics)) {
          resolvedCategories = { [comp.category || 'Core Specifications']: comp.verified_metrics };
        }

        setComparisonData({
          category: comp.category || 'Comparative Analysis',
          entities: resolvedEntities,
          entity_a: resolvedEntities[0],
          entity_b: resolvedEntities[1],
          categories: resolvedCategories,
          verified_metrics: Object.values(resolvedCategories).flat() as VerifiedMetric[],
          community_sentiment: Array.isArray(comp.community_sentiment) ? comp.community_sentiment : [],
          suggested_metrics: Array.isArray(comp.suggested_metrics) ? comp.suggested_metrics : [],
          verdict_summary: comp.veridict_summary || '',
          comparison_points: comp.comparison_points || [],
        });
      }
    } catch (err: any) {
      console.error('Error loading chat:', err);
      setError(err?.message || 'Could not load historical comparison');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChat = async (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    try {
      await fetch('/api/chats?id=' + chatId, { method: 'DELETE' });
      setChatHistory((prev) => prev.filter((c) => c.id !== chatId));
      if (activeChatId === chatId) {
        setActiveChatId(null);
      }
    } catch (err) {
      console.warn('Failed to delete chat:', err);
    }
  };

  const handleNewComparison = () => {
    setComparisonData(null);
    setPrompt('');
    setActiveChatId(null);
    setError(null);
    setUploadedImages([]);
    setIsSidebarOpen(false);
  };
  const [theme, setTheme] = useState<MorphTheme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('morph-theme');
      if (saved === 'light' || saved === 'pink' || saved === 'dark') return saved;
    }
    return 'dark';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('morph-theme', theme);
    }
  }, [theme]);
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
      const matching = metrics.filter(
        (m) =>
          m.metric.toLowerCase().includes(term) ||
          (m.values && m.values.some((v) => v.toLowerCase().includes(term))) ||
          (m.entity_a && m.entity_a.toLowerCase().includes(term)) ||
          (m.entity_b && m.entity_b.toLowerCase().includes(term))
      );
      if (matching.length > 0) {
        result[catName] = matching;
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
        (s.consensuses && s.consensuses.some((c) => c.toLowerCase().includes(term))) ||
        (s.entity_a_consensus && s.entity_a_consensus.toLowerCase().includes(term)) ||
        (s.entity_b_consensus && s.entity_b_consensus.toLowerCase().includes(term))
    );
  }, [normalizedCommunitySentiment, tableSearch]);

  // Initialize Web Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = () => setIsListening(false);

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            setPrompt(transcript);
            handleRunComparison(undefined, transcript);
          }
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please try Chrome, Edge, or Safari.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const base64 = uploadEvent.target?.result as string;
        setUploadedImages((prev) => {
          if (prev.length >= 2) return prev;
          return [
            ...prev,
            {
              data: base64,
              mimeType: file.type,
              name: file.name,
              previewUrl: URL.createObjectURL(file),
            },
          ];
        });
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddCustomMetric = async (metricName?: string) => {
    const targetMetric = (metricName || customMetricInput).trim();
    if (!targetMetric || !comparisonData) return;

    setAddingMetric(true);
    // Optimistic Insertion with inline fetching state
    const targetCat = 'User Added Metrics';
    const optimisticMetric: VerifiedMetric = {
      metric: targetMetric,
      entity_a: 'Fetching...',
      entity_b: 'Fetching...',
      values: displayEntities.map(() => 'Fetching...'),
      source_type: 'official',
    };

    setComparisonData((prev) => {
      if (!prev) return prev;
      const updatedCategories = { ...prev.categories };
      if (!updatedCategories[targetCat]) {
        updatedCategories[targetCat] = [];
      }
      updatedCategories[targetCat] = [
        ...updatedCategories[targetCat].filter((m) => m.metric !== targetMetric),
        optimisticMetric,
      ];
      return {
        ...prev,
        categories: updatedCategories,
        verified_metrics: [...prev.verified_metrics.filter((m) => m.metric !== targetMetric), optimisticMetric],
        suggested_metrics: prev.suggested_metrics.filter((sm) => sm !== targetMetric),
      };
    });

    setCustomMetricInput('');

    try {
      const res = await fetch('/api/compare/custom-metric', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityA: displayEntities[0]?.name || 'Option A',
          entityB: displayEntities[1]?.name || 'Option B',
          metric: targetMetric,
          category: comparisonData.category,
        }),
      });

      const data = res.ok ? await res.json() : null;

      const finalValA = data?.metric?.entity_a || 'Not available in current sources';
      const finalValB = data?.metric?.entity_b || 'Not available in current sources';
      const resolvedMetric: VerifiedMetric = {
        metric: targetMetric,
        entity_a: finalValA,
        entity_b: finalValB,
        values: [finalValA, finalValB],
        source_type: 'official',
      };

      setComparisonData((prev) => {
        if (!prev) return prev;
        const updatedCategories = { ...prev.categories };
        if (!updatedCategories[targetCat]) {
          updatedCategories[targetCat] = [];
        }
        updatedCategories[targetCat] = [
          ...updatedCategories[targetCat].filter((m) => m.metric !== targetMetric),
          resolvedMetric,
        ];
        return {
          ...prev,
          categories: updatedCategories,
          verified_metrics: [...prev.verified_metrics.filter((m) => m.metric !== targetMetric), resolvedMetric],
        };
      });

      setRecentlyAddedMetric(targetMetric);
      setTimeout(() => setRecentlyAddedMetric(null), 3000);
    } catch (err: any) {
      console.warn('Graceful fallback for custom metric:', err);
      // Resilient non-blocking fallback
      const fallbackMetric: VerifiedMetric = {
        metric: targetMetric,
        entity_a: 'Not available in current sources',
        entity_b: 'Not available in current sources',
        values: displayEntities.map(() => 'Not available in current sources'),
        source_type: 'official',
      };

      setComparisonData((prev) => {
        if (!prev) return prev;
        const updatedCategories = { ...prev.categories };
        if (!updatedCategories[targetCat]) {
          updatedCategories[targetCat] = [];
        }
        updatedCategories[targetCat] = [
          ...updatedCategories[targetCat].filter((m) => m.metric !== targetMetric),
          fallbackMetric,
        ];
        return {
          ...prev,
          categories: updatedCategories,
          verified_metrics: [...prev.verified_metrics.filter((m) => m.metric !== targetMetric), fallbackMetric],
        };
      });
    } finally {
      setAddingMetric(false);
    }
  };

  const handleRunComparison = async (e?: React.FormEvent, overridePrompt?: string) => {
    if (e) e.preventDefault();
    const query = overridePrompt !== undefined ? overridePrompt : prompt;
    if (!query.trim() && uploadedImages.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      let res;
      if (uploadedImages.length > 0) {
        res = await fetch('/api/compare/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            images: uploadedImages.map((img) => ({
              data: img.data,
              mimeType: img.mimeType,
            })),
            userPrompt: query,
          }),
        });
      } else {
        res = await fetch('/api/compare', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: query }),
        });
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with ${res.status}`);
      }

      const data = await res.json();

      let resolvedEntities: EntityVerdict[] = [];
      if (Array.isArray(data.entities) && data.entities.length > 0) {
        resolvedEntities = data.entities.map((e: any, idx: number) => {
          const name = typeof e === 'object' && e?.name ? String(e.name) : typeof e === 'string' ? e : `Option ${String.fromCharCode(65 + idx)}`;
          const pros = typeof e === 'object' && Array.isArray(e?.pros)
            ? e.pros.map(String).filter((p: string) => !isMissingVerdictBullet(p))
            : [];
          return {
            name,
            pros: pros.length > 0 ? pros : [`Established baseline capabilities for ${name}`],
          };
        });
      } else {
        const nameA = typeof data.entity_a === 'object' && data.entity_a?.name ? data.entity_a.name : 'Option A';
        const nameB = typeof data.entity_b === 'object' && data.entity_b?.name ? data.entity_b.name : 'Option B';
        const prosA = typeof data.entity_a === 'object' && Array.isArray(data.entity_a?.pros)
          ? data.entity_a.pros.filter((p: any) => !isMissingVerdictBullet(p))
          : [];
        const prosB = typeof data.entity_b === 'object' && Array.isArray(data.entity_b?.pros)
          ? data.entity_b.pros.filter((p: any) => !isMissingVerdictBullet(p))
          : [];
        resolvedEntities = [
          { name: nameA, pros: prosA.length > 0 ? prosA : [`Established baseline for ${nameA}`] },
          { name: nameB, pros: prosB.length > 0 ? prosB : [`Targeted advantages for ${nameB}`] },
        ];
      }

      let resolvedCategories: Record<string, VerifiedMetric[]> = {};
      if (data.categories && Object.keys(data.categories).length > 0) {
        resolvedCategories = data.categories;
      } else if (Array.isArray(data.verified_metrics) && data.verified_metrics.length > 0) {
        resolvedCategories = {
          [data.category || 'Core Specifications']: data.verified_metrics,
        };
      }

      const flatM = Object.values(resolvedCategories).flat();

      setComparisonData({
        category: data.category || 'Comparative Analysis',
        entities: resolvedEntities,
        entity_a: resolvedEntities[0],
        entity_b: resolvedEntities[1],
        categories: resolvedCategories,
        verified_metrics: flatM,
        community_sentiment: Array.isArray(data.community_sentiment) ? data.community_sentiment : [],
        suggested_metrics: Array.isArray(data.suggested_metrics) ? data.suggested_metrics : [],
        verdict_summary: data.verdict_summary || `Multi-entity comparison across ${resolvedEntities.map((e) => e.name).join(', ')}.`,
      });

      if (data.model_used) setActiveModel(data.model_used);
      setIsSwapped(false);
      setOpenSections({});
    } catch (err: any) {
      console.error('Comparison error:', err);
      setError(err?.message || 'Failed to fetch comparison');
    } finally {
      setLoading(false);
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
      <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-slate-800 selection:text-white flex flex-col justify-between w-full">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageUpload}
          accept="image/*"
          multiple
          className="hidden"
        />

        {/* Hero Top Navbar */}
        <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-xl w-full">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-sky-400 shadow-sm shrink-0">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-base sm:text-lg tracking-tight text-white">MorphUI</span>
                <span className="text-[10px] ml-2 uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-sky-300 border border-slate-700">
                  v2.0
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsSidebarOpen(true);
                  fetchChatHistory();
                }}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700/60 transition-all flex items-center gap-1.5 shadow-sm"
                title="View Past Comparisons"
              >
                <HistoryIcon className="w-3.5 h-3.5 text-sky-400" />
                <span>History</span>
                {chatHistory.length > 0 && (
                  <span className="px-1.5 py-0.2 bg-sky-500/20 text-sky-300 rounded-full text-[10px] font-mono">
                    {chatHistory.length}
                  </span>
                )}
              </button>
              <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>De-Biased Fact Engine</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Clean Hero Landing Section */}
        <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-20 text-center space-y-6 sm:space-y-8 flex-1 flex flex-col justify-center items-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-sky-400 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="font-semibold text-center">AI-Powered Entity Resolution & Reddit De-Biasing</span>
          </div>

          {/* Heading */}
          <div className="space-y-3 w-full">
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
              MorphUI: Real-Time Generative Comparisons
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Compare any two entities across any domain. Get instant side-by-side spec sheets, de-biased consensus, and spatial graph models.
            </p>
          </div>

          {/* Uploaded Images Preview if any */}
          {uploadedImages.length > 0 && (
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl flex flex-wrap items-center gap-3 w-full max-w-2xl text-left">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-sky-400" /> Visual Inputs ({uploadedImages.length}/2):
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {uploadedImages.map((img, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs"
                  >
                    <img src={img.previewUrl} alt={img.name} className="w-6 h-6 object-cover rounded" />
                    <span className="text-slate-300 font-medium truncate max-w-[120px] sm:max-w-[160px]">{img.name}</span>
                    <button
                      type="button"
                      onClick={() => setUploadedImages((prev) => prev.filter((_, i) => i !== idx))}
                      className="text-slate-500 hover:text-rose-400"
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
            <form onSubmit={handleRunComparison} className="relative flex items-center shadow-2xl w-full">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500 absolute left-3.5 sm:left-4 pointer-events-none" />
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Compare any two entities (e.g., Apple vs Mango, Sony WH-1000XM5 vs Bose QC Ultra)..."
                className="w-full bg-slate-900/90 border-2 border-slate-800 focus:border-sky-500 rounded-2xl pl-10 sm:pl-12 pr-24 sm:pr-28 py-3.5 sm:py-4 text-xs sm:text-base text-slate-100 placeholder-slate-500 outline-none transition-all shadow-inner"
              />

              <div className="absolute right-1.5 sm:right-2.5 flex items-center gap-1 sm:gap-1.5">
                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  title="Voice Search"
                  className={`p-1.5 sm:p-2 rounded-xl transition-colors ${
                    isListening
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'text-slate-400 hover:text-sky-400 hover:bg-slate-800'
                  }`}
                >
                  {isListening ? <MicOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Mic className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload image to compare"
                  className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-sky-400 hover:bg-slate-800 transition-colors"
                >
                  <ImagePlus className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>

                <button
                  type="submit"
                  disabled={!prompt.trim() && uploadedImages.length === 0}
                  className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs sm:text-sm active:scale-95 transition-all flex items-center gap-1.5 shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span className="hidden xs:inline">Compare</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>

          {/* Inspiration Query Chips */}
          <div className="space-y-2 pt-2 w-full">
            <span className="text-xs text-slate-500 font-medium block">Try a sample search:</span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {[
                { label: '🍎 Apple vs 🥭 Mango', query: 'Apple vs Mango: Nutrition & Shelf Life' },
                { label: '🎧 Sony WH-1000XM5 vs Bose QC Ultra', query: 'Sony WH-1000XM5 vs Bose QC Ultra' },
                { label: '👟 Nike Pegasus 41 vs Adidas Ultraboost', query: 'Nike Pegasus 41 vs Adidas Ultraboost Light' },
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
                  className="px-3 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 hover:text-slate-100 text-slate-400 border border-slate-800 text-xs transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </main>

        <footer className="border-t border-slate-800/80 bg-slate-900/40 py-6 text-center text-xs text-slate-500 w-full">
          <div className="w-full max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>MorphUI • Real-Time Generative Comparisons</span>
            <span>Zero-slop human-engineered runtime (2026)</span>
          </div>
        </footer>
      </div>
    );
  }

  // 2. GENERATIVE LOADING STATE WITH SKELETON UI
  const isLoading = loading;
  if (isLoading && !comparisonData) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-slate-800 selection:text-white pb-16 w-full">
        <header className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-xl sticky top-0 z-40 w-full">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4">
            <div className="flex items-center justify-between w-full md:w-auto gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-sky-400 shadow-sm shrink-0">
                  <Scale className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm sm:text-base tracking-tight text-white">MorphUI</span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-sky-300 border border-slate-700">
                      Dual-Engine
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 hidden sm:block">Spec Sheet & Spatial Graph Runtime</p>
                </div>
              </div>
            </div>

            <div className="w-full md:w-auto md:flex-1 max-w-2xl">
              <div className="relative w-full flex items-center">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  value={prompt}
                  readOnly
                  disabled
                  placeholder="Synthesizing comparison..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-12 py-2 text-xs sm:text-sm text-slate-300 placeholder-slate-500 outline-none shadow-inner"
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
          <ComparisonSkeleton prompt={prompt} viewMode={viewMode} />
        </main>
      </div>
    );
  }

  // 3. ACTIVE COMPARISON VIEW
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-slate-800 selection:text-white pb-16 w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        multiple
        className="hidden"
      />

            {/* History Sidebar Drawer (Accessible on all screens) */}
      <div
        className={`fixed inset-0 z-50 transition-opacity duration-300 ${
          isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
        {/* Drawer Panel */}
        <aside
          className={`absolute top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-slate-900 border-r border-slate-800 shadow-2xl p-4 flex flex-col justify-between transition-transform duration-300 ease-in-out ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <HistoryIcon className="w-4 h-4 text-sky-400" />
                <span className="font-bold text-sm text-white">Comparison History</span>
              </div>
              <button
                type="button"
                onClick={() => setIsSidebarOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-3">
              <button
                type="button"
                onClick={handleNewComparison}
                className="w-full py-2 px-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all"
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
                  <p className="text-[11px] text-slate-600 mt-1">Comparisons are encrypted & saved automatically.</p>
                </div>
              ) : (
                chatHistory.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => handleSelectChat(chat.id)}
                    className={`group flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                      activeChatId === chat.id
                        ? 'bg-sky-500/10 border-sky-500/30 text-sky-200'
                        : 'bg-slate-950/40 border-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
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
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-slate-800/80 transition-all shrink-0 ml-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> AES-256 Encrypted
              </span>
              <span className="text-[10px] font-mono text-slate-600">Turso DB</span>
            </div>
          </div>
        </aside>
      </div>

      {/* Fully Responsive Active Navigation Bar (Stacks on mobile, inline on desktop) */}
      <header className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-xl sticky top-0 z-40 w-full">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4">
          {/* Top Bar Row 1 on Mobile: Logo, History Toggle, and View Switcher */}
          <div className="flex items-center justify-between w-full md:w-auto gap-3 shrink-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsSidebarOpen(true);
                  fetchChatHistory();
                }}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-all flex items-center gap-1.5 shadow-sm"
                title="Open History Sidebar"
              >
                <HistoryIcon className="w-4 h-4 text-sky-400" />
                <span className="hidden lg:inline text-xs font-medium">History</span>
                {chatHistory.length > 0 && (
                  <span className="px-1.5 py-0.2 bg-sky-500/20 text-sky-300 rounded-full text-[10px] font-mono">
                    {chatHistory.length}
                  </span>
                )}
              </button>

              <div className="flex items-center gap-2 cursor-pointer" onClick={handleNewComparison} title="New Comparison">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-sky-400 shadow-sm shrink-0">
                  <Scale className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm sm:text-base tracking-tight text-white">MorphUI</span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-sky-300 border border-slate-700">
                      Dual-Engine
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 hidden sm:block">Spec Sheet & Spatial Graph Runtime</p>
                </div>
              </div>
            </div>

            {/* Mobile-visible View Switcher */}
            <div className="flex md:hidden items-center p-1 rounded-xl bg-slate-950/80 border border-slate-800 shadow-inner">
              <button
                type="button"
                onClick={() => setViewMode('spec')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                  viewMode === 'spec'
                    ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
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
                  viewMode === 'canvas'
                    ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Spatial Canvas Graph View"
              >
                <Network className="w-3 h-3 text-indigo-400" />
                <span>Canvas</span>
              </button>
            </div>
          </div>

          {/* Central Expanding Search Input (Full width on mobile) */}
          <div className="w-full md:w-auto md:flex-1 max-w-2xl">
            <form onSubmit={handleRunComparison} className="relative w-full flex items-center">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 pointer-events-none" />
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Compare any two entities (e.g., Apple vs Mango, Shoes, Phones)..."
                disabled={loading}
                className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl pl-9 pr-24 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 outline-none transition-all shadow-inner"
              />

              <div className="absolute right-1.5 flex items-center gap-1">
                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  title="Voice Search"
                  className={`p-1.5 rounded-lg transition-colors ${
                    isListening
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'text-slate-400 hover:text-sky-400 hover:bg-slate-800'
                  }`}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload image"
                  disabled={loading || uploadedImages.length >= 2}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-slate-800 transition-colors disabled:opacity-40"
                >
                  <ImagePlus className="w-4 h-4" />
                </button>

                <button
                  type="submit"
                  disabled={loading || (!prompt.trim() && uploadedImages.length === 0)}
                  title="Run Comparison"
                  className="p-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white active:scale-95 transition-all shadow-sm flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
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

          {/* Desktop-only View Switcher & Keyboard Shortcut */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
                        {/* Functional Theme Switcher */}
            <div className="flex items-center p-1 rounded-xl bg-slate-900/90 dark:bg-slate-950/90 border border-slate-700/80 shadow-inner shrink-0">
              <button
                type="button"
                onClick={() => setTheme('dark')}
                title="Dark Mode"
                className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                  theme === 'dark'
                    ? 'bg-slate-800 text-sky-400 shadow-sm border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>🌙</span>
                <span className="hidden lg:inline text-[11px]">Dark</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('light')}
                title="Clean White Mode"
                className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                  theme === 'light'
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>☀️</span>
                <span className="hidden lg:inline text-[11px]">Light</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('botanical')}
                title="Botanical Emerald Mode"
                className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                  theme === 'botanical'
                    ? 'bg-emerald-700 text-white shadow-sm border border-emerald-600'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>🌿</span>
                <span className="hidden lg:inline text-[11px]">Botanical</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('pink')}
                title="C2C Pink Theme"
                className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                  theme === 'pink'
                    ? 'bg-pink-600 text-white shadow-sm border border-pink-500'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>🌸</span>
                <span className="hidden lg:inline text-[11px]">Pink</span>
              </button>
            </div>
            <div className="flex items-center p-1 rounded-xl bg-slate-950/80 border border-slate-800 shadow-inner">
              <button
                type="button"
                onClick={() => setViewMode('spec')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  viewMode === 'spec'
                    ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Spec Sheet View (Press 'V' to flip)"
              >
                <FileText className="w-3.5 h-3.5 text-sky-400" />
                <span>Spec Sheet</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('canvas')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  viewMode === 'canvas'
                    ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Spatial Canvas Graph View (Press 'V' to flip)"
              >
                <Network className="w-3.5 h-3.5 text-indigo-400" />
                <span>Spatial Canvas</span>
              </button>
            </div>

            <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px]">
                V
              </kbd>
              <span>toggle view</span>
            </div>
          </div>
        </div>

        {isListening && (
          <div className="bg-rose-500/10 border-t border-rose-500/20 py-1 px-4 text-center text-xs text-rose-300 flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span className="font-semibold">Listening to your voice... Speak your comparison now!</span>
          </div>
        )}
      </header>

      {/* VIEWPORT BODY: DUAL-VIEW (Clean Container max-w-7xl mx-auto px-4) */}
      {viewMode === 'canvas' ? (
        // VIEW 2: SPATIAL CANVAS GRAPH VIEW
        <main className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4">
          <ReactFlowProvider>
            <SpatialCanvasWorkspace
              entities={displayEntities}
              category={category}
              verifiedMetrics={flatVerifiedMetrics}
              communitySentiment={normalizedCommunitySentiment}
              verdictSummary={verdictSummary}
              theme={theme}
            />
          </ReactFlowProvider>
        </main>
      ) : (
        // VIEW 1: SPEC SHEET VIEW (w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8)
        <main className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-6">
          {/* Uploaded Images Preview */}
          {uploadedImages.length > 0 && (
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl flex flex-wrap items-center gap-3 w-full">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-sky-400" /> Visual Inputs ({uploadedImages.length}/2):
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {uploadedImages.map((img, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs"
                  >
                    <img src={img.previewUrl} alt={img.name} className="w-6 h-6 object-cover rounded" />
                    <span className="text-slate-300 font-medium truncate max-w-[120px] sm:max-w-[160px]">{img.name}</span>
                    <button
                      type="button"
                      onClick={() => setUploadedImages((prev) => prev.filter((_, i) => i !== idx))}
                      className="text-slate-500 hover:text-rose-400"
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

          {/* Main Entity Comparison Hero Card (Dynamic Multi-Entity or 2-way VS layout) */}
          <section className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 lg:p-8 shadow-xl relative overflow-hidden">
            {displayEntities.length <= 2 ? (
              <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4 sm:gap-6 pb-4 sm:pb-6 border-b border-slate-800">
                {/* Entity A */}
                <div className="flex-1 space-y-1.5 sm:space-y-2 w-full">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-slate-800 text-sky-400 border border-slate-700 shrink-0">
                      Option A
                    </span>
                    <span className="text-xs text-slate-400 whitespace-normal break-words">{category}</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white whitespace-normal break-words leading-tight">
                    {displayEntityA}
                  </h1>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/90 border border-slate-700 text-xs font-medium text-slate-200">
                    <Award className="w-3.5 h-3.5 text-sky-400" />
                    <span>Verified Baseline</span>
                  </div>
                </div>

                {/* VS Badge */}
                <div className="flex flex-row md:flex-col items-center justify-center shrink-0 my-1 md:my-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center shadow-md">
                    <span className="font-bold font-mono text-xs sm:text-sm text-slate-400">VS</span>
                  </div>
                </div>

                {/* Entity B */}
                <div className="flex-1 space-y-1.5 sm:space-y-2 md:text-right w-full">
                  <div className="flex items-center gap-2 md:justify-end">
                    <span className="text-xs text-slate-400 whitespace-normal break-words">{category}</span>
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-slate-800 text-indigo-400 border border-slate-700 shrink-0">
                      Option B
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white whitespace-normal break-words leading-tight">
                    {displayEntityB}
                  </h1>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/90 border border-slate-700 text-xs font-medium text-slate-200">
                    <Award className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Verified Baseline</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative z-10 space-y-4 pb-4 sm:pb-6 border-b border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{category}</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-sky-300 border border-slate-700">
                    {displayEntities.length}-Way Comparison
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {displayEntities.map((ent, idx) => {
                    const badge = ENTITY_BADGES[idx % ENTITY_BADGES.length];
                    return (
                      <div key={idx} className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/90 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${badge.bg}`}>
                            {badge.label}
                          </span>
                          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                        </div>
                        <h2 className="text-base sm:text-lg font-bold text-white leading-snug break-words">{ent.name}</h2>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1">
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
            <div className="pt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-slate-500 gap-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="whitespace-normal break-words">Reddit De-Biasing & Multi-Source Extraction Engine</span>
              </div>
              <div className="font-mono text-[11px] text-slate-400">
                {activeModel}
              </div>
            </div>
          </section>

          {/* Executive Verdict Card with Full Width on Mobile & grid-cols-1 md:grid-cols-2 */}
          <section className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4 sm:space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
              <div className="p-1.5 rounded-lg bg-slate-800 text-sky-400 border border-slate-700 shrink-0">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-xs sm:text-sm text-white tracking-tight">Executive Verdict & Synthesis</h3>
                <p className="text-[11px] sm:text-xs text-slate-400">Synthesized takeaway balancing verified data & Reddit consensus</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-950/60 p-3.5 sm:p-4 rounded-xl border border-slate-800/80 whitespace-normal break-words">
              {verdictSummary}
            </p>

            {/* Dynamic Multi-Entity Pros Recommendation Grid */}
            <div className={`grid grid-cols-1 ${displayEntities.length > 2 ? 'md:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-2'} gap-3 sm:gap-4 w-full`}>
              {displayEntities.map((ent, entIdx) => {
                const badge = ENTITY_BADGES[entIdx % ENTITY_BADGES.length];
                const pros = ent.pros && ent.pros.length > 0 ? ent.pros : ['Key distinguishing features and strengths of ' + ent.name];
                return (
                  <div key={entIdx} className="w-full bg-slate-950/80 border border-slate-800/90 rounded-xl p-3.5 sm:p-4 space-y-2.5 sm:space-y-3">
                    <div className={`flex items-center gap-2 ${badge.text} font-semibold text-xs uppercase tracking-wider`}>
                      <CheckCircle2 className={`w-4 h-4 ${badge.text} shrink-0`} />
                      <span className="whitespace-normal break-words">Choose {ent.name} if:</span>
                    </div>
                    <ul className="space-y-2 text-xs text-slate-300">
                      {pros.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 whitespace-normal break-words leading-relaxed">
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

          {/* Partitioned Tabs & Utility Toolbar (Fully Responsive) */}
          <section className="w-full space-y-3 no-print">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-900 border border-slate-800 p-2 rounded-2xl w-full">
              <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab('verified')}
                  className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 sm:gap-2 ${
                    activeTab === 'verified'
                      ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="truncate">Verified Facts</span>
                  <span className="text-[10px] sm:text-[11px] font-mono px-1.5 py-0.2 rounded bg-slate-900 text-slate-400 border border-slate-800">
                    {flatVerifiedMetrics.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('community')}
                  className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 sm:gap-2 ${
                    activeTab === 'community'
                      ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 text-sky-400 shrink-0" />
                  <span className="truncate">Reddit Sentiment</span>
                  <span className="text-[10px] sm:text-[11px] font-mono px-1.5 py-0.2 rounded bg-slate-900 text-sky-300 border border-slate-800">
                    {communitySentiment.length}
                  </span>
                </button>
              </div>

              {/* Quick Filter Search */}
              <div className="flex items-center gap-2 px-1 sm:px-2 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                    placeholder="Filter attributes & themes..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-600"
                  />
                </div>
              </div>
            </div>

            {/* Action Utilities (Horizontal scroll or flex-wrap on small screens) */}
            <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-2.5 flex flex-wrap items-center justify-between gap-2 shadow-sm">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => setIsSwapped((prev) => !prev)}
                  className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white transition-colors flex items-center gap-1.5"
                  title="Swap Entity Columns"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5 text-sky-400" />
                  <span>Swap</span>
                </button>

                <button
                  type="button"
                  onClick={() => setHighlightDiff((prev) => !prev)}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    highlightDiff
                      ? 'bg-sky-500/10 border-sky-500/40 text-sky-300'
                      : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                  <span>Diff</span>
                </button>

                <button
                  type="button"
                  onClick={toggleAllSections}
                  className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white transition-colors flex items-center gap-1.5"
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
                  className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden xs:inline">Export PDF</span>
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  className="p-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors"
                  title="Share comparison summary"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </section>

          {/* TAB 1: Verified Facts & Official Specs Table (Dynamic N-Way Columns) */}
          {activeTab === 'verified' && (
            <section className="w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden print-clean">
              <div className="w-full overflow-x-auto whitespace-nowrap md:whitespace-normal">
                <div className="min-w-[650px] md:min-w-full">
                  {/* Table Header */}
                  <div className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-3.5 flex items-center text-xs font-bold uppercase tracking-wider text-slate-400 shadow-sm gap-4">
                    <div className="w-1/3 min-w-[180px] shrink-0 flex items-center gap-1.5">
                      <FileSpreadsheet className="w-4 h-4 text-slate-500 shrink-0" />
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
                  <div className="divide-y divide-slate-800">
                    {Object.keys(filteredCategories).length === 0 ? (
                      <div className="p-8 sm:p-12 text-center text-slate-500 text-sm">
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
                              className="w-full bg-slate-950/70 hover:bg-slate-950/90 px-4 sm:px-6 py-3 sm:py-3.5 flex items-center justify-between text-left transition-colors border-t first:border-t-0 border-slate-800"
                            >
                              <div className="flex items-center gap-2 whitespace-normal break-words">
                                <SlidersHorizontal className="w-4 h-4 text-sky-400 shrink-0" />
                                <span className="font-bold text-xs sm:text-sm text-slate-200 whitespace-normal break-words">
                                  {categoryName}
                                </span>
                                <span className="text-[11px] text-slate-500 font-mono shrink-0">
                                  ({metrics.length})
                                </span>
                              </div>
                              <div className="text-slate-500 hover:text-slate-300 shrink-0 ml-2">
                                {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </div>
                            </button>

                            {isOpen && (
                              <div className="divide-y divide-slate-800/60 bg-slate-900/60">
                                {metrics.map((m, idx) => {
                                  const isNewlyAdded = recentlyAddedMetric === m.metric;
                                  const rawVals = m.values || [m.entity_a, m.entity_b];
                                  const isDifferent = rawVals.length > 1 && new Set(rawVals.map((v) => String(v).trim().toLowerCase())).size > 1;

                                  return (
                                    <div
                                      key={idx}
                                      className={`flex items-start gap-4 px-4 sm:px-6 py-3.5 sm:py-4 text-xs sm:text-sm transition-all duration-500 ${
                                        isNewlyAdded
                                          ? 'bg-emerald-950/40 border-l-4 border-emerald-400'
                                          : highlightDiff && isDifferent
                                          ? 'bg-sky-950/20 hover:bg-sky-950/30'
                                          : 'hover:bg-slate-800/40'
                                      }`}
                                    >
                                      <div className="w-1/3 min-w-[180px] shrink-0 pr-2 align-top whitespace-normal break-words">
                                        <div className="font-semibold text-slate-200 leading-relaxed whitespace-normal break-words">
                                          {m.metric}
                                        </div>
                                        <div className="flex items-center gap-1.5 mt-1">
                                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                                            Official
                                          </span>
                                          {isNewlyAdded && (
                                            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                                              Custom Added
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      {displayEntities.map((_, entIdx) => {
                                        const val = m.values?.[entIdx] !== undefined ? m.values[entIdx] : (entIdx === 0 ? m.entity_a : m.entity_b);
                                        return (
                                          <div key={entIdx} className="flex-1 min-w-[160px] text-slate-300 leading-relaxed space-y-1.5 align-top whitespace-normal break-words">
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

          {/* TAB 2: Community & Reddit Sentiment Table (Dynamic N-Way Columns) */}
          {activeTab === 'community' && (
            <section className="w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden print-clean">
              <div className="p-3 sm:p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
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
                  <div className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-3.5 flex items-center text-xs font-bold uppercase tracking-wider text-slate-400 shadow-sm gap-4">
                    <div className="w-1/3 min-w-[180px] shrink-0 flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-slate-500 shrink-0" />
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
                  <div className="divide-y divide-slate-800/70 bg-slate-900/60">
                    {filteredCommunitySentiment.length === 0 ? (
                      <div className="p-8 sm:p-12 text-center text-slate-500 text-sm">
                        No community themes match &quot;{tableSearch}&quot;.
                      </div>
                    ) : (
                      filteredCommunitySentiment.map((s, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-4 px-4 sm:px-6 py-3.5 sm:py-4 text-xs sm:text-sm hover:bg-slate-800/40 transition-colors"
                        >
                          <div className="w-1/3 min-w-[180px] shrink-0 pr-2 space-y-1.5 align-top whitespace-normal break-words">
                            <div className="font-semibold text-slate-200 leading-snug whitespace-normal break-words">{s.topic}</div>
                            <div>
                              <span
                                className={`inline-flex items-center gap-1 text-[10px] uppercase font-mono px-2 py-0.5 rounded border ${
                                  s.sentiment === 'Positive'
                                    ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300'
                                    : s.sentiment === 'Critical'
                                    ? 'bg-rose-950/60 border-rose-800/80 text-rose-300'
                                    : 'bg-amber-950/60 border-amber-800/80 text-amber-300'
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
                              <div key={entIdx} className="flex-1 min-w-[160px] text-slate-300 leading-relaxed bg-slate-950/50 p-2.5 sm:p-3 rounded-xl border border-slate-800/60 align-top whitespace-normal break-words">
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

          {/* Interactive Custom Metrics & AI Suggestions (Full Width Responsive) */}
          <section className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4 no-print">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
                <h3 className="font-bold text-xs sm:text-sm text-white">AI-Suggested Comparison Metrics</h3>
              </div>
              <span className="text-[11px] sm:text-xs text-slate-400">Click any suggested chip to retrieve & append instantly</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {suggestedMetrics.map((sm, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAddCustomMetric(sm)}
                  disabled={addingMetric}
                  className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 hover:border-sky-500/50 text-slate-300 hover:text-white border border-slate-800 text-xs font-medium transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-40"
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
                    className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl pl-3.5 pr-10 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 outline-none transition-all shadow-inner"
                  />
                </div>
                <button
                  type="submit"
                  disabled={addingMetric || !customMetricInput.trim()}
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-sky-500 hover:bg-sky-400 text-white active:scale-95 transition-all flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
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
      <footer className="border-t border-slate-800/80 bg-slate-900/40 py-6 mt-8 sm:mt-12 text-center text-xs text-slate-500 w-full">
        <div className="w-full max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>MorphUI • Persistent Dual-View Spec Sheet & Spatial Graph Runtime</span>
          <span>Zero-slop human-engineered architecture (2026)</span>
        </div>
      </footer>
    </div>
  );
}
