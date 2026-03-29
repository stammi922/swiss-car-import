import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q');
  if (!q) {
    return NextResponse.json({ results: [] });
  }

  const apiKey = process.env.BRAVE_SEARCH_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ results: [], error: 'No search API key configured' });
  }

  try {
    const res = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(q)}&count=5&country=ch`,
      {
        headers: {
          Accept: 'application/json',
          'Accept-Encoding': 'gzip',
          'X-Subscription-Token': apiKey,
        },
      }
    );

    if (!res.ok) {
      return NextResponse.json({ results: [], error: `Search API error: ${res.status}` });
    }

    const data = await res.json();
    const results = (data.web?.results || []).slice(0, 5).map(
      (r: { title: string; url: string; description: string }) => ({
        title: r.title,
        url: r.url,
        desc: r.description,
      })
    );

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [], error: 'Search failed' });
  }
}
