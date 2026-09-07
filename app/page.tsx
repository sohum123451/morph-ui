'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  GenerativeComparisonResponse,
  VerifiedMetric,
  EntityVerdict,
  CommunitySentiment,
} from '@/types/morphui';
import {
  SearchIcon,
  SlidersIcon,
  SpatialIcon,
  ThreeDIcon,
  WarningIcon,
  ShieldIcon,
  PlusIcon,
  SpinnerIcon,
  MicIcon,
  RefreshIcon,
} from '@/components/icons/CustomIcons';
import { PriorityLens } from '@/components/lenses/PriorityLens';

const DivergenceField = dynamic(
  () => import('@/components/lenses/DivergenceField').then((mod) => mod.DivergenceField),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[650px] rounded-xl border border-[#355E58] bg-[#053229] flex flex-col items-center justify-center space-y-3 text-[#72B0AB] font-mono">
        <SpinnerIcon className="w-6 h-6 text-[#FE9179]" />
        <span className="text-xs uppercase tracking-widest">INITIALIZING DIVERGENCE FIELD TOPOLOGY...</span>
      </div>
    ),
  }
);

const Playable3DCanvas = dynamic(
  () => import('@/components/lenses/Playable3DCanvas').then((mod) => mod.Playable3DCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[650px] rounded-xl border border-[#355E58] bg-[#053229] flex flex-col items-center justify-center space-y-3 text-[#72B0AB] font-mono">
        <SpinnerIcon className="w-6 h-6 text-[#FE9179]" />
        <span className="text-xs uppercase tracking-widest">MOUNTING PLAYABLE 3D WEBGL ENGINE...</span>
      </div>
    ),
  }
);

const SAMPLE_QUERIES = [
  'iPhone 16 Pro vs Pixel 9 Pro',
  'React vs Vue vs Svelte for Web Apps',
  'MIT vs Stanford for Computer Science',
  'Sony WH-1000XM5 vs Bose QC Ultra',
  'Nike Pegasus 41 vs Adidas Ultraboost 5',
];

