import { NextRequest } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { WIDGET_REGISTRY, validateAndSanitizeWidgetProps } from '@/lib/widgets/registry';

export const dynamic = 'force-dynamic';

interface TelemetryPayload {
  entities?: string[];
  category?: string;
  contextTopic?: string;
  metrics?: Array<{ metric: string; entity_a?: string; entity_b?: string; values?: string[] }>;
  weights?: Record<string, number>;
  activeTileIds?: string[];
  userQuery?: string;
}

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();

  // Create SSE ReadableStream
  const stream = new ReadableStream({
    async start(controller) {
      function sendEvent(event: string, data: any) {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      }

      try {
        const body: TelemetryPayload = await req.json().catch(() => ({}));
        const {
          entities = ['Option A', 'Option B'],
          category = 'General Analysis',
          contextTopic = '',
          metrics = [],
          weights = {},
          activeTileIds = [],
          userQuery = '',
        } = body;

        sendEvent('status', { status: 'evaluating', timestamp: Date.now() });

        const entityA = entities[0] || 'Option A';
        const entityB = entities[1] || 'Option B';

        // Calculate maximum metric disparity from active weights
        let maxDisparity = 0;
        let maxDisparityMetric = '';
        metrics.forEach((m) => {
          const w = weights[m.metric] !== undefined ? weights[m.metric] : 100;
          if (w > 0) {
            const rawValA = m.entity_a || m.values?.[0] || '';
            const rawValB = m.entity_b || m.values?.[1] || '';
            const numA = parseFloat(String(rawValA).replace(/[^0-9.]/g, '')) || 50;
            const numB = parseFloat(String(rawValB).replace(/[^0-9.]/g, '')) || 50;
            const diffPct = Math.min(95, Math.abs(numA - numB) * 1.5 + (w * 0.2));
            if (diffPct > maxDisparity) {
              maxDisparity = diffPct;
              maxDisparityMetric = m.metric;
            }
          }
        });

        // Determine candidate tool ordering based on intent keywords
        const queryLower = (userQuery || '').toLowerCase();
        let candidateTypes = Object.keys(WIDGET_REGISTRY);

        if (queryLower) {
          const matched = candidateTypes.find((t) =>
            WIDGET_REGISTRY[t].heuristicTriggerKeywords.some((k) => queryLower.includes(k))
          );
          if (matched) {
            candidateTypes = [matched, ...candidateTypes.filter((t) => t !== matched)];
          }
        }

        const groqKey = process.env.GROQ_API_KEY;
        const geminiKey = process.env.GEMINI_API_KEY;

        let synthesizedTile: {
          action: 'spawn' | 'update' | 'evict' | 'noop';
          component: string;
          title: string;
          rationale: string;
          props: any;
          tileId?: string;
        } | null = null;

        const tools = Object.entries(WIDGET_REGISTRY).map(([id, manifest]) => ({
          type: 'function',
          function: {
            name: `spawn_${id}`,
            description: manifest.toolDescription,
            parameters: {
              type: 'object',
              properties: {
                title: { type: 'string', description: 'Clear title for the widget card' },
                rationale: { type: 'string', description: 'Analytical rationale explaining why this tile is needed given current metrics' },
                props: { type: 'object', description: `Structured props matching ${id} schema` },
              },
              required: ['title', 'rationale', 'props'],
            },
          },
        }));

        const systemPrompt = `You are the MorphUI Autonomous Generative Canvas Orchestrator.
Evaluate real-time comparison telemetry and spawn or update an analytical tile.
Category: "${category}". ${contextTopic ? `Domain/Topic Context: "${contextTopic}". ` : ''}Entities: ${JSON.stringify(entities)}.
Active Weights: ${JSON.stringify(weights)}.
Top Metrics: ${JSON.stringify(metrics.slice(0, 8))}.
User Intent / Trigger: "${userQuery || 'Autonomous Live Evaluation'}".
Output a tool call to spawn the most relevant tile.`;

        // --- TIER 1: GROQ LLM STREAM / TOOL-CALL CASCADE ---
        if (groqKey) {
          const groqModels = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'];
          for (const model of groqModels) {
            try {
              const groqController = new AbortController();
              const groqTimeout = setTimeout(() => groqController.abort(), 6000);

              const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${groqKey}`,
                  'Content-Type': 'application/json',
                },
                signal: groqController.signal,
                body: JSON.stringify({
                  model,
                  messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Evaluate telemetry for ${entityA} vs ${entityB} and spawn the optimal decision tile for intent: "${userQuery || 'Live Evaluation'}"` },
                  ],
                  tools,
                  tool_choice: 'auto',
                  temperature: 0.1,
                }),
              });

              clearTimeout(groqTimeout);

              if (groqRes.ok) {
                const groqData = await groqRes.json();
                const toolCall = groqData.choices?.[0]?.message?.tool_calls?.[0];

                if (toolCall && toolCall.function) {
                  const fnName = toolCall.function.name;
                  const widgetType = fnName.replace(/^spawn_/, '');
                  const args = JSON.parse(toolCall.function.arguments || '{}');

                  if (WIDGET_REGISTRY[widgetType]) {
                    synthesizedTile = {
                      action: 'spawn',
                      component: widgetType,
                      title: args.title || WIDGET_REGISTRY[widgetType].name,
                      rationale: args.rationale || 'Real-time telemetry disparity analysis.',
                      props: args.props || {},
                    };
                    break;
                  }
                }
              }
            } catch (err) {
              console.warn(`[GenerativeCanvas API] Groq ${model} attempt failed:`, (err as any)?.message);
            }
          }
        }

        // --- TIER 2: GEMINI 3.6 FLASH FALLBACK ---
        if (!synthesizedTile && geminiKey) {
          try {
            const ai = new GoogleGenAI({ apiKey: geminiKey });
            const prompt = `You are the MorphUI Autonomous Canvas Orchestrator.
Choose the single most analytical widget from: [DivergenceLedger, BudgetTracker, TimelineCalendar, AdmissionPredictor, ComparisonTable].
Entities: ${JSON.stringify(entities)}
Category: "${category}"
${contextTopic ? `Context Topic: "${contextTopic}"` : ''}
Metrics: ${JSON.stringify(metrics.slice(0, 6))}
Weights: ${JSON.stringify(weights)}
User Intent: "${userQuery || 'Live Telemetry'}"

Return valid JSON in this exact shape:
{
  "component": "DivergenceLedger" | "BudgetTracker" | "TimelineCalendar" | "AdmissionPredictor" | "ComparisonTable",
  "title": "Widget Title",
  "rationale": "Why this tile is valuable now",
  "props": {}
}`;

            const geminiCall = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: [{ role: 'user', parts: [{ text: prompt }] }],
              config: {
                responseMimeType: 'application/json',
                temperature: 0.1,
              },
            });

            if (geminiCall.text) {
              const parsed = JSON.parse(geminiCall.text);
              if (parsed.component && WIDGET_REGISTRY[parsed.component]) {
                synthesizedTile = {
                  action: 'spawn',
                  component: parsed.component,
                  title: parsed.title || WIDGET_REGISTRY[parsed.component].name,
                  rationale: parsed.rationale || 'Telemetry delta synthesis.',
                  props: parsed.props || {},
                };
              }
            }
          } catch (err) {
            console.warn('[GenerativeCanvas API] Tier 2 Gemini failed:', (err as any)?.message);
          }
        }

        // --- SERVER-SIDE STRICT SCHEMAS & SANITIZER GATE ---
        if (synthesizedTile) {
          const validated = validateAndSanitizeWidgetProps(synthesizedTile.component, synthesizedTile.props);
          if (validated.success) {
            synthesizedTile.props = validated.data;
            const tileId = `dyn-${synthesizedTile.component.toLowerCase()}-${Date.now()}`;

            sendEvent('tile_action', {
              action: 'spawn',
              tile: {
                id: tileId,
                component: synthesizedTile.component,
                title: synthesizedTile.title,
                rationale: synthesizedTile.rationale,
                props: synthesizedTile.props,
                priority: maxDisparity > 40 ? 'critical' : 'high',
                triggerMetric: maxDisparityMetric,
                disparityPct: Math.round(maxDisparity),
                createdAt: Date.now(),
                lastAffirmedAt: Date.now(),
              },
            });
          } else {
            console.warn('[GenerativeCanvas API] Tile dropped due to schema failure:', validated.error);
            sendEvent('tile_action', { action: 'noop', reason: validated.error });
          }
        } else {
          sendEvent('error', {
            message: 'Live inference stream failed to generate a validated telemetry tile.',
          });
        }

        sendEvent('status', { status: 'idle', timestamp: Date.now() });
      } catch (fatalErr: any) {
        sendEvent('error', { message: fatalErr?.message || 'Stream runtime error' });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
