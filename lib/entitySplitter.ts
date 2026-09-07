export interface ComparisonEntities {
  entityA: string;
  entityB: string;
  contextTopic?: string;
  rawQuery: string;
}

export interface MultiComparisonEntities {
  entities: string[];
  entityA: string;
  entityB: string;
  contextTopic?: string;
  rawQuery: string;
}

const KNOWN_ACRONYMS = new Set([
  'IIT', 'NIT', 'IIIT', 'BITS', 'VIT', 'SRM', 'MIT', 'UCLA', 'NYU', 'CMU', 'ETH', 'NUS', 'NTU',
  'UI', 'API', 'LLM', 'AI', 'DX', 'SSR', 'RSC', 'DOM', 'AWS', 'GCP', 'AMD', 'GPU', 'CPU', 'ANC',
  'LDAC', 'AAC', 'SBC', 'LEP', 'BOOST', 'US', 'UK', 'EU', 'CS', 'AI/ML'
]);

function preserveEntityName(rawName: string): string {
  if (!rawName) return '';
  const trimmed = rawName.trim();
  const words = trimmed.split(/\s+/);
  const normalizedWords = words.map((w) => {
    const upper = w.toUpperCase();
    if (KNOWN_ACRONYMS.has(upper)) {
      return upper;
    }
    if (/[a-z]/.test(w) && /[A-Z]/.test(w)) {
      return w;
    }
    if (/^[a-z]+$/.test(w)) {
      return w.charAt(0).toUpperCase() + w.slice(1);
    }
    return w;
  });
  return normalizedWords.join(' ');
}

export function splitMultiComparisonQuery(rawQuery: string): MultiComparisonEntities | null {
  if (!rawQuery || typeof rawQuery !== 'string') return null;

  let query = rawQuery.trim();
  if (!query) return null;

  query = query.replace(/^(compare|versus|vs|diff|difference between|difference of)\s+/i, '');

  let contextTopic = '';
  const forMatch = query.match(/\s+(?:for|in|regarding|on|as|in terms of|based on)\s+(.+)$/i);
  if (forMatch && forMatch[1]) {
    contextTopic = forMatch[1].trim();
    query = query.substring(0, forMatch.index).trim();
  }

  const delimiterPattern = /\s+(?:vs\.?|versus|v\.?|and|or|,|\+)\s+|\s*,\s*/gi;
  const parts = query.split(delimiterPattern).map((p) => p.trim()).filter((p) => p.length > 0);

  let entityList: string[] = [];

  if (parts.length >= 2) {
    entityList = parts;
  } else {
    const fallbackParts = query.split(/\s+vs\s+|\s+v\s+|\s+versus\s+/i);
    if (fallbackParts.length >= 2) {
      entityList = fallbackParts.map((p) => p.trim()).filter(Boolean);
    } else {
      const words = query.split(/\s+/);
      if (words.length === 2) {
        entityList = words;
      }
    }
  }

  const seen = new Set<string>();
  const finalizedEntities: string[] = [];

  entityList.forEach((e) => {
    const key = e.toLowerCase();
    if (!seen.has(key) && e.length > 0) {
      seen.add(key);
      finalizedEntities.push(preserveEntityName(e));
    }
  });

  if (finalizedEntities.length < 2) {
    return null;
  }

  contextTopic = contextTopic.replace(/^[^\w\d]+|[^\w\d]+$/g, '').trim();

  return {
    entities: finalizedEntities,
    entityA: finalizedEntities[0],
    entityB: finalizedEntities[1],
    contextTopic: contextTopic || undefined,
    rawQuery,
  };
}

export function splitComparisonQuery(query: string): ComparisonEntities | null {
  const multi = splitMultiComparisonQuery(query);
  if (!multi) return null;
  return {
    entityA: multi.entityA,
    entityB: multi.entityB,
    contextTopic: multi.contextTopic,
    rawQuery: multi.rawQuery,
  };
}

export async function extractEntitiesFromImages(images: string[]): Promise<string[]> {
  if (!images || images.length === 0) return [];
  return images.map((_, i) => `Image Entity ${i + 1}`);
}
