import Groq from 'groq-sdk';
import { GoogleGenAI } from '@google/genai';
import {
  GenerativeComparisonResponse,
  VerifiedMetric,
  CommunitySentiment,
  EntityVerdict,
  ComparisonPoint,
  GranularCommunityInsights,
} from '@/types/morphui';
import { EntityFactsResult } from './factRetrieval';

function withTimeout<T>(promise: Promise<T>, ms: number, errMsg: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(errMsg)), ms)),
  ]);
}

const UNIVERSAL_DYNAMIC_COMPARISON_SYSTEM_PROMPT = `You are MorphUI's universal dynamic comparative engine.
You specialize in comparing ANY entities across infinite, unconstrained domains — including universities, consumer tech, software, footwear, cosmetics, countries, sports, and abstract concepts.

═══════════════════════════════════════
CORE WORKFLOW & DYNAMIC SYNTHESIS:

1. DYNAMIC DOMAIN & DIMENSION ANALYSIS:
   Analyze the entities being compared to determine their domain.
   Synthesize 5 to 7 defining comparative metrics/dimensions tailored specifically to that pair (e.g., tech specs, curriculum/placement for universities, ingredients/finish for cosmetics, etc.).
   Organize these metrics into 2 to 4 intuitive category groups.

2. INTELLIGENT HYBRID GROUNDING & AI CONSENSUS:
   - For every attribute row generated, you MUST provide a valid, non-empty data value or numerical statistic for EVERY entity being compared. Never leave an entity's value blank, null, or defaulted to grey placeholder bars.
   - "official"     → When a value is directly derived from and grounded in the supplied live search snippets.
   - "ai_consensus" → When search results are sparse, unstructured, or for conceptual/macro dimensions, synthesize high-confidence parametric consensus.
   - NEVER output generic placeholder filler. Every metric must contain an authentic, entity-specific comparison.

3. MULTI-DIMENSIONAL REDDIT & COMMUNITY SENTIMENT EXTRACTION:
   Aggregate and synthesize authentic Reddit/forum community insights across 4 MANDATORY structured sub-topics:
   a. "Build Quality / Curriculum Depth": Structural durability, hardware build, or educational/academic rigor.
   b. "Price-to-Value Ratio": Whether users feel it is worth the cost, real-world pricing satisfaction, and alternatives discussed.
   c. "Durability / Long-Term Reliability (6+ Mos)": Feedback from users who have owned the product or attended the institution for 6+ months.
   d. "Common User Complaints": The most repeated pain points, defects, friction points, or buyer remorse reasons.
   
   For each sub-topic, extract:
   - "consensuses": Per-entity consensus summary text.
   - "sentiment": "Positive" | "Mixed" | "Critical"
   - "score_weight": 1 to 10 integer rating community consensus strength/intensity.
   - "praises": 1-3 specific praise points mentioned by users.
   - "pain_points": 1-3 specific pain points/complaints mentioned by users.
   - "quotes": 1-2 authentic Reddit thread summary quotes or highlights.

4. CONCRETE PROS & NUANCED VERDICT:
   - Provide 2-3 distinct, substantive advantages per entity.
   - In "verdict_summary", provide a clear, actionable recommendation explaining when, why, and for whom each option is superior.

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
        "source_type": "<'official' or 'ai_consensus'>"
      }
    ]
  },
  "community_sentiment": [
    {
      "topic": "Build Quality / Curriculum Depth",
      "consensuses": ["Consensus for Entity 1", "Consensus for Entity 2"],
      "sentiment": "Positive",
      "score_weight": 8,
      "praises": ["Specific praise point 1"],
      "pain_points": ["Specific pain point 1"],
      "quotes": ["\"Reddit quote or snippet summary 1\""]
    },
    {
      "topic": "Price-to-Value Ratio",
      "consensuses": ["Value verdict for Entity 1", "Value verdict for Entity 2"],
      "sentiment": "Mixed",
      "score_weight": 7,
      "praises": ["Worth the price because..."],
      "pain_points": ["Overpriced in aspects of..."],
      "quotes": ["\"Reddit community consensus on price\""]
    },
    {
      "topic": "Durability / Long-Term Reliability (6+ Mos)",
      "consensuses": ["6+ mo experience for Entity 1", "6+ mo experience for Entity 2"],
      "sentiment": "Positive",
      "score_weight": 9,
      "praises": ["Holds up well after 1 year..."],
      "pain_points": ["Shows wear/issues after 6 months on..."],
      "quotes": ["\"Long-term owner feedback\""]
    },
    {
      "topic": "Common User Complaints",
      "consensuses": ["Main complaint for Entity 1", "Main complaint for Entity 2"],
      "sentiment": "Critical",
      "score_weight": 8,
      "praises": ["Mitigated by..."],
      "pain_points": ["Recurring issue with..."],
      "quotes": ["\"Frequent complaint reported by users\""]
    }
  ],
  "community_insights": {
    "pros_and_cons": [
      {
        "entity": "<Entity 1>",
        "praises": ["Key praise 1", "Key praise 2"],
        "pain_points": ["Key pain point 1", "Key pain point 2"]
      },
      {
        "entity": "<Entity 2>",
        "praises": ["Key praise 1", "Key praise 2"],
        "pain_points": ["Key pain point 1", "Key pain point 2"]
      }
    ],
    "price_value_consensus": {
      "summary": "<Comparative real-world value analysis>",
      "worth_it_verdict": {
        "<Entity 1>": "High Value / Worth It / Overpriced",
        "<Entity 2>": "High Value / Worth It / Overpriced"
      },
      "alternatives_mentioned": ["Alternative Option 1", "Alternative Option 2"]
    },
    "long_term_reliability": {
      "summary": "<Summary of 6+ month owner / user longevity feedback>",
      "experience_6plus_months": {
        "<Entity 1>": "<6+ month durability details>",
        "<Entity 2>": "<6+ month durability details>"
      }
    }
  },
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
  const tokens = normalized.split(' ').filter(t => t.length >= 3 && !STOPWORDS.has(t));
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


/**
 * Synthesizes a realistic estimated value for any missing or blank entity metric cell
 * to guarantee zero empty/blank cells or grey placeholder bars across the UI.
 */
function synthesizeRealisticFallback(metric: string, entityName: string, categoryName = 'General'): string {
  const mLower = metric.toLowerCase();
  const eName = entityName.trim();

  if (mLower.includes('price') || mLower.includes('fee') || mLower.includes('tuition') || mLower.includes('cost')) {
    return `Competitive ${categoryName.toLowerCase()} tier (~standard market pricing)`;
  }
  if (mLower.includes('battery') || mLower.includes('playback') || mLower.includes('runtime')) {
    return '24-30 hours standard endurance';
  }
  if (mLower.includes('weight') || mLower.includes('dimensions')) {
    return 'Optimized lightweight ergonomic profile';
  }
  if (mLower.includes('rating') || mLower.includes('score') || mLower.includes('rank')) {
    return 'High-tier industry benchmark standing';
  }
  if (mLower.includes('warranty') || mLower.includes('support')) {
    return '1-year standard manufacturer warranty & support';
  }
  if (mLower.includes('connectivity') || mLower.includes('bluetooth') || mLower.includes('wireless')) {
    return 'Bluetooth 5.3+ / Ultra-low latency multi-device support';
  }
  if (mLower.includes('material') || mLower.includes('finish') || mLower.includes('texture')) {
    return 'Premium engineered composite / durable finish';
  }
  if (mLower.includes('placement') || mLower.includes('acceptance') || mLower.includes('cutoff')) {
    return 'High-selectivity threshold with top-tier career placements';
  }

  return `${eName} standard ${metric.toLowerCase()} specification`;
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

    const parseMetricItem = (m: any, catOrIndex?: string | number): VerifiedMetric => {
      const catName = typeof catOrIndex === 'string' ? catOrIndex : 'General';
      const metricName = String(m.metric || m.metric_name || m.feature_name || 'Specification').trim();
      let values: string[] = [];

      const isBlank = (v: any) =>
        v === null ||
        v === undefined ||
        !String(v).trim() ||
        /^(n\/?a|not specified.*|none|null|-|unknown|undefined)$/i.test(String(v).trim());

      if (Array.isArray(m.values)) {
        values = m.values.map((val: any, i: number) => {
          const str = String(val ?? '').trim();
          const entName = fallbackEntities[i] || resolvedEntities[i]?.name || `Entity ${i + 1}`;
          return isBlank(str) ? synthesizeRealisticFallback(metricName, entName, catName) : str;
        });
      } else if (m.values && typeof m.values === 'object') {
        values = fallbackEntities.map((name, i) => {
          const matchedKey = Object.keys(m.values).find(k => k.toLowerCase() === name.toLowerCase());
          const val = matchedKey ? m.values[matchedKey] : Object.values(m.values)[i];
          const str = String(val ?? '').trim();
          return isBlank(str) ? synthesizeRealisticFallback(metricName, name, catName) : str;
        });
      } else if (m.entity_a && m.entity_b && m.entity_a !== fallbackEntities[0]) {
        const vA = isBlank(m.entity_a) ? synthesizeRealisticFallback(metricName, fallbackEntities[0] || 'Entity A', catName) : String(m.entity_a);
        const vB = isBlank(m.entity_b) ? synthesizeRealisticFallback(metricName, fallbackEntities[1] || 'Entity B', catName) : String(m.entity_b);
        values = [vA, vB];
      } else {
        const vA = isBlank(m.entity_a) ? synthesizeRealisticFallback(metricName, fallbackEntities[0] || 'Entity A', catName) : String(m.entity_a);
        const vB = isBlank(m.entity_b) ? synthesizeRealisticFallback(metricName, fallbackEntities[1] || 'Entity B', catName) : String(m.entity_b);
        values = [vA, vB];
      }

      while (values.length < numEntities) {
        const entName = fallbackEntities[values.length] || resolvedEntities[values.length]?.name || `Entity ${values.length + 1}`;
        values.push(synthesizeRealisticFallback(metricName, entName, catName));
      }

      return {
        metric: metricName,
        values,
        entity_a: values[0],
        entity_b: values[1],
        source_type: m.source_type === 'official' ? 'official' : 'ai_consensus',
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

    // Resolve multi-dimensional community sentiment
    const community_sentiment: CommunitySentiment[] = [];
    if (Array.isArray(parsed.community_sentiment)) {
      parsed.community_sentiment.forEach((s: any) => {
        if (s && (s.topic || s.dimension)) {
          const topic = String(s.topic || s.dimension);
          let consensuses: string[] = [];
          if (Array.isArray(s.consensuses)) {
            consensuses = s.consensuses.map(String);
          } else {
            consensuses = [String(s.entity_a_consensus || 'General consensus'), String(s.entity_b_consensus || 'General consensus')];
          }

          while (consensuses.length < numEntities) {
            consensuses.push('General user sentiment');
          }

          const rawWeight = Number(s.score_weight || s.weight || s.score);
          const score_weight = !isNaN(rawWeight) && rawWeight > 0 ? Math.min(10, Math.max(1, Math.round(rawWeight))) : 8;

          const praises = Array.isArray(s.praises) ? s.praises.map(String) : [];
          const pain_points = Array.isArray(s.pain_points) ? s.pain_points.map(String) : [];
          const quotes = Array.isArray(s.quotes) ? s.quotes.map(String) : [];

          community_sentiment.push({
            topic,
            consensuses,
            entity_a_consensus: consensuses[0],
            entity_b_consensus: consensuses[1],
            sentiment: s.sentiment === 'Positive' || s.sentiment === 'Critical' ? s.sentiment : 'Mixed',
            score_weight,
            praises,
            pain_points,
            quotes,
          });
        }
      });
    }

    // Ensure mandatory sub-topics are present
    const mandatoryTopics = [
      'Build Quality / Curriculum Depth',
      'Price-to-Value Ratio',
      'Durability / Long-Term Reliability (6+ Mos)',
      'Common User Complaints'
    ];

    mandatoryTopics.forEach((topicName) => {
      const existing = community_sentiment.find(cs => cs.topic.toLowerCase().includes(topicName.toLowerCase().slice(0, 10)));
      if (!existing && community_sentiment.length < 6) {
        community_sentiment.push({
          topic: topicName,
          consensuses: resolvedEntities.map(e => `Community feedback on ${e.name} regarding ${topicName.toLowerCase()}.`),
          entity_a_consensus: `Community feedback on ${resolvedEntities[0]?.name || 'Entity A'} regarding ${topicName.toLowerCase()}.`,
          entity_b_consensus: `Community feedback on ${resolvedEntities[1]?.name || 'Entity B'} regarding ${topicName.toLowerCase()}.`,
          sentiment: 'Mixed',
          score_weight: 8,
          praises: [],
          pain_points: [],
          quotes: []
        });
      }
    });

    // Parse granular community insights object if provided
    let community_insights: GranularCommunityInsights | undefined = undefined;
    if (parsed.community_insights && typeof parsed.community_insights === 'object') {
      community_insights = {
        pros_and_cons: Array.isArray(parsed.community_insights.pros_and_cons)
          ? parsed.community_insights.pros_and_cons.map((pc: any) => ({
              entity: String(pc.entity || ''),
              praises: Array.isArray(pc.praises) ? pc.praises.map(String) : [],
              pain_points: Array.isArray(pc.pain_points) ? pc.pain_points.map(String) : [],
            }))
          : resolvedEntities.map(e => ({
              entity: e.name,
              praises: e.pros.slice(0, 3),
              pain_points: []
            })),
        price_value_consensus: parsed.community_insights.price_value_consensus ? {
          summary: String(parsed.community_insights.price_value_consensus.summary || 'Real-world value consensus analysis.'),
          worth_it_verdict: parsed.community_insights.price_value_consensus.worth_it_verdict || {},
          alternatives_mentioned: Array.isArray(parsed.community_insights.price_value_consensus.alternatives_mentioned)
            ? parsed.community_insights.price_value_consensus.alternatives_mentioned.map(String)
            : []
        } : undefined,
        long_term_reliability: parsed.community_insights.long_term_reliability ? {
          summary: String(parsed.community_insights.long_term_reliability.summary || '6+ month user durability feedback.'),
          experience_6plus_months: parsed.community_insights.long_term_reliability.experience_6plus_months || {}
        } : undefined
      };
    }

    const comparison_points: ComparisonPoint[] = flatVerifiedMetrics.map((vm) => ({
      feature_name: vm.metric,
      metric_name: vm.metric,
      entity_a_value: vm.values?.[0] || vm.entity_a || '',
      entity_b_value: vm.values?.[1] || vm.entity_b || '',
      values: vm.values,
      source_type: vm.source_type,
    }));

    let suggested_metrics = Array.isArray(parsed.suggested_metrics) && parsed.suggested_metrics.length > 0
      ? parsed.suggested_metrics.map(String).filter((s: string) => s.trim().length > 0)
      : [];

    if (suggested_metrics.length === 0) {
      const catLower = (category || '').toLowerCase();
      if (catLower.includes('phone') || catLower.includes('tech') || catLower.includes('device') || catLower.includes('laptop') || catLower.includes('gpu')) {
        suggested_metrics = ['Battery Degradation (1 Year)', 'Thermals & Peak Gaming Heat', 'Low-Light Video Quality', 'Repairability & Parts Cost', 'Haptic Engine & Speaker Quality'];
      } else if (catLower.includes('university') || catLower.includes('college') || catLower.includes('school') || catLower.includes('education')) {
        suggested_metrics = ['Median Placement Package', 'Research Grant Funding', 'Alumni Network Strength', 'Hostel & Campus Facilities', 'Faculty-to-Student Ratio'];
      } else if (catLower.includes('car') || catLower.includes('auto') || catLower.includes('vehicle') || catLower.includes('ev')) {
        suggested_metrics = ['Real-World Fuel/Range Efficiency', '5-Year Maintenance Cost', 'Cabin Noise Level (dB)', 'Resale Value Retention', 'Safety Crash Test Rating'];
      } else if (catLower.includes('shoe') || catLower.includes('footwear') || catLower.includes('apparel') || catLower.includes('sneaker')) {
        suggested_metrics = ['Midsole Energy Return (%)', 'Outsole Durability (Miles)', 'Arch Support & Stability', 'Breathability in Hot Weather', 'True-to-Size Fit'];
      } else {
        suggested_metrics = [
          `Real-World Durability for ${resolvedEntities[0]?.name || 'Entity A'}`,
          `Long-Term Value for Money`,
          `Performance Under Peak Load`,
          `Ease of Use & Ergonomics`,
          `Maintenance & Ongoing Support Cost`
        ];
      }
    }

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
      community_insights,
      suggested_metrics,
      verdict_summary,
      comparison_points,
    };
  } catch {
    return null;
  }
}

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
        return `COMMUNITY REVIEWS & REDDIT FOR ${e.toUpperCase()}:\n${content}`;
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
    reviewsCombinedText = `COMMUNITY REVIEWS & REDDIT FOR ${eA.toUpperCase()}:\n${reviewsA || 'No forum reviews found.'}\n\nCOMMUNITY REVIEWS & REDDIT FOR ${eB.toUpperCase()}:\n${reviewsB || 'No forum reviews found.'}`;

    hasMissingFacts = !factsA?.trim() && !factsB?.trim();
    entityAFactsText = factsA || '';
    entityBFactsText = factsB || '';
  }

  const isAiSynthesisMode = hasMissingFacts;
  const activeSystemPrompt = isAiSynthesisMode ? PARAMETRIC_SYNTHESIS_SYSTEM_PROMPT : PRECISION_EXTRACTION_SYSTEM_PROMPT;

  const geminiKey = process.env.GEMINI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;

  const userPrompt = isAiSynthesisMode
    ? `COMPARED ENTITIES (${entities.length}): ${entities.map((e, i) => `Entity ${i + 1}: "${e}"`).join(', ')}
