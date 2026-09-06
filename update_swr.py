with open("lib/swrCache.ts", "r", encoding="utf-8") as f:
    content = f.read()

# Update import in swrCache.ts
old_imports = """import { fetchParallelEntityFacts } from '@/lib/factRetrieval';"""
new_imports = """import { fetchParallelEntityFacts, fetchMultiEntityFacts, EntityFactsResult } from '@/lib/factRetrieval';"""

content = content.replace(old_imports, new_imports)

# Update validateComparisonSchema
old_val = """export function validateComparisonSchema(obj: any): obj is GenerativeComparisonResponse {
  if (!obj || typeof obj !== 'object') return false;
  if (typeof obj.category !== 'string' || !obj.category.trim()) return false;
  if (!obj.entity_a || typeof obj.entity_a.name !== 'string' || !Array.isArray(obj.entity_a.pros)) return false;
  if (!obj.entity_b || typeof obj.entity_b.name !== 'string' || !Array.isArray(obj.entity_b.pros)) return false;
  if (typeof obj.verdict_summary !== 'string' || !obj.verdict_summary.trim()) return false;

  const hasCategories =
    obj.categories &&
    typeof obj.categories === 'object' &&
    Object.keys(obj.categories).length > 0;
  const hasVerifiedMetrics = Array.isArray(obj.verified_metrics) && obj.verified_metrics.length > 0;

  return Boolean(hasCategories || hasVerifiedMetrics);
}"""

new_val = """export function validateComparisonSchema(obj: any): obj is GenerativeComparisonResponse {
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
}"""

content = content.replace(old_val, new_val)

# Update normalizeCacheKey
old_norm = """export function normalizeCacheKey(entityA: string, entityB: string, contextTopic?: string): string {
  const cleanA = entityA.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanB = entityB.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  const sorted = [cleanA, cleanB].sort().join(':');
  const cleanTopic = contextTopic ? contextTopic.trim().toLowerCase().replace(/[^a-z0-9]/g, '') : '';
  return `morph:cmp:${sorted}${cleanTopic ? `:${cleanTopic}` : ''}`;
}"""

new_norm = """export function normalizeCacheKey(
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
}"""

content = content.replace(old_norm, new_norm)

# Update performBackgroundRevalidation
old_bg = """export async function performBackgroundRevalidation(
  cacheKey: string,
  entityA: string,
  entityB: string,
  contextTopic: string | undefined,
  existingEntry: CachedComparisonEntry
): Promise<void> {
  if (inFlightRevalidations.has(cacheKey)) return;
  inFlightRevalidations.add(cacheKey);

  try {
    if (!canMakeSerpRequest()) {
      console.warn(`[SWR Background] SERP rate-limit active. Extending stale cache for "${entityA} vs ${entityB}".`);
      await extendStaleCacheEntry(cacheKey, existingEntry);
      return;
    }

    recordSerpRequest();
    console.log(`[SWR Background] Triggering silent revalidation for "${entityA} vs ${entityB}"...`);

    // 1. Live Parallel Retrieval
    const { factsA, factsB } = await fetchParallelEntityFacts(
      entityA,
      entityB,
      contextTopic,
      3500
    );

    const isFallbackToInternal =
      (!factsA.hasLiveResults && !factsB.hasLiveResults) ||
      (!factsA.facts.trim() && !factsB.facts.trim());

    // 2. LLM Extraction with Dual-Mode Support
    const matrix = await generateComparisonMatrix(
      entityA,
      entityB,
      factsA.facts,
      factsB.facts,
      factsA.communityReviews,
      factsB.communityReviews,
      contextTopic,
      isFallbackToInternal
    );

    // 3. Update Cache Entry
    await setCachedComparison(cacheKey, matrix, existingEntry.rawQuery, 'serp_grounded');
    console.log(`[SWR Background] Revalidation complete & cache updated for "${entityA} vs ${entityB}".`);
  } catch (err: any) {
    console.warn(`[SWR Background] Revalidation error for "${entityA} vs ${entityB}":`, err?.message || err);
  } finally {
    inFlightRevalidations.delete(cacheKey);
  }
}"""

new_bg = """export async function performBackgroundRevalidation(
  cacheKey: string,
  entityAOrList: string | string[],
  entityBOrTopic?: string,
  contextTopic?: string,
  existingEntry?: CachedComparisonEntry
): Promise<void> {
  if (inFlightRevalidations.has(cacheKey)) return;
  inFlightRevalidations.add(cacheKey);

  let entities: string[] = [];
  let topic: string | undefined = contextTopic;
  let entry: CachedComparisonEntry | undefined = existingEntry;

  if (Array.isArray(entityAOrList)) {
    entities = entityAOrList;
    topic = typeof entityBOrTopic === 'string' ? entityBOrTopic : undefined;
  } else {
    entities = [entityAOrList, entityBOrTopic || 'Option B'];
  }

  try {
    if (!canMakeSerpRequest()) {
      console.warn(`[SWR Background] SERP rate-limit active. Extending stale cache for "${entities.join(' vs ')}".`);
      if (entry) await extendStaleCacheEntry(cacheKey, entry);
      return;
    }

    recordSerpRequest();
    console.log(`[SWR Background] Triggering silent revalidation for "${entities.join(' vs ')}"...`);

    // 1. Parallel Multi-Entity Retrieval
    const factsList = await fetchMultiEntityFacts(entities, topic, 3500);

    // 2. LLM Extraction
    const matrix = await generateComparisonMatrix(
      entities,
      factsList,
      topic,
      false
    );

    // 3. Update Cache Entry
    const rawQuery = entry?.rawQuery || entities.join(' vs ');
    await setCachedComparison(cacheKey, matrix, rawQuery, 'serp_grounded');
    console.log(`[SWR Background] Revalidation complete & cache updated for "${entities.join(' vs ')}".`);
  } catch (err: any) {
    console.warn(`[SWR Background] Revalidation error for "${entities.join(' vs ')}":`, err?.message || err);
  } finally {
    inFlightRevalidations.delete(cacheKey);
  }
}"""

content = content.replace(old_bg, new_bg)

with open("lib/swrCache.ts", "w", encoding="utf-8") as f:
    f.write(content)

print("Updated lib/swrCache.ts for multi-entity comparisons")
