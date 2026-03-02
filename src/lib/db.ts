import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';

const db = new Database('claw-dealership.db');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS alternatives (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    full_description TEXT,
    github_url TEXT NOT NULL,
    stars INTEGER,
    downloads INTEGER,
    github_stats_updated_at TEXT,
    language TEXT NOT NULL,
    category TEXT NOT NULL,
    security TEXT NOT NULL,
    deployment TEXT NOT NULL,
    hardware TEXT NOT NULL,
    use_cases TEXT NOT NULL,
    features TEXT NOT NULL,
    submitted_by TEXT NOT NULL,
    source TEXT,
    status TEXT DEFAULT 'pending',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    github_id TEXT UNIQUE NOT NULL,
    username TEXT NOT NULL,
    avatar TEXT,
    role TEXT DEFAULT 'user',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS crawler_sources (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    url TEXT NOT NULL,
    active INTEGER DEFAULT 1,
    last_checked TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS crawl_history (
    id TEXT PRIMARY KEY,
    source_id TEXT NOT NULL,
    status TEXT NOT NULL,
    items_found INTEGER DEFAULT 0,
    items_added INTEGER DEFAULT 0,
    errors TEXT,
    started_at TEXT NOT NULL,
    completed_at TEXT,
    FOREIGN KEY (source_id) REFERENCES crawler_sources(id)
  );

  CREATE INDEX IF NOT EXISTS idx_crawl_history_source_id ON crawl_history(source_id);
  CREATE INDEX IF NOT EXISTS idx_alternatives_source ON alternatives(source);
`);

export default db;

// Helper functions
export function createAlternative(data: {
  name: string;
  description: string;
  fullDescription?: string;
  githubUrl: string;
  language: string;
  category: string;
  security: string;
  deployment: string[];
  hardware: string[];
  useCases: string[];
  features: string[];
  submittedBy: string;
  status?: 'pending' | 'approved' | 'rejected';
}): string {
  const id = uuidv4();
  const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const now = new Date().toISOString();
  const status = data.status || 'pending';

  const stmt = db.prepare(`
    INSERT INTO alternatives (
      id, name, slug, description, full_description, github_url, language,
      category, security, deployment, hardware, use_cases, features,
      submitted_by, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    data.name,
    slug,
    data.description,
    data.fullDescription || null,
    data.githubUrl,
    data.language,
    data.category,
    data.security,
    JSON.stringify(data.deployment),
    JSON.stringify(data.hardware),
    JSON.stringify(data.useCases),
    JSON.stringify(data.features),
    data.submittedBy,
    status,
    now,
    now
  );

  return id;
}

export function getAlternatives(filters?: {
  category?: string;
  security?: string;
  deployment?: string;
  hardware?: string;
  useCase?: string;
  search?: string;
}): any[] {
  let query = 'SELECT * FROM alternatives WHERE status = ?';
  const params: any[] = ['approved'];

  if (filters?.category && filters.category !== 'all') {
    query += ' AND category = ?';
    params.push(filters.category);
  }

  if (filters?.security && filters.security !== 'all') {
    query += ' AND security = ?';
    params.push(filters.security);
  }

  if (filters?.deployment && filters.deployment !== 'all') {
    query += ' AND deployment LIKE ?';
    params.push(`%"${filters.deployment}"%`);
  }

  if (filters?.hardware && filters.hardware !== 'all') {
    query += ' AND hardware LIKE ?';
    params.push(`%"${filters.hardware}"%`);
  }

  if (filters?.useCase && filters.useCase !== 'all') {
    query += ' AND use_cases LIKE ?';
    params.push(`%"${filters.useCase}"%`);
  }

  if (filters?.search) {
    query += ' AND (name LIKE ? OR description LIKE ?)';
    params.push(`%${filters.search}%`, `%${filters.search}%`);
  }

  query += ' ORDER BY name ASC';

  const rows = db.prepare(query).all(...params);

  return rows.map((row: any) => ({
    ...row,
    githubUrl: row.github_url,
    deployment: JSON.parse(row.deployment),
    hardware: JSON.parse(row.hardware),
    useCases: JSON.parse(row.use_cases),
    features: JSON.parse(row.features),
  }));
}

export function getAlternativeBySlug(slug: string): any | null {
  const row: any = db.prepare('SELECT * FROM alternatives WHERE slug = ?').get(slug);
  if (!row) return null;

  return {
    ...row,
    githubUrl: row.github_url,
    deployment: JSON.parse(row.deployment),
    hardware: JSON.parse(row.hardware),
    useCases: JSON.parse(row.use_cases),
    features: JSON.parse(row.features),
  };
}

export function getFeaturedAlternatives(): any[] {
  const rows = db.prepare('SELECT * FROM alternatives WHERE status = ? AND is_featured = 1 LIMIT 3').all('approved');
  return rows.map((row: any) => ({
    ...row,
    githubUrl: row.github_url,
    deployment: JSON.parse(row.deployment),
    hardware: JSON.parse(row.hardware),
    useCases: JSON.parse(row.use_cases),
    features: JSON.parse(row.features),
  }));
}

/**
 * Get all approved alternatives that have a GitHub URL.
 * Used by the GitHub stats refresh cron job.
 */
export function getAlternativesForStatsRefresh(): { id: string; githubUrl: string; name: string }[] {
  const rows = db.prepare(`
    SELECT id, github_url, name
    FROM alternatives
    WHERE status = 'approved' AND github_url IS NOT NULL AND github_url != ''
  `).all() as { id: string; github_url: string; name: string }[];

  return rows.map((row) => ({
    id: row.id,
    githubUrl: row.github_url,
    name: row.name,
  }));
}

export function updateAlternativeGitHubStats(id: string, stars: number, downloads: number): void {
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE alternatives
    SET stars = ?, downloads = ?, github_stats_updated_at = ?, updated_at = ?
    WHERE id = ?
  `).run(stars, downloads, now, now, id);
}

// Crawler source functions
export function createCrawlerSource(data: {
  name: string;
  type: 'rss' | 'subreddit' | 'api';
  url: string;
  active?: boolean;
}): string {
  const id = uuidv4();
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO crawler_sources (id, name, type, url, active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(id, data.name, data.type, data.url, data.active !== false ? 1 : 0, now, now);

  return id;
}

export function getCrawlerSources(activeOnly?: boolean): any[] {
  let query = 'SELECT * FROM crawler_sources';
  const params: any[] = [];

  if (activeOnly) {
    query += ' WHERE active = 1';
  }

  query += ' ORDER BY name ASC';

  const rows = db.prepare(query).all(...params);

  return rows.map((row: any) => ({
    ...row,
    active: row.active === 1,
  }));
}

export function updateCrawlerSourceLastChecked(id: string): void {
  const now = new Date().toISOString();
  db.prepare('UPDATE crawler_sources SET last_checked = ?, updated_at = ? WHERE id = ?').run(now, now, id);
}

export function deactivateCrawlerSource(id: string): void {
  const now = new Date().toISOString();
  db.prepare('UPDATE crawler_sources SET active = 0, updated_at = ? WHERE id = ?').run(now, id);
}

export function deleteCrawlerSource(id: string): boolean {
  // First delete associated crawl history
  db.prepare('DELETE FROM crawl_history WHERE source_id = ?').run(id);
  // Then delete the source
  const result = db.prepare('DELETE FROM crawler_sources WHERE id = ?').run(id);
  return result.changes > 0;
}

// Crawl history functions
export function createCrawlHistory(data: {
  sourceId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
}): string {
  const id = uuidv4();
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO crawl_history (id, source_id, status, started_at)
    VALUES (?, ?, ?, ?)
  `);

  stmt.run(id, data.sourceId, data.status, now);

  return id;
}

