import { fetchFeed, filterAIItems, RSSItem } from './rss';
import { fetchSubreddit, filterAlternativePosts, RedditPost } from './reddit';
import { createAlternative, getCrawlerSources, updateCrawlerSourceLastChecked, createCrawlHistory, updateCrawlHistory } from '../db';

export interface CrawlerResult {
  source: string;
  itemsFound: number;
  itemsAdded: number;
  duplicatesSkipped: number;
  errors: string[];
}

export interface CrawlerSummary {
  totalSources: number;
  totalItemsFound: number;
  totalItemsAdded: number;
  totalDuplicatesSkipped: number;
  results: CrawlerResult[];
}

// Store seen URLs to deduplicate across sources
const seenUrls = new Set<string>();

// OpenClaw characteristics for comparison
const OPENCLAW_CHARACTERISTICS = {
  // What OpenClaw IS (positive indicators)
  isAgent: ['agent', 'autonomous', 'assistant', 'bot', 'auto', 'task execution', 'workflow automation', 'multi-channel', 'telegram', 'discord', 'slack', 'whatsapp'],
  hasTools: ['tool use', 'function call', 'api', 'integration', 'plugin', 'skill'],
  isSelfHosted: ['self-hosted', 'self host', 'local', 'docker', 'raspberry pi', 'esp32', 'embedded', 'edge'],
  isLightweight: ['lightweight', 'fast', 'minimal', 'small binary', 'low resource', 'microcontroller'],
  // What OpenClaw is NOT (negative indicators - reject these)
  isNOTAgent: ['llm model', 'language model', 'just a model', 'model only', 'weights', 'foundation model'],
  isNOTAlternative: ['gpt-4', 'gpt-4o', 'gpt-', 'claude', 'anthropic', 'chatgpt', 'gemini', 'perplexity'],
};

// Score thresholds
const MIN_AGENT_SCORE = 2; // Must have at least 2 agent characteristics
const MAX_NON_AGENT_SCORE = 1; // Max 1 negative indicator allowed

/**
 * Analyzes if a project is similar enough to OpenClaw to be an alternative
 * Returns: { isValid: boolean, reason: string, score: number }
 */
function analyzeProjectRelevance(title: string, description: string, url: string): { isValid: boolean; reason: string; score: number } {
  const text = `${title} ${description} ${url}`.toLowerCase();

  let agentScore = 0;
  let nonAgentScore = 0;
  const matchedIndicators: string[] = [];
  const rejectedReasons: string[] = [];

  // Check positive indicators (must have at least MIN_AGENT_SCORE)
  for (const indicator of OPENCLAW_CHARACTERISTICS.isAgent) {
    if (text.includes(indicator)) {
      agentScore++;
      matchedIndicators.push(indicator);
    }
  }

  for (const indicator of OPENCLAW_CHARACTERISTICS.hasTools) {
    if (text.includes(indicator)) {
      agentScore++;
      matchedIndicators.push(indicator);
    }
  }

  for (const indicator of OPENCLAW_CHARACTERISTICS.isSelfHosted) {
    if (text.includes(indicator)) {
      agentScore++;
      matchedIndicators.push(indicator);
    }
  }

  for (const indicator of OPENCLAW_CHARACTERISTICS.isLightweight) {
    if (text.includes(indicator)) {
      agentScore++;
      matchedIndicators.push(indicator);
    }
  }

  // Check negative indicators
  for (const indicator of OPENCLAW_CHARACTERISTICS.isNOTAgent) {
    if (text.includes(indicator)) {
      nonAgentScore++;
      rejectedReasons.push(`contains "${indicator}" (not an agent)`);
    }
  }

  for (const indicator of OPENCLAW_CHARACTERISTICS.isNOTAlternative) {
    if (text.includes(indicator)) {
      nonAgentScore++;
      rejectedReasons.push(`is actually ${indicator} (not an alternative)`);
    }
  }

  // Reject pure LLM models (ollama, qwen, llama, etc. without agent context)
  const pureModels = ['ollama', 'qwen', 'llama', 'mistral', 'mixtral', 'phi', 'deepseek', 'command r'];
  const hasAgentContext = agentScore >= 1;
  for (const model of pureModels) {
    if (text.includes(model) && !hasAgentContext) {
      return { isValid: false, reason: `Pure LLM model (${model}) without agent capabilities`, score: 0 };
    }
  }

  // Reject if too many negative indicators
  if (nonAgentScore > MAX_NON_AGENT_SCORE) {
    return { isValid: false, reason: `Rejected: ${rejectedReasons.join(', ')}`, score: agentScore - nonAgentScore };
  }

  // Must have minimum agent score
  if (agentScore < MIN_AGENT_SCORE) {
    return { isValid: false, reason: `Not agent-like enough (score: ${agentScore}, need ${MIN_AGENT_SCORE}+)`, score: agentScore };
  }

  return {
    isValid: true,
    reason: `Matched: ${matchedIndicators.slice(0, 3).join(', ')}`,
    score: agentScore
  };
}

