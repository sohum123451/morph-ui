import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { splitMultiComparisonQuery, splitComparisonQuery, extractEntitiesFromImages } from '@/lib/entitySplitter';
import { fetchMultiEntityFacts } from '@/lib/factRetrieval';
import { generateComparisonMatrix } from '@/lib/llmMiddleware';
import {
  getCachedComparison,
  setCachedComparison,
  normalizeCacheKey,
  canMakeSerpRequest,
  recordSerpRequest,
} from '@/lib/swrCache';
import { saveUserComparison } from '@/lib/db';
import { GenerativeComparisonResponse } from '@/types/morphui';

function formatComparisonResponse(
  matrix: GenerativeComparisonResponse,
  rawQuery: string,
  cacheStatus: 'HIT' | 'MISS',
  staleness: 'FRESH' | 'STALE-REVALIDATING' | 'FRESH-LIVE' | 'FALLBACK-ZERO-SHOT',
  cacheAgeSeconds = 0,
  images: string[] = [],
  chatId?: string
) {
  const verifiedCount = matrix.verified_metrics ? matrix.verified_metrics.filter((m: any) => m.source_type === 'official' || m.source_type === 'ai_consensus').length : 0;
  let totalMetrics = 0;
  if (matrix.categories) {
    Object.values(matrix.categories).forEach((cat) => {
      if (Array.isArray(cat)) {
        totalMetrics += cat.length;
      }
    });
  }

  const confidenceScore =
    verifiedCount > 0 && totalMetrics > 0
      ? Math.min(1.0, Math.round((verifiedCount / totalMetrics + 0.3) * 100) / 100)
      : 0.85;

  return NextResponse.json(
    {
      success: true,
      query: rawQuery,
      chat_id: chatId || matrix.chat_id,
      data: matrix,
      meta: {
        cache_status: cacheStatus,
        staleness,
        cache_age_seconds: cacheAgeSeconds,
        grounded_sources: verifiedCount,
        confidence_score: confidenceScore,
        image_count: images.length,
        timestamp: new Date().toISOString(),
      },
    },
    {
      headers: {
        'X-Cache': cacheStatus,
        'X-Staleness': staleness,
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=72000',
      },
    }
  );
}

export async function POST(req: NextRequest) {
  try {
    // 1. NextAuth Authentication & User Scoping Check (Seamless Guest Fallback)
    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.email || 'guest@morphui.internal';

    const body = await req.json();
    const {
      prompt,
      query,
      entityA,
      entityB,
      topic,
      images = [],
      chat_id,
    } = body;

    const rawQuery = (prompt || query || '').trim();

    if (!rawQuery && (!entityA || !entityB) && images.length === 0) {
      return NextResponse.json(
        { error: 'Please provide a comparison prompt, entities, or images.' },
        { status: 400 }
      );
    }

    let entities: string[] = [];
    let contextTopic = topic || '';

    if (entityA && entityB) {
      entities = [entityA.trim(), entityB.trim()];
    } else if (images.length > 0 && !rawQuery) {
      entities = await extractEntitiesFromImages(images);
    } else {
      const parsed = splitMultiComparisonQuery(rawQuery);
      if (parsed && parsed.entities.length >= 2) {
        entities = parsed.entities;
        contextTopic = contextTopic || (parsed.contextTopic || '');
      } else {
        const parsed2 = splitComparisonQuery(rawQuery);
        if (parsed2) {
          entities = [parsed2.entityA, parsed2.entityB];
          contextTopic = contextTopic || (parsed2.contextTopic || '');
        }
      }
    }

    if (entities.length < 2 && images.length === 0) {
      return NextResponse.json(
        { error: 'Could not extract at least two entities to compare. Please specify "A vs B".' },
        { status: 400 }
      );
    }

    const chatId = chat_id || crypto.randomUUID();

    // Check SWR Cache
    const cacheKey = normalizeCacheKey(entities, undefined, contextTopic);
    const cached = await getCachedComparison(cacheKey);

    if (cached && cached.data) {
      const responseData = { ...cached.data, chat_id: chatId };
      const ageSeconds = Math.floor((Date.now() - cached.createdAt) / 1000);
      await saveUserComparison(chatId, userEmail, rawQuery, entities.join(' vs '), JSON.stringify(responseData));
      return formatComparisonResponse(responseData, rawQuery, 'HIT', 'FRESH', ageSeconds, images, chatId);
    }

    // Live Fact Retrieval
    const canQuerySerp = canMakeSerpRequest();
    let factsArray: any[] = [];
    if (canQuerySerp) {
      recordSerpRequest();
      factsArray = await fetchMultiEntityFacts(entities, contextTopic, 3000);
    }

    // LLM Synthesis
    const matrix = await generateComparisonMatrix(
      entities,
      factsArray,
      undefined,
      undefined,
      undefined,
      undefined,
      contextTopic,
      !canQuerySerp
    );

    matrix.chat_id = chatId;

    // Cache matrix
    await setCachedComparison(cacheKey, matrix, rawQuery, canQuerySerp ? 'serp_grounded' : 'llm_zero_shot');

    // Save user-scoped comparison to Database
    const entityTitle = entities.join(' vs ');
    await saveUserComparison(chatId, userEmail, rawQuery, entityTitle, JSON.stringify(matrix));

    return formatComparisonResponse(matrix, rawQuery, 'MISS', 'FRESH-LIVE', 0, images, chatId);
  } catch (err: any) {
    console.error('Comparison API error:', err);
    return NextResponse.json({ error: err?.message || 'Internal error processing comparison' }, { status: 500 });
  }
}
