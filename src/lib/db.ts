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
    language TEXT NOT NULL,
    category TEXT NOT NULL,
    security TEXT NOT NULL,
    deployment TEXT NOT NULL,
    hardware TEXT NOT NULL,
    use_cases TEXT NOT NULL,
    features TEXT NOT NULL,
    submitted_by TEXT NOT NULL,
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
}): string {
  const id = uuidv4();
  const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO alternatives (
      id, name, slug, description, full_description, github_url, language,
      category, security, deployment, hardware, use_cases, features,
      submitted_by, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
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
    deployment: JSON.parse(row.deployment),
    hardware: JSON.parse(row.hardware),
    useCases: JSON.parse(row.use_cases),
    features: JSON.parse(row.features),
  }));
}
