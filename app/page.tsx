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
  Coins,
  ArrowRight,
} from 'lucide-react';
import {
  AgentApiResponse,
  VerifiedMetric,
  CommunitySentiment,
  ImageInput,
  EntityVerdict,
} from '@/types/morphui';

function parseNumericValue(val: string): number | null {
  if (!val || val === 'N/A' || val === '-') return null;
  const clean = val.replace(/,/g, '');
  const match = clean.match(/[-+]?\d*\.?\d+/);
  if (!match) return null;
  const num = parseFloat(match[0]);
  return isNaN(num) ? null : num;
}

// ============================================================================
// SPATIAL CANVAS NODES (Dynamic Live Data)
// ============================================================================

const SpecMatrixNode = memo(function SpecMatrixNode({ data }: any) {
  const { entityA, entityB, category, metrics = [] } = data;
  return (
    <div className="w-[420px] bg-slate-900/95 border border-slate-700/80 rounded-2xl p-5 shadow-2xl text-slate-100 backdrop-blur-xl">
      <Handle type="target" position={Position.Left} className="!bg-sky-500 !w-3 !h-3 !border-2 !border-slate-900" />
      <Handle type="source" position={Position.Right} className="!bg-sky-500 !w-3 !h-3 !border-2 !border-slate-900" />
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-white">Verified Spec Matrix</h4>
            <span className="text-[10px] text-slate-400 font-mono">{category}</span>
          </div>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-sky-300 font-mono border border-slate-700">
          Node 1
        </span>
      </div>

      <div className="grid grid-cols-12 gap-2 text-[10px] uppercase font-mono text-slate-400 pb-1.5 border-b border-slate-800/60">
        <div className="col-span-5">Metric</div>
        <div className="col-span-3 text-sky-400 truncate">{entityA}</div>
        <div className="col-span-4 text-indigo-400 truncate">{entityB}</div>
      </div>

      <div className="divide-y divide-slate-800/60 text-xs max-h-[220px] overflow-y-auto pr-1">
        {metrics.slice(0, 6).map((m: any, idx: number) => (
          <div key={idx} className="grid grid-cols-12 gap-2 py-2 items-center">
            <span className="col-span-5 text-slate-300 font-medium text-[11px] truncate">{m.metric}</span>
            <span className="col-span-3 text-slate-200 text-[11px] truncate">{m.entity_a}</span>
            <span className="col-span-4 text-slate-200 text-[11px] truncate">{m.entity_b}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

const SentimentBreakdownNode = memo(function SentimentBreakdownNode({ data }: any) {
  const { entityA, entityB, sentiments = [] } = data;
  return (
    <div className="w-[440px] bg-slate-900/95 border border-slate-700/80 rounded-2xl p-5 shadow-2xl text-slate-100 backdrop-blur-xl">
      <Handle type="target" position={Position.Left} className="!bg-indigo-500 !w-3 !h-3 !border-2 !border-slate-900" />
      <Handle type="source" position={Position.Right} className="!bg-indigo-500 !w-3 !h-3 !border-2 !border-slate-900" />
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-white">Community & Reddit Consensus</h4>
            <span className="text-[10px] text-slate-400">De-Biased User Sentiment</span>
          </div>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono border border-slate-700">
          Node 2
        </span>
      </div>

      <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
        {sentiments.slice(0, 3).map((s: any, idx: number) => (
          <div key={idx} className="p-2.5 bg-slate-950/70 rounded-xl border border-slate-800/80 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200 text-[11px]">{s.topic}</span>
              <span
                className={`text-[9px] uppercase font-mono px-1.5 py-0.2 rounded border ${
                  s.sentiment === 'Positive'
                    ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300'
                    : s.sentiment === 'Critical'
                    ? 'bg-rose-950/60 border-rose-800/80 text-rose-300'
                    : 'bg-amber-950/60 border-amber-800/80 text-amber-300'
                }`}
              >
                {s.sentiment || 'Consensus'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400">
              <div className="bg-slate-900/60 p-1.5 rounded">
                <span className="text-sky-400 font-semibold block">{entityA}:</span>
                <span className="line-clamp-2">{s.entity_a_consensus}</span>
              </div>
              <div className="bg-slate-900/60 p-1.5 rounded">
                <span className="text-indigo-400 font-semibold block">{entityB}:</span>
                <span className="line-clamp-2">{s.entity_b_consensus}</span>
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
  const primaryMetric1 = metrics[0] || { metric: 'Primary Specification', entity_a: 'Standard', entity_b: 'Standard' };
  const primaryMetric2 = metrics[1] || { metric: 'Benchmark Yield', entity_a: 'High Tier', entity_b: 'High Tier' };

  return (
    <div className="w-[380px] bg-slate-900/95 border border-slate-700/80 rounded-2xl p-5 shadow-2xl text-slate-100 backdrop-blur-xl">
      <Handle type="target" position={Position.Left} className="!bg-emerald-500 !w-3 !h-3 !border-2 !border-slate-900" />
      <Handle type="source" position={Position.Right} className="!bg-emerald-500 !w-3 !h-3 !border-2 !border-slate-900" />
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Coins className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-white">Attribute & Yield Ledger</h4>
            <span className="text-[10px] text-slate-400">Core Comparative Metrics</span>
          </div>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-emerald-300 font-mono border border-slate-700">
          Node 3
        </span>
      </div>

      <div className="space-y-3 text-xs">
        <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80 space-y-1">
          <span className="text-[10px] text-slate-400 font-mono uppercase">{primaryMetric1.metric}</span>
          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/60">
            <span className="text-sky-300 font-medium">{entityA}:</span>
            <span className="text-slate-200 font-mono">{primaryMetric1.entity_a}</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-indigo-300 font-medium">{entityB}:</span>
            <span className="text-slate-200 font-mono">{primaryMetric1.entity_b}</span>
          </div>
        </div>

        <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80 space-y-1">
          <span className="text-[10px] text-slate-400 font-mono uppercase">{primaryMetric2.metric}</span>
          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/60">
            <span className="text-sky-300 font-medium">{entityA}:</span>
            <span className="text-slate-200 font-mono">{primaryMetric2.entity_a}</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-indigo-300 font-medium">{entityB}:</span>
            <span className="text-slate-200 font-mono">{primaryMetric2.entity_b}</span>
          </div>
        </div>
      </div>
    </div>
  );
});

const VerdictNode = memo(function VerdictNode({ data }: any) {
  const { entityA, entityB, verdictSummary, prosA = [], prosB = [] } = data;
  return (
    <div className="w-[420px] bg-slate-900/95 border border-slate-700/80 rounded-2xl p-5 shadow-2xl text-slate-100 backdrop-blur-xl">
      <Handle type="target" position={Position.Left} className="!bg-amber-500 !w-3 !h-3 !border-2 !border-slate-900" />
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-white">Executive Synthesis</h4>
            <span className="text-[10px] text-slate-400">Final Recommendation</span>
          </div>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-mono border border-slate-700">
          Node 4
        </span>
      </div>

      <p className="text-[11px] text-slate-300 leading-relaxed bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 mb-3">
        {verdictSummary}
      </p>

      <div className="grid grid-cols-2 gap-2 text-[10px]">
        <div className="p-2 bg-slate-950/70 rounded-lg border border-slate-800">
          <span className="text-sky-400 font-semibold block mb-1">Pick {entityA}:</span>
          <span className="text-slate-300 line-clamp-2">{prosA[0] || 'Established core specifications'}</span>
        </div>
        <div className="p-2 bg-slate-950/70 rounded-lg border border-slate-800">
          <span className="text-indigo-400 font-semibold block mb-1">Pick {entityB}:</span>
          <span className="text-slate-300 line-clamp-2">{prosB[0] || 'Targeted performance benchmarks'}</span>
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

﻿// ============================================================================
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
        position: { x: 530, y: 140 },
        data: {
          entityA,
          entityB,
          sentiments: communitySentiment,
        },
      },
      {
        id: 'node-ledger',
        type: 'ledger_node',
        position: { x: 1030, y: 140 },
        data: {
          entityA,
          entityB,
          metrics: verifiedMetrics,
        },
      },
      {
        id: 'node-verdict',
        type: 'verdict_node',
        position: { x: 1470, y: 140 },
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

  // Synchronize nodes when props update
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
    <div className="relative w-full h-[calc(100vh-140px)] min-h-[600px] bg-[#030712] rounded-2xl border border-slate-800/90 overflow-hidden shadow-2xl">
      {/* Floating Canvas Action Bar */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-700/80 shadow-lg text-xs">
        <div className="flex items-center gap-1.5 px-2.5 py-1 text-sky-400 font-semibold border-r border-slate-800">
          <Network className="w-3.5 h-3.5" />
          <span>Spatial Graph Model</span>
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

        <span className="text-[11px] font-mono text-slate-400 px-2">
          4 Spatial Nodes Active
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
          className="!bg-slate-950 !border-slate-800 rounded-xl overflow-hidden shadow-xl"
        />
      </ReactFlow>
    </div>
  );
}

// ============================================================================
// MAIN COMPARISON APP WRAPPER WITH DUAL VIEW SWITCHER
// ============================================================================

export default function ComparisonApp() {
  // Top-Level Persistent View Mode: 'spec' | 'canvas'
  const [viewMode, setViewMode] = useState<'spec' | 'canvas'>('spec');

  const [prompt, setPrompt] = useState('SRM Chennai vs VIT Vellore');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Safe Entity Verdict State (Resolves crash if LLM autocorrects typo in name)
  const [entityAData, setEntityAData] = useState<EntityVerdict>({
    name: 'SRM Chennai',
    pros: [
      'Flexible branch selection via SRMJEEE and higher personal campus autonomy',
      'Strong industry tie-ups with 850+ visiting recruiters',
      'Continuous evaluation model with relaxed weekend outing regulations',
    ],
  });

  const [entityBData, setEntityBData] = useState<EntityVerdict>({
    name: 'VIT Vellore',
    pros: [
      'Higher NIRF engineering ranking (#11 national premier tier)',
      'High concentration of marquee software Super Dream placement offers',
      'Fully Flexible Credit System (FFCS) curriculum structure',
    ],
  });

  const [category, setCategory] = useState('Universities & Higher Education');

  // 100% Dynamic Categories Mapping: Object.entries(categories).map(...)
  const [categories, setCategories] = useState<Record<string, VerifiedMetric[]>>({
    'Academic Ranking & Admissions': [
      { metric: 'NIRF Engineering Standing (2025-26)', entity_a: 'Rank 13-18 Category (Top National Private)', entity_b: 'Rank 11 (Premier Engineering Tier)', source_type: 'official' },
      { metric: 'Entrance Exam & Merit Cutoff', entity_a: 'SRMJEEE (Phase 1/2/3 online merit counseling)', entity_b: 'VITEEE (Category 1 to Category 5 rank brackets)', source_type: 'official' },
    ],
    'Tuition Fees & Placement Yield': [
      { metric: 'Annual B.Tech Tuition Fee', entity_a: 'INR 2.50 - 4.50 Lakhs/yr', entity_b: 'INR 1.98 - 4.95 Lakhs/yr', source_type: 'official' },
      { metric: 'Average CSE Placement CTC', entity_a: 'INR 10.50 - 14.20 LPA', entity_b: 'INR 11.50 - 15.80 LPA', source_type: 'official' },
      { metric: 'Highest Domestic Placement Offer', entity_a: 'INR 1.02 Crore / yr', entity_b: 'INR 1.02 Crore / yr', source_type: 'official' },
    ],
    'Campus Life & Infrastructure': [
      { metric: 'Campus Acreage & Land Size', entity_a: '250+ Acres (Kattankulathur main campus)', entity_b: '372 Acres (Vellore main campus)', source_type: 'official' },
      { metric: 'Recruiter Density & Visiting Companies', entity_a: '850+ Companies visited', entity_b: '900+ Companies visited', source_type: 'official' },
    ],
  });

  const [communitySentiment, setCommunitySentiment] = useState<CommunitySentiment[]>([
    {
      topic: 'Campus Freedom & Curfew Policies',
      entity_a_consensus: 'High personal flexibility and relaxed weekend outing permissions for day scholars & hostellers.',
      entity_b_consensus: 'Strict bio-metric attendance and standardized 7:00 PM hostel in-times noted across r/vit.',
      sentiment: 'Mixed',
    },
    {
      topic: 'Hostel WiFi & Living Conditions',
      entity_a_consensus: 'Modern apartment-style AC hostels with attached washrooms; consistent campus WiFi in academic blocks.',
      entity_b_consensus: 'Tiered 1-bed to 6-bed options; high-speed gigabit LAN in blocks with fast maintenance turnaround.',
      sentiment: 'Positive',
    },
    {
      topic: 'Peer Developer & Hackathon Culture',
      entity_a_consensus: 'Vibrant student clubs (SRMKZILLA, Team Rudra) with great international hackathon representation.',
      entity_b_consensus: 'High competitive coding density with active ACM chapters and massive national participation in Gravitas.',
      sentiment: 'Positive',
    },
    {
      topic: 'Administration & Exam Rigor',
      entity_a_consensus: 'Balanced continuous evaluation with accessible faculty grading.',
      entity_b_consensus: 'Rigorous FFCS schedule with high relative grading competition.',
      sentiment: 'Mixed',
    },
  ]);

  const [suggestedMetrics, setSuggestedMetrics] = useState<string[]>([
    'Hostel WiFi & Gigabit LAN Speed',
    'Mess Food & Multi-Cuisine Catering',
    'Sports Complex & Gym Facilities',
    'Startup Incubation & Seed Grants',
    'Semester Abroad Program (SAP)',
  ]);

  const [verdictSummary, setVerdictSummary] = useState(
    'Both SRM Chennai and VIT Vellore are tier-1 private engineering institutions in India. VIT Vellore holds a slight edge in NIRF ranking, structured campus discipline, and marquee software placement offers. SRM Chennai offers higher campus freedom, flexible branch selections via SRMJEEE, and excellent medical/biotech research integration.'
  );

  // Spec Sheet Tab: "verified" vs "community"
  const [activeTab, setActiveTab] = useState<'verified' | 'community'>('verified');

  // Custom Metric Inline Input
  const [customMetricInput, setCustomMetricInput] = useState('');
  const [addingMetric, setAddingMetric] = useState(false);
  const [recentlyAddedMetric, setRecentlyAddedMetric] = useState<string | null>(null);

  // Telemetry & Toggles
  const [activeModel, setActiveModel] = useState<string>('Reddit De-Biasing & Fact Pipeline');
  const [isSwapped, setIsSwapped] = useState<boolean>(false);
  const [highlightDiff, setHighlightDiff] = useState<boolean>(false);
  const [tableSearch, setTableSearch] = useState<string>('');
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  // Voice Input (Web Speech API)
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Image Upload
  const [uploadedImages, setUploadedImages] = useState<Array<ImageInput & { previewUrl: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut listener ('V' to flip view mode)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }
      if (e.key === 'v' || e.key === 'V') {
        e.preventDefault();
        setViewMode((prev) => (prev === 'spec' ? 'canvas' : 'spec'));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Safe Display Entities
  const displayEntityA = isSwapped ? entityBData.name : entityAData.name;
  const displayEntityB = isSwapped ? entityAData.name : entityBData.name;

  const displayProsA = isSwapped ? entityBData.pros : entityAData.pros;
  const displayProsB = isSwapped ? entityAData.pros : entityBData.pros;

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

﻿  // 100% Dynamic Filtered Categories (Supports any domain: Shoes, Software, Universities, etc.)
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

  const handleAddCustomMetric = async (metricToAdd?: string) => {
    const targetMetric = (metricToAdd || customMetricInput).trim();
    if (!targetMetric) return;

    setAddingMetric(true);
    setError(null);

    try {
      const res = await fetch('/api/compare/custom-metric', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityA: displayEntityA,
          entityB: displayEntityB,
          customMetric: targetMetric,
          category,
        }),
      });

      const newRow = await res.json();
      if (!res.ok || newRow.error) {
        throw new Error(newRow.error || 'Failed to extract custom metric');
      }

      const customMetricObj: VerifiedMetric = {
        metric: newRow.metric,
        entity_a: isSwapped ? newRow.entity_b : newRow.entity_a,
        entity_b: isSwapped ? newRow.entity_a : newRow.entity_b,
        source_type: newRow.source_type || 'official',
      };

      setCategories((prev) => {
        const targetCategoryName = Object.keys(prev)[0] || 'Custom Specifications';
        return {
          ...prev,
          [targetCategoryName]: [...(prev[targetCategoryName] || []), customMetricObj],
        };
      });

      setSuggestedMetrics((prev) => prev.filter((sm) => sm.toLowerCase() !== targetMetric.toLowerCase()));
      setCustomMetricInput('');
      setRecentlyAddedMetric(newRow.metric);
      setActiveTab('verified');

      setTimeout(() => setRecentlyAddedMetric(null), 3000);
    } catch (err: any) {
      console.error('Custom metric addition error:', err);
      setError(err?.message || 'Could not add custom metric');
    } finally {
      setAddingMetric(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remaining = 2 - uploadedImages.length;
    if (remaining <= 0) return;

    const filesToRead = Array.from(files).slice(0, remaining);
    const newImgs: Array<ImageInput & { previewUrl: string }> = [];

    for (const file of filesToRead) {
      const base64: string = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      newImgs.push({
        data: base64,
        mimeType: file.type || 'image/jpeg',
        name: file.name,
        previewUrl: base64,
      });
    }

    setUploadedImages((prev) => [...prev, ...newImgs]);

    if (newImgs.length > 0) {
      try {
        setLoading(true);
        const res = await fetch('/api/compare/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ images: [...uploadedImages, ...newImgs] }),
        });
        const imgData = await res.json();
        if (imgData.entityA && imgData.entityB) {
          const autoQuery = `${imgData.entityA} vs ${imgData.entityB}`;
          setPrompt(autoQuery);
          handleRunComparison(undefined, autoQuery);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRunComparison = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const query = (customQuery || prompt).trim();
    if (!query && uploadedImages.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: query || 'Compare uploaded visual subjects in detail',
          images: uploadedImages.map((img) => ({
            data: img.data,
            mimeType: img.mimeType,
            name: img.name,
          })),
        }),
      });

      const data: AgentApiResponse & { error?: string } = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to generate comparison');
      }

      // Safe Entity Resolution
      if (data.entity_a) {
        setEntityAData(
          typeof data.entity_a === 'object'
            ? data.entity_a
            : { name: String(data.entity_a), pros: [] }
        );
      }
      if (data.entity_b) {
        setEntityBData(
          typeof data.entity_b === 'object'
            ? data.entity_b
            : { name: String(data.entity_b), pros: [] }
        );
      }

      if (data.category) setCategory(data.category);

      // Dynamic Categories Resolution
      if (data.categories && Object.keys(data.categories).length > 0) {
        setCategories(data.categories);
      } else if (Array.isArray(data.verified_metrics) && data.verified_metrics.length > 0) {
        setCategories({
          [data.category || 'Core Specifications']: data.verified_metrics,
        });
      }

      if (Array.isArray(data.community_sentiment) && data.community_sentiment.length > 0) {
        setCommunitySentiment(data.community_sentiment);
      }

      if (Array.isArray(data.suggested_metrics) && data.suggested_metrics.length > 0) {
        setSuggestedMetrics(data.suggested_metrics);
      }

      if (data.verdict_summary) {
        setVerdictSummary(data.verdict_summary);
      }

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

﻿  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-slate-800 selection:text-white pb-16">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        multiple
        className="hidden"
      />

      {/* Top Main Navigation Bar with Expanding Central Search & Far-Right View Mode */}
      <header className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          {/* Logo & Branding */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-sky-400 shadow-sm">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-white">MorphUI</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-sky-300 border border-slate-700">
                  Dual-Engine
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Spec Sheet & Spatial Graph Runtime</p>
            </div>
          </div>

          {/* Central Expanding Flex Container with Search, Mic, Image & Primary Submit Icon */}
          <div className="flex-1 flex-grow max-w-2xl mx-2">
            <form onSubmit={handleRunComparison} className="relative w-full flex items-center">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Compare any two entities (Shoes, Phones, Colleges, Software)..."
                disabled={loading}
                className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl pl-9 pr-24 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 outline-none transition-all shadow-inner"
              />

              {/* Action Controls Grouped Inside the Input */}
              <div className="absolute right-1.5 flex items-center gap-1">
                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  title={isListening ? 'Listening... click to stop' : 'Click to speak query (Voice Search)'}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isListening
                      ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/30'
                      : 'text-slate-400 hover:text-sky-400 hover:bg-slate-800'
                  }`}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload images to visually compare"
                  disabled={loading || uploadedImages.length >= 2}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-slate-800 transition-colors disabled:opacity-40"
                >
                  <ImagePlus className="w-4 h-4" />
                </button>

                {/* Primary Submit Compare Icon Button Inside Input */}
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

          {/* Far-Right View Switcher & Responsive Shortcut Badge */}
          <div className="flex items-center gap-3 shrink-0">
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

            {/* Shortcut Text - Hidden on Small Screens */}
            <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px]">
                V
              </kbd>
              <span>toggle view</span>
            </div>
          </div>
        </div>

        {/* Listening Banner */}
        {isListening && (
          <div className="bg-rose-500/10 border-t border-rose-500/20 py-1 px-4 text-center text-xs text-rose-300 flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span className="font-semibold">Listening to your voice... Speak your comparison now!</span>
          </div>
        )}
      </header>

﻿      {/* VIEWPORT BODY: DUAL-VIEW */}
      {viewMode === 'canvas' ? (
        // VIEW 2: SPATIAL CANVAS GRAPH VIEW
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-4">
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
        // VIEW 1: SPEC SHEET VIEW
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Uploaded Images Preview */}
          {uploadedImages.length > 0 && (
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-sky-400" /> Visual Inputs ({uploadedImages.length}/2):
              </span>
              <div className="flex items-center gap-2">
                {uploadedImages.map((img, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs"
                  >
                    <img src={img.previewUrl} alt={img.name} className="w-6 h-6 object-cover rounded" />
                    <span className="text-slate-300 font-medium truncate max-w-[120px]">{img.name}</span>
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
            <div className="p-4 bg-rose-950/80 border border-rose-800/80 rounded-2xl text-xs sm:text-sm text-rose-200 flex items-center justify-between shadow-md">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="font-bold ml-3 text-rose-400 hover:text-rose-200">
                Dismiss
              </button>
            </div>
          )}

          {/* Main Entity Comparison Hero Card */}
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-6 border-b border-slate-800">
              {/* Entity A */}
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-slate-800 text-sky-400 border border-slate-700">
                    Option A
                  </span>
                  <span className="text-xs text-slate-400">{category}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  {displayEntityA}
                </h1>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/90 border border-slate-700 text-xs font-medium text-slate-200">
                  <Award className="w-3.5 h-3.5 text-sky-400" />
                  <span>Verified Baseline</span>
                </div>
              </div>

              {/* VS Badge */}
              <div className="flex flex-col items-center justify-center shrink-0">
                <div className="w-12 h-12 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center shadow-md">
                  <span className="font-bold font-mono text-sm text-slate-400">VS</span>
                </div>
              </div>

              {/* Entity B */}
              <div className="flex-1 space-y-2 md:text-right">
                <div className="flex items-center gap-2 md:justify-end">
                  <span className="text-xs text-slate-400">{category}</span>
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-slate-800 text-indigo-400 border border-slate-700">
                    Option B
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  {displayEntityB}
                </h1>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/90 border border-slate-700 text-xs font-medium text-slate-200">
                  <Award className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Verified Baseline</span>
                </div>
              </div>
            </div>

            {/* Telemetry and Trust Badges */}
            <div className="pt-3 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Reddit De-Biasing & Multi-Source Extraction Engine</span>
              </div>
              <div className="font-mono text-[11px] text-slate-400">
                {activeModel}
              </div>
            </div>
          </section>

          {/* Executive Verdict Card with Safe Entity Pros Resolution */}
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
              <div className="p-1.5 rounded-lg bg-slate-800 text-sky-400 border border-slate-700">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white tracking-tight">Executive Verdict & Synthesis</h3>
                <p className="text-xs text-slate-400">Synthesized takeaway balancing verified data & Reddit consensus</p>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
              {verdictSummary}
            </p>

            {/* 100% Safe Entity Verdict Cards (Mapped directly to entity_a.name / entity_b.name & pros) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-sky-400 font-semibold text-xs uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>Choose {displayEntityA} if:</span>
                </div>
                <ul className="space-y-2 text-xs text-slate-300">
                  {(displayProsA.length > 0 ? displayProsA : ['Verified domain baseline features']).map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0 mt-1.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Choose {displayEntityB} if:</span>
                </div>
                <ul className="space-y-2 text-xs text-slate-300">
                  {(displayProsB.length > 0 ? displayProsB : ['Targeted competitive benchmark features']).map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0 mt-1.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

﻿          {/* Partitioned Tabs & Utility Toolbar */}
          <section className="space-y-3 no-print">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-900 border border-slate-800 p-2 rounded-2xl">
              <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab('verified')}
                  className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                    activeTab === 'verified'
                      ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Verified Facts & Official Specs</span>
                  <span className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-slate-900 text-slate-400 border border-slate-800">
                    {flatVerifiedMetrics.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('community')}
                  className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                    activeTab === 'community'
                      ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 text-sky-400" />
                  <span>Community & Reddit Sentiment</span>
                  <span className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-slate-900 text-sky-300 border border-slate-800">
                    {communitySentiment.length}
                  </span>
                </button>
              </div>

              {/* Quick Filter Search */}
              <div className="flex items-center gap-2 px-2">
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

            {/* Action Utilities */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-2.5 flex flex-wrap items-center justify-between gap-2 shadow-sm">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSwapped((prev) => !prev)}
                  className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white transition-colors flex items-center gap-1.5"
                  title="Swap Entity Columns"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5 text-sky-400" />
                  <span>Swap Entities</span>
                </button>

                <button
                  type="button"
                  onClick={() => setHighlightDiff((prev) => !prev)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    highlightDiff
                      ? 'bg-sky-500/10 border-sky-500/40 text-sky-300'
                      : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                  <span>Highlight Diff</span>
                </button>

                <button
                  type="button"
                  onClick={toggleAllSections}
                  className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400" />
                  <span>Expand / Collapse</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportPDF}
                  className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-400" />
                  <span>Export PDF</span>
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

          {/* TAB 1: 100% Dynamic Verified Facts & Official Specs Table */}
          {activeTab === 'verified' && (
            <section className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden print-clean">
              <div className="sticky top-16 z-20 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-6 py-3.5 grid grid-cols-12 gap-4 items-center text-xs font-bold uppercase tracking-wider text-slate-400 shadow-sm">
                <div className="col-span-4 flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-slate-500" />
                  <span>Dynamic Metric / Attribute</span>
                </div>
                <div className="col-span-4 text-sky-400 flex items-center gap-1.5 truncate">
                  <span className="w-2 h-2 rounded-full bg-sky-400 shrink-0" />
                  <span className="truncate">{displayEntityA}</span>
                </div>
                <div className="col-span-4 text-indigo-400 flex items-center gap-1.5 truncate">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" />
                  <span className="truncate">{displayEntityB}</span>
                </div>
              </div>

              {/* Dynamic Categories Loop: Object.entries(categories).map(...) */}
              <div className="divide-y divide-slate-800">
                {Object.keys(filteredCategories).length === 0 ? (
                  <div className="p-12 text-center text-slate-500 text-sm">
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
                          className="w-full bg-slate-950/70 hover:bg-slate-950/90 px-6 py-3 flex items-center justify-between text-left transition-colors border-t first:border-t-0 border-slate-800"
                        >
                          <div className="flex items-center gap-2.5">
                            <SlidersHorizontal className="w-4 h-4 text-sky-400" />
                            <span className="font-bold text-xs sm:text-sm text-slate-200">
                              {categoryName}
                            </span>
                            <span className="text-[11px] text-slate-500 font-mono">
                              ({metrics.length})
                            </span>
                          </div>
                          <div className="text-slate-500 hover:text-slate-300">
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
                                  className={`grid grid-cols-12 gap-4 px-6 py-4 items-start text-xs sm:text-sm transition-all duration-500 ${
                                    isNewlyAdded
                                      ? 'bg-emerald-950/40 border-l-4 border-emerald-400'
                                      : highlightDiff && isDifferent
                                      ? 'bg-sky-950/20 hover:bg-sky-950/30'
                                      : 'hover:bg-slate-800/40'
                                  }`}
                                >
                                  <div className="col-span-4 pr-2">
                                    <div className="font-semibold text-slate-200 leading-snug">
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

                                  <div className="col-span-4 text-slate-300 leading-relaxed pr-2 space-y-1.5">
                                    <div>{m.entity_a}</div>
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

                                  <div className="col-span-4 text-slate-300 leading-relaxed space-y-1.5">
                                    <div>{m.entity_b}</div>
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
            </section>
          )}

          {/* TAB 2: Community & Reddit Sentiment Table */}
          {activeTab === 'community' && (
            <section className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden print-clean">
              <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-sky-400" />
                  <span>
                    De-Biased Consensus: Hyperbolic & isolated personal rants stripped; consensus normalized.
                  </span>
                </div>
              </div>

              <div className="sticky top-16 z-20 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-6 py-3.5 grid grid-cols-12 gap-4 items-center text-xs font-bold uppercase tracking-wider text-slate-400 shadow-sm">
                <div className="col-span-4 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-slate-500" />
                  <span>Community Theme / Topic</span>
                </div>
                <div className="col-span-4 text-sky-400 flex items-center gap-1.5 truncate">
                  <span className="w-2 h-2 rounded-full bg-sky-400 shrink-0" />
                  <span className="truncate">{displayEntityA} Consensus</span>
                </div>
                <div className="col-span-4 text-indigo-400 flex items-center gap-1.5 truncate">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" />
                  <span className="truncate">{displayEntityB} Consensus</span>
                </div>
              </div>

              <div className="divide-y divide-slate-800/70 bg-slate-900/60">
                {filteredCommunitySentiment.length === 0 ? (
                  <div className="p-12 text-center text-slate-500 text-sm">
                    No community themes match &quot;{tableSearch}&quot;.
                  </div>
                ) : (
                  filteredCommunitySentiment.map((s, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-4 px-6 py-4 items-start text-xs sm:text-sm hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="col-span-4 pr-2 space-y-1.5">
                        <div className="font-semibold text-slate-200 leading-snug">{s.topic}</div>
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

                      <div className="col-span-4 text-slate-300 leading-relaxed pr-2 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/60">
                        {s.entity_a_consensus}
                      </div>

                      <div className="col-span-4 text-slate-300 leading-relaxed bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/60">
                        {s.entity_b_consensus}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          )}

          {/* Interactive Custom Metrics & AI Suggestions */}
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 no-print">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-400" />
                <h3 className="font-bold text-sm text-white">AI-Suggested Comparison Metrics</h3>
              </div>
              <span className="text-xs text-slate-400">Click any suggested chip to retrieve & append instantly</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {suggestedMetrics.map((sm, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAddCustomMetric(sm)}
                  disabled={addingMetric}
                  className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 hover:border-sky-500/50 text-slate-300 hover:text-white border border-slate-800 text-xs font-medium transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-40"
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
                className="flex items-center gap-2 max-w-xl"
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
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-sky-500 hover:bg-sky-400 text-white active:scale-95 transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
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
      <footer className="border-t border-slate-800/80 bg-slate-900/40 py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>MorphUI • Persistent Dual-View Spec Sheet & Spatial Graph Runtime</span>
          <span>Zero-slop human-engineered architecture (2026)</span>
        </div>
      </footer>
    </div>
  );
}
