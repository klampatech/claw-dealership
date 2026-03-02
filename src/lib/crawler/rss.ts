import Parser from 'rss-parser';

export interface RSSItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
}

export interface RSSFeedResult {
  source: string;
  items: RSSItem[];
  error?: string;
}

const parser = new Parser();

// AI-focused RSS feed sources
const RSS_FEEDS = [
  { name: 'Hacker News', url: 'https://hnrss.org/frontpage' },
  { name: 'TechCrunch', url: 'https://techcrunch.com/feed/' },
  { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml' },
  { name: 'Wired', url: 'https://www.wired.com/feed/rss' },
];

/**
 * Fetches and parses an RSS feed
 */
async function fetchFeed(feedUrl: string, feedName: string): Promise<RSSFeedResult> {
  try {
    const feed = await parser.parseURL(feedUrl);

    const items: RSSItem[] = (feed.items || []).slice(0, 20).map((item) => ({
      title: item.title || '',
      description: item.contentSnippet || item.content || '',
      link: item.link || '',
      pubDate: item.pubDate || new Date().toISOString(),
    }));

    return {
      source: feedName,
      items,
    };
  } catch (error) {
    return {
      source: feedName,
      items: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Fetches all configured RSS feeds
 */
export async function fetchAllFeeds(): Promise<RSSFeedResult[]> {
  const results = await Promise.all(
    RSS_FEEDS.map((feed) => fetchFeed(feed.url, feed.name))
  );

  return results;
}

/**
 * Filters RSS items for AI-related content
 */
export function filterAIItems(items: RSSItem[]): RSSItem[] {
  const aiKeywords = [
    'ai',
    'llm',
    'gpt',
    'claude',
    'openai',
    'anthropic',
    'machine learning',
    'local ai',
    'self-hosted',
    'open source ai',
    'alternative',
    'ollama',
    'llama',
    'mistral',
    'gemini',
    'chatbot',
  ];

  const lowerItems = items.map((item) => ({
    ...item,
    title: item.title.toLowerCase(),
    description: item.description.toLowerCase(),
  }));

  return items.filter((item, index) => {
    const text = `${lowerItems[index].title} ${lowerItems[index].description}`;
    return aiKeywords.some((keyword) => text.includes(keyword));
  });
}

export default fetchAllFeeds;
