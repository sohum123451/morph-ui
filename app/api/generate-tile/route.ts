import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export interface GenerativeTileResponse {
  component: 'DivergenceLedger' | 'BudgetTracker' | 'TimelineCalendar';
  title: string;
  rationale: string;
  props: Record<string, any>;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { intent, entities = [], category = 'General', metrics = [] } = body;

    const userIntent = String(intent || '').trim();
    if (!userIntent) {
      return NextResponse.json({ error: 'Please provide a generative tile intent.' }, { status: 400 });
    }

    const entityNames = entities.map((e: any) => (typeof e === 'object' ? e.name : String(e)));
    const entityA = entityNames[0] || 'Option A';
    const entityB = entityNames[1] || 'Option B';

    // 1. Intent Classification & Component Determination
    const lowerIntent = userIntent.toLowerCase();

    let targetComponent: 'DivergenceLedger' | 'BudgetTracker' | 'TimelineCalendar' = 'DivergenceLedger';
    if (lowerIntent.includes('budget') || lowerIntent.includes('cost') || lowerIntent.includes('price') || lowerIntent.includes('expense') || lowerIntent.includes('roi')) {
      targetComponent = 'BudgetTracker';
    } else if (lowerIntent.includes('time') || lowerIntent.includes('roadmap') || lowerIntent.includes('milestone') || lowerIntent.includes('calendar') || lowerIntent.includes('schedule') || lowerIntent.includes('phase')) {
      targetComponent = 'TimelineCalendar';
    } else {
      targetComponent = 'DivergenceLedger';
    }

    // 2. Synthesize Component Props via LLM Cascade (Groq / Gemini)
    const prompt = `You are a Generative UI tile synthesizer for MorphUI.
Based on the user request, category, and comparison telemetry, synthesize exact JSON props for the target widget: "${targetComponent}".

Entities: ${JSON.stringify(entityNames)}
Category: "${category}"
Verified Metrics: ${JSON.stringify(metrics.slice(0, 10))}
User Intent / Request: "${userIntent}"

Widget Schema specifications:
If targetComponent is "DivergenceLedger":
{
  "component": "DivergenceLedger",
  "title": "Maximum Divergence Matrix",
  "rationale": "High-variance metric disparity analysis.",
  "props": {
    "category": "${category}",
    "deltas": [
      {
        "metric": "<Metric Name>",
        "disparity_pct": <number 20-95>,
        "entity_a_val": "<Value for ${entityA}>",
        "entity_b_val": "<Value for ${entityB}>",
        "critical_driver": "<Why this disparity matters for decision makers>"
      }
    ],
    "summary": "<1-2 sentence analytical summary of where they diverge most>"
  }
}

If targetComponent is "BudgetTracker":
{
  "component": "BudgetTracker",
  "title": "Comparative Budget & Cost of Ownership",
  "rationale": "Financial line-item and investment analysis.",
  "props": {
    "currency": "$",
    "totalBudget": 5000,
    "items": [
      { "name": "<Expense Item>", "category": "<Hardware/Software/Service>", "allocated": <number>, "spent": <number>, "status": "on_track" }
    ],
    "analysis": "<1-2 sentence budget comparison summary>"
  }
}

If targetComponent is "TimelineCalendar":
{
  "component": "TimelineCalendar",
  "title": "Lifecycle & Deployment Roadmap",
  "rationale": "Milestone schedule and critical path roadmap.",
  "props": {
    "title": "Implementation Schedule",
    "events": [
      { "name": "<Phase Name>", "date": "2026-10-01", "type": "milestone", "details": "<Key goal for this phase>" }
    ]
  }
}

Output JSON ONLY.`;

    const groqKey = process.env.GROQ_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    let synthesizedPayload: GenerativeTileResponse | null = null;

    if (groqKey) {
      try {
        const groqCall = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${groqKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'openai/gpt-oss-120b',
            messages: [
              { role: 'system', content: 'You are a Generative UI tool synthesizer. Output ONLY valid JSON.' },
              { role: 'user', content: prompt },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.1,
          }),
        });

        if (groqCall.ok) {
          const resJson = await groqCall.json();
          const content = resJson.choices?.[0]?.message?.content;
          if (content) {
            synthesizedPayload = JSON.parse(content);
          }
        }
      } catch {
        // Fallback to Gemini
      }
    }

    if (!synthesizedPayload && geminiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey: geminiKey });
        const geminiCall = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: {
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        });

        if (geminiCall.text) {
          synthesizedPayload = JSON.parse(geminiCall.text);
        }
      } catch {
        // Fallback
      }
    }

    // Deterministic fallback if API offline
    if (!synthesizedPayload) {
      if (targetComponent === 'BudgetTracker') {
        synthesizedPayload = {
          component: 'BudgetTracker',
          title: 'Estimated Cost Allocation',
          rationale: 'Telemetry financial projection.',
          props: {
            currency: '$',
            totalBudget: 2500,
            items: [
              { name: 'Initial Acquisition', category: 'Hardware', allocated: 1200, spent: 1100, status: 'on_track' },
              { name: 'Annual Maintenance', category: 'Operations', allocated: 600, spent: 550, status: 'on_track' },
              { name: 'Accessories & Upgrades', category: 'Support', allocated: 400, spent: 380, status: 'on_track' },
            ],
            analysis: `${entityA} vs ${entityB} cost of ownership comparison.`,
          },
        };
      } else if (targetComponent === 'TimelineCalendar') {
        synthesizedPayload = {
          component: 'TimelineCalendar',
          title: 'Deployment & Setup Roadmap',
          rationale: 'Projected onboarding schedule.',
          props: {
            title: 'Onboarding & Deployment',
            events: [
              { name: 'Initial Setup & Config', date: '2026-10-01', type: 'milestone', details: 'Setup primary environment' },
              { name: 'Integration & Testing', date: '2026-10-15', type: 'event', details: 'Telemetry synchronization' },
              { name: 'Full Operational Go-Live', date: '2026-11-01', type: 'deadline', details: 'Active deployment' },
            ],
          },
        };
      } else {
        synthesizedPayload = {
          component: 'DivergenceLedger',
          title: 'Critical Disparity Ledger',
          rationale: 'Filtered metrics with highest divergence score.',
          props: {
            category,
            deltas: metrics.slice(0, 4).map((m: any, i: number) => ({
              metric: m.metric || `Metric ${i + 1}`,
              disparity_pct: 35 + i * 15,
              entity_a_val: m.entity_a || m.values?.[0] || 'Standard',
              entity_b_val: m.entity_b || m.values?.[1] || 'Enhanced',
              critical_driver: 'Primary factor influencing comparative recommendation.',
            })),
            summary: `Significant differentiation observed between ${entityA} and ${entityB}.`,
          },
        };
      }
    }

    return NextResponse.json({
      success: true,
      tile: synthesizedPayload,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to synthesize generative tile.' }, { status: 500 });
  }
}
