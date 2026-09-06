/**
 * Stale-While-Revalidate (SWR) Caching Architecture with Jitter & Circuit Breaker
 * - Standard TTL: 24 Hours
 * - Stale Window: 20 Hours (returns stale cached data immediately + silent background revalidation)
 * - Jitter: +/- 45 Minutes on cache expiration (Stampede prevention)
 * - Circuit Breaker / Rate Limiter: Max 5 SERP requests/minute (extends stale cache by 1h on limit)
 * - Schema Validation: Strict validation before caching
 * - Dual Storage: Upstash Redis REST API with robust in-memory Map fallback
 */

import { GenerativeComparisonResponse, VerifiedMetric } from '@/types/morphui';
import { fetchParallelEntityFacts, fetchMultiEntityFacts, EntityFactsResult } from '@/lib/factRetrieval';
import { generateComparisonMatrix } from '@/lib/llmMiddleware';

export interface CachedComparisonEntry {
  data: GenerativeComparisonResponse;
  createdAt: number;
  staleAt: number;
  expiresAt: number;
  source: 'serp_grounded' | 'llm_zero_shot';
  rawQuery: string;
}

// ----------------------------------------------------------------------------
// 1. IN-MEMORY SINGLETON & LOCKS (Preserved across warm serverless instances)
// ----------------------------------------------------------------------------

declare global {
  // eslint-disable-next-line no-var
  var __MORPH_SWR_CACHE__: Map<string, CachedComparisonEntry> | undefined;
  // eslint-disable-next-line no-var
  var __MORPH_SERP_TIMESTAMPS__: number[] | undefined;
  // eslint-disable-next-line no-var
  var __MORPH_IN_FLIGHT_REVALIDATIONS__: Set<string> | undefined;
}

const inMemoryCache = globalThis.__MORPH_SWR_CACHE__ || new Map<string, CachedComparisonEntry>();
globalThis.__MORPH_SWR_CACHE__ = inMemoryCache;

const inFlightRevalidations =
  globalThis.__MORPH_IN_FLIGHT_REVALIDATIONS__ || new Set<string>();
globalThis.__MORPH_IN_FLIGHT_REVALIDATIONS__ = inFlightRevalidations;

// ----------------------------------------------------------------------------
// 2. RATE LIMITER / CIRCUIT BREAKER (Max 5 SERP calls per minute)
// ----------------------------------------------------------------------------

const MAX_SERP_REQUESTS_PER_MINUTE = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

export function canMakeSerpRequest(): boolean {
  const now = Date.now();
  const timestamps = globalThis.__MORPH_SERP_TIMESTAMPS__ || [];
  const valid = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  globalThis.__MORPH_SERP_TIMESTAMPS__ = valid;
  return valid.length < MAX_SERP_REQUESTS_PER_MINUTE;
}

export function recordSerpRequest(): void {
  const now = Date.now();
  const timestamps = globalThis.__MORPH_SERP_TIMESTAMPS__ || [];
  timestamps.push(now);
  globalThis.__MORPH_SERP_TIMESTAMPS__ = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
}

// ----------------------------------------------------------------------------
// 3. JITTER & EXPIRATION CALCULATIONS
// ----------------------------------------------------------------------------

const STANDARD_TTL_MS = 24 * 60 * 60 * 1000; // 24 Hours
const STALE_THRESHOLD_MS = 20 * 60 * 60 * 1000; // 20 Hours
const SHORT_TTL_MS = 60 * 60 * 1000; // 1 Hour (for Zero-Shot LLM fallbacks)
const EXTENSION_TTL_MS = 60 * 60 * 1000; // 1 Hour extension when rate-limited

export function calculateExpirationWithJitter(isShortTtl = false): {
  createdAt: number;
  staleAt: number;
  expiresAt: number;
} {
  const now = Date.now();
  if (isShortTtl) {
    return {
      createdAt: now,
      staleAt: now + 50 * 60 * 1000,
      expiresAt: now + SHORT_TTL_MS,
    };
  }

  // Jitter: random variation between -45 minutes and +45 minutes
  const jitterMs = Math.floor((Math.random() * 90 - 45) * 60 * 1000);
  const expiresAt = now + STANDARD_TTL_MS + jitterMs;
  const staleAt = now + STALE_THRESHOLD_MS + Math.floor(jitterMs * 0.5);

  return {
    createdAt: now,
    staleAt,
    expiresAt,
  };
}

// ----------------------------------------------------------------------------
// 4. SCHEMA VALIDATION
// ----------------------------------------------------------------------------

export function validateComparisonSchema(obj: any): obj is GenerativeComparisonResponse {
  if (!obj || typeof obj !== 'object') return false;
  if (typeof obj.category !== 'string' || !obj.category.trim()) return false;
  const hasEntities = Array.isArray(obj.entities) && obj.entities.length >= 2;
  const hasEntityAB = Boolean(obj.entity_a && obj.entity_b);
  if (!hasEntities && !hasEntityAB) return false;
  if (typeof obj.verdict_summary !== 'string' || !obj.verdict_summary.trim()) return false;

  const hasCategories =
    obj.categories &&
    typeof obj.categories === 'object' &&
    Object.keys(obj.categories).length > 0;
  const hasVerifiedMetrics = Array.isArray(obj.verified_metrics) && obj.verified_metrics.length > 0;

  return Boolean(hasCategories || hasVerifiedMetrics);
}

// ----------------------------------------------------------------------------
// 5. CACHE KEY NORMALIZATION
// ----------------------------------------------------------------------------

