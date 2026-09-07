import { NextRequest, NextResponse } from 'next/server';

const imageCache = new Map<string, string>();

async function fetchEntityImage(entityName: string): Promise<string | null> {
  const query = entityName.trim();
  if (!query) return null;

  if (imageCache.has(query)) {
    return imageCache.get(query) || null;
  }

  // 1. Try SerpApi if key is present
  const serpApiKey = process.env.SERPAPI_API_KEY;
  if (serpApiKey) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2200);
      const url = `https://serpapi.com/search.json?engine=google_images&q=${encodeURIComponent(query)}&num=3&api_key=${serpApiKey}`;
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        const firstImg = data.images_results?.[0]?.original || data.images_results?.[0]?.thumbnail;
        if (firstImg) {
          imageCache.set(query, firstImg);
          return firstImg;
        }
      }
    } catch {
      // Fallback
    }
  }

  // 2. Fast Wikipedia / Wikimedia API fallback (No auth needed, 2s timeout)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(query)}&prop=pageimages&format=json&pithumbsize=800&origin=*`;
    const res = await fetch(wikiUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const pages = data.query?.pages;
      if (pages) {
        const firstPageId = Object.keys(pages)[0];
        const thumb = pages[firstPageId]?.thumbnail?.source;
        if (thumb) {
          imageCache.set(query, thumb);
          return thumb;
        }
      }
    }
  } catch {
    // Graceful silent fallback
  }

  return null;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const entitiesParam = searchParams.get('entities');
    if (!entitiesParam) {
      return NextResponse.json({ images: {} });
    }

    const entities = entitiesParam.split(',').map((e) => e.trim()).filter(Boolean);
    const results: Record<string, string> = {};

    await Promise.all(
      entities.map(async (name) => {
        const img = await fetchEntityImage(name);
        if (img) {
          results[name] = img;
        }
      })
    );

    return NextResponse.json({ images: results });
  } catch {
    return NextResponse.json({ images: {} }, { status: 200 });
  }
}
