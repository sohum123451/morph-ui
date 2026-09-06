/**
 * Parallel Fact & Reddit Retrieval Utility
 * Executes independent, parallel search queries for Entity A and Entity B:
 * 1. Official/benchmark specifications
 * 2. Community reviews & Reddit discussions for sentiment analysis
 */

export interface EntityFactsResult {
  entity: string;
  queryUsed: string;
  facts: string;
  communityReviews?: string;
  source: 'serp_api' | 'serper_api' | 'duckduckgo';
}

function sanitizeSnippet(text: string): string {
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

async function searchDuckDuckGo(query: string, timeoutMs: number): Promise<string[]> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (res.ok) {
      const html = await res.text();
      const snippets: string[] = [];
      const regex = /<a class="result__snippet[^>]*>([\s\S]*?)<\/a>/g;
      let match;
      while ((match = regex.exec(html)) !== null && snippets.length < 5) {
        const clean = sanitizeSnippet(match[1]);
        if (clean && clean.length > 20) {
          snippets.push(clean);
        }
      }
      return snippets;
    }
  } catch {
    // ignore
  }
  return [];
}

export async function fetchEntityFacts(
  entity: string,
  contextTopic?: string,
  timeoutMs = 2500
): Promise<EntityFactsResult> {
  const serpApiKey = process.env.SERP_API_KEY;
  const serperApiKey = process.env.SERPER_API_KEY;

  const searchQuery = contextTopic
    ? `${entity} ${contextTopic} specifications ranking tuition placement statistics 2025 2026`
    : `${entity} official overview specifications metrics ranking statistics 2025 2026`;

  const redditQuery = `${entity} reddit review consensus student opinion honest pros cons`;

  let factsSnippets: string[] = [];
  let redditSnippets: string[] = [];
  let source: 'serp_api' | 'serper_api' | 'duckduckgo' = 'duckduckgo';

  // 1. Serper API
  if (serperApiKey) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: { 'X-API-KEY': serperApiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: searchQuery, num: 6 }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        if (data.knowledgeGraph?.description) {
          factsSnippets.push(`Knowledge Graph: ${data.knowledgeGraph.title} - ${data.knowledgeGraph.description}`);
        }
        if (Array.isArray(data.organic)) {
          for (const item of data.organic.slice(0, 5)) {
            if (item.snippet) factsSnippets.push(item.snippet);
          }
        }
        source = 'serper_api';
      }
    } catch {
      // fallback
    }
  }

  // If facts not found via Serper, use DuckDuckGo
  if (factsSnippets.length === 0) {
    factsSnippets = await searchDuckDuckGo(searchQuery, timeoutMs);
  }

  // Fetch Reddit / community discussions
  redditSnippets = await searchDuckDuckGo(redditQuery, timeoutMs);

  return {
    entity,
    queryUsed: searchQuery,
    facts: factsSnippets.map(sanitizeSnippet).join('\n- '),
    communityReviews: redditSnippets.map(sanitizeSnippet).join('\n- '),
    source,
  };
}

export async function fetchParallelEntityFacts(
  entityA: string,
  entityB: string,
  contextTopic?: string,
  timeoutMs = 2500
): Promise<{ factsA: EntityFactsResult; factsB: EntityFactsResult }> {
  const [factsA, factsB] = await Promise.all([
    fetchEntityFacts(entityA, contextTopic, timeoutMs),
    fetchEntityFacts(entityB, contextTopic, timeoutMs),
  ]);

  return { factsA, factsB };
}