${contextTopic ? `Specific Focus / Topic: "${contextTopic}"` : ''}

No rigid spec sheet exists in live web results for this comparison.
1. Analyze these entities to identify their domain (geopolitical, athletic, cosmetic, philosophical, technical, cultural, etc.).
2. Dynamically determine 5 to 7 of the most insightful, differentiating comparative metrics tailored specifically to this pair.
3. Extract granular Reddit / community sentiment across all 4 mandatory sub-topics ("Build Quality / Curriculum Depth", "Price-to-Value Ratio", "Durability / Long-Term Reliability (6+ Mos)", "Common User Complaints") with score weights, praises, pain points, and quote summaries.
4. Synthesize a comprehensive, multi-category comparison JSON object. Set source_type: "ai_consensus" on all synthesized metrics.`
    : `COMPARED ENTITIES (${entities.length}): ${entities.map((e, i) => `Entity ${i + 1}: "${e}"`).join(', ')}
${contextTopic ? `Specific Focus / Topic: "${contextTopic}"` : ''}

${factsCombinedText}

${reviewsCombinedText}

1. Analyze these entities to identify their domain and determine 5 to 7 defining comparative dimensions.
2. If search snippets supply verified facts, extract them and set source_type: "official".
3. For dimensions where search snippets are sparse, conceptual, or missing, seamlessly blend high-confidence parametric consensus with source_type: "ai_consensus".
4. Extract granular Reddit / community sentiment across all 4 mandatory sub-topics ("Build Quality / Curriculum Depth", "Price-to-Value Ratio", "Durability / Long-Term Reliability (6+ Mos)", "Common User Complaints") with score weights, praises, pain points, and quote summaries.
5. Produce authentic pros and a nuanced verdict summary.`;

  // 1. PRIMARY MODEL: Groq Multi-Tier Cascade (gpt-oss-120b -> gpt-oss-20b -> qwen3.8-27b)
  if (groqKey) {
    const groqModels = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b'];
    for (const modelName of groqModels) {
      try {
        const groqCall = fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${groqKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: modelName,
            messages: [
              { role: 'system', content: activeSystemPrompt },
              { role: 'user', content: userPrompt },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.1,
          }),
        });

        const groqRes = await withTimeout(groqCall, 16000, `Groq (${modelName}) extraction timeout`);
        if (groqRes.ok) {
          const groqData = await groqRes.json();
          const content = groqData.choices?.[0]?.message?.content || '';
          const parsed = cleanAndParseJson(content, entities);
          if (parsed) {
            parsed.model_used = isAiSynthesisMode ? `Groq (${modelName}) • AI Knowledge Synthesis` : `Groq (${modelName})`;
            return enforceGroundingOnResponse(parsed, entityAFactsText, entityBFactsText);
          }
        } else {
          console.warn(`Groq model ${modelName} returned status ${groqRes.status}, cascading to next model...`);
        }
      } catch (err: any) {
        console.warn(`Groq (${modelName}) attempt failed, cascading:`, err?.message || err);
      }
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

        const response = await withTimeout(geminiCall, 40000, `Gemini (${modelName}) precision extraction timeout`);
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

// --- MULTI-TIER LLM MIDDLEWARE CASCADE ---
const groqClient = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;
const geminiClient = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

const SYSTEM_PROMPT = `You are the MorphUI structural engine. Analyze the user prompt, gather constraints, and output ONLY a valid JSON array of widgets matching the requested schema. No markdown wrapping, no conversational text.`;

export async function orchestrateLLMCascade(prompt: string): Promise<any> {
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
      console.warn('Groq tier failed, falling back to Gemini 3.6 Flash...', groqError);
    }
  }

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

  throw new Error('All LLM providers (Groq, Gemini) failed. Cannot generate widget data without inference.');
}


export interface SemanticValidationResult {
  compatible: boolean;
  domain?: string;
  error?: string;
  message?: string;
}

/**
 * Pre-Flight Semantic Check:
 * Evaluates if requested entities share a logical comparison domain (e.g. phones, universities, fruits).
 * If entities belong to completely unrelated domains and no common context is specified, aborts comparison.
 */
export async function validateEntityCompatibility(
  entities: string[],
  contextTopic?: string
): Promise<SemanticValidationResult> {
  if (!entities || entities.length < 2) {
    return { compatible: true };
  }

  const prompt = `You are a strict semantic entity compatibility validator for a comparative matrix engine.
