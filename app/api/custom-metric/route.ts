import { sanitizeQuery, sanitizeEntities } from '@/lib/security';
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

function withTimeout<T>(promise: Promise<T>, ms: number, errMsg: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(errMsg)), ms)),
  ]);
}

async function searchMetricSnippets(query: string): Promise<string> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (res.ok) {
      const html = await res.text();
      const snippets: string[] = [];
      const regex = /<a class="result__snippet[^>]*>([\s\S]*?)<\/a>/g;
      let match;
      while ((match = regex.exec(html)) !== null && snippets.length < 3) {
        const clean = match[1].replace(/<[^>]*>/g, '').replace(/&#x27;/g, "'").trim();
        if (clean) snippets.push(clean);
      }
      return snippets.join('\n- ');
    }
  } catch {
    // ignore
  }
  return '';
}

export async function POST(req: NextRequest) {
  let customMetric = '';
  let entities: string[] = [];

  try {
    const body = await req.json().catch(() => ({}));
    const rawMetric = body.metric || body.customMetric;
    const rawEntities = Array.isArray(body.entities) ? body.entities : [];

    customMetric = sanitizeQuery(rawMetric, 70);

    if (rawEntities.length > 0) {
      entities = sanitizeEntities(rawEntities, 6, 50);
    } else {
      const eA = sanitizeQuery(body.entityA || body.entity_a, 50);
      const eB = sanitizeQuery(body.entityB || body.entity_b, 50);
      if (eA && eB) {
        entities = [eA, eB];
      }
    }

    if (!customMetric || entities.length === 0) {
      return NextResponse.json({ error: 'Missing metric or entities in request' }, { status: 400 });
    }

    // Search snippets in parallel for all entities
    const searchPromises = entities.map((ent) =>
      searchMetricSnippets(`${ent} ${customMetric} specification fact review 2025 2026`)
    );
    const searchResults = await Promise.all(searchPromises);

    const findingsText = entities
      .map((ent, i) => `Entity ${i + 1}: "${ent}"\nSearch context:\n${searchResults[i] || 'No external snippets found.'}`)
      .join('\n\n');

    const prompt = `You are MorphUI's precision factual data extraction engine.
CRITICAL MANDATORY INSTRUCTIONS:
1. Evaluate and extract CONCRETE, FACTUAL specifications for the metric "${customMetric}" across all ${entities.length} entities:
${entities.map((e, i) => `  - Entity ${i + 1}: "${e}"`).join('\n')}
2. GROUNDING & SYNTHESIS: If search context contains the exact specification, extract it and set source_type to "official". If search context lacks data for this metric, synthesize the most accurate factual estimate based on product knowledge and set source_type to "ai_consensus".
3. ACCURACY: Provide authentic, realistic specifications for each entity. Do not output placeholder text like "N/A" or "No verified data found".
4. Keep each value clear and concise (e.g., "10mm drop (37mm heel / 27mm forefoot)", "₹21.8 LPA Median B.Tech package", "30 hours with ANC On").

${findingsText}

Return strictly valid JSON in this exact structure:
{
  "metric": "${customMetric}",
  "values": [
${entities.map((_, i) => `    "<Concrete factual value for Entity ${i + 1}>"`).join(',\n')}
  ],
  "entity_a": "<Concrete factual value for Entity 1>",
  "entity_b": "<Concrete factual value for Entity 2>",
  "source_type": "<official if from search snippets, otherwise ai_consensus>"
}`;

    const apiKey = process.env.GEMINI_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;

    let lastError: Error | null = null;

    // 1. Primary: Groq llama-3.3-70b-versatile for ultra-fast structured response
    if (groqKey) {
      try {
        const groqCall = fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'openai/gpt-oss-20b',
            messages: [
              { role: 'system', content: 'You are a precise JSON factual generator. Never leave fields empty or null.' },
              { role: 'user', content: prompt }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.1,
          }),
        });
        const groqRes = await withTimeout(groqCall, 10000, 'Groq custom metric timeout');
        if (groqRes.ok) {
          const groqData = await groqRes.json();
          const content = groqData.choices?.[0]?.message?.content || '{}';
          const parsed = JSON.parse(content);
          if (parsed && (Array.isArray(parsed.values) || (parsed.entity_a && parsed.entity_b))) {
            let values = Array.isArray(parsed.values) && parsed.values.length >= entities.length
              ? parsed.values.map(String)
              : [String(parsed.entity_a || ''), String(parsed.entity_b || '')];

            // Gemini cross-verification for ambiguity resolution
            if (apiKey) {
              try {
                const ai = new GoogleGenAI({ apiKey });
                const verifyCall = ai.models.generateContent({
                  model: 'gemini-3.6-flash',
                  contents: [{ role: 'user', parts: [{ text: `Cross-verify and resolve any ambiguity or hallucination for custom metric "${customMetric}" comparing entities ${entities.join(' vs ')}.\nSearch facts:\n${findingsText}\n\nPreliminary values from Groq:\n${JSON.stringify(parsed, null, 2)}\n\nIf ambiguous or inaccurate, correct with the most trustable value. Return JSON: { "metric": "${customMetric}", "values": ["val1", "val2"], "source_type": "official" | "ai_consensus" }` }] }],
                  config: { responseMimeType: 'application/json', temperature: 0.1 },
                });
                const verifyRes = await withTimeout(verifyCall, 6000, 'Gemini custom metric verify timeout');
                const vParsed = JSON.parse(verifyRes.text || '{}');
                if (vParsed && (Array.isArray(vParsed.values) || (vParsed.entity_a && vParsed.entity_b))) {
                  const vValues = Array.isArray(vParsed.values) && vParsed.values.length >= entities.length
                    ? vParsed.values.map(String)
                    : [String(vParsed.entity_a || ''), String(vParsed.entity_b || '')];
                  return NextResponse.json({
                    metric: vParsed.metric || customMetric,
                    values: vValues,
                    entity_a: vValues[0] || 'Verified attribute',
                    entity_b: vValues[1] || 'Verified attribute',
                    source_type: vParsed.source_type === 'official' ? 'official' : (vParsed.source_type === 'unverified' ? 'unverified' : 'ai_consensus'),
                  });
                }
              } catch (vErr) {
                console.warn('Gemini custom metric verification fallback to Groq:', vErr);
              }
            }

            return NextResponse.json({
              metric: parsed.metric || customMetric,
              values,
              entity_a: values[0] || 'Verified attribute',
              entity_b: values[1] || 'Verified attribute',
              source_type: parsed.source_type === 'official' ? 'official' : (parsed.source_type === 'unverified' ? 'unverified' : 'ai_consensus'),
            });
          }
        }
      } catch (e: any) {
        lastError = e;
        console.error('LLM Error (Groq custom-metric):', e?.message || e);
      }
    }

    // 2. Secondary: Google Gemini
    if (apiKey) {
      for (const modelName of ['gemini-3.6-flash']) {
        try {
          const ai = new GoogleGenAI({ apiKey });
          const geminiCall = ai.models.generateContent({
            model: modelName,
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: { responseMimeType: 'application/json', temperature: 0.1 },
          });
          const res = await withTimeout(geminiCall, 12000, `Gemini (${modelName}) custom metric timeout`);
          const parsed = JSON.parse(res.text || '{}');
          if (parsed && (Array.isArray(parsed.values) || (parsed.entity_a && parsed.entity_b))) {
            const values = Array.isArray(parsed.values) && parsed.values.length >= entities.length
              ? parsed.values.map(String)
              : [String(parsed.entity_a || ''), String(parsed.entity_b || '')];

            return NextResponse.json({
              metric: parsed.metric || customMetric,
              values,
              entity_a: values[0] || 'Verified attribute',
              entity_b: values[1] || 'Verified attribute',
              source_type: parsed.source_type === 'official' ? 'official' : (parsed.source_type === 'unverified' ? 'unverified' : 'ai_consensus'),
            });
          }
        } catch (e: any) {
          lastError = e;
          console.error(`LLM Error (Gemini ${modelName} custom-metric):`, e?.message || e);
        }
      }
    }

    // 3. Return clean structural error rather than generic placeholder template strings
    console.error('LLM Error (All inference engines failed):', lastError?.message || 'LLM execution or JSON parsing failure');
    return NextResponse.json(
      { error: 'Unable to generate custom metric at this time. Please retry.' },
      { status: 502 }
    );
  } catch (err: any) {
    console.error('LLM Error (Unhandled custom metric error):', err?.message || err);
    return NextResponse.json(
      { error: 'Unable to generate custom metric at this time. Please retry.' },
      { status: 500 }
    );
  }
}
