'use client';

import React, { Component, ErrorInfo, ReactNode, memo, useEffect, useMemo, useState, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  NodeProps,
  Handle,
  Position,
  BackgroundVariant,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  useReactFlow,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion } from 'framer-motion';

import { ComparisonTableWidget } from './widgets/ComparisonTableWidget';
import { BudgetTrackerWidget } from './widgets/BudgetTrackerWidget';
import { TimelineCalendarWidget } from './widgets/TimelineCalendarWidget';
import { AdmissionPredictorWidget } from './widgets/AdmissionPredictorWidget';
import { DivergenceLedgerWidget } from './widgets/DivergenceLedgerWidget';
import { validateAndSanitizeWidgetProps } from '@/lib/widgets/registry';
import { useGenerativeCanvasLoop } from '@/lib/hooks/useGenerativeCanvasLoop';
import { VerifiedMetric, CommunitySentiment } from '@/types/morphui';
import { getLayoutedElements, generateComparisonGraph, layoutDynamicNodesAndEdges } from '@/lib/spatialLayout';
import {
  AlertTriangle,
  RefreshCw,
  Maximize2,
  MoveDown,
  MoveRight,
  SlidersHorizontal,
  RotateCcw,
  Sparkles,
  Award,
  MessageSquare,
  CheckCircle2,
  TrendingUp,
  PlusCircle,
  Zap,
  DollarSign,
  Calendar,
  Loader2,
  X,
} from 'lucide-react';

// --- 1. DETERMINISTIC COMPONENT REGISTRY ---
export const COMPONENT_REGISTRY = {
  ComparisonTable: ComparisonTableWidget,
  BudgetTracker: BudgetTrackerWidget,
  TimelineCalendar: TimelineCalendarWidget,
  AdmissionPredictor: AdmissionPredictorWidget,
  DivergenceLedger: DivergenceLedgerWidget,
  comparison_table: ComparisonTableWidget,
  budget_tracker: BudgetTrackerWidget,
  timeline_calendar: TimelineCalendarWidget,
  admission_predictor: AdmissionPredictorWidget,
  divergence_ledger: DivergenceLedgerWidget,
};

// --- 2. GRACEFUL WIDGET ERROR FALLBACK CARD ---
export interface WidgetErrorFallbackProps {
  type?: string;
  error?: Error | null;
  message?: string;
  onRetry?: () => void;
}

export function WidgetErrorFallback({
  type = 'Unknown',
  error,
  message,
  onRetry,
}: WidgetErrorFallbackProps) {
  return (
    <div className="w-full min-w-[320px] max-w-md rounded-2xl border border-red-500/30 bg-red-950/20 p-5 backdrop-blur-md shadow-xl text-zinc-200 transition-all hover:border-red-500/50">
      <div className="flex items-start gap-3.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-semibold text-red-200 truncate">
              Live Stream Validation Error
            </h4>
            <span className="inline-block px-2 py-0.5 text-[10px] uppercase font-mono font-bold tracking-wider rounded bg-red-500/20 text-red-300 border border-red-500/30">
              {type}
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-400 line-clamp-2 leading-relaxed">
            {message || error?.message || 'Live payload failed validation or contained malformed data.'}
          </p>

          <div className="mt-3.5 flex items-center justify-between pt-2 border-t border-red-500/10">
            <span className="text-[11px] text-zinc-500 font-mono">
              Live telemetry boundary active
            </span>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg transition-colors active:scale-95"
              >
                <RefreshCw className="h-3 w-3" />
                Retry
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- 3. COMPONENT-LEVEL ERROR BOUNDARY ---
interface ErrorBoundaryProps {
  widgetType: string;
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class WidgetErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn(`[WidgetErrorBoundary] Caught failure in <${this.props.widgetType}>:`, error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <WidgetErrorFallback
          type={this.props.widgetType}
          error={this.state.error}
          onRetry={this.handleRetry}
        />
      );
    }
    return this.props.children;
  }
}

