/**
 * Cron endpoint for refreshing GitHub stats for all approved alternatives.
 * Triggered via external cron services like Vercel Cron.
 *
 * POST /api/cron/github-stats
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAlternativesForStatsRefresh, updateAlternativeGitHubStats } from '@/lib/db';
import { fetchGitHubStats } from '@/lib/github';

const RATE_LIMIT_DELAY_MS = 1100; // Delay between GitHub API calls to avoid rate limiting

interface RefreshResult {
  success: boolean;
  total: number;
  updated: number;
  failed: number;
  errors: string[];
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Verify cron secret if provided (optional security measure)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get all approved alternatives with GitHub URLs
    const alternatives = getAlternativesForStatsRefresh();

    if (alternatives.length === 0) {
      return NextResponse.json({
        message: 'No alternatives to refresh',
        result: { success: true, total: 0, updated: 0, failed: 0, errors: [] },
      });
    }

    const result: RefreshResult = {
      success: true,
      total: alternatives.length,
      updated: 0,
      failed: 0,
      errors: [],
    };

    // Process each alternative with rate limiting
    for (const alternative of alternatives) {
      try {
        // Add delay to avoid GitHub API rate limiting
        if (result.updated > 0 || result.failed > 0) {
          await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY_MS));
        }

        const stats = await fetchGitHubStats(alternative.githubUrl);

        if (stats) {
          updateAlternativeGitHubStats(
            alternative.id,
            stats.stars,
            stats.downloads
          );
          result.updated++;
        } else {
          result.failed++;
          result.errors.push(`Failed to fetch stats for: ${alternative.name}`);
        }
      } catch (error) {
        result.failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push(`Error processing ${alternative.name}: ${errorMessage}`);
      }
    }

    // Determine overall success based on results
    result.success = result.failed === 0;

    return NextResponse.json({
      message: result.success
        ? 'GitHub stats refreshed successfully'
        : 'GitHub stats refresh completed with some errors',
      result,
    });
  } catch (error) {
    console.error('GitHub stats refresh error:', error);

    return NextResponse.json(
      {
        error: 'Failed to refresh GitHub stats',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET handler for manual testing (disabled in production)
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    message: 'Use POST to trigger GitHub stats refresh',
    endpoint: '/api/cron/github-stats',
    method: 'POST',
  });
}
