import { NextRequest, NextResponse } from 'next/server';
import { runCrawler } from '@/lib/crawler';

export async function POST(request: NextRequest) {
  try {
    const result = await runCrawler();

    return NextResponse.json({
      success: true,
      itemsFound: result.totalItemsFound,
      itemsAdded: result.totalItemsAdded,
      errors: result.results.flatMap((r) => r.errors),
      message: `Crawl completed. Found ${result.totalItemsFound} items, added ${result.totalItemsAdded} new.`,
    });
  } catch (error) {
    console.error('Crawl error:', error);
    return NextResponse.json(
      { error: 'Failed to run crawl', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
