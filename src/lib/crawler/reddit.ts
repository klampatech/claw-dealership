export interface RedditPost {
  title: string;
  url: string;
  subreddit: string;
  created_utc: number;
}

export interface RedditSearchResult {
  source: string;
  posts: RedditPost[];
  error?: string;
}

const SUBREDDITS = [
  'ArtificialIntelligence',
  'MachineLearning',
  'LocalLLaMA',
  'OpenSource',
  'selfhosted',
];

const SEARCH_TERMS = [
  'alternative to Claude',
  'alternative to ChatGPT',
  'open source AI',
  'LLM alternative',
  'self-hosted AI',
  'local LLM',
];

const BASE_URL = 'https://www.reddit.com';

/**
 * Fetches posts from a subreddit
 */
async function fetchSubreddit(subreddit: string): Promise<RedditSearchResult> {
  try {
    const url = `${BASE_URL}/r/${subreddit}/new.json?limit=25`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'ClawDealership/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const data = await response.json();
    const posts: RedditPost[] = (data.data?.children || []).map(
      (child: any) => ({
        title: child.data.title,
        url: `${BASE_URL}${child.data.permalink}`,
        subreddit: child.data.subreddit,
        created_utc: child.data.created_utc,
      })
    );

    return {
      source: `r/${subreddit}`,
      posts,
    };
  } catch (error) {
    return {
      source: `r/${subreddit}`,
      posts: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Searches Reddit using the search endpoint
 */
async function searchReddit(term: string): Promise<RedditSearchResult> {
  try {
    const encodedTerm = encodeURIComponent(term);
    const url = `${BASE_URL}/search.json?q=${encodedTerm}&sort=new&limit=25`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'ClawDealership/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const data = await response.json();
    const posts: RedditPost[] = (data.data?.children || []).map(
      (child: any) => ({
        title: child.data.title,
        url: `${BASE_URL}${child.data.permalink}`,
        subreddit: child.data.subreddit,
        created_utc: child.data.created_utc,
      })
    );

    return {
      source: `search:${term}`,
      posts,
    };
  } catch (error) {
    return {
      source: `search:${term}`,
      posts: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Fetches from all subreddits and searches
 */
export async function fetchAllReddit(): Promise<RedditSearchResult[]> {
  const subredditResults = await Promise.all(
    SUBREDDITS.map((sub) => fetchSubreddit(sub))
  );

  const searchResults = await Promise.all(
    SEARCH_TERMS.map((term) => searchReddit(term))
  );

  return [...subredditResults, ...searchResults];
}

/**
 * Filters Reddit posts for AI tool alternatives
 */
export function filterAlternativePosts(posts: RedditPost[]): RedditPost[] {
  const altKeywords = [
    'alternative',
    '替代',
    'instead of',
    'replacement for',
    'vs ',
    'compared to',
    'better than',
    'open source',
    'self-hosted',
    'local',
    'ollama',
    'llama',
    'mistral',
    'phi',
    'qwen',
    'deepseek',
    'command r',
    'claude alternative',
    'chatgpt alternative',
    'gpt alternative',
  ];

  const lowerPosts = posts.map((post) => ({
    ...post,
    title: post.title.toLowerCase(),
  }));

  return posts.filter((post, index) => {
    const text = lowerPosts[index].title;
    return altKeywords.some((keyword) => text.includes(keyword));
  });
}

export default fetchAllReddit;
