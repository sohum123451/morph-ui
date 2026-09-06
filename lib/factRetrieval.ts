/**
 * Parallel Fact Retrieval Utility
 * Executes independent, parallel search queries for Entity A and Entity B
 * to retrieve clean, factual data without unstructured SEO comparison noise.
 */

export interface EntityFactsResult {
  entity: string;
  queryUsed: string;
  facts: string;
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

/**
 * Searches for facts about a single entity using SerpAPI or Google Serper API if available,
 * or falls back to fast live web snippet retrieval.
 */
export async function fetchEntityFacts(
  entity: string,
  contextTopic?: string,
  timeoutMs = 2500
): Promise<EntityFactsResult> {
  const serpApiKey = process.env.SERP_API_KEY;
  const serperApiKey = process.env.SERPER_API_KEY;

  const searchQuery = contextTopic
    ? `${entity} ${contextTopic} facts overview specifications statistics 2025 2026`
    : `${entity} key facts overview specifications data statistics 2025 2026`;

  // 1. Google Serper API (if key configured)
  if (serperApiKey) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': serperApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ q: searchQuery, num: 6 }),
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (res.ok) {
        const data = await res.json();
        const snippets: string[] = [];

        if (data.knowledgeGraph?.description) {
          snippets.push(`Knowledge Graph: ${data.knowledgeGraph.title} - ${data.knowledgeGraph.description}`);
          if (data.knowledgeGraph.attributes) {
            for (const [k, v] of Object.entries(data.knowledgeGraph.attributes)) {
              snippets.push(`${k}: ${v}`);
            }
          }
        }

        if (Array.isArray(data.organic)) {
          for (const item of data.organic.slice(0, 5)) {
            if (item.snippet) snippets.push(item.snippet);
          }
        }

        if (snippets.length > 0) {
          return {
            entity,
            queryUsed: searchQuery,
            facts: snippets.map(sanitizeSnippet).join('\n- '),
            source: 'serper_api',
          };
        }
      }
    } catch (err) {
      console.warn(`Serper API failed for ${entity}, falling back to web search:`, err);
    }
  }

  // 2. SerpAPI (if key configured)
  if (serpApiKey) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const url = `https://serpapi.com/search.json?q=${encodeURIComponent(searchQuery)}&api_key=${serpApiKey}&num=5`;
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);

      if (res.ok) {
        const data = await res.json();
        const snippets: string[] = [];

        if (data.knowledge_graph?.description) {
          snippets.push(`Knowledge Graph: ${data.knowledge_graph.description}`);
        }

        if (Array.isArray(data.organic_results)) {
          for (const item of data.organic_results.slice(0, 5)) {
            if (item.snippet) snippets.push(item.snippet);
          }
        }

        if (snippets.length > 0) {
          return {
            entity,
            queryUsed: searchQuery,
            facts: snippets.map(sanitizeSnippet).join('\n- '),
            source: 'serp_api',
          };
        }
      }
    } catch (err) {
      console.warn(`SerpAPI failed for ${entity}, falling back to web search:`, err);
    }
  }

  // 3. Fast Web Search Snippet Extraction (Zero-dependency fallback)
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(searchQuery)}`;
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
      while ((match = regex.exec(html)) !== null && snippets.length < 6) {
        const clean = sanitizeSnippet(match[1]);
        if (clean && clean.length > 20) {
          snippets.push(clean);
        }
      }

      if (snippets.length > 0) {
        return {
          entity,
          queryUsed: searchQuery,
          facts: snippets.join('\n- '),
          source: 'duckduckgo',
        };
      }
    }
  } catch {
    // Timeout or network glitch
  }

  return {
    entity,
    queryUsed: searchQuery,
    facts: '',
    source: 'duckduckgo',
  };
}

/**
 * Runs two parallel search queries to fetch raw facts for Entity A and Entity B independently.
 */
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
