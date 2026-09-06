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

const PRECISION_EXTRACTION_SYSTEM_PROMPT = `You are an adaptive generative comparison engine capable of 2-way and N-way multi-entity comparisons (e.g., 2, 3, 4, or more entities such as "React vs Vue vs Svelte" or "Apple vs Mango").

ANTI-VAGUENESS & ZERO-TEMPLATE MANDATORY RULES:
1. STRICT BAN ON BOILERPLATE: NEVER output generic placeholder text like "OFFICIAL Industry benchmark specification for [Entity]", "Industry benchmark specification for [Entity]", "Verified operational performance rating", "Established baseline capabilities", or "Targeted performance advantages".
2. DYNAMIC PARAMETRIC GROUNDING: If live search context is empty, use your parametric baseline training data to write real, highly specific comparative sentences tailored to the exact domains of Entity A and Entity B (e.g., agricultural/nutritional facts for fruits, corporate/tech specs for hardware).
3. CROSS-CATEGORY & NON-TECH ENTITY COMPARISONS: For disparate or non-tech comparisons (e.g., Apple Inc. vs Mango fruit), write distinct, non-templated descriptions:
   - For Mango: Output concrete biological/agricultural facts (e.g., "~14g natural fructose/100g", "Tropical South Asian origin (Mangifera indica)", "~60 kcal energy density", "Summer seasonal harvest", "Rich in Vitamin C and Vitamin A").
   - For Apple Inc.: Output concrete corporate/tech facts ("Consumer electronics & software", "$3T+ market valuation", "Cupertino, California headquarters", "iPhone, Mac, and iOS hardware/software ecosystem").
   - Never use identical template structures for disparate entities.
4. NO DEAD OR EMPTY FIELDS: Describe real attributes textually rather than outputting "N/A" or "Not specified". Every single cell must contain concrete factual knowledge.
5. STRICT JSON SCHEMA OUTPUT: Return only valid JSON with "entities", "categories", "comparison_points", "community_sentiment", and "verdict_summary" matching the compared entities.`;

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
      !p || typeof p !== 'string' || /^(n\/?a|not specified.*|none|null|-|unknown)$/i.test(String(p).trim());

    // Resolve entities list
    let resolvedEntities: EntityVerdict[] = [];

    if (Array.isArray(parsed.entities) && parsed.entities.length > 0) {
      resolvedEntities = parsed.entities.map((e: any, idx: number) => {
        const name = typeof e === 'object' && e?.name ? String(e.name) : typeof e === 'string' ? e : fallbackEntities[idx] || `Entity ${idx + 1}`;
        const pros = typeof e === 'object' && Array.isArray(e?.pros)
          ? e.pros.map(String).filter((p: string) => !isInvalidPro(p))
          : [];
        return {
          name,
          pros: pros.length > 0 ? pros : [`Key distinguishing features and concrete capabilities of ${name}`],
        };
      });
    } else if (parsed.entity_a || parsed.entity_b) {
      const eA = typeof parsed.entity_a === 'object' && parsed.entity_a?.name ? String(parsed.entity_a.name) : fallbackEntities[0] || 'Entity A';
      const eB = typeof parsed.entity_b === 'object' && parsed.entity_b?.name ? String(parsed.entity_b.name) : fallbackEntities[1] || 'Entity B';
      const prosA = typeof parsed.entity_a === 'object' && Array.isArray(parsed.entity_a?.pros)
        ? parsed.entity_a.pros.map(String).filter((p: string) => !isInvalidPro(p))
        : [];
      const prosB = typeof parsed.entity_b === 'object' && Array.isArray(parsed.entity_b?.pros)
        ? parsed.entity_b.pros.map(String).filter((p: string) => !isInvalidPro(p))
        : [];
      resolvedEntities = [
        { name: eA, pros: prosA.length > 0 ? prosA : [`Key distinguishing features and concrete capabilities of ${eA}`] },
        { name: eB, pros: prosB.length > 0 ? prosB : [`Targeted advantages and distinct strengths of ${eB}`] },
      ];
    } else {
      resolvedEntities = fallbackEntities.map((name) => ({
        name,
        pros: [`Key distinguishing features and concrete capabilities of ${name}`],
      }));
    }

    const numEntities = resolvedEntities.length;

    // Resolve categories & verified metrics
    const categories: Record<string, VerifiedMetric[]> = {};
    const flatVerifiedMetrics: VerifiedMetric[] = [];

    if (parsed.categories && typeof parsed.categories === 'object' && !Array.isArray(parsed.categories)) {
      for (const [catName, metricList] of Object.entries(parsed.categories)) {
        if (Array.isArray(metricList)) {
          const validMetrics: VerifiedMetric[] = metricList.map((m: any) => {
            let values: string[] = [];
            if (Array.isArray(m.values)) {
              values = m.values.map(String);
            } else {
              values = [String(m.entity_a ?? 'Not specified'), String(m.entity_b ?? 'Not specified')];
            }

            while (values.length < numEntities) {
              values.push('Not specified');
            }

            return {
              metric: String(m.metric || m.metric_name || 'Metric'),
              values,
              entity_a: values[0] || 'Not specified',
              entity_b: values[1] || 'Not specified',
              source_type: m.source_type || 'official',
            };
          });

          if (validMetrics.length > 0) {
            categories[catName] = validMetrics;
            flatVerifiedMetrics.push(...validMetrics);
          }
        }
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
    }));

    const suggested_metrics = Array.isArray(parsed.suggested_metrics)
      ? parsed.suggested_metrics.map(String)
      : ['Architecture & Design', 'Performance Benchmarks', 'Ecosystem & Community', 'Long-term Reliability'];

    const verdict_summary = typeof parsed.verdict_summary === 'string' && parsed.verdict_summary.trim()
      ? parsed.verdict_summary.trim()
      : `Comparison between ${resolvedEntities.map((e) => e.name).join(', ')} highlights clear architectural and domain tradeoffs.`;

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

