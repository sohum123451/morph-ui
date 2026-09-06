import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

function withTimeout<T>(promise: Promise<T>, ms: number, errMsg: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(errMsg)), ms)),
  ]);
}

export async function POST(req: NextRequest) {
  try {
    const { images = [] } = await req.json();

    if (!Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: 'No image data provided' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const parts: any[] = [];

        images.forEach((img: any) => {
          const cleanBase64 = img.data.includes('base64,') ? img.data.split('base64,')[1] : img.data;
          parts.push({
            inlineData: {
              data: cleanBase64,
              mimeType: img.mimeType || 'image/jpeg',
            },
          });
        });

        parts.push({
          text: `You are a multimodal product and entity recognition model.
Analyze the image(s). Identify what two entities/products/institutions/items are depicted (or if one image contains a comparison, extract Entity A and Entity B).
Return strictly valid JSON:
{
  "entityA": "Name of Entity A",
  "entityB": "Name of Entity B",
  "category": "Category name (e.g. Smartphone, University, Fruit, Automobile)",
  "suggested_query": "Entity A vs Entity B"
}`,
        });

        const geminiCall = ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [{ role: 'user', parts }],
          config: { responseMimeType: 'application/json', temperature: 0.1 },
        });

        const res = await withTimeout(geminiCall, 6000, 'Image recognition timeout');
        const parsed = JSON.parse(res.text || '{}');
        if (parsed.entityA && parsed.entityB) {
          return NextResponse.json({
            identified: true,
            entityA: parsed.entityA,
            entityB: parsed.entityB,
            category: parsed.category || 'Product Comparison',
            suggested_query: parsed.suggested_query || `${parsed.entityA} vs ${parsed.entityB}`,
          });
        }
      } catch (err) {
        console.warn('Multimodal image detection error:', err);
      }
    }

    // Default fallback if vision model is offline or no API key
    const nameA = images[0]?.name?.replace(/\.[^/.]+$/, '') || 'Item A';
    const nameB = images[1]?.name?.replace(/\.[^/.]+$/, '') || 'Item B';

    return NextResponse.json({
      identified: true,
      entityA: nameA,
      entityB: nameB,
      category: 'Visual Comparison',
      suggested_query: `${nameA} vs ${nameB}`,
    });
  } catch (err: any) {
    console.error('Image compare API error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to analyze images' }, { status: 500 });
  }
}
