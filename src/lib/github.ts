/**
 * GitHub API client for fetching repository statistics.
 * Provides functions to fetch stars and downloads from GitHub.
 */

const GITHUB_API_BASE = 'https://api.github.com';
const RATE_LIMIT_DELAY = 1000; // 1 second between requests to avoid rate limiting

interface GitHubRepoResponse {
  stargazers_count: number;
  name: string;
  owner: {
    login: string;
  };
}

interface GitHubReleaseAsset {
  name: string;
  download_count: number;
}

interface GitHubReleaseResponse {
  assets: GitHubReleaseAsset[];
}

/**
 * Parse a GitHub URL to extract owner and repository name.
 * Supports various GitHub URL formats:
 * - https://github.com/owner/repo
 * - https://github.com/owner/repo/
 * - https://github.com/owner/repo/releases
 * - git@github.com:owner/repo.git
 */
export function parseGitHubUrl(githubUrl: string): { owner: string; repo: string } | null {
  // HTTPS URL pattern
  const httpsMatch = githubUrl.match(/github\.com\/([^\/]+)\/([^\/\s]+)/);
  if (httpsMatch) {
    // Remove .git suffix if present
    const repo = httpsMatch[2].replace(/\.git$/, '');
    return { owner: httpsMatch[1], repo };
  }

  // SSH URL pattern
  const sshMatch = githubUrl.match(/git@github\.com:([^\/]+)\/([^\/\s]+)\.git/);
  if (sshMatch) {
    return { owner: sshMatch[1], repo: sshMatch[2] };
  }

  return null;
}

/**
 * Fetch repository stars from GitHub API.
 * Uses unauthenticated requests which have a rate limit of 60/hour.
 */
async function fetchRepoStars(owner: string, repo: string): Promise<number> {
  const response = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}`, {
    headers: {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'Claw-Dealership/1.0',
    },
    next: { revalidate: 3600 }, // Cache for 1 hour
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Repository not found');
    }
    if (response.status === 403) {
      throw new Error('Rate limited by GitHub API');
    }
    throw new Error(`GitHub API error: ${response.status}`);
  }

  const data: GitHubRepoResponse = await response.json();
  return data.stargazers_count;
}

/**
 * Fetch total downloads from all releases of a repository.
 * Sums up download counts from all release assets.
 */
async function fetchRepoDownloads(owner: string, repo: string): Promise<number> {
  const response = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/releases`, {
    headers: {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'Claw-Dealership/1.0',
    },
    next: { revalidate: 3600 }, // Cache for 1 hour
  });

  if (!response.ok) {
    if (response.status === 404) {
      // No releases is fine - just return 0
      return 0;
    }
    if (response.status === 403) {
      throw new Error('Rate limited by GitHub API');
    }
    throw new Error(`GitHub API error: ${response.status}`);
  }

  const releases: GitHubReleaseResponse[] = await response.json();

  let totalDownloads = 0;
  for (const release of releases) {
    for (const asset of release.assets) {
      totalDownloads += asset.download_count;
    }
  }

  return totalDownloads;
}

/**
 * Fetch GitHub statistics for a repository.
 * Returns stars and downloads count.
 *
 * @param githubUrl - The GitHub repository URL
 * @returns Object with stars and downloads, or null if URL is invalid
 */
export async function fetchGitHubStats(
  githubUrl: string
): Promise<{ stars: number; downloads: number } | null> {
  const parsed = parseGitHubUrl(githubUrl);
  if (!parsed) {
    console.error('Invalid GitHub URL:', githubUrl);
    return null;
  }

  const { owner, repo } = parsed;

  try {
    // Fetch stars and downloads in parallel
    const [stars, downloads] = await Promise.all([
      fetchRepoStars(owner, repo).catch((err) => {
        console.error(`Failed to fetch stars for ${owner}/${repo}:`, err);
        return 0;
      }),
      fetchRepoDownloads(owner, repo).catch((err) => {
        console.error(`Failed to fetch downloads for ${owner}/${repo}:`, err);
        return 0;
      }),
    ]);

    return { stars, downloads };
  } catch (error) {
    console.error('Failed to fetch GitHub stats:', error);
    return null;
  }
}

/**
 * Fetch GitHub stats with rate limiting protection.
 * Adds a delay between requests to avoid hitting rate limits.
 */
export async function fetchGitHubStatsWithRateLimit(
  githubUrl: string,
  delayMs: number = RATE_LIMIT_DELAY
): Promise<{ stars: number; downloads: number } | null> {
  // Add small delay to be respectful to GitHub API
  await new Promise((resolve) => setTimeout(resolve, delayMs));
  return fetchGitHubStats(githubUrl);
}