// --- 4. SAFE COMPONENT RENDERER WITH ZOD VALIDATION ---
export function renderWidgetComponent(type: string, data: any) {
  const WidgetComponent = COMPONENT_REGISTRY[type as keyof typeof COMPONENT_REGISTRY];
  if (!WidgetComponent) {
    return <WidgetErrorFallback type={type} message={`Unknown widget registry type: "${type}"`} />;
  }

  const rawPayload = data && data.data !== undefined ? data.data : data;
  const validationResult = validateAndSanitizeWidgetProps(type, rawPayload);

  if (!validationResult.success) {
    return <WidgetErrorFallback type={type} message={validationResult.error} />;
  }

  return (
    <WidgetErrorBoundary widgetType={type}>
      <WidgetComponent data={validationResult.data} />
    </WidgetErrorBoundary>
  );
}

function parseMetricNumber(val: any): number {
  if (val === null || val === undefined) return 50;
  const str = String(val).replace(/,/g, '');
  const match = str.match(/[-+]?\d*\.?\d+/);
  if (!match) {
    if (/yes|true|standard|supported|high|superior/i.test(str)) return 85;
    if (/no|false|none|low|inferior/i.test(str)) return 35;
    return 60;
  }
  const parsed = parseFloat(match[0]);
  return isNaN(parsed) ? 50 : parsed;
}

// --- 5. CUSTOM REACTFLOW GRAPH NODES ---

