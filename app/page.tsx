'use client';

import '@xyflow/react/dist/style.css';
import React, { useState, useMemo, useCallback, useRef } from 'react';
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
import { Sparkles, Play, LayoutGrid, Loader2, Compass, AlertCircle, Cpu, ImagePlus, X, Eye } from 'lucide-react';
import { ComparisonTableWidget } from '@/components/widgets/ComparisonTableWidget';
import { TimelineCalendarWidget } from '@/components/widgets/TimelineCalendarWidget';
import { BudgetTrackerWidget } from '@/components/widgets/BudgetTrackerWidget';
import { AdmissionPredictorWidget } from '@/components/widgets/AdmissionPredictorWidget';
import { AgentApiResponse, MorphWidget, ImageInput } from '@/types/morphui';

const SAMPLE_PROMPTS = [
  "🍎 Apple vs 🍊 Orange: Nutrition, Taste & Shelf Life",
  "iit bombay vs iit delhi",
  "Top Master's in CS programs in Germany: requirements, deadlines, living budget",
  "Trip to Tokyo for 7 days: flight/hotel comparison & budget",
  "iPhone 16 Pro vs Samsung Galaxy S25 Ultra: camera, battery & performance",
];

function CanvasWorkspace() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeModel, setActiveModel] = useState<string | null>(null);
  const [isGrounded, setIsGrounded] = useState<boolean>(false);
  const [isVisual, setIsVisual] = useState<boolean>(false);

  // Multimodal image comparison state
  const [uploadedImages, setUploadedImages] = useState<Array<ImageInput & { previewUrl: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = 3 - uploadedImages.length;
    if (remainingSlots <= 0) return;

    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    filesToProcess.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setUploadedImages((prev) => [
          ...prev,
          {
            data: result,
            mimeType: file.type || 'image/jpeg',
            name: file.name,
            previewUrl: result,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setUploadedImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleRun = async (e?: React.FormEvent, customPrompt?: string) => {
    if (e) e.preventDefault();
    let queryToRun = (customPrompt || prompt).trim();

    if (!queryToRun && uploadedImages.length === 0) {
      return;
    }

    if (!queryToRun && uploadedImages.length > 0) {
      queryToRun = uploadedImages.length === 1
        ? 'Visually inspect this image and generate comprehensive feature analysis widgets'
        : 'Compare these items in visual and functional detail';
      setPrompt(queryToRun);
    } else if (customPrompt) {
      setPrompt(customPrompt);
    }

    setLoading(true);
    setError(null);

    // Clear existing nodes and edges before mapping new ones
    setNodes([]);
    setEdges([]);
    setActiveModel(null);
    setIsGrounded(false);
    setIsVisual(false);

    try {
      const payloadImages: ImageInput[] = uploadedImages.map((img) => ({
        data: img.data,
        mimeType: img.mimeType,
        name: img.name,
      }));

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: queryToRun,
          images: payloadImages,
        }),
      });

      const json: AgentApiResponse & { error?: string } = await res.json();

      if (!res.ok || json.error) {
        throw new Error(json.error || `Request failed with status ${res.status}`);
      }

      const generatedWidgets: MorphWidget[] = json.widgets || [];
      if (generatedWidgets.length === 0) {
        throw new Error('No widgets generated for this query. Please try with more details.');
      }

      if (json.model_used) {
        setActiveModel(json.model_used);
      }
      if (json.grounded) {
        setIsGrounded(true);
      }
      if (json.visual_comparison || uploadedImages.length > 0) {
        setIsVisual(true);
      }

      const START_X = 80;
      const CARD_WIDTH = 540;
      const GAP = 52;
      const START_Y = 120;

      const newNodes: Node[] = generatedWidgets.map((widget, index) => {
        // If images were uploaded and this is a comparison table, attach image thumbnails
        const widgetData = { ...widget.data } as any;
        if (widget.widget_type === 'comparison_table' && uploadedImages.length > 0 && !widgetData.images) {
          widgetData.images = uploadedImages.map((img, i) => ({
            url: img.previewUrl,
            name: img.name,
            label: i === 0 ? 'Item A' : i === 1 ? 'Item B' : `Item ${i + 1}`,
          }));
        }

        return {
          id: `node-${index}-${Date.now()}`,
          type: widget.widget_type,
          position: {
            x: START_X + index * (CARD_WIDTH + GAP),
            y: START_Y,
          },
          data: {
            title: widget.title,
            ...widgetData,
          },
        };
      });

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
      {/* Hidden File Input for Image Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        multiple
        className="hidden"
      />

      {/* Top Floating Command Bar */}
      <header className="absolute top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-5xl">
        <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-800/90 shadow-2xl rounded-2xl p-3 flex flex-col gap-2.5">
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
              <div className="relative flex-1 flex items-center">
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={
                    uploadedImages.length > 0
                      ? 'Type custom comparison instructions or click Run Agent...'
                      : 'Enter any scenario (e.g. Apple vs Orange, universities, trips)...'
                  }
                  disabled={loading}
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-sky-500 rounded-xl pl-4 pr-10 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all shadow-inner disabled:opacity-60"
                />

                {/* Attach Image Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload images to visually compare"
                  disabled={loading || uploadedImages.length >= 3}
                  className="absolute right-2 p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-slate-800/80 transition-colors disabled:opacity-40"
                >
                  <ImagePlus className="w-4 h-4" />
                </button>
              </div>

              <button
                type="submit"
                disabled={loading || (!prompt.trim() && uploadedImages.length === 0)}
                className="px-4 py-2.5 rounded-xl font-medium text-sm text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 active:scale-[0.98] transition-all shadow-lg shadow-sky-600/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing...</span>
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

          {/* Uploaded Images Preview Strip */}
          {uploadedImages.length > 0 && (
            <div className="flex items-center gap-2 px-2 py-1.5 bg-slate-950/70 border border-slate-800 rounded-xl overflow-x-auto">
              <div className="flex items-center gap-1.5 text-xs text-sky-400 shrink-0 font-medium pr-2 border-r border-slate-800">
                <Eye className="w-3.5 h-3.5" />
                <span>Visual Comparison Mode ({uploadedImages.length}/3):</span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto py-0.5">
                {uploadedImages.map((img, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/70 rounded-lg px-2 py-1 shrink-0 group relative shadow-md"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.previewUrl}
                      alt={img.name}
                      className="w-5 h-5 rounded object-cover border border-slate-700"
                    />
                    <span className="text-[11px] font-semibold text-sky-300">
                      Item {idx === 0 ? 'A' : idx === 1 ? 'B' : String.fromCharCode(65 + idx)}:
                    </span>
                    <span className="text-[11px] text-slate-300 truncate max-w-[120px]">
                      {img.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="p-0.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors ml-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadedImages.length >= 3}
                className="text-[11px] text-slate-400 hover:text-sky-300 px-2 py-1 rounded bg-slate-900/80 border border-slate-800 shrink-0 disabled:opacity-40"
              >
                + Add Another
              </button>
            </div>
          )}

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

            <div className="flex items-center gap-1.5 shrink-0">
              {isVisual && (
                <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-950/60 border border-purple-800/60 text-purple-300 text-[10px] font-mono">
                  <Eye className="w-3 h-3 text-purple-400" />
                  <span>Multimodal Vision</span>
                </div>
              )}
              {isGrounded && (
                <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-950/60 border border-sky-800/60 text-sky-300 text-[10px] font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse"></span>
                  <span>Live Grounded 2026</span>
                </div>
              )}
              {activeModel && (
                <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-[10px] font-mono">
                  <Cpu className="w-3 h-3 text-emerald-400" />
                  <span className="truncate max-w-[180px]">{activeModel}</span>
                </div>
              )}
            </div>
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
              x
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
            Dynamic Spatial Research Canvas
          </h2>
          <p className="text-sm text-slate-400 max-w-md leading-relaxed mb-6">
            Enter a prompt, pick a sample query, or upload two images (e.g. 🍎 Apple vs 🍊 Orange) using the camera icon to generate synchronized comparison widgets.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 pointer-events-auto">
            <span className="text-xs text-slate-500 uppercase tracking-widest font-mono">
              Dynamic Widgets:
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
              <p className="font-semibold text-sm text-slate-100">
                {uploadedImages.length > 0 ? 'Analyzing Visual Input & Generating Widgets...' : 'Consulting Multi-Model Engine...'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {uploadedImages.length > 0 ? 'Running Gemini 3.6 Flash multimodal vision...' : 'Racing Gemini 3.6 Flash & Groq with live failover...'}
              </p>
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
