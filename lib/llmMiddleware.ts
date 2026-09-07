import Groq from 'groq-sdk';
import { GoogleGenAI } from '@google/genai';
import {
  GenerativeComparisonResponse,
  VerifiedMetric,
  CommunitySentiment,
  EntityVerdict,
  ComparisonPoint,
} from '@/types/morphui';
import { EntityFactsResult } from './factRetrieval';

function withTimeout<T>(promise: Promise<T>, ms: number, errMsg: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(errMsg)), ms)),
  ]);
}

const UNIVERSAL_DYNAMIC_COMPARISON_SYSTEM_PROMPT = `You are MorphUI's universal dynamic comparative engine.
You specialize in comparing ANY entities across infinite, unconstrained domains — including countries, sports, philosophies, cosmetics, financial instruments, software architectures, consumer hardware, media/entertainment, and abstract concepts.

═══════════════════════════════════════
CORE WORKFLOW & DYNAMIC SYNTHESIS:

1. DYNAMIC DOMAIN & DIMENSION ANALYSIS:
   First, analyze the entities being compared to determine their domain (e.g., Geopolitical, Sporting, Cosmetic, Philosophical, Computational, Cultural).
   Dynamically synthesize 5 to 7 of the most insightful, defining, and differentiating comparative metrics / dimensions tailored specifically to that pair:
   - Countries: e.g., "GDP per Capita (PPP)", "Primary Economic Drivers", "Healthcare & Social Model", "Geopolitical Alignment", "Cost of Living Index".
   - Cosmetics: e.g., "Primary Function", "Key Ingredients & Base", "Texture & Finish Options", "Coverage Level", "Longevity & Wear Time".
   - Sports / Fitness: e.g., "Primary Energy System", "Aerobic vs Anaerobic Demand", "Equipment & Accessibility", "Injury Profile", "Tactical Complexity".
   - Philosophies / Concepts: e.g., "Core Epistemological Axiom", "View on Human Agency", "Practical Application in Daily Life", "Historical Provenance".
   - Hardware / Technology: e.g., "Processing Architecture", "Memory Bandwidth", "Thermal Envelope (TDP)", "Real-World Throughput", "MSRP & Value".
   Organize these metrics into 2 to 4 intuitive, domain-relevant category groups.

2. INTELLIGENT HYBRID GROUNDING & AI CONSENSUS BLENDING:
   - "official"     → When a value is directly derived from and grounded in the supplied live search snippets (concrete verified numbers, dates, official release specs).
   - "ai_consensus" → When live search results are sparse, unstructured, or unavailable (or for conceptual, macro, or qualitative dimensions), seamlessly synthesize accurate specifications using high-confidence parametric domain knowledge and consensus.
   - NEVER output "N/A", "Not specified", or generic filler phrases. Every metric must contain an authentic, informative, entity-specific comparison.

3. CONCRETE PROS & VERDICT:
   - Write 2-3 distinct, substantive advantages per entity.
   - In "verdict_summary", provide a clear, nuanced recommendation explaining when, why, and for whom each option is superior.

STRICT JSON OUTPUT SCHEMA:
{
  "category": "<Derived Domain or Category Name>",
  "entities": [
    { "name": "<Verbatim Entity 1 Name>", "pros": ["Substantive strength 1", "Substantive strength 2"] },
    { "name": "<Verbatim Entity 2 Name>", "pros": ["Substantive strength 1", "Substantive strength 2"] }
  ],
  "categories": {
    "<Domain Category 1>": [
      {
        "metric": "<Dimension Name>",
        "values": ["Tailored spec for Entity 1", "Tailored spec for Entity 2"],
        "entity_a": "Tailored spec for Entity 1",
        "entity_b": "Tailored spec for Entity 2",
        "source_type": "<'official' if traceable to search snippets, otherwise 'ai_consensus'>"
      }
    ]
  },
  "community_sentiment": [
    {
      "topic": "<Key Public Sentiment / Experience Dimension>",
      "consensuses": ["Sentiment for Entity 1", "Sentiment for Entity 2"],
      "sentiment": "Positive"
    }
  ],
  "suggested_metrics": ["Alternative Metric 1", "Alternative Metric 2", "Alternative Metric 3"],
  "verdict_summary": "<Actionable, balanced verdict comparing real trade-offs>"
}
Return ONLY valid JSON matching this schema. No markdown fences. No conversational prose.`;

