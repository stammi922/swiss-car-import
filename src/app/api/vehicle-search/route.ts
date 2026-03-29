import { NextRequest, NextResponse } from 'next/server';

const BRAVE_API = 'https://api.search.brave.com/res/v1/web/search';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const make = searchParams.get('make') || '';
  const model = searchParams.get('model') || '';
  const year = searchParams.get('year') || '';

  if (!make || !model) {
    return NextResponse.json({ results: [] });
  }

  const apiKey = process.env.BRAVE_SEARCH_API_KEY;
  if (!apiKey) {
    // Fallback: return empty results if no API key configured
    return NextResponse.json({ results: [], error: 'Search not configured' });
  }

  const query = `${make} ${model} ${year} curb weight kg CO2 g/km specifications`;

  try {
    const res = await fetch(`${BRAVE_API}?q=${encodeURIComponent(query)}&count=5`, {
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': apiKey,
      },
    });

    if (!res.ok) {
      return NextResponse.json({ results: [], error: 'Search failed' });
    }

    const data = await res.json();
    const results = (data.web?.results || []).slice(0, 5).map((r: { title: string; url: string; description: string }) => ({
      title: r.title,
      url: r.url,
      description: r.description,
    }));

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [], error: 'Search error' });
  }
}
