import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sourceId = searchParams.get('sourceId');
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    let query = `
      SELECT ch.*, cs.name as source_name, cs.type as source_type
      FROM crawl_history ch
      JOIN crawler_sources cs ON ch.source_id = cs.id
    `;
    const params: any[] = [];

    if (sourceId) {
      query += ' WHERE ch.source_id = ?';
      params.push(sourceId);
    }

    query += ' ORDER BY ch.started_at DESC LIMIT ?';
    params.push(limit);

    const rows = db.prepare(query).all(...params);

    return NextResponse.json({
      history: rows.map((h: any) => ({
        id: h.id,
        sourceId: h.source_id,
        sourceName: h.source_name,
        sourceType: h.source_type,
        status: h.status,
        itemsFound: h.items_found,
        itemsAdded: h.items_added,
        errors: h.errors,
        startedAt: h.started_at,
        completedAt: h.completed_at,
      })),
    });
  } catch (error) {
    console.error('Failed to fetch crawl history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch crawl history' },
      { status: 500 }
    );
  }
}