export const PARAMETRIC_SYNTHESIS_SYSTEM_PROMPT = UNIVERSAL_DYNAMIC_COMPARISON_SYSTEM_PROMPT;
const PRECISION_EXTRACTION_SYSTEM_PROMPT = UNIVERSAL_DYNAMIC_COMPARISON_SYSTEM_PROMPT;





/**
 * Normalizes text for fuzzy matching: lowercase, strip punctuation, collapse whitespace.
 */
function normalizeForMatch(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s%.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extracts "meaningful" tokens from a value string — numbers, and words 4+ chars long,
 * skipping common filler words that would false-positive against almost any snippet.
 */
function extractGroundingTokens(value: string): string[] {
  const STOPWORDS = new Set([
    'with', 'that', 'this', 'from', 'have', 'been', 'were', 'their',
    'which', 'about', 'into', 'over', 'under', 'more', 'less', 'than',
    'design', 'optimized', 'specialized', 'tailored', 'general', 'broad',
  ]);
  const normalized = normalizeForMatch(value);
  // Include tokens >= 3 chars (e.g. spf, ram, cpu, gpu, vram, fps)
  const tokens = normalized.split(' ').filter(t => t.length >= 3 && !STOPWORDS.has(t));
  // Include standalone numbers and short spec tokens (e.g., "16gb", "spf30", "24gb", "4k")
  const numbers = normalized.match(/\b\d+(\.\d+)?%?\w*\b/g) || [];
  const shortSpecs = normalized.match(/\b[a-z]{1,4}\s?\d+\b|\b\d+\s?[a-z]{1,4}\b/gi) || [];
  return Array.from(new Set([...tokens, ...numbers, ...shortSpecs]));
}

/**
 * Checks whether at least one meaningful token from `value` actually appears in the
 * combined snippet corpus.
 */
function isGroundedInSnippets(value: string, snippetCorpus: string): boolean {
  if (!snippetCorpus || snippetCorpus.trim().length === 0) return false;
  const normalizedCorpus = normalizeForMatch(snippetCorpus);
  const tokens = extractGroundingTokens(value);
  if (tokens.length === 0) return false;
  return tokens.some(token => normalizedCorpus.includes(token));
}

/**
 * Post-hoc grounding enforcement. Takes the parsed LLM output and the raw snippet text
 * that was actually fed to the model, and downgrades any 'official' claim that can't be
 * traced back to real retrieved text.
 */
export function enforceGrounding(
  comparisonPoints: ComparisonPoint[],
  entityASnippets: string,
  entityBSnippets: string
): ComparisonPoint[] {
  return comparisonPoints.map(point => {
    if (point.source_type !== 'official') return point;

    const aGrounded = isGroundedInSnippets(point.entity_a_value || '', entityASnippets);
    const bGrounded = isGroundedInSnippets(point.entity_b_value || '', entityBSnippets);

    if (aGrounded && bGrounded) {
      return point;
    }

    return {
      ...point,
      source_type: 'ai_consensus' as const,
    };
  });
}

export function enforceGroundingOnResponse(
  parsed: GenerativeComparisonResponse,
  entityAFactsText: string,
  entityBFactsText: string
): GenerativeComparisonResponse {
  if (!parsed || !parsed.comparison_points) return parsed;

  const updatedComparisonPoints = enforceGrounding(
    parsed.comparison_points,
    entityAFactsText,
    entityBFactsText
  );

  const updatedCategories: Record<string, VerifiedMetric[]> = {};
  for (const [catName, metricList] of Object.entries(parsed.categories || {})) {
    updatedCategories[catName] = metricList.map(m => {
      const cp = updatedComparisonPoints.find(p => p.metric_name === m.metric || p.feature_name === m.metric);
      const effectiveSourceType = cp?.source_type || m.source_type || 'ai_consensus';
      return {
        ...m,
        source_type: effectiveSourceType
      };
    });
  }

  const updatedFlatMetrics = Object.values(updatedCategories).flat();

  return {
    ...parsed,
    categories: updatedCategories,
    verified_metrics: updatedFlatMetrics,
    comparison_points: updatedComparisonPoints,
  };
}

function cleanAndParseJson(
  raw: string,
  fallbackEntities: string[]
): GenerativeComparisonResponse | null {
  if (!raw) return null;
  let cleaned = raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  cleaned = cleaned.replace(/```json/gi, '').replace(/```/g, '').trim();

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  try {
    const parsed = JSON.parse(cleaned);

    const category = typeof parsed.category === 'string' && parsed.category.trim()
      ? parsed.category.trim()
      : 'Comparative Analysis';

    const isInvalidPro = (p: any) =>
      !p ||
      typeof p !== 'string' ||
      /^(n\/?a|not specified.*|none|null|-|unknown|established core specifications.*|proven domain track record.*|industry benchmark specification.*|premier engineering standing.*)$/i.test(String(p).trim());

    // Resolve entities list while strictly preserving exact names
    let resolvedEntities: EntityVerdict[] = [];

    if (Array.isArray(parsed.entities) && parsed.entities.length > 0) {
      resolvedEntities = parsed.entities.map((e: any, idx: number) => {
        const rawName = typeof e === 'object' && e?.name ? String(e.name) : typeof e === 'string' ? e : fallbackEntities[idx] || `Entity ${idx + 1}`;
        // Enforce exact fallback entity name if model attempted to mangle it (e.g. "lit Bombay")
        const name = fallbackEntities[idx] && fallbackEntities[idx].toLowerCase() === rawName.toLowerCase()
          ? fallbackEntities[idx]
          : rawName;

        const pros = typeof e === 'object' && Array.isArray(e?.pros)
          ? e.pros.map(String).filter((p: string) => !isInvalidPro(p))
          : [];
        return {
          name,
          pros: pros.length > 0 ? pros : ['No specific pros extracted from search data'],
        };
      });
    } else if (parsed.entity_a || parsed.entity_b) {
      const eA = fallbackEntities[0] || (typeof parsed.entity_a === 'object' && parsed.entity_a?.name ? String(parsed.entity_a.name) : 'Entity A');
      const eB = fallbackEntities[1] || (typeof parsed.entity_b === 'object' && parsed.entity_b?.name ? String(parsed.entity_b.name) : 'Entity B');
      const prosA = typeof parsed.entity_a === 'object' && Array.isArray(parsed.entity_a?.pros)
        ? parsed.entity_a.pros.map(String).filter((p: string) => !isInvalidPro(p))
        : [];
      const prosB = typeof parsed.entity_b === 'object' && Array.isArray(parsed.entity_b?.pros)
        ? parsed.entity_b.pros.map(String).filter((p: string) => !isInvalidPro(p))
        : [];
      resolvedEntities = [
        { name: eA, pros: prosA.length > 0 ? prosA : ['No specific pros extracted from search data'] },
        { name: eB, pros: prosB.length > 0 ? prosB : ['No specific pros extracted from search data'] },
      ];
    } else {
      resolvedEntities = fallbackEntities.map((name) => ({
        name,
        pros: ['No specific pros extracted from search data'],
      }));
    }

    const numEntities = resolvedEntities.length;

    // Resolve categories & verified metrics
    const categories: Record<string, VerifiedMetric[]> = {};
    const flatVerifiedMetrics: VerifiedMetric[] = [];

    const parseMetricItem = (m: any): VerifiedMetric => {
      let values: string[] = [];
      if (Array.isArray(m.values)) {
        values = m.values.map(String);
      } else if (m.values && typeof m.values === 'object') {
        values = fallbackEntities.map(name => {
          const matchedKey = Object.keys(m.values).find(k => k.toLowerCase() === name.toLowerCase());
          return matchedKey ? String(m.values[matchedKey]) : String(Object.values(m.values)[0] || 'Not specified');
        });
      } else if (m.entity_a && m.entity_b && m.entity_a !== fallbackEntities[0]) {
        values = [String(m.entity_a), String(m.entity_b)];
      } else {
        values = [String(m.entity_a ?? 'Not specified'), String(m.entity_b ?? 'Not specified')];
      }

      while (values.length < numEntities) {
        values.push('Not specified');
      }

      return {
        metric: String(m.metric || m.metric_name || m.feature_name || 'Metric'),
        values,
        entity_a: values[0] || 'Not specified',
        entity_b: values[1] || 'Not specified',
        source_type: m.source_type === 'official' ? 'official' : (m.source_type === 'unverified' ? 'unverified' : 'ai_consensus'),
      };
    };

    if (parsed.categories && typeof parsed.categories === 'object' && !Array.isArray(parsed.categories)) {
      for (const [catName, metricList] of Object.entries(parsed.categories)) {
        if (Array.isArray(metricList)) {
          const validMetrics = metricList.map(parseMetricItem);
          if (validMetrics.length > 0) {
            categories[catName] = validMetrics;
            flatVerifiedMetrics.push(...validMetrics);
          }
        }
      }
    } else if (Array.isArray(parsed.categories)) {
      const validMetrics = parsed.categories.map(parseMetricItem);
      if (validMetrics.length > 0) {
        categories[category || 'Key Specifications'] = validMetrics;
        flatVerifiedMetrics.push(...validMetrics);
      }
    } else if (Array.isArray(parsed.comparison_points)) {
      const validMetrics = parsed.comparison_points.map(parseMetricItem);
      if (validMetrics.length > 0) {
        categories[category || 'Key Specifications'] = validMetrics;
        flatVerifiedMetrics.push(...validMetrics);
      }
    }

    // Resolve community sentiment
    const community_sentiment: CommunitySentiment[] = [];
    if (Array.isArray(parsed.community_sentiment)) {
      parsed.community_sentiment.forEach((s: any) => {
        if (s && s.topic) {
          let consensuses: string[] = [];
          if (Array.isArray(s.consensuses)) {
            consensuses = s.consensuses.map(String);
          } else {
            consensuses = [String(s.entity_a_consensus || 'General consensus'), String(s.entity_b_consensus || 'General consensus')];
          }

          while (consensuses.length < numEntities) {
            consensuses.push('General user sentiment');
          }

          community_sentiment.push({
            topic: String(s.topic),
            consensuses,
            entity_a_consensus: consensuses[0],
            entity_b_consensus: consensuses[1],
            sentiment: s.sentiment === 'Positive' || s.sentiment === 'Critical' ? s.sentiment : 'Mixed',
          });
        }
      });
    }

    const comparison_points: ComparisonPoint[] = flatVerifiedMetrics.map((vm) => ({
      feature_name: vm.metric,
      metric_name: vm.metric,
      entity_a_value: vm.values?.[0] || vm.entity_a || '',
      entity_b_value: vm.values?.[1] || vm.entity_b || '',
      values: vm.values,
      source_type: vm.source_type,
    }));

    const suggested_metrics = Array.isArray(parsed.suggested_metrics)
      ? parsed.suggested_metrics.map(String)
      : [];

    const verdict_summary = typeof parsed.verdict_summary === 'string' && parsed.verdict_summary.trim()
      ? parsed.verdict_summary.trim()
      : `Insufficient data for a confident verdict.`;

    return {
      category,
      entities: resolvedEntities,
      entity_a: resolvedEntities[0],
      entity_b: resolvedEntities[1],
      categories,
      verified_metrics: flatVerifiedMetrics,
      community_sentiment,
      suggested_metrics,
      verdict_summary,
      comparison_points,
    };
  } catch {
    return null;
  }
}

// generateConcreteFallbackMulti removed: 0 hard-coding requirement.

export async function generateComparisonMatrix(
  entityAOrList: string | string[],
  entityBOrFactsList?: string | EntityFactsResult[] | any,
  factsA?: string,
  factsB?: string,
  reviewsA?: string,
  reviewsB?: string,
  contextTopic?: string,
  isFallbackToInternal?: boolean
): Promise<GenerativeComparisonResponse> {
  let entities: string[] = [];
  let factsCombinedText = '';
  let reviewsCombinedText = '';
  let hasMissingFacts = false;
  let entityAFactsText = '';
  let entityBFactsText = '';

  if (Array.isArray(entityAOrList)) {
    entities = entityAOrList;
    const factsArray: EntityFactsResult[] = Array.isArray(entityBOrFactsList) ? entityBOrFactsList : [];

    factsCombinedText = entities
      .map((e, idx) => {
        const f = factsArray[idx];
        const content = f?.facts ? f.facts : 'No search snippets retrieved.';
        return `RAW FACTS FOR ${e.toUpperCase()}:\n${content}`;
      })
      .join('\n\n');

    reviewsCombinedText = entities
      .map((e, idx) => {
        const f = factsArray[idx];
        const content = f?.communityReviews ? f.communityReviews : 'No forum discussions retrieved.';
        return `COMMUNITY REVIEWS FOR ${e.toUpperCase()}:\n${content}`;
      })
      .join('\n\n');

    hasMissingFacts = factsArray.every((f) => !f?.facts?.trim());
    entityAFactsText = factsArray[0]?.facts || '';
    entityBFactsText = factsArray[1]?.facts || '';
  } else {
    const eA = entityAOrList;
    const eB = typeof entityBOrFactsList === 'string' ? entityBOrFactsList : 'Option B';
    entities = [eA, eB];

    factsCombinedText = `RAW FACTS FOR ${eA.toUpperCase()}:\n${factsA || 'No search snippets retrieved.'}\n\nRAW FACTS FOR ${eB.toUpperCase()}:\n${factsB || 'No search snippets retrieved.'}`;
    reviewsCombinedText = `COMMUNITY REVIEWS FOR ${eA.toUpperCase()}:\n${reviewsA || 'No forum reviews found.'}\n\nCOMMUNITY REVIEWS FOR ${eB.toUpperCase()}:\n${reviewsB || 'No forum reviews found.'}`;

    hasMissingFacts = !factsA?.trim() && !factsB?.trim();
    entityAFactsText = factsA || '';
    entityBFactsText = factsB || '';
  }

  // When live search has 0 results or fails to find structured web data (e.g. cosmetics, lifestyle, concepts),
  // route to AI Knowledge Synthesis rather than failing with an empty table.
  const isAiSynthesisMode = hasMissingFacts;
  const activeSystemPrompt = isAiSynthesisMode ? PARAMETRIC_SYNTHESIS_SYSTEM_PROMPT : PRECISION_EXTRACTION_SYSTEM_PROMPT;

  const geminiKey = process.env.GEMINI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;

  const internalFallbackDirective = ``;

  const userPrompt = isAiSynthesisMode
    ? `COMPARED ENTITIES (${entities.length}): ${entities.map((e, i) => `Entity ${i + 1}: "${e}"`).join(', ')}
${contextTopic ? `Specific Focus / Topic: "${contextTopic}"` : ''}

No rigid spec sheet exists in live web results for this comparison.
1. Analyze these entities to identify their domain (geopolitical, athletic, cosmetic, philosophical, technical, cultural, etc.).
2. Dynamically determine 5 to 7 of the most insightful, differentiating comparative metrics tailored specifically to this pair.
3. Synthesize a comprehensive, multi-category comparison JSON object. Set source_type: "ai_consensus" on all synthesized metrics.`
    : `COMPARED ENTITIES (${entities.length}): ${entities.map((e, i) => `Entity ${i + 1}: "${e}"`).join(', ')}
${contextTopic ? `Specific Focus / Topic: "${contextTopic}"` : ''}

${factsCombinedText}

${reviewsCombinedText}

1. Analyze these entities to identify their domain and determine 5 to 7 defining comparative dimensions.
2. If search snippets supply verified facts, extract them and set source_type: "official".
3. For dimensions where search snippets are sparse, conceptual, or missing, seamlessly blend high-confidence parametric consensus with source_type: "ai_consensus".
4. Produce authentic pros and a nuanced verdict summary.`;

  // 1. PRIMARY MODEL: Groq (llama-3.3-70b-versatile) for ultra-fast structured JSON inference
  if (groqKey) {
    try {
      const groqCall = fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${groqKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'openai/gpt-oss-120b',
          messages: [
            { role: 'system', content: activeSystemPrompt },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1,
        }),
      });

      const groqRes = await withTimeout(groqCall, 10000, 'Groq precision extraction timeout');
      if (groqRes.ok) {
        const groqData = await groqRes.json();
        const content = groqData.choices?.[0]?.message?.content || '';
        const parsed = cleanAndParseJson(content, entities);
        if (parsed) {
          parsed.model_used = isAiSynthesisMode ? 'Groq (gpt-oss-120b) • AI Knowledge Synthesis' : 'Groq (gpt-oss-120b)';
          return enforceGroundingOnResponse(parsed, entityAFactsText, entityBFactsText);
        }
      }
    } catch (err: any) {
      console.warn('Groq primary extraction failed, cascading to Gemini fallback:', err?.message || err);
    }
  }

  // 2. SECONDARY / FALLBACK MODEL: Google Gemini
  if (geminiKey) {
    for (const modelName of ['gemini-3.6-flash']) {
      try {
        const ai = new GoogleGenAI({ apiKey: geminiKey });
        const geminiCall = ai.models.generateContent({
          model: modelName,
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          config: {
            systemInstruction: activeSystemPrompt,
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        });

        const response = await withTimeout(geminiCall, 15000, `Gemini (${modelName}) precision extraction timeout`);
        const parsed = cleanAndParseJson(response.text || '', entities);
        if (parsed) {
          parsed.model_used = isAiSynthesisMode ? `Gemini (${modelName}) • AI Knowledge Synthesis` : `Gemini (${modelName})`;
          return enforceGroundingOnResponse(parsed, entityAFactsText, entityBFactsText);
        }
      } catch (err: any) {
        console.warn(`Gemini (${modelName}) error:`, err?.message || err);
      }
    }
  }

  // All LLM providers failed — return structured error instead of fabricated data
  return {
    category: 'Comparison Unavailable',
    entities: entities.map(e => ({ name: e, pros: ['LLM inference failed — no verified data available'] })),
    entity_a: { name: entities[0] || 'Entity A', pros: ['LLM inference unavailable'] },
    entity_b: { name: entities[1] || 'Entity B', pros: ['LLM inference unavailable'] },
    categories: {
      'Service Status': [{
        metric: 'LLM Availability',
        values: entities.map(() => 'All inference providers failed or timed out'),
        entity_a: 'Unavailable', entity_b: 'Unavailable',
        source_type: 'unverified'
      }]
    },
    verified_metrics: [],
    community_sentiment: [],
    suggested_metrics: [],
    verdict_summary: 'All LLM inference providers (Groq, Gemini) failed or timed out. Please retry.',
    comparison_points: [{
      feature_name: 'LLM Availability', metric_name: 'LLM Availability',
      entity_a_value: 'Unavailable', entity_b_value: 'Unavailable',
      values: entities.map(() => 'Unavailable'), source_type: 'unverified'
    }],
    model_used: 'None (All Providers Failed)'
  };
}

