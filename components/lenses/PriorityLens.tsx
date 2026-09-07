'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VerifiedMetric, EntityVerdict } from '@/types/morphui';
import { ChevronUpIcon, ChevronDownIcon, SlidersIcon } from '@/components/icons/CustomIcons';

export interface PriorityLensProps {
  entities: EntityVerdict[];
  metrics: VerifiedMetric[];
  weights: Record<string, number>;
  onWeightChange: (metricName: string, weight: number) => void;
  onMoveMetric: (fromIndex: number, toIndex: number) => void;
  onResetWeights: () => void;
}

/**
 * Extracts a normalized score (0 to 100) for an entity value.
 */
function scoreEntityValue(val: string | undefined, allValues: string[]): number {
  if (!val) return 50;
  
  const numMatch = val.match(/(\d+(\.\d+)?)/);
  if (numMatch) {
    const num = parseFloat(numMatch[1]);
    const allNums = allValues
      .map(v => v ? v.match(/(\d+(\.\d+)?)/) : null)
      .filter(m => m !== null)
      .map(m => parseFloat(m![1]));

    if (allNums.length > 1) {
      const min = Math.min(...allNums);
      const max = Math.max(...allNums);
      if (max > min) {
        const isLowerBetter = /(price|cost|weight|thickness|latency|ms|usd|\$|inr|₹)/i.test(val);
        if (isLowerBetter) {
          return Math.round(100 - ((num - min) / (max - min)) * 60 + 20);
        }
        return Math.round(((num - min) / (max - min)) * 60 + 40);
      }
    }
  }

  if (/pro|ultra|titanium|flagship|oled|amoled|superior|fastest|high/i.test(val)) return 85;
  if (/standard|good|average|decent/i.test(val)) return 70;
  if (/base|limited|slow|basic/i.test(val)) return 55;
  return 65;
}