/**
 * Extracts potential alternative tool names from text
 */
function extractToolNames(title: string, description: string): string[] {
  const text = `${title} ${description}`.toLowerCase();

  // Only look for actual AI AGENTS, not just models
  const knownAgents = [
    'agent', 'autonomous', 'assistant', 'bot', 'claude', 'chatgpt',
    'ollama agent', 'local agent', 'self-hosted agent',
    'cursor', 'windsurf', 'cline', 'devin', 'roo code',
  ];

  const found: string[] = [];

  for (const agent of knownAgents) {
    if (text.includes(agent)) {
      found.push(agent);
    }
  }

  return found;
}

/**
 * Checks if a URL has been seen
 */
function isNewUrl(url: string): boolean {
  const normalizedUrl = url.toLowerCase().trim();
  if (seenUrls.has(normalizedUrl)) {
    return false;
  }
  seenUrls.add(normalizedUrl);
  return true;
}

/**
 * Converts RSS item to alternative data if valid
 */
function parseRSSItemToAlternative(item: RSSItem): {
  name: string;
  description: string;
  githubUrl: string;
} | null {
  const title = item.title;
  const description = item.description;

  // First, analyze if this is relevant enough to OpenClaw
  const relevance = analyzeProjectRelevance(title, description, item.link);
  if (!relevance.isValid) {
    console.log(`  Skipping: ${relevance.reason} - "${title.slice(0, 50)}..."`);
    return null;
  }

  // Try to extract GitHub URL from the item
  const githubMatch = item.link.match(/github\.com\/([^\/]+)\/([^\/\s]+)/i);

  if (!githubMatch) {
    return null;
  }

  const toolNames = extractToolNames(title, description);

  // Use the repo name as the alternative name (more accurate)
  const repoName = githubMatch[2];

  return {
    name: repoName.charAt(0).toUpperCase() + repoName.slice(1),
    description: description.slice(0, 200),
    githubUrl: `https://github.com/${githubMatch[1]}/${githubMatch[2]}`,
  };
}

/**
 * Converts Reddit post to alternative data if valid
 */
function parseRedditPostToAlternative(
  post: RedditPost
): {
  name: string;
  description: string;
  githubUrl: string;
} | null {
  const title = post.title;

  // First, analyze if this is relevant enough to OpenClaw
  const relevance = analyzeProjectRelevance(title, '', post.url);
  if (!relevance.isValid) {
    console.log(`  Skipping: ${relevance.reason} - "${title.slice(0, 50)}..."`);
    return null;
  }

  // Try to extract GitHub URL from the title or assume a pattern
  const githubMatch = title.match(/github\.com\/([^\/\s]+)\/([^\/\s]+)/i);

  if (!githubMatch) {
    // Try to extract tool name from title
    const toolNames = extractToolNames(title, '');

    if (toolNames.length === 0) {
      return null;
    }

    // Map common names to GitHub repos (only for actual agents, not models)
    const knownAgentRepos: Record<string, string> = {
      'ollama agent': 'https://github.com/ollama/ollama',
      'cursor': 'https://github.com/getcursor/cursor',
      'windsurf': 'https://github.com/windsurf/windsurf',
      'cline': 'https://github.com/cline/cline',
      'devin': 'https://github.com/cognition-labs/devin',
    };

    const toolName = toolNames[0];
    const githubUrl = knownAgentRepos[toolName];
    if (!githubUrl) {
      return null;
    }

    return {
      name: toolName.charAt(0).toUpperCase() + toolName.slice(1),
      description: title.slice(0, 200),
      githubUrl,
    };
  }

  return {
    name: githubMatch[2],
    description: title.slice(0, 200),
    githubUrl: `https://github.com/${githubMatch[1]}/${githubMatch[2]}`,
  };
}

/**
 * Processes RSS items from a source
 */
