import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    // Get all sources
    const sources = db.prepare(`
      SELECT cs.*,
        (SELECT COUNT(*) FROM crawl_history ch WHERE ch.source_id = cs.id) as total_runs,
        (SELECT MAX(ch.started_at) FROM crawl_history ch WHERE ch.source_id = cs.id AND ch.status = 'completed') as last_completed
      FROM crawler_sources cs
      ORDER BY cs.name ASC
    `).all();

    // Get recent crawl history (last 10 runs)
    const recentHistory = db.prepare(`
      SELECT ch.*, cs.name as source_name, cs.type as source_type
      FROM crawl_history ch
      JOIN crawler_sources cs ON ch.source_id = cs.id
      ORDER BY ch.started_at DESC
      LIMIT 10
    `).all();

    // Get aggregate stats
    const stats = db.prepare(`
      SELECT
        COUNT(DISTINCT cs.id) as total_sources,
        SUM(CASE WHEN cs.active = 1 THEN 1 ELSE 0 END) as active_sources,
        (SELECT MAX(started_at) FROM crawl_history WHERE status = 'completed') as last_run,
        (SELECT SUM(items_found) FROM crawl_history) as total_items_found,
        (SELECT SUM(items_added) FROM crawl_history) as total_items_added
      FROM crawler_sources cs
    `).get() as {
      total_sources: number;
      active_sources: number;
      last_run: string | null;
      total_items_found: number | null;
      total_items_added: number | null;
    } | undefined;

    return NextResponse.json({
      sources: sources.map((s: any) => ({
        ...s,
        active: s.active === 1,
        lastCompleted: s.last_completed,
        totalRuns: s.total_runs,
      })),
      recentHistory: recentHistory.map((h: any) => ({
        ...h,
        sourceId: h.source_id,
        itemsFound: h.items_found,
        itemsAdded: h.items_added,
        startedAt: h.started_at,
        completedAt: h.completed_at,
      })),
      stats: {
        totalSources: stats?.total_sources ?? 0,
        activeSources: stats?.active_sources ?? 0,
        lastRun: stats?.last_run ?? null,
        totalItemsFound: stats?.total_items_found ?? 0,
        totalItemsAdded: stats?.total_items_added ?? 0,
      },
    });
  } catch (error) {
    console.error('Failed to fetch crawler status:', error);
    return NextResponse.json({ error: 'Failed to fetch crawler status' }, { status: 500 });
  }
}