// --- MULTI-TIER LLM MIDDLEWARE CASCADE (Groq Llama 3.3 70B -> Gemini 2.5 Flash -> Parametric Baseline) ---
const groqClient = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;
const geminiClient = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

const SYSTEM_PROMPT = `You are the MorphUI structural engine. Analyze the user prompt, gather constraints, and output ONLY a valid JSON array of widgets matching the requested schema. No markdown wrapping, no conversational text.`;

export async function orchestrateLLMCascade(prompt: string): Promise<any> {
  // --- TIER 1: Groq (GPT-OSS 120B) ---
  if (groqClient) {
    try {
      const completion = await groqClient.chat.completions.create({
        model: 'openai/gpt-oss-120b',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
      });
      
      const text = completion.choices[0]?.message?.content;
      if (text) return JSON.parse(text);
    } catch (groqError) {
      console.warn('Groq tier failed, falling back to Gemini 2.5 Flash...', groqError);
    }
  }

  // --- TIER 2: Google Gemini 2.5 Flash Fallback ---
  if (geminiClient) {
    try {
      const response = await geminiClient.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: `${SYSTEM_PROMPT}\n\nUser Request: ${prompt}`,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        }
      });

      if (response.text) return JSON.parse(response.text);
    } catch (geminiError) {
      console.error('Gemini tier failed, deploying parametric baseline fallback.', geminiError);
    }
  }

  // --- TIER 3: All providers failed — throw instead of returning fabricated data ---
  throw new Error('All LLM providers (Groq, Gemini) failed. Cannot generate widget data without inference.');
}