async function processRSSSource(
  sourceId: string,
  sourceName: string,
  sourceUrl: string
): Promise<CrawlerResult> {
  const errors: string[] = [];
  let itemsFound = 0;
  let itemsAdded = 0;
  let duplicatesSkipped = 0;

  // Create crawl history entry
  const historyId = createCrawlHistory({
    sourceId,
    status: 'running',
  });

  try {
    const rssResult = await fetchFeed(sourceUrl, sourceName);

    if (rssResult.error) {
      errors.push(rssResult.error);
    } else {
      const aiItems = filterAIItems(rssResult.items);
      itemsFound = aiItems.length;

      for (const item of aiItems) {
        if (!isNewUrl(item.link)) {
          duplicatesSkipped++;
          continue;
        }

        const alternativeData = parseRSSItemToAlternative(item);
        if (alternativeData) {
          try {
            createAlternative({
              name: alternativeData.name,
              description: alternativeData.description,
              githubUrl: alternativeData.githubUrl,
              language: 'English',
              category: 'LLM',
              security: 'Open Source',
              deployment: ['Cloud', 'Self-hosted'],
              hardware: ['CPU', 'GPU'],
              useCases: ['General'],
              features: ['API'],
              submittedBy: 'crawler',
              status: 'approved',
            });
            itemsAdded++;
          } catch (error) {
            if (
              error instanceof Error &&
              error.message.includes('UNIQUE constraint')
            ) {
              duplicatesSkipped++;
            } else {
              errors.push(
                `Failed to add ${alternativeData.name}: ${
                  error instanceof Error ? error.message : 'Unknown error'
                }`
              );
            }
          }
        }
      }
    }
  } catch (error) {
    errors.push(
      `Failed to fetch RSS: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  // Update crawl history and last_checked timestamp
  updateCrawlHistory(historyId, {
    status: errors.length > 0 ? 'failed' : 'completed',
    itemsFound,
    itemsAdded,
    errors: errors.length > 0 ? errors.join('; ') : undefined,
  });
  updateCrawlerSourceLastChecked(sourceId);

  return {
    source: sourceName,
    itemsFound,
    itemsAdded,
    duplicatesSkipped,
    errors,
  };
}

/**
 * Processes subreddit items from a source
 */
async function processSubredditSource(
  sourceId: string,
  sourceName: string,
  sourceUrl: string
): Promise<CrawlerResult> {
  const errors: string[] = [];
  let itemsFound = 0;
  let itemsAdded = 0;
  let duplicatesSkipped = 0;

  // Create crawl history entry
  const historyId = createCrawlHistory({
    sourceId,
    status: 'running',
  });

  try {
    // sourceUrl contains the subreddit name (e.g., "ArtificialIntelligence")
    const redditResult = await fetchSubreddit(sourceUrl);

    if (redditResult.error) {
      errors.push(redditResult.error);
    } else {
      const altPosts = filterAlternativePosts(redditResult.posts);
      itemsFound = altPosts.length;

      for (const post of altPosts) {
        if (!isNewUrl(post.url)) {
          duplicatesSkipped++;
          continue;
        }

        const alternativeData = parseRedditPostToAlternative(post);
        if (alternativeData) {
          try {
            createAlternative({
              name: alternativeData.name,
              description: alternativeData.description,
              githubUrl: alternativeData.githubUrl,
              language: 'English',
              category: 'LLM',
              security: 'Open Source',
              deployment: ['Cloud', 'Self-hosted'],
              hardware: ['CPU', 'GPU'],
              useCases: ['General'],
              features: ['API'],
              submittedBy: 'crawler',
              status: 'approved',
            });
            itemsAdded++;
          } catch (error) {
            if (
              error instanceof Error &&
              error.message.includes('UNIQUE constraint')
            ) {
              duplicatesSkipped++;
            } else {
              errors.push(
                `Failed to add ${alternativeData.name}: ${
                  error instanceof Error ? error.message : 'Unknown error'
                }`
              );
            }
          }
        }
      }
    }
  } catch (error) {
    errors.push(
      `Failed to fetch subreddit: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  // Update crawl history and last_checked timestamp
  updateCrawlHistory(historyId, {
    status: errors.length > 0 ? 'failed' : 'completed',
    itemsFound,
    itemsAdded,
    errors: errors.length > 0 ? errors.join('; ') : undefined,
  });
  updateCrawlerSourceLastChecked(sourceId);

  return {
    source: sourceName,
    itemsFound,
    itemsAdded,
    duplicatesSkipped,
    errors,
  };
}

/**
 * Processes API source (generic HTTP endpoint)
 */
async function processAPISource(
  sourceId: string,
  sourceName: string,
  sourceUrl: string
): Promise<CrawlerResult> {
  const errors: string[] = [];
  let itemsFound = 0;
  let itemsAdded = 0;
  let duplicatesSkipped = 0;

  // Create crawl history entry
  const historyId = createCrawlHistory({
    sourceId,
    status: 'running',
  });

  try {
    const response = await fetch(sourceUrl, {
      headers: {
        'User-Agent': 'ClawDealership/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const data = await response.json();

    // Try to extract items from common API response formats
    const items = Array.isArray(data)
      ? data
      : data.items || data.results || data.data || [];

    for (const item of items) {
      // Extract URL and title/description from the item
      const url = item.url || item.link || item.html_url || '';
      const title = item.title || item.name || '';
      const description = item.description || item.body || item.content || '';

      if (!url || !title) continue;

      if (!isNewUrl(url)) {
        duplicatesSkipped++;
        continue;
      }

      const relevance = analyzeProjectRelevance(title, description, url);
      if (!relevance.isValid) {
        continue;
      }

      // Try to extract GitHub URL
      const githubMatch = url.match(/github\.com\/([^\/]+)\/([^\/\s]+)/i);
      if (!githubMatch) continue;

      const repoName = githubMatch[2];

      try {
        createAlternative({
          name: repoName.charAt(0).toUpperCase() + repoName.slice(1),
          description: description.slice(0, 200),
          githubUrl: `https://github.com/${githubMatch[1]}/${githubMatch[2]}`,
          language: 'English',
          category: 'LLM',
          security: 'Open Source',
          deployment: ['Cloud', 'Self-hosted'],
          hardware: ['CPU', 'GPU'],
          useCases: ['General'],
          features: ['API'],
          submittedBy: 'crawler',
          status: 'approved',
        });
        itemsAdded++;
        itemsFound++;
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes('UNIQUE constraint')
        ) {
          duplicatesSkipped++;
        } else {
          errors.push(
            `Failed to add ${repoName}: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`
          );
        }
      }
    }
  } catch (error) {
    errors.push(
      `Failed to fetch API: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  // Update crawl history and last_checked timestamp
  updateCrawlHistory(historyId, {
    status: errors.length > 0 ? 'failed' : 'completed',
    itemsFound,
    itemsAdded,
    errors: errors.length > 0 ? errors.join('; ') : undefined,
  });
  updateCrawlerSourceLastChecked(sourceId);

  return {
    source: sourceName,
    itemsFound,
    itemsAdded,
    duplicatesSkipped,
    errors,
  };
}

/**
 * Runs the full crawler and adds new alternatives to the database
 */
export async function runCrawler(): Promise<CrawlerSummary> {
  console.log('Starting crawler...');

  const results: CrawlerResult[] = [];
  let totalItemsFound = 0;
  let totalItemsAdded = 0;
  let totalDuplicatesSkipped = 0;

  // Get active sources from database
  console.log('Fetching sources from database...');
  const sources = getCrawlerSources(true);

  if (sources.length === 0) {
    console.log('No active sources configured. Please add sources in /admin/crawler');
    return {
      totalSources: 0,
      totalItemsFound: 0,
      totalItemsAdded: 0,
      totalDuplicatesSkipped: 0,
      results: [],
    };
  }

  console.log(`Found ${sources.length} active sources in database`);

  // Process each source based on its type
  for (const source of sources) {
    console.log(`Processing source: ${source.name} (${source.type})`);

    let result: CrawlerResult;

    if (source.type === 'rss') {
      result = await processRSSSource(source.id, source.name, source.url);
    } else if (source.type === 'subreddit') {
      result = await processSubredditSource(source.id, source.name, source.url);
    } else if (source.type === 'api') {
      result = await processAPISource(source.id, source.name, source.url);
    } else {
      result = {
        source: source.name,
        itemsFound: 0,
        itemsAdded: 0,
        duplicatesSkipped: 0,
        errors: [`Unknown source type: ${source.type}`],
      };
    }

    results.push(result);
    totalItemsFound += result.itemsFound;
    totalItemsAdded += result.itemsAdded;
    totalDuplicatesSkipped += result.duplicatesSkipped;

    console.log(
      `  Found: ${result.itemsFound}, Added: ${result.itemsAdded}, Duplicates: ${result.duplicatesSkipped}`
    );
  }

  console.log('Crawler complete.');

  return {
    totalSources: results.length,
    totalItemsFound,
    totalItemsAdded,
    totalDuplicatesSkipped,
    results,
  };
}

// Alias for backwards compatibility
export const runCrawl = runCrawler;

export default runCrawler;
