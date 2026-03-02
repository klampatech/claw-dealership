import { NextRequest, NextResponse } from 'next/server';
import { fetchGitHubStats } from '@/lib/github';

/**
 * API route to fetch GitHub repository statistics.
 *
 * GET /api/github/stats?url=<github-url>
 *
 * Returns: { stars: number, downloads: number }
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const githubUrl = searchParams.get('url');

  if (!githubUrl) {
    return NextResponse.json(
      { error: 'Missing required parameter: url' },
      { status: 400 }
    );
  }

  try {
    const stats = await fetchGitHubStats(githubUrl);

    if (!stats) {
      return NextResponse.json(
        { error: 'Invalid GitHub URL' },
        { status: 400 }
      );
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error('GitHub stats API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch GitHub stats' },
      { status: 500 }
    );
  }
}
