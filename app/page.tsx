'use client';

import '@xyflow/react/dist/style.css';
import React, { useState, useMemo, useCallback } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  useReactFlow,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  BackgroundVariant,
} from '@xyflow/react';
import { Sparkles, Play, LayoutGrid, Loader2, Compass, AlertCircle, Cpu } from 'lucide-react';
import { ComparisonTableWidget } from '@/components/widgets/ComparisonTableWidget';
import { TimelineCalendarWidget } from '@/components/widgets/TimelineCalendarWidget';
import { BudgetTrackerWidget } from '@/components/widgets/BudgetTrackerWidget';
import { AdmissionPredictorWidget } from '@/components/widgets/AdmissionPredictorWidget';
import { AgentApiResponse, MorphWidget } from '@/types/morphui';

const SAMPLE_PROMPTS = [
  "iit bombay vs iit delhi",
  "Top Master's in CS programs in Germany: requirements, deadlines, living budget, and admission odds",
  "Trip to Tokyo for 7 days: flight/hotel comparison, daily itinerary, expense budget",
  "Compare Ivy League universities: tuition fees, application timeline, admission chances",
  "Launching a SaaS product: tech stack comparison, 3-month launch roadmap, seed budget",
];

function CanvasWorkspace() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeModel, setActiveModel] = useState<string | null>(null);
  const [isGrounded, setIsGrounded] = useState<boolean>(false);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const { fitView } = useReactFlow();

  const nodeTypes = useMemo(
    () => ({
      comparison_table: ComparisonTableWidget,
      timeline_calendar: TimelineCalendarWidget,
      budget_tracker: BudgetTrackerWidget,
      admission_predictor: AdmissionPredictorWidget,
    }),
    []
  );

  const handleAutoLayout = useCallback(() => {
    fitView({ padding: 0.18, duration: 600 });
  }, [fitView]);

  const handleRun = async (e?: React.FormEvent, customPrompt?: string) => {
    if (e) e.preventDefault();
    const queryToRun = customPrompt || prompt;
    if (!queryToRun.trim() || loading) return;

    if (customPrompt) {
      setPrompt(customPrompt);
    }

    setLoading(true);
    setError(null);

    // Clear existing nodes and edges before mapping new ones
    setNodes([]);
    setEdges([]);
    setActiveModel(null);
    setIsGrounded(false);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: queryToRun }),
      });

      const json: AgentApiResponse & { error?: string; model_used?: string } = await res.json();

      if (!res.ok || json.error) {
        throw new Error(json.error || `Request failed with status ${res.status}`);
      }

      const generatedWidgets: MorphWidget[] = json.widgets || [];
      if (generatedWidgets.length === 0) {
        throw new Error('No widgets generated for this prompt. Try a more detailed query.');
      }

      if (json.model_used) {
        setActiveModel(json.model_used);
      }
      if (json.grounded) {
        setIsGrounded(true);
      }

      const START_X = 80;
      const CARD_WIDTH = 480;
      const GAP = 48;
      const START_Y = 120;

      const newNodes: Node[] = generatedWidgets.map((widget, index) => ({
        id: `node-${index}-${Date.now()}`,
        type: widget.widget_type,
        position: {
          x: START_X + index * (CARD_WIDTH + GAP),
          y: START_Y,
        },
        data: {
          title: widget.title,
          ...widget.data,
        },
      }));

      // Generate sequential flow edges connecting each card to the next
      const newEdges: Edge[] = [];
      for (let i = 0; i < newNodes.length - 1; i++) {
        newEdges.push({
          id: `edge-${newNodes[i].id}-${newNodes[i + 1].id}`,
          source: newNodes[i].id,
          target: newNodes[i + 1].id,
          animated: true,
          style: { stroke: '#38bdf8', strokeWidth: 2, strokeDasharray: '5,5' },
        });
      }

      setNodes(newNodes);
      setEdges(newEdges);

      // Smooth camera framing over the newly created spatial layout
      setTimeout(() => {
        fitView({ padding: 0.18, duration: 600 });
      }, 150);
    } catch (err: unknown) {
      console.error('Run Agent Error:', err);
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred while running agent.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#070b14] text-slate-100 select-none">
      {/* Top Floating Command Bar */}
      <header className="absolute top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-5xl">
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800/90 shadow-2xl rounded-2xl p-3 flex flex-col gap-2.5">
          <div className="flex items-center gap-3">
            {/* Brand Logo & Title */}
            <div className="flex items-center gap-2.5 pl-2 pr-3 py-1 border-r border-slate-800 shrink-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="leading-tight">
                <h1 className="font-bold text-base tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  MorphUI
                </h1>
                <p className="text-[10px] uppercase font-mono tracking-widest text-sky-400">
                  Spatial Runtime
                </p>
              </div>
            </div>

            {/* Prompt Input Form */}
            <form onSubmit={handleRun} className="flex-1 flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Enter any scenario, university, itinerary, or research topic..."
                  disabled={loading}
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-sky-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all shadow-inner disabled:opacity-60"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !prompt.trim()}
                className="px-4 py-2.5 rounded-xl font-medium text-sm text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 active:scale-[0.98] transition-all shadow-lg shadow-sky-600/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Racing Models...</span>
                  </>
                ) : (
                  <>
                    <span>Run Agent</span>
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleAutoLayout}
                title="Fit View / Auto-Layout Canvas"
                className="px-3 py-2.5 rounded-xl text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 active:scale-[0.98] transition-all flex items-center gap-1.5 shrink-0"
              >
                <LayoutGrid className="w-4 h-4 text-sky-400" />
                <span className="hidden sm:inline">Auto-Layout</span>
              </button>
            </form>
          </div>

          {/* Subheader: Prompt Suggestions & Active Model Tag */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/50 text-[11px]">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar flex-1 min-w-0">
              <span className="text-slate-500 shrink-0 flex items-center gap-1 pl-1">
                <Compass className="w-3 h-3 text-sky-400" /> Suggestions:
              </span>
              {SAMPLE_PROMPTS.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleRun(undefined, sample)}
                  disabled={loading}
                  className="shrink-0 px-2.5 py-1 rounded-full bg-slate-800/60 hover:bg-slate-800 hover:text-sky-300 text-slate-400 border border-slate-700/50 transition-colors text-left truncate max-w-[280px]"
                >
                  {sample}
                </button>
              ))}
            </div>

            {isGrounded && (
                <div className="shrink-0 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-950/60 border border-sky-800/60 text-sky-300 text-[10px] font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse"></span>
                  <span>Live Grounded 2026</span>
                </div>
              )}
              {activeModel && (
              <div className="shrink-0 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-[10px] font-mono">
                <Cpu className="w-3 h-3 text-emerald-400" />
                <span>Fast Result: {activeModel}</span>
              </div>
            )}
          </div>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div className="mt-2 mx-auto max-w-2xl p-3 bg-rose-950/80 border border-rose-800/60 rounded-xl text-xs text-rose-200 flex items-center justify-between shadow-xl backdrop-blur">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-rose-400 hover:text-rose-200 font-bold ml-2 text-sm"
            >
              ?
            </button>
          </div>
        )}
      </header>

      {/* Empty State Overlay */}
      {nodes.length === 0 && !loading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4 shadow-2xl text-sky-400">
            <Sparkles className="w-8 h-8 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight mb-2">
            Dynamic Spatial Canvas
          </h2>
          <p className="text-sm text-slate-400 max-w-md leading-relaxed mb-6">
            Enter a prompt or select a suggestion above. MorphUI runs a high-speed multi-model race (Gemini & Groq) with real-time failover to synthesize connected widgets across your canvas.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 pointer-events-auto">
            <span className="text-xs text-slate-500 uppercase tracking-widest font-mono">
              Supported Widgets:
            </span>
            <span className="px-2.5 py-1 rounded-md text-xs bg-slate-900 border border-slate-800 text-sky-300">
              Comparison Table
            </span>
            <span className="px-2.5 py-1 rounded-md text-xs bg-slate-900 border border-slate-800 text-indigo-300">
              Timeline & Calendar
            </span>
            <span className="px-2.5 py-1 rounded-md text-xs bg-slate-900 border border-slate-800 text-emerald-300">
              Budget Tracker
            </span>
            <span className="px-2.5 py-1 rounded-md text-xs bg-slate-900 border border-slate-800 text-amber-300">
              Admission Predictor
            </span>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/40 backdrop-blur-sm pointer-events-none">
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl flex flex-col items-center gap-3 text-center">
            <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
            <div>
              <p className="font-semibold text-sm text-slate-100">Consulting Multi-Model Engine</p>
              <p className="text-xs text-slate-400 mt-1">Racing Gemini & Groq with instant failover fallback...</p>
            </div>
          </div>
        </div>
      )}

      {/* React Flow Infinite Canvas */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.2}
        maxZoom={1.8}
        defaultViewport={{ x: 0, y: 0, zoom: 0.85 }}
        className="w-full h-full"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.5}
          color="#1e293b"
        />
        <Controls position="bottom-right" />
      </ReactFlow>
    </div>
  );
}

export default function Page() {
  return (
    <ReactFlowProvider>
      <CanvasWorkspace />
    </ReactFlowProvider>
  );
}