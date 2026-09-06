import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { MorphWidget, ImageInput, GenerativeComparisonResponse, EntityVerdict } from '@/types/morphui';
import { splitMultiComparisonQuery, splitComparisonQuery } from '@/lib/entitySplitter';
import { fetchMultiEntityFacts, fetchParallelEntityFacts } from '@/lib/factRetrieval';
import { generateComparisonMatrix } from '@/lib/llmMiddleware';
import {
  normalizeCacheKey,
  getCachedComparison,
  setCachedComparison,
  canMakeSerpRequest,
  recordSerpRequest,
  performBackgroundRevalidation,
} from '@/lib/swrCache';
import { createChat, saveMessage } from '@/lib/db';
import { encryptData } from '@/lib/crypto';

function formatComparisonResponse(
  matrix: GenerativeComparisonResponse,
  rawQuery: string,
  cacheHeader: 'HIT' | 'STALE' | 'MISS' | 'MISS-FALLBACK-LLM',
  cacheStatus: 'FRESH' | 'REVALIDATING' | 'FRESH-LIVE' | 'RATE-LIMITED-FALLBACK',
  ageSeconds = 0,
  images: ImageInput[] = [],
  chatId?: string
) {
  const entityNames = matrix.entities?.map((e) => e.name) || [matrix.entity_a?.name || 'Option A', matrix.entity_b?.name || 'Option B'];
  const title = `${entityNames.join(' vs ')}: ${matrix.category}`;

  const primaryWidget: MorphWidget = {
    widget_type: 'comparison_table',
    title,
    data: {
      category: matrix.category,
      entities: matrix.entities,
      entity_a: matrix.entity_a,
      entity_b: matrix.entity_b,
      categories: matrix.categories,
      verified_metrics: matrix.verified_metrics,
      community_sentiment: matrix.community_sentiment,
      suggested_metrics: matrix.suggested_metrics,
      comparison_points: matrix.comparison_points,
      verdict_summary: matrix.verdict_summary,
      headers: ['Metric / Feature', ...entityNames],
      rows: matrix.verified_metrics.map((vm) => {
        const row: Record<string, string> = { 'Metric / Feature': vm.metric };
        entityNames.forEach((name, idx) => {
          row[name] = vm.values?.[idx] || (idx === 0 ? vm.entity_a || '' : vm.entity_b || '');
        });
        return row;
      }),
      summary: matrix.verdict_summary,
      images:
        images.length > 0
          ? images.map((img, i) => ({
              url: img.data.startsWith('data:') ? img.data : `data:${img.mimeType};base64,${img.data}`,
              name: img.name || entityNames[i] || `Entity ${i + 1}`,
              label: entityNames[i] || `Entity ${i + 1}`,
            }))
          : undefined,
    },
  };

  const response = NextResponse.json({
    widgets: [primaryWidget],
    chat_id: chatId,
    category: matrix.category,
    entities: matrix.entities,
    entity_a: matrix.entity_a || matrix.entities?.[0],
    entity_b: matrix.entity_b || matrix.entities?.[1],
    categories: matrix.categories,
    verified_metrics: matrix.verified_metrics,
    community_sentiment: matrix.community_sentiment,
    suggested_metrics: matrix.suggested_metrics,
    verdict_summary: matrix.verdict_summary,
    comparison_points: matrix.comparison_points,
    model_used:
      matrix.model_used ||
      (cacheHeader === 'HIT'
        ? 'SWR Cache (Instant Hit)'
        : cacheHeader === 'STALE'
        ? 'SWR Cache (Stale Served, Background Revalidation Triggered)'
        : cacheHeader === 'MISS-FALLBACK-LLM'
        ? 'Zero-Shot LMM (Rate-Limit Circuit Breaker Engaged)'
        : 'Live Precision Pipeline (SERP + Multi-Source)'),
    grounded: cacheHeader !== 'MISS-FALLBACK-LLM',
    raw_query: rawQuery,
    cache_info: {
      status: cacheHeader,
      cache_status: cacheStatus,
      age_seconds: ageSeconds,
    },
    visual_comparison: images.length > 0,
  });

  response.headers.set('X-Cache', cacheHeader);
  response.headers.set('X-Cache-Status', cacheStatus);
  response.headers.set('X-Cache-Age-Seconds', String(ageSeconds));
  if (chatId) response.headers.set('X-Chat-ID', chatId);

  return response;
}


