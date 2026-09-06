export interface ComparisonEntities {
  entityA: string;
  entityB: string;
  contextTopic?: string;
  rawQuery: string;
}

function capitalizeWords(str: string): string {
  return str
    .split(/\s+/)
    .map((word) => (word.length > 0 ? word.charAt(0).toUpperCase() + word.slice(1) : ''))
    .join(' ');
}

/**
 * Intercepts a search query and determines if it is a comparison between two entities.
 * If a comparison is detected (e.g., contains "vs", "versus", "compare X and Y", "X compared to Y"),
 * splits the query into clean Entity A and Entity B, alongside any specific focus topic.
 */
export function splitComparisonQuery(query: string): ComparisonEntities | null {
  if (!query || typeof query !== 'string') return null;

  const rawQuery = query.trim();
  // Strip leading/trailing non-alphanumerics
  let clean = rawQuery.replace(/^[^\w\d"'#]+|[^\w\d"'#?.]+$/g, '').trim();

  // Strip leading comparison keywords
  clean = clean.replace(/^(?:compare|comparison\s+between|difference\s+between|between)\s+/i, '').trim();

  let entityA = '';
  let entityB = '';
  let contextTopic = '';

  // Pattern 1: vs / vs. / versus / against
  let match = clean.match(/^(.+?)\s+(?:\b(?:vs\.?|versus|against)\b)\s+(.+)$/i);

  // Pattern 2: compared to
  if (!match) {
    match = clean.match(/^(.+?)\s+(?:\bcompared\s+to\b)\s+(.+)$/i);
  }

  // Pattern 3: A and B (when question begins or ends with compare/difference context)
  if (!match) {
    match = clean.match(/^(.+?)\s+(?:\band\b|\bor\b)\s+(.+)$/i);
    // Only accept "and" / "or" if the original query contained comparison intent
    if (match && !/compare|comparison|versus|diff|better|which|choice/i.test(rawQuery)) {
      match = null;
    }
  }

  if (!match) {
    return null;
  }

  entityA = match[1].trim();
  entityB = match[2].trim();

  // Extract trailing context/topic (e.g. "for CS", ": placement and fees", "in 2026")
  if (entityB.includes(':')) {
    const parts = entityB.split(':');
    entityB = parts[0].trim();
    contextTopic = parts.slice(1).join(':').trim();
  } else if (/\s+for\s+/i.test(entityB)) {
    const parts = entityB.split(/\s+for\s+/i);
    entityB = parts[0].trim();
    contextTopic = parts.slice(1).join(' for ').trim();
  } else if (/\s+in\s+terms\s+of\s+/i.test(entityB)) {
    const parts = entityB.split(/\s+in\s+terms\s+of\s+/i);
    entityB = parts[0].trim();
    contextTopic = parts.slice(1).join(' in terms of ').trim();
  }

  // Clean trailing punctuation and question marks
  entityA = entityA.replace(/^[^\w\d]+|[^\w\d]+$/g, '').trim();
  entityB = entityB.replace(/^[^\w\d]+|[^\w\d]+$/g, '').trim();
  contextTopic = contextTopic.replace(/^[^\w\d]+|[^\w\d]+$/g, '').trim();

  if (!entityA || !entityB || entityA.toLowerCase() === entityB.toLowerCase()) {
    return null;
  }

  return {
    entityA: capitalizeWords(entityA),
    entityB: capitalizeWords(entityB),
    contextTopic: contextTopic || undefined,
    rawQuery,
  };
}
