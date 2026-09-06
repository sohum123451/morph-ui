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
} from 'lucide-react';
import {
  VerifiedMetric,
  CommunitySentiment,
  GenerativeComparisonResponse,
} from '@/types/morphui';

interface UploadedVisual {
  data: string; // base64 string
  mimeType: string;
  name: string;
  previewUrl: string;
}

function parseNumericValue(val: string): number | null {
  if (!val || val === 'N/A' || val === '-') return null;
  const clean = val.replace(/,/g, '');
  const match = clean.match(/[-+]?\d*\.?\d+/);
  if (!match) return null;
  const num = parseFloat(match[0]);
  return isNaN(num) ? null : num;
}

// ============================================================================
// SPATIAL CANVAS NODES (Responsive, Auto-Sizing, Full Word-Wrap)
// ============================================================================

const SpecMatrixNode = memo(function SpecMatrixNode({ data }: any) {
  const { entityA, entityB, category, metrics = [] } = data;
  return (
    <div className="w-[320px] sm:w-[380px] min-h-min h-auto bg-slate-900/95 border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-2xl text-slate-100 backdrop-blur-xl">
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

      <div className="grid grid-cols-12 gap-2 text-[10px] uppercase font-mono text-slate-400 pb-1.5 border-b border-slate-800/60">
        <div className="col-span-5">Metric</div>
        <div className="col-span-3 text-sky-400 whitespace-normal break-words">{entityA}</div>
        <div className="col-span-4 text-indigo-400 whitespace-normal break-words">{entityB}</div>
      </div>

      <div className="divide-y divide-slate-800/60 text-xs">
        {metrics.slice(0, 7).map((m: VerifiedMetric, idx: number) => (
          <div key={idx} className="grid grid-cols-12 gap-2 py-2 items-start">
            <div className="col-span-5 text-slate-300 font-medium text-[11px] whitespace-normal break-words">
              {m.metric}
            </div>
            <div className="col-span-3 text-slate-100 text-[11px] whitespace-normal break-words">
              {m.entity_a}
            </div>
            <div className="col-span-4 text-slate-100 text-[11px] whitespace-normal break-words">
              {m.entity_b}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

const SentimentBreakdownNode = memo(function SentimentBreakdownNode({ data }: any) {
  const { entityA, entityB, sentiments = [] } = data;
  return (
    <div className="w-[320px] sm:w-[420px] min-h-min h-auto bg-slate-900/95 border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-2xl text-slate-100 backdrop-blur-xl">
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
              <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800 whitespace-normal break-words leading-relaxed">
                <span className="text-[10px] text-sky-400 font-semibold block mb-0.5">{entityA}:</span>
                {s.entity_a_consensus}
              </div>
              <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800 whitespace-normal break-words leading-relaxed">
                <span className="text-[10px] text-indigo-400 font-semibold block mb-0.5">{entityB}:</span>
                {s.entity_b_consensus}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

const LedgerNode = memo(function LedgerNode({ data }: any) {
  const { entityA, entityB, metrics = [] } = data;

  const scoreA = useMemo(() => {
    let aWins = 0;
    metrics.forEach((m: VerifiedMetric) => {
      const vA = parseNumericValue(m.entity_a);
      const vB = parseNumericValue(m.entity_b);
      if (vA !== null && vB !== null) {
        if (vA > vB) aWins++;
      }
    });
    return aWins;
  }, [metrics]);

  const scoreB = useMemo(() => {
    let bWins = 0;
    metrics.forEach((m: VerifiedMetric) => {
      const vA = parseNumericValue(m.entity_a);
      const vB = parseNumericValue(m.entity_b);
      if (vA !== null && vB !== null) {
        if (vB > vA) bWins++;
      }
    });
    return bWins;
  }, [metrics]);

  return (
    <div className="w-[300px] sm:w-[340px] min-h-min h-auto bg-slate-900/95 border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-2xl text-slate-100 backdrop-blur-xl">
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

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-center space-y-1">
          <span className="text-[10px] text-sky-400 font-mono uppercase truncate block">{entityA}</span>
          <div className="text-2xl font-black text-white">{scoreA}</div>
          <span className="text-[9px] text-slate-400">Winning Attributes</span>
        </div>
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-center space-y-1">
          <span className="text-[10px] text-indigo-400 font-mono uppercase truncate block">{entityB}</span>
          <div className="text-2xl font-black text-white">{scoreB}</div>
          <span className="text-[9px] text-slate-400">Winning Attributes</span>
        </div>
      </div>

      <div className="text-xs text-slate-400 leading-relaxed bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
        <span className="font-semibold text-slate-300">Analysis:</span> Numeric metrics evaluated for direct quantitative edge.
      </div>
    </div>
  );
});

const VerdictNode = memo(function VerdictNode({ data }: any) {
  const { entityA, entityB, verdictSummary, prosA = [], prosB = [] } = data;
  return (
    <div className="w-[320px] sm:w-[400px] min-h-min h-auto bg-slate-900/95 border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-2xl text-slate-100 backdrop-blur-xl">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        <div className="p-2.5 bg-slate-950/70 rounded-lg border border-slate-800 whitespace-normal break-words leading-relaxed">
          <span className="text-sky-400 font-semibold block mb-1">Pick {entityA}:</span>
          <span className="text-slate-300">{prosA[0] || 'Established core specifications'}</span>
        </div>
        <div className="p-2.5 bg-slate-950/70 rounded-lg border border-slate-800 whitespace-normal break-words leading-relaxed">
          <span className="text-indigo-400 font-semibold block mb-1">Pick {entityB}:</span>
          <span className="text-slate-300">{prosB[0] || 'Targeted performance benchmarks'}</span>
        </div>
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
  entityA: string;
  entityB: string;
  category: string;
  verifiedMetrics: VerifiedMetric[];
  communitySentiment: CommunitySentiment[];
  verdictSummary: string;
  prosA: string[];
  prosB: string[];
}

function SpatialCanvasWorkspace({
  entityA,
  entityB,
  category,
  verifiedMetrics,
  communitySentiment,
  verdictSummary,
  prosA,
  prosB,
}: SpatialCanvasViewProps) {
  const { fitView } = useReactFlow();

  const generatedNodes: Node[] = useMemo(() => {
    return [
      {
        id: 'node-spec-matrix',
        type: 'spec_matrix',
        position: { x: 50, y: 140 },
        data: {
          entityA,
          entityB,
          category,
          metrics: verifiedMetrics,
        },
      },
      {
        id: 'node-sentiment',
        type: 'sentiment_breakdown',
        position: { x: 480, y: 140 },
        data: {
          entityA,
          entityB,
          sentiments: communitySentiment,
        },
      },
      {
        id: 'node-ledger',
        type: 'ledger_node',
        position: { x: 960, y: 140 },
        data: {
          entityA,
          entityB,
          metrics: verifiedMetrics,
        },
      },
      {
        id: 'node-verdict',
        type: 'verdict_node',
        position: { x: 1380, y: 140 },
        data: {
          entityA,
          entityB,
          verdictSummary,
          prosA,
          prosB,
        },
      },
    ];
  }, [entityA, entityB, category, verifiedMetrics, communitySentiment, verdictSummary, prosA, prosB]);

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

      <ReactFlow
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

  // Safe entity resolution
  const displayEntityA = isSwapped
    ? comparisonData?.entity_b?.name || 'Option B'
    : comparisonData?.entity_a?.name || 'Option A';

  const displayEntityB = isSwapped
    ? comparisonData?.entity_a?.name || 'Option A'
    : comparisonData?.entity_b?.name || 'Option B';

  const displayProsA = useMemo(() => {
    const raw = isSwapped ? comparisonData?.entity_b?.pros : comparisonData?.entity_a?.pros;
    return Array.isArray(raw) ? raw : [];
  }, [comparisonData, isSwapped]);

  const displayProsB = useMemo(() => {
    const raw = isSwapped ? comparisonData?.entity_a?.pros : comparisonData?.entity_b?.pros;
    return Array.isArray(raw) ? raw : [];
  }, [comparisonData, isSwapped]);

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
      result[catName] = metrics.map((m) => ({
        metric: m.metric,
        entity_a: isSwapped ? m.entity_b : m.entity_a,
        entity_b: isSwapped ? m.entity_a : m.entity_b,
        source_type: m.source_type,
      }));
    }
    return result;
  }, [categories, isSwapped]);

  const normalizedCommunitySentiment = useMemo(() => {
    return communitySentiment.map((s) => ({
      topic: s.topic,
      entity_a_consensus: isSwapped ? s.entity_b_consensus : s.entity_a_consensus,
      entity_b_consensus: isSwapped ? s.entity_a_consensus : s.entity_b_consensus,
      sentiment: s.sentiment,
    }));
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
          m.entity_a.toLowerCase().includes(term) ||
          m.entity_b.toLowerCase().includes(term)
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
        s.entity_a_consensus.toLowerCase().includes(term) ||
        s.entity_b_consensus.toLowerCase().includes(term)
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
    setError(null);

    try {
      const res = await fetch('/api/compare/custom-metric', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityA: comparisonData.entity_a.name,
          entityB: comparisonData.entity_b.name,
          metric: targetMetric,
          category: comparisonData.category,
        }),
      });

      if (!res.ok) throw new Error('Failed to fetch custom metric data');
      const data = await res.json();

      if (data.metric) {
        const newMetric: VerifiedMetric = {
          metric: data.metric.metric || targetMetric,
          entity_a: data.metric.entity_a || 'N/A',
          entity_b: data.metric.entity_b || 'N/A',
          source_type: 'official',
        };

        const targetCat = data.metric.category || 'User Added Metrics';

        setComparisonData((prev) => {
          if (!prev) return prev;
          const updatedCategories = { ...prev.categories };
          if (!updatedCategories[targetCat]) {
            updatedCategories[targetCat] = [];
          }
          updatedCategories[targetCat] = [
            ...updatedCategories[targetCat].filter((m) => m.metric !== newMetric.metric),
            newMetric,
          ];

          return {
            ...prev,
            categories: updatedCategories,
            verified_metrics: [...prev.verified_metrics.filter((m) => m.metric !== newMetric.metric), newMetric],
            suggested_metrics: prev.suggested_metrics.filter((sm) => sm !== targetMetric),
          };
        });

        setRecentlyAddedMetric(newMetric.metric);
        setTimeout(() => setRecentlyAddedMetric(null), 3000);
        setCustomMetricInput('');
      }
    } catch (err: any) {
      console.error('Add metric error:', err);
      setError('Could not retrieve fact for this metric. Please try another.');
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
        res = await fetch('/api/generate', {
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

      const resolvedEntityA =
        typeof data.entity_a === 'object' && data.entity_a !== null
          ? {
              name: data.entity_a.name || 'Option A',
              pros: Array.isArray(data.entity_a.pros) ? data.entity_a.pros : [],
              tagline: data.entity_a.tagline || '',
            }
          : {
              name: typeof data.entity_a === 'string' ? data.entity_a : 'Option A',
              pros: [],
              tagline: '',
            };

      const resolvedEntityB =
        typeof data.entity_b === 'object' && data.entity_b !== null
          ? {
              name: data.entity_b.name || 'Option B',
              pros: Array.isArray(data.entity_b.pros) ? data.entity_b.pros : [],
              tagline: data.entity_b.tagline || '',
            }
          : {
              name: typeof data.entity_b === 'string' ? data.entity_b : 'Option B',
              pros: [],
              tagline: '',
            };

      let resolvedCategories: Record<string, VerifiedMetric[]> = {};
      if (data.categories && Object.keys(data.categories).length > 0) {
        resolvedCategories = data.categories;
      } else if (Array.isArray(data.verified_metrics) && data.verified_metrics.length > 0) {
        resolvedCategories = {
          [data.category || 'Core Specifications']: data.verified_metrics,
        };
      }

      const flatM = Object.values(resolvedCategories).flat();
      if (resolvedEntityA.pros.length === 0) {
        resolvedEntityA.pros = flatM.slice(0, 3).map((m) => `${m.metric}: ${m.entity_a}`);
      }
      if (resolvedEntityB.pros.length === 0) {
        resolvedEntityB.pros = flatM.slice(0, 3).map((m) => `${m.metric}: ${m.entity_b}`);
      }

      setComparisonData({
        category: data.category || 'Comparative Analysis',
        entity_a: resolvedEntityA,
        entity_b: resolvedEntityB,
        categories: resolvedCategories,
        verified_metrics: flatM,
        community_sentiment: Array.isArray(data.community_sentiment) ? data.community_sentiment : [],
        suggested_metrics: Array.isArray(data.suggested_metrics) ? data.suggested_metrics : [],
        verdict_summary: data.verdict_summary || `${resolvedEntityA.name} and ${resolvedEntityB.name} provide distinct tradeoffs.`,
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

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="hidden sm:inline">De-Biased Fact Engine & Spatial Matrix</span>
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

  // 2. LOADING STATE
  if (loading && !comparisonData) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 space-y-6 w-full">
        <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-sky-400 shadow-2xl relative">
          <Loader2 className="w-8 h-8 animate-spin" />
          <div className="absolute inset-0 rounded-2xl border-2 border-sky-500/40 animate-ping opacity-25" />
        </div>

        <div className="text-center space-y-2 max-w-md px-4">
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">Generating Precision Comparison</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Executing parallel web retrieval, stripping forum bias, and synthesizing dynamic domain metrics...
          </p>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono text-sky-400 bg-slate-900/80 px-3 py-1.5 rounded-full border border-slate-800 max-w-md truncate">
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Active Query: &quot;{prompt || 'Visual Comparison'}&quot;</span>
        </div>
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

      {/* Fully Responsive Active Navigation Bar (Stacks on mobile, inline on desktop) */}
      <header className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-xl sticky top-0 z-40 w-full">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4">
          {/* Top Bar Row 1 on Mobile: Logo and View Switcher */}
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
              entityA={displayEntityA}
              entityB={displayEntityB}
              category={category}
              verifiedMetrics={flatVerifiedMetrics}
              communitySentiment={normalizedCommunitySentiment}
              verdictSummary={verdictSummary}
              prosA={displayProsA}
              prosB={displayProsB}
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

          {/* Main Entity Comparison Hero Card (Fully Responsive Side-by-Side: grid-cols-1 md:grid-cols-2) */}
          <section className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 lg:p-8 shadow-xl relative overflow-hidden">
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

            {/* Side-by-Side Pros (grid-cols-1 md:grid-cols-2) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 w-full">
              <div className="w-full bg-slate-950/80 border border-slate-800/90 rounded-xl p-3.5 sm:p-4 space-y-2.5 sm:space-y-3">
                <div className="flex items-center gap-2 text-sky-400 font-semibold text-xs uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                  <span className="whitespace-normal break-words">Choose {displayEntityA} if:</span>
                </div>
                <ul className="space-y-2 text-xs text-slate-300">
                  {(displayProsA.length > 0 ? displayProsA : ['Verified domain baseline features']).map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 whitespace-normal break-words leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0 mt-1.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="w-full bg-slate-950/80 border border-slate-800/90 rounded-xl p-3.5 sm:p-4 space-y-2.5 sm:space-y-3">
                <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span className="whitespace-normal break-words">Choose {displayEntityB} if:</span>
                </div>
                <ul className="space-y-2 text-xs text-slate-300">
                  {(displayProsB.length > 0 ? displayProsB : ['Targeted competitive benchmark features']).map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 whitespace-normal break-words leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0 mt-1.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
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

          {/* TAB 1: Verified Facts & Official Specs Table (Horizontal scroll wrapper: overflow-x-auto & min-w-[120px]) */}
          {activeTab === 'verified' && (
            <section className="w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden print-clean">
              <div className="w-full overflow-x-auto">
                <div className="min-w-[620px] md:min-w-full">
                  {/* Table Header */}
                  <div className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-3.5 grid grid-cols-12 gap-4 items-center text-xs font-bold uppercase tracking-wider text-slate-400 shadow-sm">
                    <div className="col-span-4 min-w-[120px] flex items-center gap-1.5">
                      <FileSpreadsheet className="w-4 h-4 text-slate-500 shrink-0" />
                      <span className="truncate">Metric / Attribute</span>
                    </div>
                    <div className="col-span-4 min-w-[120px] text-sky-400 flex items-center gap-1.5 whitespace-normal break-words">
                      <span className="w-2 h-2 rounded-full bg-sky-400 shrink-0" />
                      <span>{displayEntityA}</span>
                    </div>
                    <div className="col-span-4 min-w-[120px] text-indigo-400 flex items-center gap-1.5 whitespace-normal break-words">
                      <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" />
                      <span>{displayEntityB}</span>
                    </div>
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

                                  const isDifferent = m.entity_a.trim().toLowerCase() !== m.entity_b.trim().toLowerCase();
                                  const isNewlyAdded = recentlyAddedMetric === m.metric;

                                  return (
                                    <div
                                      key={idx}
                                      className={`grid grid-cols-12 gap-4 px-4 sm:px-6 py-3.5 sm:py-4 items-start text-xs sm:text-sm transition-all duration-500 ${
                                        isNewlyAdded
                                          ? 'bg-emerald-950/40 border-l-4 border-emerald-400'
                                          : highlightDiff && isDifferent
                                          ? 'bg-sky-950/20 hover:bg-sky-950/30'
                                          : 'hover:bg-slate-800/40'
                                      }`}
                                    >
                                      <div className="col-span-4 min-w-[120px] pr-2 align-top whitespace-normal break-words">
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

                                      <div className="col-span-4 min-w-[120px] text-slate-300 leading-relaxed pr-2 space-y-1.5 align-top whitespace-normal break-words">
                                        <div className="whitespace-normal break-words">{m.entity_a}</div>
                                        {hasNumeric && (
                                          <div className="pt-1">
                                            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                                              <div
                                                style={{ width: `${pctA}%` }}
                                                className="h-full bg-sky-500 rounded-full transition-all duration-500"
                                              />
                                            </div>
                                          </div>
                                        )}
                                      </div>

                                      <div className="col-span-4 min-w-[120px] text-slate-300 leading-relaxed space-y-1.5 align-top whitespace-normal break-words">
                                        <div className="whitespace-normal break-words">{m.entity_b}</div>
                                        {hasNumeric && (
                                          <div className="pt-1">
                                            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                                              <div
                                                style={{ width: `${pctB}%` }}
                                                className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                                              />
                                            </div>
                                          </div>
                                        )}
                                      </div>
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

          {/* TAB 2: Community & Reddit Sentiment Table (Horizontal scroll wrapper: overflow-x-auto & min-w-[120px]) */}
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

              <div className="w-full overflow-x-auto">
                <div className="min-w-[620px] md:min-w-full">
                  {/* Sentiment Header */}
                  <div className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-3.5 grid grid-cols-12 gap-4 items-center text-xs font-bold uppercase tracking-wider text-slate-400 shadow-sm">
                    <div className="col-span-4 min-w-[120px] flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-slate-500 shrink-0" />
                      <span className="truncate">Theme / Topic</span>
                    </div>
                    <div className="col-span-4 min-w-[120px] text-sky-400 flex items-center gap-1.5 whitespace-normal break-words">
                      <span className="w-2 h-2 rounded-full bg-sky-400 shrink-0" />
                      <span>{displayEntityA} Consensus</span>
                    </div>
                    <div className="col-span-4 min-w-[120px] text-indigo-400 flex items-center gap-1.5 whitespace-normal break-words">
                      <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" />
                      <span>{displayEntityB} Consensus</span>
                    </div>
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
                          className="grid grid-cols-12 gap-4 px-4 sm:px-6 py-3.5 sm:py-4 items-start text-xs sm:text-sm hover:bg-slate-800/40 transition-colors"
                        >
                          <div className="col-span-4 min-w-[120px] pr-2 space-y-1.5 align-top whitespace-normal break-words">
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

                          <div className="col-span-4 min-w-[120px] text-slate-300 leading-relaxed pr-2 bg-slate-950/50 p-2.5 sm:p-3 rounded-xl border border-slate-800/60 align-top whitespace-normal break-words">
                            {s.entity_a_consensus}
                          </div>

                          <div className="col-span-4 min-w-[120px] text-slate-300 leading-relaxed bg-slate-950/50 p-2.5 sm:p-3 rounded-xl border border-slate-800/60 align-top whitespace-normal break-words">
                            {s.entity_b_consensus}
                          </div>
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