export function updateCrawlHistory(
  id: string,
  data: {
    status?: 'pending' | 'running' | 'completed' | 'failed';
    itemsFound?: number;
    itemsAdded?: number;
    errors?: string;
  }
): void {
  const now = new Date().toISOString();
  const updates: string[] = [];
  const params: any[] = [];

  if (data.status) {
    updates.push('status = ?');
    params.push(data.status);
  }

  if (data.itemsFound !== undefined) {
    updates.push('items_found = ?');
    params.push(data.itemsFound);
  }

  if (data.itemsAdded !== undefined) {
    updates.push('items_added = ?');
    params.push(data.itemsAdded);
  }

  if (data.errors !== undefined) {
    updates.push('errors = ?');
    params.push(data.errors);
  }

  if (data.status === 'completed' || data.status === 'failed') {
    updates.push('completed_at = ?');
    params.push(now);
  }

  if (updates.length === 0) return;

  params.push(id);
  db.prepare(`UPDATE crawl_history SET ${updates.join(', ')} WHERE id = ?`).run(...params);
}

export function getCrawlHistory(sourceId?: string, limit?: number): any[] {
  let query = 'SELECT * FROM crawl_history';
  const params: any[] = [];

  if (sourceId) {
    query += ' WHERE source_id = ?';
    params.push(sourceId);
  }

  query += ' ORDER BY started_at DESC';

  if (limit) {
    query += ' LIMIT ?';
    params.push(limit);
  }

  const rows = db.prepare(query).all(...params);

  return rows.map((row: any) => ({
    ...row,
    sourceId: row.source_id,
    itemsFound: row.items_found,
    itemsAdded: row.items_added,
    startedAt: row.started_at,
    completedAt: row.completed_at,
  }));
}
