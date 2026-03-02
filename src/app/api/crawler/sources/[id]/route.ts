import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { active } = body;

    if (active === undefined) {
      return NextResponse.json(
        { error: 'Missing required field: active' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    db.prepare('UPDATE crawler_sources SET active = ?, updated_at = ? WHERE id = ?')
      .run(active ? 1 : 0, now, id);

    return NextResponse.json({
      success: true,
      message: `Source ${active ? 'activated' : 'deactivated'} successfully`,
    });
  } catch (error) {
    console.error('Failed to update source:', error);
    return NextResponse.json(
      { error: 'Failed to update source' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Delete related crawl history first
    db.prepare('DELETE FROM crawl_history WHERE source_id = ?').run(id);

    // Delete the source
    db.prepare('DELETE FROM crawler_sources WHERE id = ?').run(id);

    return NextResponse.json({
      success: true,
      message: 'Source deleted successfully',
    });
  } catch (error) {
    console.error('Failed to delete source:', error);
    return NextResponse.json(
      { error: 'Failed to delete source' },
      { status: 500 }
    );
  }
}