export function normalizeCacheKey(
  entityAOrList: string | string[],
  entityB?: string,
  contextTopic?: string
): string {
  let entities: string[] = [];
  if (Array.isArray(entityAOrList)) {
    entities = entityAOrList;
  } else {
    entities = [entityAOrList, entityB || ''].filter(Boolean);
  }
  const cleanSorted = entities
    .map((e) => e.trim().toLowerCase().replace(/[^a-z0-9]/g, ''))
    .sort()
    .join(':');
  const cleanTopic = contextTopic ? contextTopic.trim().toLowerCase().replace(/[^a-z0-9]/g, '') : '';
  return `morph:cmp:${cleanSorted}${cleanTopic ? `:${cleanTopic}` : ''}`;
}

// ----------------------------------------------------------------------------
// 6. REDIS / IN-MEMORY STORAGE ACCESSORS
// ----------------------------------------------------------------------------

async function getFromRedis(key: string): Promise<CachedComparisonEntry | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (!url || !token) return null;

  try {
    const res = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      if (data.result) {
        const parsed = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
        return parsed as CachedComparisonEntry;
      }
    }
  } catch (e) {
    console.warn('Redis read error, falling back to memory:', e);
  }
  return null;
}

async function setToRedis(key: string, entry: CachedComparisonEntry, ttlMs: number): Promise<void> {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (!url || !token) return;

  try {
    const ttlSeconds = Math.max(60, Math.floor(ttlMs / 1000));
    await fetch(`${url}/set/${encodeURIComponent(key)}/${encodeURIComponent(JSON.stringify(entry))}?ex=${ttlSeconds}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (e) {
    console.warn('Redis write error:', e);
  }
}

export async function getCachedComparison(key: string): Promise<CachedComparisonEntry | null> {
  // 1. Check Redis if configured
  const redisEntry = await getFromRedis(key);
  if (redisEntry) {
    inMemoryCache.set(key, redisEntry);
    return redisEntry;
  }

  // 2. Check In-Memory Map
  const memEntry = inMemoryCache.get(key);
  if (memEntry) {
    if (Date.now() > memEntry.expiresAt) {
      inMemoryCache.delete(key);
      return null;
    }
    return memEntry;
  }

  return null;
}

export async function setCachedComparison(
  key: string,
  data: GenerativeComparisonResponse,
  rawQuery: string,
  source: 'serp_grounded' | 'llm_zero_shot' = 'serp_grounded'
): Promise<CachedComparisonEntry | null> {
  if (!validateComparisonSchema(data)) {
    console.warn('Rejecting cache write: Data failed UI schema validation.');
    return null;
  }

  const isShortTtl = source === 'llm_zero_shot';
  const { createdAt, staleAt, expiresAt } = calculateExpirationWithJitter(isShortTtl);

  const entry: CachedComparisonEntry = {
    data,
    createdAt,
    staleAt,
    expiresAt,
    source,
    rawQuery,
  };

  // Write to memory
  inMemoryCache.set(key, entry);

  // Write to Redis
  const ttlMs = expiresAt - Date.now();
  await setToRedis(key, entry, ttlMs);

  return entry;
}

export async function extendCachedComparisonTtl(key: string, currentEntry: CachedComparisonEntry): Promise<void> {
  currentEntry.staleAt += EXTENSION_TTL_MS;
  currentEntry.expiresAt += EXTENSION_TTL_MS;
  inMemoryCache.set(key, currentEntry);
  const ttlMs = currentEntry.expiresAt - Date.now();
  await setToRedis(key, currentEntry, ttlMs);
}

// ----------------------------------------------------------------------------
// 7. BACKGROUND REVALIDATION ENGINE (Circuit Breaker & Lock Protected)
// ----------------------------------------------------------------------------

export async function performBackgroundRevalidation(
  cacheKey: string,
  entityA: string,
  entityB: string,
  contextTopic?: string,
  currentEntry?: CachedComparisonEntry
): Promise<void> {
  // Stampede Protection: Prevent duplicate in-flight background requests
  if (inFlightRevalidations.has(cacheKey)) {
    return;
  }

  // Circuit Breaker: Check if we have available SERP quota
  if (!canMakeSerpRequest()) {
    console.warn(`[SWR Circuit Breaker] Rate limit reached (5 req/min). Aborting background fetch for "${entityA} vs ${entityB}". Extending stale cache TTL by 1 hour.`);
    if (currentEntry) {
      await extendCachedComparisonTtl(cacheKey, currentEntry);
    }
    return;
  }

  inFlightRevalidations.add(cacheKey);

  try {
    recordSerpRequest();
    console.log(`[SWR Background] Revalidating cache in background for "${entityA} vs ${entityB}"...`);

    const { factsA, factsB } = await fetchParallelEntityFacts(entityA, entityB, contextTopic, 3500);

    const matrix = await generateComparisonMatrix(
      entityA,
      entityB,
      factsA.facts,
      factsB.facts,
      factsA.communityReviews,
      factsB.communityReviews,
      contextTopic
    );

    if (validateComparisonSchema(matrix)) {
      await setCachedComparison(cacheKey, matrix, `${entityA} vs ${entityB}`, 'serp_grounded');
      console.log(`[SWR Background] Successfully refreshed cache for "${entityA} vs ${entityB}".`);
    } else {
      console.warn(`[SWR Background] Generated matrix failed schema validation, preserving current cache.`);
    }
  } catch (err) {
    console.warn(`[SWR Background] Revalidation error for "${entityA} vs ${entityB}":`, err);
    if (currentEntry) {
      await extendCachedComparisonTtl(cacheKey, currentEntry);
    }
  } finally {
    inFlightRevalidations.delete(cacheKey);
  }
}
