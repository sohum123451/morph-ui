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

export function sanitizeEntityName(rawName: string): string {
  if (!rawName) return '';
  let trimmed = String(rawName).trim();
  
  // 1. Extract bracketed disambiguations like "Apple [tech]" or "Apple (Fruit)"
  const bracketMatch = trimmed.match(/^([^(\[]+)[(\[]([^)\]]+)[)\]]$/);
  if (bracketMatch && bracketMatch[1].trim().length > 0) {
    trimmed = bracketMatch[1].trim();
  }

  // 2. Strip colon subtitles if they remain (fallback safety)
  if (trimmed.includes(':')) {
    const colonParts = trimmed.split(':');
    if (colonParts[0].trim().length > 0) {
      trimmed = colonParts[0].trim();
    }
  }

  return trimmed;
}

export function sanitizeMetricLabel(rawLabel: string): string {
  if (!rawLabel) return 'Specification';
  let str = String(rawLabel).trim();
  if (str.includes(':') && !str.toLowerCase().startsWith('http')) {
    const parts = str.split(':');
    if (parts[0].trim().length >= 3) {
      str = parts[0].trim();
    }
  }
  return str;
}

export function preserveEntityName(rawName: string): string {
  const cleaned = sanitizeEntityName(rawName);
  if (!cleaned) return '';
  
  const words = cleaned.split(/\s+/);
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

  // Strip leading comparison trigger phrases
  query = query.replace(/^(compare|versus|vs|diff|difference between|difference of)\s+/i, '');

  let contextTopic = '';

  // 1. Pattern: Prefix topic notation (e.g., "Nutrition: Apple vs Mango" or "[Nutrition] Apple vs Mango")
  const prefixMatch = query.match(/^([A-Za-z0-9\s&/]+)[:\]]\s+(.+)$/i);
  if (prefixMatch && prefixMatch[1] && prefixMatch[2] && (/\s+(?:vs\.?|versus|v\.?|and|or)\s+/i.test(prefixMatch[2]) || prefixMatch[2].includes(','))) {
    contextTopic = prefixMatch[1].replace(/^\[/, '').trim();
    query = prefixMatch[2].trim();
  }

  // 2. Pattern: Suffix topic notation with colon (e.g., "Apple vs Mango: Nutrition" or "iPhone vs Galaxy: Camera & Battery")
  if (!contextTopic) {
    const colonMatch = query.match(/^(.+?):\s*([A-Za-z0-9\s&/,\-()]+)$/i);
    if (colonMatch && colonMatch[1] && colonMatch[2]) {
      const potentialEntities = colonMatch[1].trim();
      const potentialTopic = colonMatch[2].trim();
      // Ensure the pre-colon part actually contains comparison delimiters
      if (/\s+(?:vs\.?|versus|v\.?|and|or|,|\+)\s+/i.test(potentialEntities) || potentialEntities.split(/\s+/).length >= 2) {
        contextTopic = potentialTopic;
        query = potentialEntities;
      }
    }
  }

  // 3. Pattern: Keyword topic notation (e.g., "Apple vs Mango in terms of nutrition" / "regarding battery")
  if (!contextTopic) {
    const forMatch = query.match(/\s+(?:in terms of|based on|regarding|topic:|for|in|on|as)\s+(.+)$/i);
    if (forMatch && forMatch[1]) {
      contextTopic = forMatch[1].trim();
      query = query.substring(0, forMatch.index).trim();
    }
  }

  // 4. Pattern: Dash suffix topic notation (e.g., "Apple vs Mango - Nutrition & Taste")
  if (!contextTopic) {
    const dashMatch = query.match(/^(.+?)\s+[-–—]\s+([A-Za-z0-9\s&/()]+)$/i);
    if (dashMatch && dashMatch[1] && dashMatch[2]) {
      const potentialEntities = dashMatch[1].trim();
      if (/\s+(?:vs\.?|versus|v\.?|and|or|,|\+)\s+/i.test(potentialEntities)) {
        contextTopic = dashMatch[2].trim();
        query = potentialEntities;
      }
    }
  }

  // Split entities by comparison delimiters
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

  // If the last entity still has a lingering colon topic (safety net)
  if (!contextTopic && entityList.length >= 2) {
    const last = entityList[entityList.length - 1];
    if (last.includes(':')) {
      const [eName, ...rest] = last.split(':');
      entityList[entityList.length - 1] = eName.trim();
      contextTopic = rest.join(':').trim();
    }
  }

  const seen = new Set<string>();
  const finalizedEntities: string[] = [];

  entityList.forEach((e) => {
    const sanitized = preserveEntityName(e);
    const key = sanitized.toLowerCase();
    if (!seen.has(key) && sanitized.length > 0) {
      seen.add(key);
      finalizedEntities.push(sanitized);
    }
  });

  if (finalizedEntities.length < 2) {
    return null;
  }

  if (contextTopic) {
    contextTopic = contextTopic.replace(/^[^\w\d]+|[^\w\d]+$/g, '').trim();
  }

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
