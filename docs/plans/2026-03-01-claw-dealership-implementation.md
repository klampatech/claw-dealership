# Claw Dealership Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild the Claw Dealership website - an OpenClaw alternative directory with filtering, search, GitHub auth, and submission system.

**Architecture:** Next.js 14 app with SQLite database, NextAuth.js for GitHub OAuth. Clean separation: pages in `/app`, database logic in `/lib`, components in `/components`.

**Tech Stack:** Next.js 14, Tailwind CSS, SQLite (better-sqlite3), NextAuth.js, TypeScript, Lucide React

---

## Pre-requisites

Before starting, clean up the existing codebase:
- Remove existing src files (will rebuild)
- Keep: package.json, tsconfig.json, next.config.ts, tailwind config, public folder

---

## Task 1: Initialize Project & Install Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install dependencies**

Run:
```bash
npm install better-sqlite3 next-auth lucide-react uuid
npm install -D @types/better-sqlite3 @types/uuid
```

Expected: Dependencies installed successfully

**Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install dependencies (better-sqlite3, next-auth, uuid)"
```

---

## Task 2: Create Database Schema & Types

**Files:**
- Create: `src/lib/db.ts` - SQLite database setup and initialization
- Create: `src/types/index.ts` - TypeScript interfaces

**Step 1: Write database setup**

Create `src/lib/db.ts`:

```typescript
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
    params.push(`%"${filters.use  }

  ifCase}"%`);
 (filters?.search) {
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
```

**Step 2: Write types**

Create `src/types/index.ts`:

```typescript
export interface Alternative {
  id: string;
  name: string;
  slug: string;
  description: string;
  fullDescription?: string;
  githubUrl: string;
  stars?: number;
  language: string;
  category: Category;
  security: SecurityLevel;
  deployment: Deployment[];
  hardware: Hardware[];
  useCases: UseCase[];
  features: string[];
  submittedBy: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export type Category =
  | 'popular'
  | 'security'
  | 'lightweight'
  | 'enterprise'
  | 'hardware';

export type SecurityLevel =
  | 'sandboxed'
  | 'workspace-isolation'
  | 'minimal-permissions'
  | 'standard';

export type Deployment =
  | 'local'
  | 'cloud'
  | 'docker'
  | 'serverless'
  | 'desktop'
  | 'embedded';

export type Hardware =
  | 'x86_64'
  | 'arm64'
  | 'esp32'
  | 'raspberry-pi'
  | 'risc-v'
  | 'cloud-only';

export type UseCase =
  | 'personal'
  | 'enterprise'
  | 'development'
  | 'automation'
  | 'research';

export interface User {
  id: string;
  githubId: string;
  username: string;
  avatar?: string;
  role: 'user' | 'admin';
}

export interface FilterState {
  search: string;
  category: string;
  security: string;
  deployment: string;
  hardware: string;
  useCase: string;
  sortBy: string;
}
```

**Step 3: Commit**

```bash
git add src/lib/db.ts src/types/index.ts
git commit -m "feat: add database schema and types"
```

---

## Task 3: Set Up NextAuth with GitHub OAuth

**Files:**
- Create: `src/lib/auth.ts` - NextAuth configuration
- Create: `src/app/api/auth/[...nextauth]/route.ts` - Auth API route

**Step 1: Write auth configuration**

Create `src/lib/auth.ts`:

```typescript
import { NextAuthOptions } from 'next-auth';
import GithubProvider from 'next-auth/providers/github';

export const authOptions: NextAuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.name = token.sub;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
};
```

Create `src/app/api/auth/[...nextauth]/route.ts`:

```typescript
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
```

**Step 2: Create environment example**

Create `.env.example`:

```env
GITHUB_ID=your_github_oauth_app_id
GITHUB_SECRET=your_github_oauth_app_secret
NEXTAUTH_SECRET=your_random_secret_string
NEXTAUTH_URL=http://localhost:3000
```

**Step 3: Commit**

```bash
git add src/lib/auth.ts src/app/api/auth/ .env.example
git commit -m "feat: add NextAuth GitHub OAuth configuration"
```

---

## Task 4: Create Layout and Header Components

**Files:**
- Modify: `src/app/layout.tsx` - Add auth provider wrapper
- Create: `src/components/Header.tsx` - Navigation header with auth

**Step 1: Write layout with auth**

Modify `src/app/layout.tsx`:

```typescript
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Claw Dealership - OpenClaw Alternatives Directory',
  description: 'Discover and compare open-source AI agents in the OpenClaw ecosystem',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

**Step 2: Create Providers component**

Create `src/components/Providers.tsx`:

```typescript
'use client';

import { SessionProvider } from 'next-auth/react';

export default function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
```

**Step 3: Write Header component**

Create `src/components/Header.tsx`:

```typescript
'use client';

import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Terminal, Github, LogOut } from 'lucide-react';

export default function Header() {
  const { data: session } = useSession();

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <Terminal className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">Claw Dealership</span>
          </Link>
          <nav className="hidden md:flex gap-6">
            <Link href="/" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Directory
            </Link>
            <Link href="/submit" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Submit
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {session ? (
            <div className="flex items-center gap-4">
              {session.user?.image && (
                <img
                  src={session.user.image}
                  alt={session.user.name || 'User'}
                  className="h-8 w-8 rounded-full"
                />
              )}
              <button
                onClick={() => signOut()}
                className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          ) : (
            <button
              onClick={() => signIn('github')}
              className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              <Github className="h-4 w-4" />
              Sign in
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
```

**Step 4: Commit**

```bash
git add src/app/layout.tsx src/components/Providers.tsx src/components/Header.tsx
git commit -m "feat: add layout and header components with auth"
```

---

## Task 5: Create FilterSidebar Component

**Files:**
- Create: `src/components/FilterSidebar.tsx`

**Step 1: Write FilterSidebar**

Create `src/components/FilterSidebar.tsx`:

```typescript
'use client';

import { FilterState } from '@/types';

interface FilterSidebarProps {
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  onClearFilters: () => void;
}

const categories = [
  { value: 'all', label: 'All Categories' },
  { value: 'popular', label: 'Popular' },
  { value: 'security', label: 'Security' },
  { value: 'lightweight', label: 'Lightweight' },
  { value: 'enterprise', label: 'Enterprise' },
  { value: 'hardware', label: 'Hardware' },
];

const securityLevels = [
  { value: 'all', label: 'All Security Levels' },
  { value: 'sandboxed', label: 'Sandboxed' },
  { value: 'workspace-isolation', label: 'Workspace Isolation' },
  { value: 'minimal-permissions', label: 'Minimal Permissions' },
  { value: 'standard', label: 'Standard' },
];

const deployments = [
  { value: 'all', label: 'All Deployments' },
  { value: 'local', label: 'Local' },
  { value: 'cloud', label: 'Cloud' },
  { value: 'docker', label: 'Docker' },
  { value: 'serverless', label: 'Serverless' },
  { value: 'desktop', label: 'Desktop' },
  { value: 'embedded', label: 'Embedded' },
];

const hardware = [
  { value: 'all', label: 'All Hardware' },
  { value: 'x86_64', label: 'x86_64' },
  { value: 'arm64', label: 'ARM64' },
  { value: 'esp32', label: 'ESP32' },
  { value: 'raspberry-pi', label: 'Raspberry Pi' },
  { value: 'risc-v', label: 'RISC-V' },
  { value: 'cloud-only', label: 'Cloud Only' },
];

const useCases = [
  { value: 'all', label: 'All Use Cases' },
  { value: 'personal', label: 'Personal' },
  { value: 'enterprise', label: 'Enterprise' },
  { value: 'development', label: 'Development' },
  { value: 'automation', label: 'Automation' },
  { value: 'research', label: 'Research' },
];

export default function FilterSidebar({ filters, onFilterChange, onClearFilters }: FilterSidebarProps) {
  const hasFilters =
    filters.category !== 'all' ||
    filters.security !== 'all' ||
    filters.deployment !== 'all' ||
    filters.hardware !== 'all' ||
    filters.useCase !== 'all';

  return (
    <aside className="w-full lg:w-64 shrink-0">
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Filters</h2>
          {hasFilters && (
            <button
              onClick={onClearFilters}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Clear all
            </button>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) => onFilterChange({ category: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Language
            </label>
            <select
              value={filters.language || 'all'}
              onChange={(e) => onFilterChange({ language: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Languages</option>
              <option value="Python">Python</option>
              <option value="Rust">Rust</option>
              <option value="TypeScript">TypeScript</option>
              <option value="Go">Go</option>
              <option value="C">C</option>
              <option value="Zig">Zig</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Security
            </label>
            <select
              value={filters.security}
              onChange={(e) => onFilterChange({ security: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              {securityLevels.map((sec) => (
                <option key={sec.value} value={sec.value}>
                  {sec.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deployment
            </label>
            <select
              value={filters.deployment}
              onChange={(e) => onFilterChange({ deployment: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              {deployments.map((dep) => (
                <option key={dep.value} value={dep.value}>
                  {dep.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hardware
            </label>
            <select
              value={filters.hardware}
              onChange={(e) => onFilterChange({ hardware: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              {hardware.map((hw) => (
                <option key={hw.value} value={hw.value}>
                  {hw.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Use Case
            </label>
            <select
              value={filters.useCase}
              onChange={(e) => onFilterChange({ useCase: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              {useCases.map((uc) => (
                <option key={uc.value} value={uc.value}>
                  {uc.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </aside>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/FilterSidebar.tsx
git commit -m "feat: add filter sidebar component"
```

---

## Task 6: Create AlternativeCard Component

**Files:**
- Create: `src/components/AlternativeCard.tsx`

**Step 1: Write AlternativeCard**

Create `src/components/AlternativeCard.tsx`:

```typescript
import Link from 'next/link';
import { Star, ExternalLink } from 'lucide-react';
import { Alternative } from '@/types';

interface AlternativeCardProps {
  alternative: Alternative;
}

export default function AlternativeCard({ alternative }: AlternativeCardProps) {
  return (
    <Link href={`/alternatives/${alternative.slug}`}>
      <div className="group h-full rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-blue-300 hover:shadow-md">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">
              {alternative.name}
            </h3>
            <p className="mt-1 text-sm text-gray-600 line-clamp-2">
              {alternative.description}
            </p>
          </div>
          {alternative.stars !== undefined && (
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span>{alternative.stars.toLocaleString()}</span>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
            {alternative.language}
          </span>
          {alternative.deployment.slice(0, 2).map((dep) => (
            <span
              key={dep}
              className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600"
            >
              {dep}
            </span>
          ))}
        </div>

        <div className="mt-4 flex items-center text-sm text-blue-600">
          <ExternalLink className="mr-1 h-4 w-4" />
          View on GitHub
        </div>
      </div>
    </Link>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/AlternativeCard.tsx
git commit -m "feat: add alternative card component"
```

---

## Task 7: Build Home Page

**Files:**
- Modify: `src/app/page.tsx`

**Step 1: Write home page**

Modify `src/app/page.tsx`:

```typescript
'use client';

import { useState, useMemo, useEffect } from 'react';
import Header from '@/components/Header';
import FilterSidebar from '@/components/FilterSidebar';
import AlternativeCard from '@/components/AlternativeCard';
import { getAlternatives } from '@/lib/db';
import { FilterState } from '@/types';
import { Search } from 'lucide-react';

const defaultFilters: FilterState = {
  search: '',
  category: 'all',
  security: 'all',
  deployment: 'all',
  hardware: 'all',
  useCase: 'all',
  language: 'all',
  sortBy: 'name',
};

export default function Home() {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [alternatives, setAlternatives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAlternatives() {
      setLoading(true);
      try {
        const data = await getAlternatives({
          category: filters.category !== 'all' ? filters.category : undefined,
          security: filters.security !== 'all' ? filters.security : undefined,
          deployment: filters.deployment !== 'all' ? filters.deployment : undefined,
          hardware: filters.hardware !== 'all' ? filters.hardware : undefined,
          useCase: filters.useCase !== 'all' ? filters.useCase : undefined,
          search: filters.search || undefined,
        });

        // Filter by language client-side (or add to DB query)
        let filtered = data;
        if (filters.language && filters.language !== 'all') {
          filtered = filtered.filter((alt) => alt.language === filters.language);
        }

        // Sort
        if (filters.sortBy === 'stars') {
          filtered.sort((a, b) => (b.stars || 0) - (a.stars || 0));
        } else if (filters.sortBy === 'newest') {
          filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }

        setAlternatives(filtered);
      } catch (error) {
        console.error('Failed to fetch alternatives:', error);
        setAlternatives([]);
      } finally {
        setLoading(false);
      }
    }

    fetchAlternatives();
  }, [filters]);

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleClearFilters = () => {
    setFilters(defaultFilters);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="mb-10 text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            OpenClaw Alternatives
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            Discover and compare open-source AI agents in the OpenClaw ecosystem.
            Find the perfect agent for your needs.
          </p>
        </div>

        {/* Search Bar */}
        <div className="mx-auto mb-8 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search alternatives..."
              value={filters.search}
              onChange={(e) => handleFilterChange({ search: e.target.value })}
              className="w-full rounded-lg border border-gray-200 py-3 pl-10 pr-4 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col gap-8 lg:flex-row">
          <FilterSidebar
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
          />

          <div className="flex-1">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {loading ? 'Loading...' : `Showing ${alternatives.length} alternatives`}
              </p>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange({ sortBy: e.target.value })}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="name">Sort by Name</option>
                <option value="stars">Sort by Stars</option>
                <option value="newest">Sort by Newest</option>
              </select>
            </div>

            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-48 animate-pulse rounded-xl bg-gray-200" />
                ))}
              </div>
            ) : alternatives.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {alternatives.map((alt) => (
                  <AlternativeCard key={alt.id} alternative={alt} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center">
                <p className="text-lg font-medium text-gray-900">No alternatives found</p>
                <p className="mt-1 text-gray-500">Try adjusting your filters or search query</p>
                <button
                  onClick={handleClearFilters}
                  className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="mt-16 border-t border-gray-200 bg-white py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-gray-500 sm:px-6 lg:px-8">
          <p>&copy; {new Date().getFullYear()} Claw Dealership. OpenClaw Alternatives Directory.</p>
        </div>
      </footer>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: build home page with search and filters"
```

---

## Task 8: Build Alternative Detail Page

**Files:**
- Create: `src/app/alternatives/[slug]/page.tsx`

**Step 1: Write detail page**

Create `src/app/alternatives/[slug]/page.tsx`:

```typescript
import { getAlternativeBySlug } from '@/lib/db';
import Header from '@/components/Header';
import Link from 'next/link';
import { ArrowLeft, Star, Github, ExternalLink } from 'lucide-react';
import { notFound } from 'next/navigation';

interface PageProps {
  params: { slug: string };
}

export default async function AlternativePage({ params }: PageProps) {
  const alternative = await getAlternativeBySlug(params.slug);

  if (!alternative) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="mb-6 inline-flex items-center text-sm text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to directory
        </Link>

        <div className="rounded-xl border border-gray-200 bg-white p-6 sm:p-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{alternative.name}</h1>
              <p className="mt-2 text-lg text-gray-600">{alternative.description}</p>
            </div>
            {alternative.stars !== undefined && (
              <div className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{alternative.stars.toLocaleString()}</span>
              </div>
            )}
          </div>

          {alternative.fullDescription && (
            <p className="mt-6 text-gray-700">{alternative.fullDescription}</p>
          )}

          <div className="mt-8 flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
              {alternative.language}
            </span>
            <span className="inline-flex items-center rounded-full bg-purple-50 px-3 py-1 text-sm font-medium text-purple-700">
              {alternative.category}
            </span>
            <span className="inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-sm font-medium text-green-700">
              {alternative.security}
            </span>
          </div>

          <div className="mt-8 border-t border-gray-100 pt-8">
            <h2 className="text-lg font-semibold text-gray-900">Details</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Deployment</dt>
                <dd className="mt-1 flex flex-wrap gap-2">
                  {alternative.deployment.map((dep: string) => (
                    <span
                      key={dep}
                      className="inline-flex items-center rounded bg-gray-100 px-2 py-1 text-sm text-gray-700"
                    >
                      {dep}
                    </span>
                  ))}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Hardware</dt>
                <dd className="mt-1 flex flex-wrap gap-2">
                  {alternative.hardware.map((hw: string) => (
                    <span
                      key={hw}
                      className="inline-flex items-center rounded bg-gray-100 px-2 py-1 text-sm text-gray-700"
                    >
                      {hw}
                    </span>
                  ))}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Use Cases</dt>
                <dd className="mt-1 flex flex-wrap gap-2">
                  {alternative.useCases.map((uc: string) => (
                    <span
                      key={uc}
                      className="inline-flex items-center rounded bg-gray-100 px-2 py-1 text-sm text-gray-700"
                    >
                      {uc}
                    </span>
                  ))}
                </dd>
              </div>
            </dl>
          </div>

          {alternative.features.length > 0 && (
            <div className="mt-8 border-t border-gray-100 pt-8">
              <h2 className="text-lg font-semibold text-gray-900">Features</h2>
              <ul className="mt-4 space-y-2">
                {alternative.features.map((feature: string, i: number) => (
                  <li key={i} className="flex items-center text-gray-700">
                    <span className="mr-2 text-blue-500">•</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-8 border-t border-gray-100 pt-8">
            <a
              href={alternative.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-6 py-3 font-medium text-white hover:bg-gray-800"
            >
              <Github className="h-5 w-5" />
              View on GitHub
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </main>

      <footer className="mt-16 border-t border-gray-200 bg-white py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-gray-500 sm:px-6 lg:px-8">
          <p>&copy; {new Date().getFullYear()} Claw Dealership. OpenClaw Alternatives Directory.</p>
        </div>
      </footer>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/alternatives/\[slug\]/page.tsx
git commit -m "feat: build alternative detail page"
```

---

## Task 9: Build Submit Page (Auth Protected)

**Files:**
- Create: `src/app/submit/page.tsx`

**Step 1: Write submit page**

Create `src/app/submit/page.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { ArrowLeft, Send, Github, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function SubmitPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    fullDescription: '',
    githubUrl: '',
    language: 'Python',
    category: 'popular',
    security: 'standard',
    deployment: [] as string[],
    hardware: [] as string[],
    useCases: [] as string[],
    features: '',
  });

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="mx-auto flex max-w-2xl flex-col items-center justify-center px-4 py-20 sm:px-6 lg:px-8">
          <div className="text-center">
            <Github className="mx-auto h-12 w-12 text-gray-400" />
            <h1 className="mt-6 text-2xl font-bold text-gray-900">Sign in to Submit</h1>
            <p className="mt-2 text-gray-600">
              You need to sign in with GitHub to submit an alternative.
              This helps prevent spam.
            </p>
            <button
              onClick={() => signIn('github')}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-6 py-3 font-medium text-white hover:bg-gray-800"
            >
              <Github className="h-5 w-5" />
              Sign in with GitHub
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
            <h1 className="mt-4 text-2xl font-bold text-green-900">Submission Received!</h1>
            <p className="mt-2 text-green-700">
              Thank you for submitting {formData.name}. We&apos;ll review it and add it to the directory soon.
            </p>
            <div className="mt-6 flex justify-center gap-4">
              <Link
                href="/"
                className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700"
              >
                Back to Directory
              </Link>
              <button
                onClick={() => setSubmitted(false)}
                className="rounded-lg border border-green-300 px-4 py-2 font-medium text-green-700 hover:bg-green-100"
              >
                Submit Another
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...formData,
      features: formData.features.split(',').map((f) => f.trim()).filter(Boolean),
      submittedBy: session.user?.name || 'anonymous',
    };

    try {
      const res = await fetch('/api/alternatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSubmitted(true);
      }
    } catch (error) {
      console.error('Submission failed:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCheckboxChange = (field: string, value: string) => {
    setFormData((prev) => {
      const current = prev[field as keyof typeof prev] as string[];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [field]: updated };
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="mb-6 inline-flex items-center text-sm text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to directory
        </Link>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Submit an AI Agent</h1>
            <p className="mt-2 text-gray-600">
              Add your AI agent to the directory. All submissions are reviewed before publishing.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Name *</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., MyAwesomeAgent"
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Short Description *</label>
              <input
                type="text"
                name="description"
                required
                value={formData.description}
                onChange={handleChange}
                placeholder="One-line description"
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Full Description</label>
              <textarea
                name="fullDescription"
                rows={3}
                value={formData.fullDescription}
                onChange={handleChange}
                placeholder="Detailed description..."
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">GitHub URL *</label>
              <input
                type="url"
                name="githubUrl"
                required
                value={formData.githubUrl}
                onChange={handleChange}
                placeholder="https://github.com/..."
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Language *</label>
                <select
                  name="language"
                  required
                  value={formData.language}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Python">Python</option>
                  <option value="Rust">Rust</option>
                  <option value="TypeScript">TypeScript</option>
                  <option value="Go">Go</option>
                  <option value="C">C</option>
                  <option value="Zig">Zig</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Category *</label>
                <select
                  name="category"
                  required
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="popular">Popular</option>
                  <option value="security">Security</option>
                  <option value="lightweight">Lightweight</option>
                  <option value="enterprise">Enterprise</option>
                  <option value="hardware">Hardware</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Security Level *</label>
              <select
                name="security"
                required
                value={formData.security}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="sandboxed">Sandboxed</option>
                <option value="workspace-isolation">Workspace Isolation</option>
                <option value="minimal-permissions">Minimal Permissions</option>
                <option value="standard">Standard</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Deployment Options</label>
              <div className="flex flex-wrap gap-3">
                {['local', 'cloud', 'docker', 'serverless', 'desktop', 'embedded'].map((dep) => (
                  <label key={dep} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.deployment.includes(dep)}
                      onChange={() => handleCheckboxChange('deployment', dep)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 capitalize">{dep}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Supported Hardware</label>
              <div className="flex flex-wrap gap-3">
                {['x86_64', 'arm64', 'esp32', 'raspberry-pi', 'risc-v', 'cloud-only'].map((hw) => (
                  <label key={hw} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.hardware.includes(hw)}
                      onChange={() => handleCheckboxChange('hardware', hw)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{hw}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Use Cases</label>
              <div className="flex flex-wrap gap-3">
                {['personal', 'enterprise', 'development', 'automation', 'research'].map((uc) => (
                  <label key={uc} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.useCases.includes(uc)}
                      onChange={() => handleCheckboxChange('useCases', uc)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 capitalize">{uc}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Features (comma-separated)</label>
              <input
                type="text"
                name="features"
                value={formData.features}
                onChange={handleChange}
                placeholder="Feature 1, Feature 2, Feature 3"
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-4 border-t border-gray-100 pt-6">
              <Link
                href="/"
                className="rounded-lg border border-gray-200 px-6 py-2.5 font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 font-medium text-white hover:bg-blue-700"
              >
                <Send className="h-4 w-4" /> Submit for Review
              </button>
            </div>
          </form>
        </div>
      </main>

      <footer className="mt-16 border-t border-gray-200 bg-white py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-gray-500 sm:px-6 lg:px-8">
          <p>&copy; {new Date().getFullYear()} Claw Dealership. OpenClaw Alternatives Directory.</p>
        </div>
      </footer>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/submit/page.tsx
git commit -m "feat: build submit page with auth protection"
```

---

## Task 10: Create Submit API Endpoint

**Files:**
- Create: `src/app/api/alternatives/route.ts`

**Step 1: Write API route**

Create `src/app/api/alternatives/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createAlternative } from '@/lib/db';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();

    const {
      name,
      description,
      fullDescription,
      githubUrl,
      language,
      category,
      security,
      deployment,
      hardware,
      useCases,
      features,
    } = body;

    const id = createAlternative({
      name,
      description,
      fullDescription,
      githubUrl,
      language,
      category,
      security,
      deployment: deployment || [],
      hardware: hardware || [],
      useCases: useCases || [],
      features: features || [],
      submittedBy: session.user?.name || 'anonymous',
    });

    return NextResponse.json({ id, message: 'Submission received' });
  } catch (error) {
    console.error('Submission error:', error);
    return NextResponse.json({ error: 'Failed to submit' }, { status: 500 });
  }
}
```

**Step 2: Commit**

```bash
git add src/app/api/alternatives/route.ts
git commit -m "feat: add submit API endpoint"
```

---

## Task 11: Seed Initial Data

**Files:**
- Create: `scripts/seed.ts`

**Step 1: Write seed script**

Create `scripts/seed.ts`:

```typescript
import db, { createAlternative } from '../src/lib/db';

const seedData = [
  {
    name: 'Nanobot',
    description: 'Lightweight, auditable Python-based AI agent with ~4K lines of code.',
    fullDescription: 'Nanobot is a popular open-source AI agent built in Python, known for its lightweight and auditable codebase. With approximately 4,000 lines of code, it offers transparency and ease of modification for developers who want to understand and customize their AI agent.',
    githubUrl: 'https://github.com',
    stars: 24793,
    language: 'Python',
    category: 'popular',
    security: 'workspace-isolation',
    deployment: ['local', 'docker'],
    hardware: ['x86_64', 'arm64', 'raspberry-pi'],
    useCases: ['personal', 'development', 'automation'],
    features: ['Lightweight', 'Auditable', 'Python-based', 'Customizable', 'Active community'],
  },
  {
    name: 'ZeroClaw',
    description: 'Ultra-low resource Rust-based agent running on 5MB RAM, perfect for edge devices.',
    githubUrl: 'https://github.com',
    stars: 18877,
    language: 'Rust',
    category: 'lightweight',
    security: 'workspace-isolation',
    deployment: ['local', 'embedded'],
    hardware: ['x86_64', 'arm64', 'esp32', 'raspberry-pi', 'risc-v'],
    useCases: ['personal', 'iot', 'embedded'],
    features: ['Ultra-low RAM', 'Rust-based', 'Edge computing', 'IoT optimized'],
  },
  {
    name: 'OpenAgent',
    description: 'Full-featured TypeScript agent with extensive plugin ecosystem.',
    githubUrl: 'https://github.com',
    stars: 12450,
    language: 'TypeScript',
    category: 'developer',
    security: 'sandboxed',
    deployment: ['local', 'cloud', 'docker'],
    hardware: ['x86_64', 'arm64', 'cloud-only'],
    useCases: ['development', 'automation', 'enterprise'],
    features: ['Plugin ecosystem', 'TypeScript', 'REST API', 'Webhooks'],
  },
  {
    name: 'RustClaw',
    description: 'High-performance Rust agent with minimal dependencies and maximum speed.',
    githubUrl: 'https://github.com',
    stars: 8234,
    language: 'Rust',
    category: 'lightweight',
    security: 'minimal-permissions',
    deployment: ['local', 'embedded'],
    hardware: ['x86_64', 'arm64', 'risc-v'],
    useCases: ['development', 'automation'],
    features: ['Zero dependencies', 'Blazing fast', 'Small binary'],
  },
  {
    name: 'EnterpriseClaw',
    description: 'Enterprise-grade agent with SSO, audit logs, and compliance features.',
    githubUrl: 'https://github.com',
    stars: 5678,
    language: 'Go',
    category: 'enterprise',
    security: 'sandboxed',
    deployment: ['local', 'cloud', 'docker'],
    hardware: ['x86_64', 'arm64', 'cloud-only'],
    useCases: ['enterprise', 'automation'],
    features: ['SSO', 'Audit logging', 'Compliance reports', 'Role-based access'],
  },
];

console.log('Seeding database...');

for (const data of seedData) {
  try {
    createAlternative({
      name: data.name,
      description: data.description,
      fullDescription: data.fullDescription,
      githubUrl: data.githubUrl,
      language: data.language,
      category: data.category,
      security: data.security,
      deployment: data.deployment,
      hardware: data.hardware,
      useCases: data.useCases,
      features: data.features,
      submittedBy: 'system',
    });

    // Update stars (direct SQL for this demo)
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    db.prepare('UPDATE alternatives SET stars = ? WHERE slug = ?').run(data.stars, slug);

    console.log(`Created: ${data.name}`);
  } catch (error) {
    console.error(`Failed to create ${data.name}:`, error);
  }
}

console.log('Seeding complete!');
```

**Step 2: Run seed script**

```bash
npx tsx scripts/seed.ts
```

**Step 3: Commit**

```bash
git add scripts/seed.ts
git commit -m "feat: add seed script with sample data"
```

---

## Task 12: Add GitHub Stars Fetch (Optional Enhancement)

This is an optional enhancement - fetch stars from GitHub API when submitting.

**Files:**
- Modify: `src/app/api/alternatives/route.ts`

**Step 1: Add GitHub stars fetch**

Modify the POST handler to fetch stars from GitHub:

```typescript
// Add to POST handler after parsing body
let stars = 0;
try {
  const match = githubUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (match) {
    const [, owner, repo] = match;
    const ghRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: { 'User-Agent': 'ClawDealership' },
    });
    if (ghRes.ok) {
      const ghData = await ghRes.json();
      stars = ghData.stargazers_count || 0;
    }
  }
} catch (error) {
  console.error('Failed to fetch GitHub stars:', error);
}
```

This is optional - skip if GitHub API rate limits are a concern.

---

## Task 13: Build and Test

**Step 1: Create .env file**

Create `.env.local`:

```env
GITHUB_ID=mock_github_id_for_dev
GITHUB_SECRET=mock_github_secret_for_dev
NEXTAUTH_SECRET=development_secret_not_for_production
NEXTAUTH_URL=http://localhost:3000
```

**Step 2: Run build**

```bash
npm run build
```

Expected: Build succeeds with no errors

**Step 3: Test locally**

```bash
npm run dev
```

Visit http://localhost:3000 - should see:
- Home page with sample data
- Filtering works
- Submit page prompts for auth
- Detail pages show full info

**Step 4: Commit**

```bash
git add .env.local
git commit -m "feat: complete MVP with working build"
```

---

## Summary

This plan builds a complete MVP with:

1. SQLite database with proper schema
2. NextAuth GitHub OAuth
3. Home page with search and multi-filter
4. Detail pages for each alternative
5. Submit form (auth-protected)
6. Seed data with 5 sample alternatives

**Next steps after MVP:**
- Release announcements page
- Admin moderation queue
- More alternatives data
- User dashboard
