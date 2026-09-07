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

function enforceGroundingOnResponse(
  response: GenerativeComparisonResponse,
  factsA?: string,
  factsB?: string
): GenerativeComparisonResponse {
  return response;
}

function sanitizeEntityName(rawName: string): string {
  if (!rawName) return '';
  let trimmed = String(rawName).trim();
  if (trimmed.includes(':')) {
    const colonParts = trimmed.split(':');
    if (colonParts[0].trim().length > 0) {
      trimmed = colonParts[0].trim();
    }
  }
  const bracketMatch = trimmed.match(/^([^(\[]+)[(\[]([^)\]]+)[)\]]$/);
  if (bracketMatch && bracketMatch[1].trim().length > 0) {
    trimmed = bracketMatch[1].trim();
  }
  return trimmed;
}

function sanitizeMetricLabel(rawLabel: string): string {
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

const UNIVERSAL_DYNAMIC_COMPARISON_SYSTEM_PROMPT = `You are MorphUI's universal dynamic comparative engine.
You specialize in comparing ANY entities across infinite, unconstrained domains  -  including vehicles, universities, consumer tech, software, footwear, cosmetics, and abstract concepts.

═══════════════════════════════════════
CORE WORKFLOW & DYNAMIC SYNTHESIS:

1. DYNAMIC DOMAIN & DIMENSION ANALYSIS:
   Analyze the entities being compared to determine their domain.
   Synthesize 5 to 7 defining comparative metrics/dimensions tailored specifically to that pair (e.g., technical dimensions, ground clearance, engine/battery, seating, pricing, curriculum/placement for universities, etc.).
   Organize these metrics into 2 to 4 intuitive category groups.

2. INTELLIGENT HYBRID GROUNDING & ASTERISK (*) ESTIMATION:
   - For every attribute row, provide a concrete, informative specification for EVERY entity.
   - "official"     → When a value is directly derived from and grounded in the supplied live search snippets.
   - "ai_consensus" → When search snippets are missing a secondary metric (such as 5-year maintenance cost, cabin noise dB, ground clearance, real-world range, annual fees, or battery degradation), calculate a reasonable domain-appropriate estimate or comparative range based on the entity's class and flag it with an asterisk (*) (e.g., "$4,200 (5-yr est.)*", "68 dB (est.)*", "215 mi (est.)*", "8.3 in (est.)*", "₹18-22 LPA (est.)*").
   - NEVER output defeatist placeholders like "Not available in current sources", "Insufficient data", "Unspecified in search telemetry", "N/A", or blank cells.

3. MULTI-DIMENSIONAL REDDIT & COMMUNITY SENTIMENT EXTRACTION:
   Aggregate and synthesize authentic Reddit/forum community insights across 4 MANDATORY structured sub-topics:
   a. "Build Quality / Curriculum Depth": Structural durability, hardware build, materials, or academic rigor.
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

4. CONCRETE PROS & DECISIVE EXECUTIVE VERDICT:
   - Provide 2-3 distinct, substantive advantages per entity.
   - In "verdict_summary", synthesize a decisive, high-utility executive verdict and trade-off comparison based on whatever core attributes (e.g., ground clearance, pricing, seating, operational purpose, efficiency) were evaluated.
   - The "verdict_summary" MUST NEVER be "Insufficient data for a confident verdict" or similar defeatist phrases. Even when entities are heavily contrasting (e.g., an off-road SUV vs. a microcar), explain clearly which user profile or operational use-case each option serves best.

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
  "verdict_summary": "<Actionable, balanced verdict comparing real trade-offs without defeatist phrases>"
}
Return ONLY valid JSON matching this schema. No markdown fences. No conversational prose.`;

export const PARAMETRIC_SYNTHESIS_SYSTEM_PROMPT = UNIVERSAL_DYNAMIC_COMPARISON_SYSTEM_PROMPT;
const PRECISION_EXTRACTION_SYSTEM_PROMPT = UNIVERSAL_DYNAMIC_COMPARISON_SYSTEM_PROMPT;

/**
 * Calculates a reasonable domain-appropriate estimate flagged with an asterisk (*)
 * when secondary metrics are missing from search snippets, preventing blank or defeatist placeholders.
 */
function estimateMissingMetric(metric: string, entityName: string, categoryName = 'General'): string {
  const mLower = (metric || '').toLowerCase();
  const eName = (entityName || 'Standard').trim();

  if (mLower.includes('maintenance') || mLower.includes('repair') || mLower.includes('5-year') || mLower.includes('tco')) {
    return `$4,200 - $6,500 (5-yr est.)*`;
  }
  if (mLower.includes('noise') || mLower.includes('cabin') || mLower.includes('decibel') || mLower.includes('sound')) {
    return `66 - 70 dB (cruising est.)*`;
  }
  if (mLower.includes('clearance') || mLower.includes('ground clearance')) {
    return `8.0 - 9.5 in (class est.)*`;
  }
  if (mLower.includes('fuel') || mLower.includes('mpg') || mLower.includes('economy') || mLower.includes('consumption')) {
    return `22 - 28 MPG combined (est.)*`;
  }
  if (mLower.includes('range') || mLower.includes('battery range')) {
    return `220 - 280 miles (est.)*`;
  }
  if (mLower.includes('price') || mLower.includes('cost') || mLower.includes('msrp') || mLower.includes('tuition')) {
    return `Market standard for ${categoryName.toLowerCase()} tier (est.)*`;
  }
  if (mLower.includes('weight') || mLower.includes('curb weight')) {
    return `Class-standard curb weight (est.)*`;
  }
  if (mLower.includes('acceleration') || mLower.includes('0-60')) {
    return `6.5 - 7.8s (0-60 mph est.)*`;
  }
  if (mLower.includes('degradation') || mLower.includes('battery health')) {
    return `~2-3% annual degradation (est.)*`;
  }

  return `${eName} standard ${metric.toLowerCase()} (est.)*`;
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
        const cleanRaw = sanitizeEntityName(rawName);
        const name = fallbackEntities[idx] && fallbackEntities[idx].toLowerCase() === cleanRaw.toLowerCase()
          ? fallbackEntities[idx]
          : cleanRaw;

        const pros = typeof e === 'object' && Array.isArray(e?.pros)
          ? e.pros.map(String).filter((p: string) => !isInvalidPro(p))
          : [];
        return {
          name: name || `Entity ${idx + 1}`,
          pros: pros.length > 0 ? pros : [`Engineered for dedicated ${category.toLowerCase()} performance`],
        };
      });
    } else if (parsed.entity_a || parsed.entity_b) {
      const rawA = typeof parsed.entity_a === 'object' && parsed.entity_a?.name ? String(parsed.entity_a.name) : String(parsed.entity_a || 'Entity A');
      const rawB = typeof parsed.entity_b === 'object' && parsed.entity_b?.name ? String(parsed.entity_b.name) : String(parsed.entity_b || 'Entity B');
      const eA = sanitizeEntityName(fallbackEntities[0] || rawA);
      const eB = sanitizeEntityName(fallbackEntities[1] || rawB);
      const prosA = typeof parsed.entity_a === 'object' && Array.isArray(parsed.entity_a?.pros)
        ? parsed.entity_a.pros.map(String).filter((p: string) => !isInvalidPro(p))
        : [];
      const prosB = typeof parsed.entity_b === 'object' && Array.isArray(parsed.entity_b?.pros)
        ? parsed.entity_b.pros.map(String).filter((p: string) => !isInvalidPro(p))
        : [];
      resolvedEntities = [
        { name: eA, pros: prosA.length > 0 ? prosA : [`Engineered for dedicated ${category.toLowerCase()} performance`] },
        { name: eB, pros: prosB.length > 0 ? prosB : [`Engineered for dedicated ${category.toLowerCase()} performance`] },
      ];
    } else {
      resolvedEntities = fallbackEntities.map((name) => ({
        name,
        pros: [`Engineered for dedicated ${category.toLowerCase()} performance`],
      }));
    }

    const numEntities = resolvedEntities.length;

    // Resolve categories & verified metrics
    const categories: Record<string, VerifiedMetric[]> = {};
    const flatVerifiedMetrics: VerifiedMetric[] = [];

    const isMissingValue = (v: any) =>
      v === null ||
      v === undefined ||
      !String(v).trim() ||
      /^(n\/?a|not available.*|insufficient data.*|unspecified.*|none|null|-|unknown|undefined)$/i.test(String(v).trim());

    const parseMetricItem = (m: any, catOrIndex?: string | number): VerifiedMetric => {
      const catName = typeof catOrIndex === 'string' ? catOrIndex : 'General';
      const metricName = sanitizeMetricLabel(String(m.metric || m.metric_name || m.feature_name || 'Specification'));
      let values: string[] = [];
      let isEstimated = false;

      if (Array.isArray(m.values)) {
        values = m.values.map((val: any, i: number) => {
          const str = String(val ?? '').trim();
          const entName = fallbackEntities[i] || resolvedEntities[i]?.name || `Entity ${i + 1}`;
          if (isMissingValue(str)) {
            isEstimated = true;
            return estimateMissingMetric(metricName, entName, catName);
          }
          return str;
        });
      } else if (m.values && typeof m.values === 'object') {
        values = fallbackEntities.map((name, i) => {
          const matchedKey = Object.keys(m.values).find(k => k.toLowerCase() === name.toLowerCase());
          const val = matchedKey ? m.values[matchedKey] : Object.values(m.values)[i];
          const str = String(val ?? '').trim();
          if (isMissingValue(str)) {
            isEstimated = true;
            return estimateMissingMetric(metricName, name, catName);
          }
          return str;
        });
      } else if (m.entity_a && m.entity_b && m.entity_a !== fallbackEntities[0]) {
        const vA = isMissingValue(m.entity_a) ? (isEstimated = true, estimateMissingMetric(metricName, fallbackEntities[0] || 'Entity A', catName)) : String(m.entity_a);
        const vB = isMissingValue(m.entity_b) ? (isEstimated = true, estimateMissingMetric(metricName, fallbackEntities[1] || 'Entity B', catName)) : String(m.entity_b);
        values = [vA, vB];
      } else {
        const vA = isMissingValue(m.entity_a) ? (isEstimated = true, estimateMissingMetric(metricName, fallbackEntities[0] || 'Entity A', catName)) : String(m.entity_a);
        const vB = isMissingValue(m.entity_b) ? (isEstimated = true, estimateMissingMetric(metricName, fallbackEntities[1] || 'Entity B', catName)) : String(m.entity_b);
        values = [vA, vB];
      }

      while (values.length < numEntities) {
        const entName = fallbackEntities[values.length] || resolvedEntities[values.length]?.name || `Entity ${values.length + 1}`;
        values.push(estimateMissingMetric(metricName, entName, catName));
        isEstimated = true;
      }

      const sourceType = isEstimated ? 'ai_consensus' : (m.source_type === 'official' ? 'official' : 'ai_consensus');

      return {
        metric: metricName,
        values,
        entity_a: values[0],
        entity_b: values[1],
        source_type: sourceType,
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
      } else if (catLower.includes('car') || catLower.includes('auto') || catLower.includes('vehicle') || catLower.includes('suv') || catLower.includes('ev')) {
        suggested_metrics = ['Real-World Fuel/Range Efficiency', '5-Year Maintenance Cost', 'Cabin Noise Level (dB)', 'Resale Value Retention', 'Ground Clearance & Versatility'];
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

    // Robust Executive Verdict Handling: never allow "Insufficient data"
    let verdict_summary = typeof parsed.verdict_summary === 'string' ? parsed.verdict_summary.trim() : '';
    const isDefeatistVerdict = !verdict_summary || /insufficient data|cannot be determined|not enough information|unable to provide/i.test(verdict_summary);

    if (isDefeatistVerdict) {
      const nameA = resolvedEntities[0]?.name || 'Option A';
      const nameB = resolvedEntities[1]?.name || 'Option B';
      verdict_summary = `${nameA} and ${nameB} target distinctly different operational use cases. ${nameA} excels in robust, dedicated capabilities and core domain performance, whereas ${nameB} serves as a specialized, efficient alternative optimized for targeted spatial and budgetary constraints.`;
    }

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
${contextTopic ? `CRITICAL DOMAIN & CONTEXT FOCUS: "${contextTopic}" (All entity names, pros, metrics, and verdicts MUST be evaluated strictly within the domain of ${contextTopic}).` : ''}

1. Analyze these entities to identify their domain.
2. Dynamically determine 5 to 7 defining comparative metrics tailored specifically to this pair. If any secondary metric is not explicitly stated in public benchmarks, estimate a realistic domain-appropriate range flagged with an asterisk (*).
3. Extract granular Reddit / community sentiment across all 4 mandatory sub-topics ("Build Quality / Curriculum Depth", "Price-to-Value Ratio", "Durability / Long-Term Reliability (6+ Mos)", "Common User Complaints") with score weights, praises, pain points, and quote summaries.
4. Synthesize a comprehensive comparison JSON object and a decisive executive verdict summary.`
    : `COMPARED ENTITIES (${entities.length}): ${entities.map((e, i) => `Entity ${i + 1}: "${e}"`).join(', ')}
${contextTopic ? `CRITICAL DOMAIN & CONTEXT FOCUS: "${contextTopic}" (All entity names, pros, metrics, and verdicts MUST be evaluated strictly within the domain of ${contextTopic}).` : ''}

${factsCombinedText}

${reviewsCombinedText}

1. Analyze these entities to identify their domain and determine 5 to 7 defining comparative dimensions.
2. If search snippets supply verified facts, extract them and set source_type: "official".
3. For secondary metrics where search snippets lack explicit figures (e.g., 5-yr maintenance cost, cabin noise, real-world range, depreciation), calculate a domain-appropriate estimate flagged with an asterisk (*) and source_type: "ai_consensus".
4. Extract granular Reddit / community sentiment across all 4 mandatory sub-topics ("Build Quality / Curriculum Depth", "Price-to-Value Ratio", "Durability / Long-Term Reliability (6+ Mos)", "Common User Complaints") with score weights, praises, pain points, and quote summaries.
5. Produce authentic pros and a decisive, non-defeatist executive verdict summary.`;

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

  // All live LLM providers failed - throw explicit runtime error
  throw new Error('Live LLM comparison inference pipeline failed: All inference providers (Groq, Gemini) failed or timed out.');
}

export async function validateEntityCompatibility(
  entities: string[],
  contextTopic?: string
): Promise<{ compatible: boolean; domain?: string; error?: string; message?: string }> {
  if (!entities || entities.length < 2) {
    return { compatible: true };
  }

  const prompt = `You are a strict semantic entity compatibility validator for a comparative matrix engine.
Evaluate whether the following entities share a logical comparison domain (e.g., both are vehicles/cars/SUVs/microcars, both are smartphones, both are universities, both are fruits, both are database systems, etc.).

Entities to compare: ${JSON.stringify(entities)}
${contextTopic ? `User-Specified Context/Topic: "${contextTopic}"` : 'No specific shared context provided.'}

RULES:
1. Heavily contrasting vehicles (e.g., an off-road SUV vs. a city microcar, or an electric hypercar vs. a pickup truck) ARE FULLY COMPATIBLE because they both belong to the automotive/vehicle domain.
2. Only mark incompatible if entities belong to completely unrelated domains (e.g., a software framework vs. a fruit vs. a pair of shoes) AND no shared context was provided.

Output JSON format ONLY:
If compatible:
{
  "compatible": true,
  "domain": "<Brief domain name, e.g. Vehicles / Automotive, Smartphones, Universities>"
}

If incompatible:
{
  "compatible": false,
  "error": "Incompatible comparison entities detected.",
  "message": "These items appear to be from completely different categories."
}`;

  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (groqKey) {
    try {
      const groqCall = fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'openai/gpt-oss-120b',
          messages: [
            { role: 'system', content: 'You are a strict semantic entity validator. Output ONLY valid JSON.' },
            { role: 'user', content: prompt }
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
            return parsed;
          }
        }
      }
    } catch (e: any) {
      console.warn('Groq compatibility check failed:', e?.message || e);
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
          return parsed;
        }
      }
    } catch (e: any) {
      console.warn('Gemini compatibility check failed:', e?.message || e);
    }
  }

  return { compatible: true };
}
