'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { WIDGET_REGISTRY } from '@/lib/widgets/registry';

export interface DynamicCanvasTile {
  id: string;
  component: string;
  title: string;
  rationale: string;
  props: Record<string, any>;
  priority?: 'critical' | 'high' | 'informative';
  triggerMetric?: string;
  disparityPct?: number;
  createdAt: number;
  lastAffirmedAt: number;
}

export interface UseGenerativeCanvasLoopOptions {
  enabled?: boolean;
  entities: any[];
  category: string;
  contextTopic?: string;
  metrics: any[];
  weights: Record<string, number>;
  maxDynamicTiles?: number;
  cooldownMs?: number;
}

export function useGenerativeCanvasLoop({
  enabled = true,
  entities = [],
  category = 'General Comparison',
  contextTopic = '',
  metrics = [],
  weights = {},
  maxDynamicTiles = 3,
  cooldownMs = 3500,
}: UseGenerativeCanvasLoopOptions) {
  const [dynamicTiles, setDynamicTiles] = useState<DynamicCanvasTile[]>([]);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [lastEvaluatedAt, setLastEvaluatedAt] = useState<number | null>(null);
  const [loopStatus, setLoopStatus] = useState<'idle' | 'evaluating' | 'cooldown' | 'offline'>('idle');

  const abortControllerRef = useRef<AbortController | null>(null);
  const lastStateHashRef = useRef<string>('');
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Compute lightweight state hash to prevent redundant LLM invocations
  const computeStateHash = useCallback(() => {
    const weightKeys = Object.entries(weights)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join('|');
    const entNames = entities.map((e) => (typeof e === 'object' ? e.name : String(e))).join(',');
    return `${category}#${contextTopic}#${entNames}#${weightKeys}#${metrics.length}`;
  }, [category, contextTopic, entities, weights, metrics]);

  // Function to remove a dynamic tile manually or via eviction
  const removeDynamicTile = useCallback((tileId: string) => {
    setDynamicTiles((prev) => prev.filter((t) => t.id !== tileId));
  }, []);

  // Trigger evaluation function
  const evaluateNow = useCallback(
    async (intentPrompt?: string) => {
      if (isEvaluating) {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      }

      setIsEvaluating(true);
      setLoopStatus('evaluating');

      const controller = new AbortController();
      abortControllerRef.current = controller;
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const normalizedEntities = entities.map((e) => (typeof e === 'object' ? e.name : String(e)));

      try {
        const res = await fetch('/api/generative-canvas/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            entities: normalizedEntities,
            category,
            contextTopic,
            metrics,
            weights,
            activeTileIds: dynamicTiles.map((t) => t.id),
            userQuery: intentPrompt || '',
          }),
        });

        clearTimeout(timeoutId);

        if (!res.ok || !res.body) {
          throw new Error(`Server returned status ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          let currentEvent = 'message';
          for (const line of lines) {
            if (line.startsWith('event: ')) {
              currentEvent = line.replace('event: ', '').trim();
            } else if (line.startsWith('data: ')) {
              const dataStr = line.replace('data: ', '').trim();
              if (dataStr) {
                try {
                  const data = JSON.parse(dataStr);
                  if (currentEvent === 'tile_action' && data.action === 'spawn' && data.tile) {
                    const newTile: DynamicCanvasTile = data.tile;

                    setDynamicTiles((prev) => {
                      // Check if same component already exists: update its props
                      const existingIdx = prev.findIndex((t) => t.component === newTile.component);
                      if (existingIdx >= 0) {
                        const updated = [...prev];
                        updated[existingIdx] = {
                          ...updated[existingIdx],
                          title: newTile.title,
                          props: newTile.props,
                          rationale: newTile.rationale,
                          lastAffirmedAt: Date.now(),
                          disparityPct: newTile.disparityPct,
                        };
                        return updated;
                      }

                      // Enforce MAX_DYNAMIC_TILES capacity cap (FIFO eviction)
                      const list = [...prev, newTile];
                      if (list.length > maxDynamicTiles) {
                        return list.slice(list.length - maxDynamicTiles);
                      }
                      return list;
                    });
                  }
                } catch {
                  // Ignore SSE JSON parse error
                }
              }
            }
          }
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.warn('[useGenerativeCanvasLoop] Streaming fetch error:', err.message);
          setLoopStatus('offline');
        }
      } finally {
        setIsEvaluating(false);
        setLastEvaluatedAt(Date.now());
        setLoopStatus('idle');
      }
    },
    [category, contextTopic, entities, metrics, weights, dynamicTiles, isEvaluating, maxDynamicTiles]
  );

  // 1. Reactive Delta Observer with Debounce Buffer
  useEffect(() => {
    if (!enabled || entities.length === 0) return;

    const currentHash = computeStateHash();
    if (currentHash === lastStateHashRef.current) return;
    lastStateHashRef.current = currentHash;

    if (cooldownTimerRef.current) {
      clearTimeout(cooldownTimerRef.current);
    }

    setLoopStatus('cooldown');
    cooldownTimerRef.current = setTimeout(() => {
      evaluateNow();
    }, cooldownMs);

    return () => {
      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
    };
  }, [enabled, entities, computeStateHash, evaluateNow, cooldownMs]);

  // 2. Deterministic Hysteresis Eviction & TTL Decay Ticker (runs every 5s)
  useEffect(() => {
    const ticker = setInterval(() => {
      setDynamicTiles((prev) => {
        const now = Date.now();
        const filtered = prev.filter((tile) => {
          const manifest = WIDGET_REGISTRY[tile.component];
          const hysteresis = manifest?.hysteresis || { spawnThresholdPct: 20, evictThresholdPct: 10, ttlSeconds: 60 };

          // Check TTL decay
          const ageSeconds = (now - tile.lastAffirmedAt) / 1000;
          if (ageSeconds > hysteresis.ttlSeconds) {
            return false;
          }

          // Check Disparity Recovery below evictThresholdPct
          if (tile.triggerMetric && weights[tile.triggerMetric] !== undefined) {
            const currentWeight = weights[tile.triggerMetric];
            if (currentWeight < hysteresis.evictThresholdPct) {
              return false; // Auto-evict: disparity recovered/resolved
            }
          }

          return true;
        });

        return filtered.length !== prev.length ? filtered : prev;
      });
    }, 5000);

    return () => clearInterval(ticker);
  }, [weights]);

  return {
    dynamicTiles,
    isEvaluating,
    lastEvaluatedAt,
    loopStatus,
    removeDynamicTile,
    evaluateNow,
  };
}
