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
    // If it has mixed casing like iPhone, MacBook, Ultraboost, WH-1000XM5, preserve as is
    if (/[a-z]/.test(w) && /[A-Z]/.test(w)) {
      return w;
    }
    // If all lowercase, title case
    if (/^[a-z]+$/.test(w)) {
      return w.charAt(0).toUpperCase() + w.slice(1);
    }
    return w;
  });
  return normalizedWords.join(' ');
}

function sanitizeEntity(str: string): string {
  return str
    .replace(/^[^\w\d"#]+|[^\w\d"#]+$/g, '')
    .trim();
}

/**
 * Splits a query into 2 or more entities (N-way comparison).
 * Preserves user's entity integrity and capitalizes acronyms accurately (e.g. "IIT Bombay", "IIT Delhi").
 */
export function splitMultiComparisonQuery(query: string): MultiComparisonEntities | null {
  if (!query || typeof query !== 'string') return null;

  const rawQuery = query.trim();
  let clean = rawQuery.replace(/^[^\w\d"'#]+|[^\w\d"'#?.]+$/g, '').trim();

  // Strip leading comparison prefix
  clean = clean.replace(/^(?:compare|comparison\s+between|difference\s+between|between)\s+/i, '').trim();

  let contextTopic = '';

  // Extract trailing context topic
  if (clean.includes(':')) {
    const parts = clean.split(':');
    clean = parts[0].trim();
    contextTopic = parts.slice(1).join(':').trim();
  } else if (/\s+for\s+/i.test(clean)) {
    const parts = clean.split(/\s+for\s+/i);
    clean = parts[0].trim();
    contextTopic = parts.slice(1).join(' for ').trim();
  } else if (/\s+in\s+terms\s+of\s+/i.test(clean)) {
    const parts = clean.split(/\s+in\s+terms\s+of\s+/i);
    clean = parts[0].trim();
    contextTopic = parts.slice(1).join(' in terms of ').trim();
  }

  let entityList: string[] = [];

  // 1. Check for "vs", "vs.", "versus", "against" delimiter
  if (/\b(?:vs\.?|versus|against)\b/i.test(clean)) {
    const rawTokens = clean.split(/\s+(?:\b(?:vs\.?|versus|against)\b)\s+/i);
    entityList = rawTokens
      .map(sanitizeEntity)
      .filter((t) => t.length > 0);
  }
  // 2. Check for comma-separated items ("React, Vue, Svelte" or "React, Vue, and Svelte")
  else if (clean.includes(',')) {
    const rawTokens = clean.split(',');
    const tokens: string[] = [];
    rawTokens.forEach((t) => {
      const sub = t.split(/\b(?:and|or)\b/i);
      sub.forEach((st) => {
        const item = sanitizeEntity(st);
        if (item.length > 0) tokens.push(item);
      });
    });
    entityList = tokens;
  }
  // 3. Fallback to " A and B " or " A compared to B "
  else if (/\b(?:compared\s+to|and|or)\b/i.test(clean)) {
    const match = clean.match(/^(.+?)\s+(?:\b(?:compared\s+to|and|or)\b)\s+(.+)$/i);
    if (match) {
      const eA = sanitizeEntity(match[1]);
      const eB = sanitizeEntity(match[2]);
      if (eA && eB) {
        entityList = [eA, eB];
      }
    }
  }

  // Deduplicate case-insensitively and preserve clean naming
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

/**
 * Backward-compatible 2-way splitter
 */
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