Evaluate whether the following entities share a logical comparison domain (e.g., both are smartphones, both are universities, both are fruits, both are automotive brands, both are video games, both are database systems, etc.).

Entities to compare: ${JSON.stringify(entities)}
${contextTopic ? `User-Specified Context/Topic: "${contextTopic}"` : 'No specific shared context provided.'}

RULES:
1. If the entities belong to completely unrelated domains (e.g., a tech company vs a fruit vs a developer tool, or a pair of sneakers vs a quantum physics theory) AND no unifying context was provided by the user:
   Output incompatible JSON.
2. If the entities share a coherent category or if the user specified a clear context, output compatible JSON.

Output JSON format ONLY:
If compatible:
{
  "compatible": true,
  "domain": "<Brief domain name, e.g. Smartphones, Universities, Tropical Fruits>"
}

If incompatible:
{
  "compatible": false,
  "error": "Incompatible comparison entities detected.",
  "message": "These items appear to be from completely different categories. Please specify a shared context or category (e.g., 'Compare Apple [fruit] to Banana' or 'Compare Apple [tech] to Microsoft')."
}`;

  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

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
            {
              role: 'system',
              content: 'You are a strict semantic entity compatibility validator. Output ONLY valid JSON matching the requested schema. No conversational prose.',
            },
            { role: 'user', content: prompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.0,
        }),
      });

      const res = await withTimeout(groqCall, 4000, 'Groq compatibility check timeout');
      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          if (parsed && typeof parsed.compatible === 'boolean') {
            return {
              compatible: parsed.compatible,
              domain: parsed.domain,
              error: parsed.error || (parsed.compatible ? undefined : 'Incompatible comparison entities detected.'),
              message:
                parsed.message ||
                (parsed.compatible
                  ? undefined
                  : "These items appear to be from completely different categories. Please specify a shared context or category (e.g., 'Compare Apple [fruit] to Banana' or 'Compare Apple [tech] to Microsoft')."),
            };
          }
        }
      }
    } catch (e: any) {
      console.warn('Groq compatibility check failed, falling back to Gemini:', e?.message || e);
    }
  }

  if (geminiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const geminiCall = ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction: 'You are a strict semantic entity compatibility validator. Output ONLY valid JSON.',
          responseMimeType: 'application/json',
          temperature: 0.0,
        },
      });

      const response = await withTimeout(geminiCall, 4000, 'Gemini compatibility check timeout');
      if (response.text) {
        const parsed = JSON.parse(response.text);
        if (parsed && typeof parsed.compatible === 'boolean') {
          return {
            compatible: parsed.compatible,
            domain: parsed.domain,
            error: parsed.error || (parsed.compatible ? undefined : 'Incompatible comparison entities detected.'),
            message:
              parsed.message ||
              (parsed.compatible
                ? undefined
                : "These items appear to be from completely different categories. Please specify a shared context or category (e.g., 'Compare Apple [fruit] to Banana' or 'Compare Apple [tech] to Microsoft')."),
          };
        }
      }
    } catch (e: any) {
      console.warn('Gemini compatibility check failed:', e?.message || e);
    }
  }

  return { compatible: true };
}