export default function MorphUIWorkbench() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [comparisonData, setComparisonData] = useState<GenerativeComparisonResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [incompatibleError, setIncompatibleError] = useState<{
    error: string;
    message: string;
    entities?: string[];
  } | null>(null);

  // Active View: 'priority' | 'divergence' | 'spatial3d'
  const [activeLens, setActiveLens] = useState<'priority' | 'divergence' | 'spatial3d'>('priority');

  // Interactive Priority Weights state
  const [metricWeights, setMetricWeights] = useState<Record<string, number>>({});
  const [orderedMetrics, setOrderedMetrics] = useState<VerifiedMetric[]>([]);

  // Voice recording state
  const [isListening, setIsListening] = useState(false);

  // Custom metric input
  const [customMetricInput, setCustomMetricInput] = useState('');
  const [addingMetric, setAddingMetric] = useState(false);

  // Synchronize comparison metrics when new data arrives
  useEffect(() => {
    if (comparisonData) {
      const flatList: VerifiedMetric[] = [];
      if (comparisonData.categories) {
        Object.values(comparisonData.categories).forEach((cat) => {
          if (Array.isArray(cat)) {
            flatList.push(...cat);
          }
        });
      }
      if (flatList.length === 0 && comparisonData.verified_metrics) {
        flatList.push(...comparisonData.verified_metrics);
      }

      setOrderedMetrics(flatList);

      // Initialize weights to 1.0
      const initialWeights: Record<string, number> = {};
      flatList.forEach((m) => {
        initialWeights[m.metric] = 1.0;
      });
      setMetricWeights(initialWeights);
    }
  }, [comparisonData]);

  // Execute Comparison API Call
  const handleExecuteComparison = async (queryToRun: string) => {
    if (!queryToRun.trim() || loading) return;

    setLoading(true);
    setError(null);
    setIncompatibleError(null);

    try {
      const res = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: queryToRun }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        if (errJson.incompatible) {
          setIncompatibleError({
            error: errJson.error || 'Incompatible comparison entities detected.',
            message:
              errJson.message ||
              "These items appear to be from completely different categories. Please specify a shared context or category (e.g., 'Compare Apple [fruit] to Banana' or 'Compare Apple [tech] to Microsoft').",
            entities: errJson.entities || [],
          });
          setLoading(false);
          return;
        }
        throw new Error(errJson.error || `Comparison failed with HTTP ${res.status}`);
      }

      const resJson = await res.json();
      const data: GenerativeComparisonResponse = resJson.data ? resJson.data : resJson;
      setComparisonData(data);
    } catch (err: any) {
      console.error('Comparison error:', err);
      setError(err.message || 'Failed to generate comparison. Please check input.');
    } finally {
      setLoading(false);
    }
  };

  // Keyboard shortcut: Press 'V' to cycle lenses
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (e.key === 'v' || e.key === 'V') {
        e.preventDefault();
        setActiveLens((prev) => {
          if (prev === 'priority') return 'divergence';
          if (prev === 'divergence') return 'spatial3d';
          return 'priority';
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Weight handlers
  const handleWeightChange = useCallback((metricName: string, weight: number) => {
    setMetricWeights((prev) => ({
      ...prev,
      [metricName]: weight,
    }));
  }, []);

  const handleMoveMetric = useCallback((fromIndex: number, toIndex: number) => {
    setOrderedMetrics((prev) => {
      if (fromIndex < 0 || fromIndex >= prev.length || toIndex < 0 || toIndex >= prev.length) {
        return prev;
      }
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    });
  }, []);

  const handleResetWeights = useCallback(() => {
    const reset: Record<string, number> = {};
    orderedMetrics.forEach((m) => {
      reset[m.metric] = 1.0;
    });
    setMetricWeights(reset);
  }, [orderedMetrics]);

  // Voice Search Handler
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

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setPrompt(transcript);
        setIsListening(false);
        handleExecuteComparison(transcript);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognition.start();
    } catch (e) {
      console.warn('Speech recognition error:', e);
      setIsListening(false);
    }
  };

  // Add custom metric
  const handleAddCustomMetric = async (metricToAdd?: string) => {
    const targetMetric = metricToAdd || customMetricInput;
    if (!targetMetric.trim() || !comparisonData || addingMetric) return;

    setAddingMetric(true);
    try {
      const entities = comparisonData.entities?.map((e) => e.name) || [
        comparisonData.entity_a?.name || 'Entity A',
        comparisonData.entity_b?.name || 'Entity B',
      ];

      const res = await fetch('/api/custom-metric', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metric: targetMetric.trim(),
          entities,
          category: comparisonData.category || 'General',
        }),
      });

      if (res.ok) {
        const metricData = await res.json();
        const newMetric: VerifiedMetric = {
          metric: metricData.metric || targetMetric.trim(),
          values: metricData.values || [metricData.entity_a, metricData.entity_b],
          entity_a: metricData.entity_a || '',
          entity_b: metricData.entity_b || '',
          source_type: metricData.source_type || 'ai_consensus',
        };

        setOrderedMetrics((prev) => [newMetric, ...prev]);
        setMetricWeights((prev) => ({ ...prev, [newMetric.metric]: 1.2 }));
        setCustomMetricInput('');
      }
    } catch (e) {
      console.error('Failed to append custom metric:', e);
    } finally {
      setAddingMetric(false);
    }
  };

  const entities = comparisonData?.entities || [
    { name: comparisonData?.entity_a?.name || 'Entity A', pros: comparisonData?.entity_a?.pros || [] },
    { name: comparisonData?.entity_b?.name || 'Entity B', pros: comparisonData?.entity_b?.pros || [] },
  ];

  return (
    <div className="min-h-screen bg-[#053229] text-[#FFEDD1] flex flex-col font-sans selection:bg-[#FE9179] selection:text-[#053229]">
      {/* Top Header Bar */}
      <header className="w-full border-b border-[#355E58] bg-[#053229]/90 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-[#355E58] border border-[#72B0AB] flex items-center justify-center font-bold text-xs text-[#FE9179]">
            M
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight text-[#FFEDD1]">MorphUI</span>
            <span className="hidden sm:inline-block ml-2 text-[11px] font-mono text-[#BCDDDC]">
              Real-Time Comparative Workbench
            </span>
          </div>
        </div>

        {/* Tri-View Lens Navigation Switcher */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-[#355E58] border border-[#355E58]">
          <button
            type="button"
            onClick={() => setActiveLens('priority')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeLens === 'priority'
                ? 'bg-[#053229] text-[#FFEDD1] shadow-md'
                : 'text-[#BCDDDC] hover:text-[#FFEDD1]'
            }`}
          >
            <SlidersIcon className="w-3.5 h-3.5 text-[#FE9179]" />
            <span>Priority Lens</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveLens('divergence')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeLens === 'divergence'
                ? 'bg-[#053229] text-[#FFEDD1] shadow-md'
                : 'text-[#BCDDDC] hover:text-[#FFEDD1]'
            }`}
          >
            <SpatialIcon className="w-3.5 h-3.5 text-[#72B0AB]" />
            <span>Divergence Field</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveLens('spatial3d')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeLens === 'spatial3d'
                ? 'bg-[#053229] text-[#FFEDD1] shadow-md'
                : 'text-[#BCDDDC] hover:text-[#FFEDD1]'
            }`}
          >
            <ThreeDIcon className="w-3.5 h-3.5 text-[#CFB97E]" />
            <span>3D Space</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Search & Query Execution Bar */}
        <section className="w-full p-4 sm:p-5 rounded-xl bg-[#355E58] border border-[#355E58] space-y-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleExecuteComparison(prompt);
            }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Compare entities (e.g. 'iPhone 16 Pro vs Pixel 9 Pro', 'React vs Svelte')..."
                disabled={loading}
                className="w-full bg-[#053229] border border-[#355E58] text-[#FFEDD1] placeholder-[#BCDDDC]/60 rounded-lg px-4 py-2.5 text-xs sm:text-sm outline-none focus:border-[#72B0AB] transition-colors"
              />
              <button
                type="button"
                onClick={toggleVoiceInput}
                className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs p-1 rounded transition-colors ${
                  isListening ? 'text-[#FE9179] animate-pulse' : 'text-[#BCDDDC] hover:text-[#FFEDD1]'
                }`}
                title="Voice input"
              >
                <MicIcon className="w-4 h-4" />
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="px-5 py-2.5 rounded-lg text-xs sm:text-sm font-bold bg-[#FE9179] hover:bg-[#FE9179]/90 text-[#053229] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shrink-0"
            >
              {loading ? (
                <>
                  <SpinnerIcon className="w-4 h-4 text-[#053229]" />
                  <span>Synthesizing...</span>
                </>
              ) : (
                <>
                  <SearchIcon className="w-4 h-4 text-[#053229]" />
                  <span>Execute Comparison</span>
                </>
              )}
            </button>
          </form>

          {/* Sample Query Chips */}
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <span className="text-[11px] font-mono text-[#BCDDDC]">Suggested:</span>
            {SAMPLE_QUERIES.map((sq, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setPrompt(sq);
                  handleExecuteComparison(sq);
                }}
                disabled={loading}
                className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-[#053229] hover:bg-[#053229]/80 border border-[#355E58] text-[#BCDDDC] hover:text-[#FFEDD1] transition-colors"
              >
                {sq}
              </button>
            ))}
          </div>
        </section>

        {/* Error Alert Box */}
        {error && !incompatibleError && (
          <div className="p-4 rounded-xl bg-[#355E58] border border-[#FE9179]/50 text-xs sm:text-sm text-[#FFEDD1] flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="font-bold text-[#FE9179] hover:underline ml-3">
              Dismiss
            </button>
          </div>
        )}

        {/* Incompatible Entities Clarification State */}
        {incompatibleError && (
          <div className="p-5 sm:p-6 rounded-xl bg-[#355E58] border border-[#CFB97E] text-xs sm:text-sm text-[#FFEDD1] space-y-3">
            <div className="flex items-center gap-2.5 text-[#CFB97E] font-bold text-sm">
              <WarningIcon className="w-5 h-5" />
              <span>Incompatible Comparison Entities Detected</span>
            </div>
            <p className="text-[#FFEDD1] leading-relaxed">
              {incompatibleError.message}
            </p>
            {incompatibleError.entities && incompatibleError.entities.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap pt-1">
                <span className="text-[11px] font-mono text-[#BCDDDC]">Entities Checked:</span>
                {incompatibleError.entities.map((ent, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-[#053229] border border-[#355E58] text-xs font-mono text-[#FFEDD1]">
                    {ent}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Skeleton Loading State */}
        {loading && (
          <div className="p-6 sm:p-8 rounded-xl bg-[#355E58] border border-[#355E58] space-y-6 animate-pulse">
            <div className="flex items-center justify-between border-b border-[#053229]/40 pb-4">
              <div className="h-5 w-40 bg-[#053229] rounded" />
              <div className="h-4 w-24 bg-[#053229] rounded" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="h-28 bg-[#053229] rounded-lg" />
              <div className="h-28 bg-[#053229] rounded-lg" />
            </div>
            <div className="space-y-3 pt-2">
              <div className="h-10 bg-[#053229] rounded" />
              <div className="h-10 bg-[#053229] rounded" />
              <div className="h-10 bg-[#053229] rounded" />
            </div>
          </div>
        )}

        {/* Live Multi-Lens Visual Workspace */}
        {!loading && comparisonData && (
          <div className="space-y-6">
            {/* 1. Active Interactive Lens with Continuous Data Handoff */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeLens}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
              >
                {activeLens === 'priority' && (
                  <PriorityLens
                    entities={entities}
                    metrics={orderedMetrics}
                    weights={metricWeights}
                    onWeightChange={handleWeightChange}
                    onMoveMetric={handleMoveMetric}
                    onResetWeights={handleResetWeights}
                  />
                )}

                {activeLens === 'divergence' && (
                  <DivergenceField
                    entities={entities}
                    metrics={orderedMetrics}
                    weights={metricWeights}
                  />
                )}

                {activeLens === 'spatial3d' && (
                  <Playable3DCanvas
                    entities={entities}
                    metrics={orderedMetrics}
                    weights={metricWeights}
                  />
                )}
              </motion.div>
            </AnimatePresence>

            {/* 2. Executive Synthesis & Nuanced Verdict */}
            {comparisonData.verdict_summary && (
              <section className="p-5 sm:p-6 rounded-xl bg-[#355E58] border border-[#355E58] space-y-4">
                <div className="flex items-center gap-2 border-b border-[#053229]/40 pb-3">
                  <ShieldIcon className="w-4 h-4 text-[#72B0AB]" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#FFEDD1]">
                    Executive Synthesis & Strategic Verdict
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-[#FFEDD1] leading-relaxed p-4 rounded-lg bg-[#053229] border border-[#355E58]">
                  {comparisonData.verdict_summary}
                </p>

                {/* Entity Strengths */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {entities.map((ent, idx) => (
                    <div key={idx} className="p-3.5 rounded-lg bg-[#053229] border border-[#355E58] space-y-2">
                      <div className="font-bold text-xs text-[#FFEDD1] truncate">
                        Recommended Scenarios for {ent.name}
                      </div>
                      <ul className="space-y-1.5 text-xs text-[#BCDDDC]">
                        {(ent.pros && ent.pros.length > 0 ? ent.pros : ['Distinguishing functional strength']).map((pro, pIdx) => (
                          <li key={pIdx} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#FE9179] shrink-0 mt-1.5" />
                            <span>{pro}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 3. Granular Reddit & Forum Community Insights */}
            {comparisonData.community_sentiment && comparisonData.community_sentiment.length > 0 && (
              <section className="p-5 sm:p-6 rounded-xl bg-[#355E58] border border-[#355E58] space-y-4">
                <div className="flex items-center justify-between border-b border-[#053229]/40 pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldIcon className="w-4 h-4 text-[#72B0AB]" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-[#FFEDD1]">
                      Community Sentiment & Real-World Forum Insights
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono text-[#BCDDDC]">Normalized Consensus</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {comparisonData.community_sentiment.map((cs, idx) => (
                    <div key={idx} className="p-3.5 rounded-lg bg-[#053229] border border-[#355E58] space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#FFEDD1]">{cs.topic}</span>
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#355E58] text-[#BCDDDC]">
                          Score: {cs.score_weight || 7}/10
                        </span>
                      </div>
                      <div className="space-y-1 text-[#BCDDDC]">
                        {cs.praises && cs.praises.length > 0 && (
                          <div>
                            <span className="text-[#72B0AB] font-semibold">Praises: </span>
                            {cs.praises.join(', ')}
                          </div>
                        )}
                        {cs.pain_points && cs.pain_points.length > 0 && (
                          <div>
                            <span className="text-[#FE9179] font-semibold">Friction Points: </span>
                            {cs.pain_points.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 4. Append Custom Metric */}
            <section className="p-4 sm:p-5 rounded-xl bg-[#355E58] border border-[#355E58] space-y-3">
              <div className="flex items-center justify-between text-xs border-b border-[#053229]/40 pb-2">
                <span className="font-bold uppercase tracking-wider text-[#FFEDD1]">
                  Add Dimension to Active Priority Lens
                </span>
                <span className="text-[11px] font-mono text-[#BCDDDC]">Live Extraction</span>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddCustomMetric();
                }}
                className="flex items-center gap-2 max-w-lg"
              >
                <input
                  type="text"
                  value={customMetricInput}
                  onChange={(e) => setCustomMetricInput(e.target.value)}
                  placeholder="+ Add custom metric (e.g. Battery endurance, RAM bandwidth)..."
                  disabled={addingMetric}
                  className="flex-1 bg-[#053229] border border-[#355E58] text-[#FFEDD1] placeholder-[#BCDDDC]/60 rounded-lg px-3.5 py-2 text-xs outline-none focus:border-[#72B0AB]"
                />
                <button
                  type="submit"
                  disabled={addingMetric || !customMetricInput.trim()}
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-[#FE9179] text-[#053229] disabled:opacity-40 shrink-0 flex items-center gap-1.5"
                >
                  {addingMetric ? <SpinnerIcon className="w-3.5 h-3.5 text-[#053229]" /> : <PlusIcon className="w-3.5 h-3.5 text-[#053229]" />}
                  <span>Add</span>
                </button>
              </form>
            </section>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-[#355E58] bg-[#053229] py-5 mt-10 text-xs text-[#BCDDDC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>MorphUI • Real-Time Comparative Lens Workbench</span>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="text-[#72B0AB] hover:underline">
              Terms of Service
            </Link>
            <span>•</span>
            <Link href="/privacy" className="text-[#72B0AB] hover:underline">
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
