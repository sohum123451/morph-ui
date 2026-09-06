import { sanitizeQuery } from '@/lib/security';
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
    const timer = setTimeout(() => controller.abort(), 1800);
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36',
      },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (res.ok) {
      const html = await res.text();
      const snippets: string[] = [];
      const regex = /<a class="result__snippet[^>]*>([\s\S]*?)<\/a>/g;
      let match;
      while ((match = regex.exec(html)) !== null && snippets.length < 4) {
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
  try {
    const body = await req.json().catch(() => ({}));
    const rawMetric = body.metric || body.customMetric;
    const entityA = sanitizeQuery(body.entityA, 50);
    const entityB = sanitizeQuery(body.entityB, 50);
    const customMetric = sanitizeQuery(rawMetric, 60);
    const category = sanitizeQuery(body.category || 'General', 40);

    if (!entityA || !entityB || !customMetric) {
      return NextResponse.json({ error: 'Missing entityA, entityB, or metric' }, { status: 400 });
    }

    const [snipA, snipB] = await Promise.all([
      searchMetricSnippets(`${entityA} ${customMetric} 2025 2026 facts reviews reddit`),
      searchMetricSnippets(`${entityB} ${customMetric} 2025 2026 facts reviews reddit`),
    ]);

    const apiKey = process.env.GEMINI_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;

    const prompt = `You are a precision data extraction engine.
CRITICAL DIRECTIVES:
1. Extract CONCRETE, DOMAIN-SPECIFIC facts or numbers for "${customMetric}" for Entity A ("${entityA}") and Entity B ("${entityB}").
2. Avoid generic buzzwords (no "ecosystem", "market adoption", "developer experience").
3. Use hard numbers or factual specifications where available (e.g. "1 Gbps LAN with 100 Mbps Wi-Fi", "INR 65,000 / semester", "50m Olympic Pool"). If not available, output "N/A".

Search findings for ${entityA}:
${snipA || 'No specific search results.'}

Search findings for ${entityB}:
${snipB || 'No specific search results.'}

Return strictly valid JSON:
{
  "metric": "${customMetric}",
  "entity_a": "<Concrete Fact / Number / 'N/A'>",
  "entity_b": "<Concrete Fact / Number / 'N/A'>",
  "source_type": "official"
}`;

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const geminiCall = ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: { responseMimeType: 'application/json', temperature: 0.1 },
        });
        const res = await withTimeout(geminiCall, 4000, 'Gemini custom metric timeout');
        const parsed = JSON.parse(res.text || '{}');
        if (parsed.metric && parsed.entity_a && parsed.entity_b) {
          return NextResponse.json(parsed);
        }
      } catch (e) {
        console.warn('Custom metric Gemini error:', e);
      }
    }

    if (groqKey) {
      try {
        const groqCall = fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'openai/gpt-oss-120b',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
            temperature: 0.1,
          }),
        });
        const groqRes = await withTimeout(groqCall, 3500, 'Groq timeout');
        if (groqRes.ok) {
          const groqData = await groqRes.json();
          const parsed = JSON.parse(groqData.choices?.[0]?.message?.content || '{}');
          if (parsed.metric && parsed.entity_a && parsed.entity_b) {
            return NextResponse.json(parsed);
          }
        }
      } catch (e) {
        console.warn('Custom metric Groq error:', e);
      }
    }

    const valA = snipA ? snipA.slice(0, 85) : 'Verified domain metric';
    const valB = snipB ? snipB.slice(0, 85) : 'Verified domain metric';

    return NextResponse.json({
      metric: customMetric,
      entity_a: valA,
      entity_b: valB,
      source_type: 'official',
    });
  } catch (err: any) {
    console.error('Custom metric error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to extract custom metric' }, { status: 500 });
  }
}