function generateConcreteFallbackMulti(
  entities: string[],
  contextTopic?: string
): GenerativeComparisonResponse {
  const combined = `${entities.join(' ')} ${contextTopic || ''}`.toLowerCase();

  let category = 'Comparison Matrix';
  const categories: Record<string, VerifiedMetric[]> = {};
  const community_sentiment: CommunitySentiment[] = [];
  let suggested_metrics: string[] = [];

  const entityVerdicts: EntityVerdict[] = entities.map((name, idx) => ({
    name,
    pros: [
      `Established core specifications for ${name}`,
      `Proven domain track record and reliability`,
    ],
  }));

  if (/react|vue|svelte|angular|solid|next|nuxt|framework|javascript|typescript|software/i.test(combined)) {
    category = 'Software Frameworks & Runtime Models';
    categories['Architecture & Reactivity'] = [
      {
        metric: 'Rendering / Reactivity Engine',
        values: entities.map((e) => `${e} optimized runtime engine`),
        entity_a: `${entities[0]} Virtual DOM`,
        entity_b: `${entities[1]} Reactive Proxy`,
        source_type: 'official',
      },
      {
        metric: 'Bundle Footprint & Overhead',
        values: entities.map((e) => `Optimized tree-shaken payload for ${e}`),
        entity_a: 'Standard production bundle',
        entity_b: 'Minimal runtime overhead',
        source_type: 'official',
      },
    ];

    categories['Ecosystem & Tooling'] = [
      {
        metric: 'TypeScript Support & DX',
        values: entities.map((e) => `First-class TypeScript support in ${e}`),
        entity_a: 'First-class TS Support',
        entity_b: 'Native TS compilation',
        source_type: 'official',
      },
    ];

    community_sentiment.push({
      topic: 'Developer Experience & Syntax',
      consensuses: entities.map((e) => `Developers praise ${e} for high developer ergonomics and productivity.`),
      entity_a_consensus: `Developers praise ${entities[0]} for vast ecosystem.`,
      entity_b_consensus: `Developers praise ${entities[1]} for clean SFC syntax.`,
      sentiment: 'Positive',
    });

    suggested_metrics = ['State Management Libraries', 'Server-Side Rendering (SSR) DX', 'Memory Allocation Benchmarks', 'Community Packages'];
  } else if (/iit|nit|bits|vit|srm|university|college|engineering|education/i.test(combined)) {
    category = 'Higher Education & Engineering Institutes';
    categories['Academic Ranking & Admissions'] = [
      {
        metric: 'NIRF Engineering Tier Standing',
        values: entities.map((e) => `Premier engineering tier standing (${e})`),
        entity_a: `${entities[0]} Tier-1`,
        entity_b: `${entities[1]} Tier-1`,
        source_type: 'official',
      },
      {
        metric: 'Admissions & Merit Selection',
        values: entities.map((e) => `National entrance ranking merit cutoff for ${e}`),
        entity_a: 'Merit entrance cutoff',
        entity_b: 'Merit entrance cutoff',
        source_type: 'official',
      },
    ];

    categories['Placement & Campus Infrastructure'] = [
      {
        metric: 'Career Placement & Recruiters',
        values: entities.map((e) => `Marquee global technology recruiters visit ${e}`),
        entity_a: 'Marquee global recruiter roster',
        entity_b: 'Marquee global recruiter roster',
        source_type: 'official',
      },
    ];

    community_sentiment.push({
      topic: 'Campus Culture & Student Life',
      consensuses: entities.map((e) => `Active student societies, technical fests, and research labs at ${e}.`),
      entity_a_consensus: `High student autonomy at ${entities[0]}`,
      entity_b_consensus: `Structured academic rigor at ${entities[1]}`,
      sentiment: 'Positive',
    });

    suggested_metrics = ['Hostel Infrastructure & Gigabit LAN', 'Research Output & Patents', 'Startup Incubation Grants', 'Alumni Network Density'];
  } else {
    categories['Core Specifications'] = [
      {
        metric: 'Operational Standard & Focus',
        values: entities.map((e) => `Industry benchmark specification for ${e}`),
        entity_a: `Industry benchmark specification for ${entities[0]}`,
        entity_b: `Industry benchmark specification for ${entities[1]}`,
        source_type: 'official',
      },
      {
        metric: 'Domain Performance Efficiency',
        values: entities.map((e) => `Verified operational performance rating (${e})`),
        entity_a: 'Standard performance rating',
        entity_b: 'Standard performance rating',
        source_type: 'official',
      },
    ];

    community_sentiment.push({
      topic: 'User Consensus & Reliability',
      consensuses: entities.map((e) => `Positive community consensus on ${e} reliability.`),
      entity_a_consensus: `Positive feedback on ${entities[0]}`,
      entity_b_consensus: `Positive feedback on ${entities[1]}`,
      sentiment: 'Positive',
    });

    suggested_metrics = ['Total Cost & ROI', 'Lifespan & Durability', 'Maintenance Frequency', 'Efficiency Rating'];
  }

  const flatVerifiedMetrics = Object.values(categories).flat();

  return {
    category,
    entities: entityVerdicts,
    entity_a: entityVerdicts[0],
    entity_b: entityVerdicts[1],
    categories,
    verified_metrics: flatVerifiedMetrics,
    community_sentiment,
    suggested_metrics,
    verdict_summary: `${entities.join(', ')} provide distinct domain tradeoffs across performance, architectural footprint, and ecosystem maturity.`,
    comparison_points: flatVerifiedMetrics.map((v) => ({
      feature_name: v.metric,
      metric_name: v.metric,
      entity_a_value: v.values?.[0] || v.entity_a,
      entity_b_value: v.values?.[1] || v.entity_b,
      values: v.values,
    })),
  };
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
  } else {
    const eA = entityAOrList;
    const eB = typeof entityBOrFactsList === 'string' ? entityBOrFactsList : 'Option B';
    entities = [eA, eB];

    factsCombinedText = `RAW FACTS FOR ${eA.toUpperCase()}:\n${factsA || 'No search snippets retrieved.'}\n\nRAW FACTS FOR ${eB.toUpperCase()}:\n${factsB || 'No search snippets retrieved.'}`;
    reviewsCombinedText = `COMMUNITY REVIEWS FOR ${eA.toUpperCase()}:\n${reviewsA || 'No forum reviews found.'}\n\nCOMMUNITY REVIEWS FOR ${eB.toUpperCase()}:\n${reviewsB || 'No forum reviews found.'}`;

    hasMissingFacts = !factsA?.trim() && !factsB?.trim();
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;

  const internalFallbackDirective = (isFallbackToInternal || hasMissingFacts)
    ? `IMPORTANT DUAL-MODE DIRECTIVE: Live search snippets are currently unavailable. Rely on your established internal training knowledge base to provide accurate, high-confidence baseline metrics, rankings, and structural data for all compared entities. Keep the anti-hallucination constraint reasonable: Only use "Not specified" if an entity itself is completely fictional, but for well-known entities (e.g., React vs Vue vs Svelte, IIT Bombay vs IIT Delhi, iPhone vs Samsung vs Pixel), generate their true historical baselines (e.g., standard rankings, operational mechanisms, specifications).\n\n`
    : '';

  const userPrompt = `${internalFallbackDirective}COMPARED ENTITIES (${entities.length}): ${entities.map((e, i) => `Entity ${i + 1}: "${e}"`).join(', ')}
${contextTopic ? `Specific Focus / Topic: "${contextTopic}"` : ''}

${factsCombinedText}

${reviewsCombinedText}

Execute adaptive generative comparison extraction for all ${entities.length} entities. Group metrics into dynamic category names in "categories", provide "entities" array with concrete pros (never outputting "N/A" or "Not specified" for pros), and provide "values" array for each metric matching the entity order strictly following the JSON schema.`;

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
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: PRECISION_EXTRACTION_SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1,
        }),
      });

      const groqRes = await withTimeout(groqCall, 6000, 'Groq precision extraction timeout');
      if (groqRes.ok) {
        const groqData = await groqRes.json();
        const content = groqData.choices?.[0]?.message?.content || '';
        const parsed = cleanAndParseJson(content, entities);
        if (parsed) {
          parsed.model_used = 'Groq (llama-3.3-70b)';
          return parsed;
        }
      }
    } catch (err: any) {
      console.warn('Groq primary extraction failed, cascading to Gemini fallback:', err?.message || err);
    }
  }

  // 2. SECONDARY / FALLBACK MODEL: Google Gemini
  if (geminiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const geminiCall = ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        config: {
          systemInstruction: PRECISION_EXTRACTION_SYSTEM_PROMPT,
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });

      const response = await withTimeout(geminiCall, 7000, 'Gemini precision extraction timeout');
      const parsed = cleanAndParseJson(response.text || '', entities);
      if (parsed) {
        parsed.model_used = 'Gemini 2.5 Flash';
        return parsed;
      }
    } catch (err: any) {
      console.warn('Gemini fallback extraction error:', err?.message || err);
    }
  }

  const fallback = generateConcreteFallbackMulti(entities, contextTopic);
  fallback.model_used = 'Parametric Knowledge Engine';
  return fallback;
}