const EntityGraphNode = memo(function EntityGraphNode({ data }: NodeProps) {
  const { name, score, verdict, pros = [], index = 0, isWinner = false } = (data || {}) as any;
  const colors = [
    { border: 'border-sky-500/60', badge: 'bg-sky-500/20 text-sky-300 border-sky-500/40' },
    { border: 'border-indigo-500/60', badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' },
    { border: 'border-purple-500/60', badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
    { border: 'border-emerald-500/60', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  ];
  const color = colors[index % colors.length];

  return (
    <motion.div
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 280, damping: 24, mass: 0.9 }}
      className={`w-[320px] bg-[#0B1120] border ${
        isWinner ? 'border-sky-400 ring-2 ring-sky-500/30' : color.border
      } rounded-2xl p-4 shadow-xl text-slate-100 font-sans`}
    >
      <Handle type="target" position={Position.Top} className="!bg-sky-400 !w-3 !h-3 !border-2 !border-slate-900" />
      <Handle type="target" position={Position.Left} className="!bg-sky-400 !w-3 !h-3 !border-2 !border-slate-900" />

      <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded border ${color.badge}`}>
            Option {String.fromCharCode(65 + index)}
          </span>
          <h4 className="font-bold text-sm text-white truncate max-w-[150px]">{name}</h4>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1">
            <span className="text-xs font-mono font-bold text-sky-400">{score}%</span>
            {isWinner && <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
          </div>
          <span className="text-[9px] font-mono text-slate-500 uppercase">Live Score</span>
        </div>
      </div>

      {verdict && (
        <div className="mt-2.5 text-xs text-slate-300 bg-slate-900/90 rounded-lg p-2 border border-slate-800/80 leading-snug">
          <span className="font-semibold text-sky-300">Assessment: </span>
          {verdict}
        </div>
      )}

      {pros.length > 0 && (
        <div className="mt-2.5 space-y-1">
          <span className="text-[10px] uppercase font-mono text-emerald-400 font-semibold">Key Strengths</span>
          <ul className="text-[11px] text-slate-300 space-y-0.5 list-disc list-inside">
            {pros.slice(0, 2).map((p: string, i: number) => (
              <li key={i} className="truncate">{p}</li>
            ))}
          </ul>
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-sky-400 !w-3 !h-3 !border-2 !border-slate-900" />
      <Handle type="source" position={Position.Right} className="!bg-sky-400 !w-3 !h-3 !border-2 !border-slate-900" />
    </motion.div>
  );
});

const SpecMatrixGraphNode = memo(function SpecMatrixGraphNode({ data }: NodeProps) {
  const { category = 'Telemetry Matrix', metrics = [], weights = {}, onWeightChange } = (data || {}) as any;

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 280, damping: 24, mass: 0.9 }}
      className="w-[540px] bg-[#0B1120] border border-cyan-500/40 rounded-2xl p-4 shadow-xl text-slate-100 font-mono"
    >
      <Handle type="target" position={Position.Top} className="!bg-cyan-400 !w-3 !h-3 !border-2 !border-slate-900" />
      <Handle type="target" position={Position.Left} className="!bg-cyan-400 !w-3 !h-3 !border-2 !border-slate-900" />

      <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-white">Interactive Metric Weights</h4>
            <span className="text-[10px] text-slate-400">{category}</span>
          </div>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
          Live Tuner
        </span>
      </div>

      <div className="mt-2.5 space-y-2 max-h-[260px] overflow-y-auto pr-1">
        {metrics.slice(0, 6).map((m: VerifiedMetric, idx: number) => {
          const currentWeight = weights[m.metric] !== undefined ? weights[m.metric] : 100;
          return (
            <div key={idx} className="p-2 rounded-lg bg-slate-900/80 border border-slate-800/80 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-200 truncate max-w-[280px]">
                  {m.metric}
                </span>
                <span className="text-[10px] font-mono text-cyan-300 font-bold">
                  {currentWeight}% Weight
                </span>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={currentWeight}
                  onChange={(e) => {
                    if (onWeightChange) {
                      onWeightChange(m.metric, parseInt(e.target.value, 10));
                    }
                  }}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 font-sans pt-0.5">
                <span className="truncate text-sky-300">A: {m.entity_a || m.values?.[0] || '-'}</span>
                <span className="truncate text-indigo-300">B: {m.entity_b || m.values?.[1] || '-'}</span>
              </div>
            </div>
          );
        })}
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-cyan-400 !w-3 !h-3 !border-2 !border-slate-900" />
      <Handle type="source" position={Position.Right} className="!bg-cyan-400 !w-3 !h-3 !border-2 !border-slate-900" />
    </motion.div>
  );
});

const SentimentGraphNode = memo(function SentimentGraphNode({ data }: NodeProps) {
  const { sentiments = [] } = (data || {}) as any;

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 280, damping: 24, mass: 0.9 }}
      className="w-[420px] bg-[#0B1120] border border-indigo-500/40 rounded-2xl p-4 shadow-xl text-slate-100 font-sans"
    >
      <Handle type="target" position={Position.Top} className="!bg-indigo-400 !w-3 !h-3 !border-2 !border-slate-900" />
      <Handle type="target" position={Position.Left} className="!bg-indigo-400 !w-3 !h-3 !border-2 !border-slate-900" />

      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <MessageSquare className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-200">Community Consensus</h4>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
          Field Feedback
        </span>
      </div>

      <div className="mt-2.5 space-y-2 max-h-[200px] overflow-y-auto">
        {sentiments.slice(0, 3).map((s: CommunitySentiment, idx: number) => (
          <div key={idx} className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
            <div className="flex items-center justify-between text-[10px] text-slate-400 pb-1">
              <span className="font-semibold text-indigo-300">{s.topic}</span>
              <span className="font-mono text-emerald-400">{s.sentiment || 'Consensus'}</span>
            </div>
            <p className="text-slate-300 text-[11px] line-clamp-2 leading-relaxed">
              {s.entity_a_consensus || (s.consensuses && s.consensuses[0]) || (s.praises && s.praises[0]) || 'Verified community user feedback'}
            </p>
          </div>
        ))}
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-indigo-400 !w-3 !h-3 !border-2 !border-slate-900" />
      <Handle type="source" position={Position.Right} className="!bg-indigo-400 !w-3 !h-3 !border-2 !border-slate-900" />
    </motion.div>
  );
});

const VerdictGraphNode = memo(function VerdictGraphNode({ data }: NodeProps) {
  const { verdictSummary = '', winningEntity = '' } = (data || {}) as any;

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 280, damping: 24, mass: 0.9 }}
      className="w-[460px] bg-[#0B1120] border border-emerald-500/50 rounded-2xl p-4 shadow-xl text-slate-100 font-sans"
    >
      <Handle type="target" position={Position.Top} className="!bg-emerald-400 !w-3 !h-3 !border-2 !border-slate-900" />
      <Handle type="target" position={Position.Left} className="!bg-emerald-400 !w-3 !h-3 !border-2 !border-slate-900" />

      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Award className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-300">Dynamic Executive Verdict</h4>
        </div>
        <div className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          <span>Real-time Synthesis</span>
        </div>
      </div>

      <div className="mt-2.5 p-2.5 rounded-xl bg-slate-900/90 border border-emerald-500/20 text-xs text-slate-200 leading-relaxed max-h-[180px] overflow-y-auto space-y-1.5">
        {winningEntity && (
          <div className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Optimal Choice under current weighting: {winningEntity}</span>
          </div>
        )}
        <p className="text-slate-300 text-[11px] leading-relaxed">
          {verdictSummary || 'Comparison completed with cross-verified metric telemetry.'}
        </p>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-emerald-400 !w-3 !h-3 !border-2 !border-slate-900" />
    </motion.div>
  );
});

// --- 6. FRAMER MOTION GENERATIVE TILE NODE WITH SPRING PHYSICS ---
const GenerativeTileNode = memo(function GenerativeTileNode({ data }: NodeProps) {
  const { component = 'DivergenceLedger', props = {}, rationale, onRemoveNode, id, priority = 'high', disparityPct } = (data || {}) as any;

  return (
    <motion.div
      layout
      initial={{ scale: 0.82, opacity: 0, y: 35 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.75, opacity: 0, y: 20 }}
      transition={{
        type: 'spring',
        stiffness: 280,
        damping: 24,
        mass: 0.9,
      }}
      className="relative group"
    >
      <Handle type="target" position={Position.Top} className="!bg-cyan-400 !w-3 !h-3 !border-2 !border-slate-900" />
      <Handle type="target" position={Position.Left} className="!bg-cyan-400 !w-3 !h-3 !border-2 !border-slate-900" />

      {/* Dynamic Telemetry Badge */}
      <div className="absolute -top-3 left-4 z-20 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-950/90 border border-cyan-500/40 text-[9px] font-mono text-cyan-300 shadow-lg backdrop-blur-md">
        <Sparkles className="w-3 h-3 text-amber-400" />
        <span className="uppercase font-bold tracking-wider">{priority} Autonomous Tile</span>
        {disparityPct !== undefined && (
          <span className="text-amber-400 font-bold">({disparityPct}% disparity)</span>
        )}
      </div>

      {/* Floating remove button */}
      {onRemoveNode && (
        <button
          type="button"
          onClick={() => onRemoveNode(id)}
          className="absolute -top-2.5 -right-2.5 z-20 w-6 h-6 rounded-full bg-slate-900 border border-slate-700 text-slate-400 hover:text-white flex items-center justify-center shadow-lg transition-colors"
          title="Dismiss Generative Tile"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      {renderWidgetComponent(component, { data: props })}

      {rationale && (
        <div className="mt-1 px-3 py-1 text-[10px] font-mono text-slate-400 bg-slate-950/80 border border-slate-800 rounded-lg max-w-[460px] truncate">
          <span className="text-cyan-400 font-semibold">Orchestrator: </span>
          {rationale}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-cyan-400 !w-3 !h-3 !border-2 !border-slate-900" />
      <Handle type="source" position={Position.Right} className="!bg-cyan-400 !w-3 !h-3 !border-2 !border-slate-900" />
    </motion.div>
  );
});

export const customNodeTypes = {
  entityNode: EntityGraphNode,
  specMatrixNode: SpecMatrixGraphNode,
  sentimentNode: SentimentGraphNode,
  verdictNode: VerdictGraphNode,
  generativeTileNode: GenerativeTileNode,
  widgetNode: GenerativeTileNode,
  ComparisonTable: GenerativeTileNode,
  BudgetTracker: GenerativeTileNode,
  TimelineCalendar: GenerativeTileNode,
  AdmissionPredictor: GenerativeTileNode,
  DivergenceLedger: GenerativeTileNode,
};

// --- 7. INTERNAL SPATIAL FLOW CONTROLLER WITH AUTONOMOUS LOOP ---

interface FlowInnerProps {
  initialNodes: Node[];
  initialEdges: Edge[];
  direction: 'TB' | 'LR';
  setDirection: (dir: 'TB' | 'LR') => void;
  metrics: VerifiedMetric[];
  entities: any[];
  category: string;
  contextTopic?: string;
  weights: Record<string, number>;
  onWeightChange: (metric: string, weight: number) => void;
  onResetWeights: () => void;
}

function SpatialFlowInner({
  initialNodes,
  initialEdges,
  direction,
  setDirection,
  metrics,
  entities,
  category,
  contextTopic = "",
  weights,
  onWeightChange,
  onResetWeights,
}: FlowInnerProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { fitView } = useReactFlow();
  const [tilePrompt, setTilePrompt] = useState('');

  // Autonomous Generative Canvas Reactive Loop
  const {
    dynamicTiles: streamTiles,
    isEvaluating,
    loopStatus,
    removeDynamicTile,
    evaluateNow,
  } = useGenerativeCanvasLoop({
    enabled: true,
    entities,
    category,
    contextTopic,
    metrics,
    weights,
    maxDynamicTiles: 3,
    cooldownMs: 3500,
  });

  // Calculate non-overlapping Dagre & multi-column grid layout for all nodes
  const { layoutedNodes, layoutedEdges } = useMemo(() => {
    // 1. Calculate live entity weighted scores
    const rawEntities = entities.length > 0 ? entities : ['Option A', 'Option B'];

    const scores = rawEntities.map((ent, entIdx) => {
      let weightedSum = 0;
      let count = 0;

      metrics.forEach((m) => {
        const w = weights[m.metric] !== undefined ? weights[m.metric] : 100;
        const val = entIdx === 0 ? (m.entity_a || m.values?.[0]) : (m.entity_b || m.values?.[1]);
        const num = parseMetricNumber(val);
        const norm = Math.min(98, Math.max(50, 70 + (num % 25)));
        weightedSum += norm * (w / 100);
        count += (w / 100);
      });

      const avg = count > 0 ? Math.round(weightedSum / count) : 80;
      return avg;
    });

    const highestScore = Math.max(...scores);
    const winIdx = scores.indexOf(highestScore);
    const winName = typeof rawEntities[winIdx] === 'object' ? rawEntities[winIdx].name : rawEntities[winIdx];

    const updatedBaseNodes = initialNodes.map((node) => {
      if (node.type === 'entityNode') {
        const idx = typeof (node.data as any)?.index === 'number' ? (node.data as any).index : 0;
        const entScore = scores[idx] !== undefined ? scores[idx] : 82;
        const isWinner = idx === winIdx;

        return {
          ...node,
          data: {
            ...node.data,
            score: entScore,
            isWinner,
          },
        };
      }

      if (node.type === 'specMatrixNode') {
        return {
          ...node,
          data: {
            ...node.data,
            weights,
            onWeightChange,
          },
        };
      }

      if (node.type === 'verdictNode') {
        const dynText = `Based on active telemetry weights, ${winName} emerges as the optimal recommendation with a composite score of ${highestScore}%. Adjusting sliders recalculates real-time priority arbitration.`;
        return {
          ...node,
          data: {
            ...node.data,
            winningEntity: winName,
            verdictSummary: dynText,
          },
        };
      }

      return node;
    });

    // 2. Pass base nodes, edges, and streamTiles through dynamic layout calculation
    const result = layoutDynamicNodesAndEdges({
      primaryNodes: updatedBaseNodes,
      primaryEdges: initialEdges,
      dynamicTiles: streamTiles,
      direction,
      onRemoveNode: removeDynamicTile,
    });

    return {
      layoutedNodes: result.nodes,
      layoutedEdges: result.edges,
    };
  }, [initialNodes, initialEdges, entities, metrics, weights, onWeightChange, direction, streamTiles, removeDynamicTile]);

  useEffect(() => {
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [layoutedNodes, layoutedEdges, setNodes, setEdges]);

  const handleFitView = useCallback(() => {
    fitView({ padding: 0.2, duration: 400 });
  }, [fitView]);

  return (
    <div className="w-full h-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={customNodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.15}
        maxZoom={2.5}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#38bdf8', strokeWidth: 1.8 },
        }}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1.5} color="#1e293b" />
        <Controls className="!bg-slate-900/95 !border-slate-800 !fill-slate-300 !text-slate-300 !rounded-xl !shadow-xl" />
        <MiniMap
          nodeStrokeWidth={3}
          zoomable
          pannable
          className="!bg-slate-900/90 !border-slate-800 rounded-xl overflow-hidden shadow-xl"
        />

        {/* Top Floating Telemetry Controls */}
        <Panel position="top-right" className="flex items-center gap-2 bg-slate-900/95 border border-slate-800 p-1.5 rounded-xl shadow-xl backdrop-blur-md">
          <button
            type="button"
            onClick={() => setDirection(direction === 'TB' ? 'LR' : 'TB')}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-lg transition-colors"
            title="Toggle Layout Direction (Top-Bottom / Left-Right)"
          >
            {direction === 'TB' ? <MoveDown className="w-3.5 h-3.5 text-cyan-400" /> : <MoveRight className="w-3.5 h-3.5 text-cyan-400" />}
            <span>{direction === 'TB' ? 'Rank: TB' : 'Rank: LR'}</span>
          </button>
          <button
            type="button"
            onClick={onResetWeights}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-lg transition-colors"
            title="Reset All Metric Weights to 100%"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Reset Weights</span>
          </button>
          <button
            type="button"
            onClick={handleFitView}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-lg transition-colors"
            title="Fit All Nodes in View"
          >
            <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Fit View</span>
          </button>
        </Panel>

        {/* Generative UI Autonomous Interactive Intent Bar (AI SDK Pattern) */}
        <Panel position="top-left" className="bg-slate-900/95 border border-slate-800 p-3 rounded-2xl shadow-2xl backdrop-blur-xl max-w-lg space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-mono text-sky-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Generative Canvas Engine</span>
            </span>
            <div className="flex items-center gap-1.5">
              <span className={`text-[9px] font-mono px-2 py-0.5 rounded border flex items-center gap-1 transition-all ${
                isEvaluating || loopStatus === 'evaluating'
                  ? 'bg-amber-950/80 text-amber-300 border-amber-600 animate-pulse ring-1 ring-amber-500/40'
                  : loopStatus === 'cooldown'
                  ? 'bg-cyan-950/80 text-cyan-300 border-cyan-700'
                  : 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  isEvaluating || loopStatus === 'evaluating' ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'
                }`} />
                <span>{isEvaluating || loopStatus === 'evaluating' ? 'SYNTHESIZING...' : loopStatus.toUpperCase()}</span>
              </span>
            </div>
          </div>

          {/* Quick Intent Action Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              disabled={isEvaluating}
              onClick={() => evaluateNow('Where do these diverge most? Focus on maximum disparity and trade-offs.')}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono bg-amber-950/40 border border-amber-500/30 text-amber-300 hover:bg-amber-900/50 transition-all disabled:opacity-50 active:scale-95 cursor-pointer"
            >
              <Zap className="w-3 h-3 text-amber-400" />
              <span>Where do they diverge most?</span>
            </button>

            <button
              type="button"
              disabled={isEvaluating}
              onClick={() => evaluateNow('Provide an itemized budget breakdown, cost of ownership, and price comparison.')}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/50 transition-all disabled:opacity-50 active:scale-95 cursor-pointer"
            >
              <DollarSign className="w-3 h-3 text-emerald-400" />
              <span>Budget & TCO Breakdown</span>
            </button>

            <button
              type="button"
              disabled={isEvaluating}
              onClick={() => evaluateNow('Provide a milestone roadmap, implementation phases, and timeline schedule.')}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-900/50 transition-all disabled:opacity-50 active:scale-95 cursor-pointer"
            >
              <Calendar className="w-3 h-3 text-indigo-400" />
              <span>Milestone Roadmap</span>
            </button>
          </div>

          {/* Freeform Tile Prompt */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (tilePrompt.trim() && !isEvaluating) {
                evaluateNow(tilePrompt.trim());
                setTilePrompt('');
              }
            }}
            className="flex items-center gap-1.5 pt-0.5"
          >
            <input
              type="text"
              value={tilePrompt}
              onChange={(e) => setTilePrompt(e.target.value)}
              placeholder="Inject telemetry intent or evaluate..."
              disabled={isEvaluating}
              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-500 font-sans disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isEvaluating || !tilePrompt.trim()}
              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed"
            >
              {isEvaluating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Synthesizing...</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Synthesize</span>
                </>
              )}
            </button>
          </form>
        </Panel>

        {/* Bottom Status Ribbon */}
        <Panel position="bottom-left" className="bg-slate-950/90 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-mono text-slate-400 flex items-center gap-2.5 shadow-xl">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>Autonomous Stream Engine • {streamTiles.length} Active Dynamic Tile{streamTiles.length === 1 ? '' : 's'}</span>
        </Panel>
      </ReactFlow>
    </div>
  );
}

// --- 8. EXPORTED CANVAS RENDERER COMPONENT ---

export interface CanvasRendererProps {
  entities?: any[];
  category?: string;
  contextTopic?: string;
  verifiedMetrics?: VerifiedMetric[];
  communitySentiment?: CommunitySentiment[];
  verdictSummary?: string;
  nodes?: Node[];
  edges?: Edge[];
  widgets?: any[];
  className?: string;
  isStreaming?: boolean;
}

export function CanvasRenderer({
  entities = [],
  category = 'General Analysis',
  contextTopic = '',
  verifiedMetrics = [],
  communitySentiment = [],
  verdictSummary = '',
  nodes = [],
  edges = [],
  widgets = [],
  className = 'h-[750px] w-full min-h-[550px] rounded-2xl border border-slate-800 bg-[#090D16] overflow-hidden relative shadow-2xl',
  isStreaming = false,
}: CanvasRendererProps) {
  const [direction, setDirection] = useState<'TB' | 'LR'>('TB');
  const [weights, setWeights] = useState<Record<string, number>>({});

  const handleWeightChange = useCallback((metric: string, weight: number) => {
    setWeights((prev) => ({ ...prev, [metric]: weight }));
  }, []);

  const handleResetWeights = useCallback(() => {
    setWeights({});
  }, []);

  const { graphNodes, graphEdges } = useMemo(() => {
    if (nodes && nodes.length > 0) {
      const layouted = getLayoutedElements(nodes, edges || [], direction);
      return { graphNodes: layouted.nodes, graphEdges: layouted.edges };
    }

    const generated = generateComparisonGraph({
      entities,
      category,
      verifiedMetrics,
      communitySentiment,
      verdictSummary,
      direction,
    });
    return { graphNodes: generated.nodes, graphEdges: generated.edges };
  }, [entities, category, verifiedMetrics, communitySentiment, verdictSummary, nodes, edges, direction]);

  return (
    <div className={className}>
      <ReactFlowProvider>
        <SpatialFlowInner
          initialNodes={graphNodes}
          initialEdges={graphEdges}
          direction={direction}
          setDirection={setDirection}
          metrics={verifiedMetrics}
          entities={entities}
          category={category}
          contextTopic={contextTopic}
          weights={weights}
          onWeightChange={handleWeightChange}
          onResetWeights={handleResetWeights}
        />
      </ReactFlowProvider>
    </div>
  );
}

export default CanvasRenderer;