async function persistComparisonToDb(chatId: string, query: string, matrix: GenerativeComparisonResponse) {
  try {
    const userEnc = encryptData({ prompt: query });
    await saveMessage(
      crypto.randomUUID(),
      chatId,
      userEnc.encryptedPayload,
      userEnc.iv,
      'user'
    );

    const assistantEnc = encryptData(matrix);
    await saveMessage(
      crypto.randomUUID(),
      chatId,
      assistantEnc.encryptedPayload,
      assistantEnc.iv,
      'assistant'
    );
  } catch (err) {
    console.error('Error persisting encrypted comparison to Turso DB:', err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      prompt,
      chat_id,
      entities: directEntities,
      entityA: directA,
      entityB: directB,
      contextTopic: directTopic,
      images = [],
    } = body;

    const rawQuery = (prompt || (Array.isArray(directEntities) ? directEntities.join(' vs ') : directA && directB ? `${directA} vs ${directB}` : '') || '').trim();

    if (!rawQuery && images.length === 0) {
      return NextResponse.json({ error: 'Missing prompt, entities, or image input' }, { status: 400 });
    }

    let entities: string[] = [];
    let contextTopic: string | undefined = directTopic;

    if (Array.isArray(directEntities) && directEntities.length >= 2) {
      entities = directEntities;
    } else if (directA && directB) {
      entities = [directA, directB];
    } else {
      const parsed = splitMultiComparisonQuery(rawQuery);
      if (parsed) {
        entities = parsed.entities;
        contextTopic = contextTopic || parsed.contextTopic;
      }
    }

    const activeChatId = chat_id || crypto.randomUUID();
    const chatTitle = entities.length >= 2 ? entities.join(' vs ') : rawQuery.slice(0, 50) || 'New Comparison';

    await createChat(activeChatId, chatTitle);

    if (entities.length >= 2) {
      const cacheKey = normalizeCacheKey(entities, undefined, contextTopic);
      const now = Date.now();

      const cached = await getCachedComparison(cacheKey);

      if (cached && cached.data) {
        const ageSeconds = Math.floor((now - cached.createdAt) / 1000);

        persistComparisonToDb(activeChatId, rawQuery, cached.data);

        if (now < cached.staleAt) {
          return formatComparisonResponse(
            cached.data,
            rawQuery,
            'HIT',
            'FRESH',
            ageSeconds,
            images,
            activeChatId
          );
        }

        if (now < cached.expiresAt) {
          const backgroundTask = performBackgroundRevalidation(
            cacheKey,
            entities[0],
            entities[1],
            contextTopic,
            cached
          );

          if ((req as any).waitUntil) {
            (req as any).waitUntil(backgroundTask);
          } else {
            backgroundTask.catch((err) =>
              console.warn('[SWR Background Revalidation Detached Error]:', err)
            );
          }

          return formatComparisonResponse(
            cached.data,
            rawQuery,
            'STALE',
            'REVALIDATING',
            ageSeconds,
            images,
            activeChatId
          );
        }
      }

      if (canMakeSerpRequest()) {
        recordSerpRequest();

        const factsList = await fetchMultiEntityFacts(
          entities,
          contextTopic,
          3500
        );

        const isFallbackToInternal = factsList.every((f) => !f.facts?.trim());

        const matrix = await generateComparisonMatrix(
          entities,
          factsList,
          undefined,
          undefined,
          undefined,
          undefined,
          contextTopic,
          isFallbackToInternal
        );

        await setCachedComparison(cacheKey, matrix, rawQuery, 'serp_grounded');
        await persistComparisonToDb(activeChatId, rawQuery, matrix);

        return formatComparisonResponse(
          matrix,
          rawQuery,
          'MISS',
          'FRESH-LIVE',
          0,
          images,
          activeChatId
        );
      } else {
        console.warn(`[Circuit Breaker] SERP rate-limit active. Executing Zero-Shot LLM fallback for "${entities.join(' vs ')}".`);

        const emptyFacts = entities.map((e) => ({
          entity: e,
          queryUsed: e,
          facts: '',
          communityReviews: '',
          source: 'internal_knowledge' as const,
          hasLiveResults: false,
        }));

        const matrix = await generateComparisonMatrix(
          entities,
          emptyFacts,
          undefined,
          undefined,
          undefined,
          undefined,
          contextTopic,
          true
        );

        await setCachedComparison(cacheKey, matrix, rawQuery, 'llm_zero_shot');
        await persistComparisonToDb(activeChatId, rawQuery, matrix);

        return formatComparisonResponse(
          matrix,
          rawQuery,
          'MISS-FALLBACK-LLM',
          'RATE-LIMITED-FALLBACK',
          0,
          images,
          activeChatId
        );
      }
    }

    const singleEntityFacts = await fetchMultiEntityFacts([rawQuery], undefined, 3000);
    const matrix = await generateComparisonMatrix(
      [rawQuery, 'Baseline Standard'],
      singleEntityFacts,
      undefined,
      undefined,
      undefined,
      undefined,
      contextTopic,
      true
    );

    await persistComparisonToDb(activeChatId, rawQuery, matrix);

    return formatComparisonResponse(
      matrix,
      rawQuery,
      'MISS',
      'FRESH-LIVE',
      0,
      images,
      activeChatId
     );
  } catch (err: any) {
    console.error('Error in /api/compare:', err);
    return NextResponse.json(
      {
        error: err?.message || 'Failed to generate comparison matrix',
        fallback: true,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'MorphUI Dual-Engine Comparison API' });
}
