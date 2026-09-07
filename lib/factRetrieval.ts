/**
 * Parallel Fact & Reddit Retrieval Utility
 * Executes independent, parallel search queries for Entity A and Entity B:
 * 1. SerpApi / Serper / DuckDuckGo search
 * 2. Community reviews & Reddit discussions for multi-dimensional sentiment analysis
 * 3. Graceful fallback flag when search returns empty or key is absent
 */

export interface EntityFactsResult {
  entity: string;
  queryUsed: string;
  facts: string;
  communityReviews?: string;
  source: 'serp_api' | 'serper_api' | 'duckduckgo' | 'internal_knowledge';
  hasLiveResults: boolean;
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
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
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
      if (snippets.length > 0) return snippets;
    }
  } catch {
    // ignore
  }

  // Fallback to Wikipedia API if HTML scraper returns empty
  try {
    const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query.replace(/\s+/g, '_'))}`;
    const wikiRes = await fetch(wikiUrl);
    if (wikiRes.ok) {
      const wikiData = await wikiRes.json();
      if (wikiData.extract && wikiData.extract.length > 30) {
        return [sanitizeSnippet(wikiData.extract)];
      }
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

  // Multi-dimensional Reddit query targeting durability, worth-it pricing, and pain points
  const redditPrimaryQuery = `${entity} site:reddit.com OR reddit review pros cons "worth it" durability complaints`;
  const redditLongTermQuery = `${entity} reddit "months" OR "years" durability reliability honest feedback`;

  let factsSnippets: string[] = [];
  let redditSnippets: string[] = [];
  let source: 'serp_api' | 'serper_api' | 'duckduckgo' | 'internal_knowledge' = 'internal_knowledge';

  // 1. SerpApi
  if (serpApiKey) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const serpUrl = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(searchQuery)}&api_key=${serpApiKey}&num=6`;
      const serpRedditUrl = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(redditPrimaryQuery)}&api_key=${serpApiKey}&num=4`;

      const [res, resReddit] = await Promise.all([
        fetch(serpUrl, { signal: controller.signal }).catch(() => null),
        fetch(serpRedditUrl, { signal: controller.signal }).catch(() => null),
      ]);
      clearTimeout(timer);

      if (res && res.ok) {
        const data = await res.json();
        if (data.knowledge_graph?.description) {
          factsSnippets.push(`Knowledge Graph: ${data.knowledge_graph.title || ''} - ${data.knowledge_graph.description}`);
        }
        if (data.answer_box?.snippet) {
          factsSnippets.push(data.answer_box.snippet);
        }
        if (Array.isArray(data.organic_results)) {
          for (const item of data.organic_results.slice(0, 5)) {
            if (item.snippet) factsSnippets.push(item.snippet);
          }
        }
        if (factsSnippets.length > 0) source = 'serp_api';
      }

      if (resReddit && resReddit.ok) {
        const redditData = await resReddit.json();
        if (Array.isArray(redditData.organic_results)) {
          for (const item of redditData.organic_results.slice(0, 4)) {
            if (item.snippet) redditSnippets.push(`[Reddit Thread] ${item.title || ''}: ${item.snippet}`);
          }
        }
      }
    } catch {
      // fallback
    }
  }

  // 2. Serper API
  if (factsSnippets.length === 0 && serperApiKey) {
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
        if (factsSnippets.length > 0) source = 'serper_api';
      }
    } catch {
      // fallback
    }
  }

  // 3. DuckDuckGo Fallback for Facts
  if (factsSnippets.length === 0) {
    factsSnippets = await searchDuckDuckGo(searchQuery, timeoutMs);
    if (factsSnippets.length > 0) source = 'duckduckgo';
  }

  // 4. DuckDuckGo Fallback for Reddit & Community Sentiment if empty
  if (redditSnippets.length === 0) {
    const [ddgReviews, ddgLongTerm] = await Promise.all([
      searchDuckDuckGo(redditPrimaryQuery, timeoutMs),
      searchDuckDuckGo(redditLongTermQuery, timeoutMs),
    ]);
    redditSnippets.push(...ddgReviews, ...ddgLongTerm);
  }

  const hasLiveResults = factsSnippets.length > 0;

  return {
    entity,
    queryUsed: searchQuery,
    facts: factsSnippets.map(sanitizeSnippet).join('\n- '),
    communityReviews: redditSnippets.map(sanitizeSnippet).join('\n- '),
    source,
    hasLiveResults,
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

export async function fetchMultiEntityFacts(
  entities: string[],
  contextTopic?: string,
  timeoutMs = 3000
): Promise<EntityFactsResult[]> {
  return Promise.all(
    entities.map((entity) => fetchEntityFacts(entity, contextTopic, timeoutMs))
  );
}