export function PriorityLens({
  entities = [],
  metrics = [],
  weights = {},
  onWeightChange,
  onMoveMetric,
  onResetWeights,
}: PriorityLensProps) {
  const entityNames = useMemo(() => {
    return entities.map((e, idx) => e.name || `Entity ${idx + 1}`);
  }, [entities]);

  // Real-time rank and composite score calculation
  const compositeScores = useMemo(() => {
    if (entities.length === 0 || metrics.length === 0) return [];

    const scores = entities.map((_, entIdx) => {
      let totalWeight = 0;
      let weightedSum = 0;

      metrics.forEach((m) => {
        const metricName = m.metric || 'Metric';
        const w = weights[metricName] !== undefined ? weights[metricName] : 1.0;
        if (w <= 0.001) return;

        const allVals = entityNames.map((_, i) => {
          return m.values?.[i] !== undefined ? m.values[i] : (i === 0 ? m.entity_a : m.entity_b) || '';
        });

        const entityVal = m.values?.[entIdx] !== undefined
          ? m.values[entIdx]
          : (entIdx === 0 ? m.entity_a : m.entity_b) || '';

        const itemScore = scoreEntityValue(entityVal, allVals);
        weightedSum += itemScore * w;
        totalWeight += w;
      });

      const finalScore = totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 10) / 10 : 50;
      return {
        name: entityNames[entIdx],
        score: finalScore,
        index: entIdx,
      };
    });

    return [...scores].sort((a, b) => b.score - a.score);
  }, [entities, metrics, weights, entityNames]);

  const leader = compositeScores[0];

  return (
    <div className="w-full space-y-6 text-theme-text">
      {/* Live Priority Scoreboard Leaderboard with Framer Motion Layout Animation */}
      <div className="p-4 sm:p-5 rounded-xl bg-theme-card border border-theme-border space-y-3 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-theme-border pb-3">
          <div className="flex items-center gap-2">
            <SlidersIcon className="w-4 h-4 text-theme-accent" />
            <h3 className="text-sm font-bold text-theme-text uppercase tracking-wider">
              Live Priority Scoreboard
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-theme-secondary font-medium">
              {leader ? `Leading: ${leader.name} (${leader.score}/100)` : 'Adjust weights to evaluate real-time trade-offs'}
            </span>
            <button
              type="button"
              onClick={onResetWeights}
              className="text-[11px] font-mono text-theme-focus hover:underline"
            >
              Reset Weights
            </button>
          </div>
        </div>

        {/* Live Score Ticker Cards with Framer Motion Layout Transitions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
          {compositeScores.map((ent, rankIdx) => {
            const isFirst = rankIdx === 0;
            return (
              <motion.div
                key={ent.name}
                layout
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className={`p-3.5 rounded-lg border transition-all ${
                  isFirst
                    ? 'bg-theme-bg border-theme-accent/60 shadow-sm'
                    : 'bg-theme-bg border-theme-border'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-theme-text truncate">{ent.name}</span>
                  <span
                    className={`font-mono font-semibold px-2 py-0.5 rounded text-[11px] ${
                      isFirst
                        ? 'bg-theme-accent/15 text-theme-accent border border-theme-accent/30'
                        : 'bg-theme-card text-theme-secondary border border-theme-border'
                    }`}
                  >
                    Rank #{rankIdx + 1} • {ent.score}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-theme-secondary/20 overflow-hidden mt-2">
                  <motion.div
                    className={`h-full ${isFirst ? 'bg-theme-accent' : 'bg-theme-focus'}`}
                    initial={false}
                    animate={{ width: `${Math.min(100, Math.max(5, ent.score))}%` }}
                    transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Weighted Rows Table with Smooth Row Transitions */}
      <div className="rounded-xl bg-theme-card border border-theme-border overflow-hidden shadow-sm">
        <div className="grid grid-cols-12 gap-3 px-4 py-3 bg-theme-bg border-b border-theme-border text-xs font-bold uppercase tracking-wider text-theme-secondary">
          <div className="col-span-5 sm:col-span-4">Metric Dimension & Priority Multiplier</div>
          {entityNames.map((name, idx) => (
            <div key={idx} className="col-span-7 sm:col-span-4 lg:col-span-3 text-right sm:text-left truncate">
              {name}
            </div>
          ))}
        </div>

        <div className="divide-y divide-theme-border">
          <AnimatePresence initial={false}>
            {metrics.map((m, idx) => {
              const metricName = m.metric || `Metric ${idx + 1}`;
              const weight = weights[metricName] !== undefined ? weights[metricName] : 1.0;
              const isSynthesized = m.source_type === 'ai_consensus' || m.source_type === 'unverified';

              return (
                <motion.div
                  key={metricName}
                  layout
                  transition={{ type: 'spring', damping: 28, stiffness: 350 }}
                  className="grid grid-cols-12 gap-3 p-3.5 items-center hover:bg-theme-bg/50 transition-colors text-xs"
                >
                  {/* Metric & Weight Slider Column */}
                  <div className="col-span-12 sm:col-span-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <div className="flex flex-col gap-0.5">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => onMoveMetric(idx, idx - 1)}
                            className="text-theme-secondary hover:text-theme-text disabled:opacity-20 transition-colors"
                            title="Move priority up"
                          >
                            <ChevronUpIcon className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === metrics.length - 1}
                            onClick={() => onMoveMetric(idx, idx + 1)}
                            className="text-theme-secondary hover:text-theme-text disabled:opacity-20 transition-colors"
                            title="Move priority down"
                          >
                            <ChevronDownIcon className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="font-bold text-theme-text leading-tight">
                          {metricName}
                          {isSynthesized && (
                            <span className="text-theme-accent font-mono ml-0.5 select-none" title="AI-synthesized estimate">*</span>
                          )}
                        </span>
                      </div>

                      <span className="font-mono text-[11px] text-theme-accent font-semibold">
                        {weight.toFixed(1)}x
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="0.0"
                        max="2.0"
                        step="0.1"
                        value={weight}
                        onChange={(e) => onWeightChange(metricName, parseFloat(e.target.value))}
                        className="w-full accent-theme-accent h-1.5 rounded-lg bg-theme-bg cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Entity Values Columns */}
                  {entityNames.map((_, entIdx) => {
                    const val = m.values?.[entIdx] !== undefined
                      ? m.values[entIdx]
                      : (entIdx === 0 ? m.entity_a : m.entity_b);

                    return (
                      <div
                        key={entIdx}
                        className="col-span-6 sm:col-span-4 lg:col-span-3 text-xs text-theme-text leading-relaxed break-words"
                      >
                        <span className="sm:hidden text-[10px] font-mono text-theme-secondary block mb-0.5">
                          {entityNames[entIdx]}:
                        </span>
                        {val || 'Estimated standard'}
                      </div>
                    );
                  })}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Footnote */}
      <div className="pt-2 text-[11px] font-mono text-theme-secondary flex items-center gap-1">
        <span>* Metrics marked with an asterisk represent AI-synthesized consensus estimates derived from multi-source data extraction.</span>
      </div>
    </div>
  );
}
