import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  
  if (!q) {
    return NextResponse.json({ error: 'Missing query parameter "q"' }, { status: 400 });
  }

  try {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`YouTube request failed with status: ${response.status}`);
    }

    const html = await response.text();

    // 1. Extract videoIds from actual search result card renderers (videoRenderer, playlistVideoRenderer, etc.)
    const rendererRegex = /"[a-zA-Z0-9_]*VideoRenderer"\s*:\s*\{\s*"videoId"\s*:\s*"([a-zA-Z0-9_-]{11})"/g;
    const rendererMatches = [...html.matchAll(rendererRegex)].map((m) => m[1]);

    // 2. Extract from standard watch link URLs in the HTML
    const linkRegex = /\/watch\?v=([a-zA-Z0-9_-]{11})/g;
    const linkMatches = [...html.matchAll(linkRegex)].map((m) => m[1]);

    // 3. Extract any other raw videoIds found in JSON or text context
    const generalRegex = /"videoId"\s*:\s*"([a-zA-Z0-9_-]{11})"/g;
    const generalMatches = [...html.matchAll(generalRegex)].map((m) => m[1]);

    // 4. Combine and deduplicate while keeping priority order
    const allVideoIds = [...new Set([...rendererMatches, ...linkMatches, ...generalMatches])];

    if (allVideoIds.length > 0) {
      return NextResponse.json({
        videoId: allVideoIds[0],
        videoIds: allVideoIds,
      });
    }

    return NextResponse.json({ error: 'No videos found' }, { status: 404 });
  } catch (err: any) {
    console.error('[YTSearchAPI] Error searching YouTube:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

