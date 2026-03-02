import { NextRequest, NextResponse } from 'next/server';
import { getCrawlerSources, createCrawlerSource } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const sources = getCrawlerSources(activeOnly);

    return NextResponse.json({
      sources: sources.map((s) => ({
        id: s.id,
        name: s.name,
        type: s.type,
        url: s.url,
        active: s.active,
        lastChecked: s.last_checked,
        createdAt: s.created_at,
        updatedAt: s.updated_at,
      })),
    });
  } catch (error) {
    console.error('Failed to fetch crawler sources:', error);
    return NextResponse.json(
      { error: 'Failed to fetch crawler sources', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { name, type, url, active } = body;

    if (!name || !type || !url) {
      return NextResponse.json(
        { error: 'Missing required fields: name, type, url' },
        { status: 400 }
      );
    }

    // Validate type
    if (!['rss', 'subreddit', 'api'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be one of: rss, subreddit, api' },
        { status: 400 }
      );
    }

    const id = createCrawlerSource({
      name,
      type,
      url,
      active: active !== false,
    });

    return NextResponse.json({
      id,
      message: 'Crawler source created successfully',
    });
  } catch (error) {
    console.error('Failed to create crawler source:', error);
    return NextResponse.json(
      { error: 'Failed to create crawler source', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
