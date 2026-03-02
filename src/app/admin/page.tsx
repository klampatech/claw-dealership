'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Header from '@/components/Header';
import Link from 'next/link';
import {
  Activity,
  Play,
  Plus,
  ToggleLeft,
  ToggleRight,
  Trash2,
  ExternalLink,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';

interface CrawlerStats {
  totalSources: number;
  activeSources: number;
  lastRun: string | null;
  totalItemsFound: number;
  totalItemsAdded: number;
}

interface CrawlerSource {
  id: string;
  name: string;
  type: string;
  url: string;
  active: boolean;
  lastChecked: string | null;
  totalRuns: number;
  lastCompleted: string | null;
}

interface CrawlHistoryEntry {
  id: string;
  sourceId: string;
  sourceName: string;
  sourceType: string;
  status: string;
  itemsFound: number;
  itemsAdded: number;
  startedAt: string;
  completedAt: string | null;
}

async function fetchCrawlerStatus() {
  const res = await fetch('/api/crawler/status');
  if (!res.ok) return null;
  return res.json();
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [stats, setStats] = useState<CrawlerStats | null>(null);
  const [sources, setSources] = useState<CrawlerSource[]>([]);
  const [recentHistory, setRecentHistory] = useState<CrawlHistoryEntry[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') return;
    loadData();
  }, [status]);

  async function loadData() {
    setLoading(true);
    try {
      const data = await fetchCrawlerStatus();
      if (data) {
        setStats(data.stats);
        setSources(data.sources);
        setRecentHistory(data.recentHistory);
      }
    } catch (error) {
      console.error('Failed to fetch crawler status:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRunCrawl() {
    setRunning(true);
    try {
      const res = await fetch('/api/crawler/run', { method: 'POST' });
      if (res.ok) {
        await loadData();
      }
    } catch (error) {
      console.error('Failed to run crawl:', error);
    } finally {
      setRunning(false);
    }
  }

  async function handleToggleSource(sourceId: string, currentActive: boolean) {
    try {
      const res = await fetch(`/api/crawler/sources/${sourceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentActive }),
      });
      if (res.ok) {
        setSources((prev) =>
          prev.map((s) => (s.id === sourceId ? { ...s, active: !currentActive } : s))
        );
      }
    } catch (error) {
      console.error('Failed to toggle source:', error);
    }
  }

  async function handleDeleteSource(sourceId: string) {
    if (!confirm('Are you sure you want to delete this source? This will also delete all crawl history for this source.')) {
      return;
    }
    try {
      const res = await fetch(`/api/crawler/sources/${sourceId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setSources((prev) => prev.filter((s) => s.id !== sourceId));
      }
    } catch (error) {
      console.error('Failed to delete source:', error);
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-bg-primary">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-accent-primary" />
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <Header />
        <main className="mx-auto flex max-w-2xl flex-col items-center justify-center px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center animate-fade-in">
            <AlertCircle size={48} className="mx-auto mb-4 text-text-muted" />
            <h1 className="text-2xl font-bold text-text-primary font-heading">Admin Access Required</h1>
            <p className="mt-3 text-text-secondary">
              You must be signed in to access the admin dashboard.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <Header />

      <main className="mx-auto max-w-7xl px-4 pt-24 pb-12 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-text-primary font-heading">Admin Dashboard</h1>
              <p className="mt-2 text-text-secondary">Manage crawler status and data sources</p>
            </div>
            <Link href="/admin/crawler" className="btn-secondary inline-flex items-center gap-2">
              <Activity size={18} />
              Detailed View
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-accent-primary" />
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
              <div className="rounded-xl border border-border-subtle bg-bg-surface p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text-muted">Total Sources</p>
                    <p className="mt-1 text-2xl font-bold text-text-primary">{stats?.totalSources || 0}</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent-primary/10">
                    <Activity size={24} className="text-accent-primary" />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border-subtle bg-bg-surface p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text-muted">Active Sources</p>
                    <p className="mt-1 text-2xl font-bold text-green-400">{stats?.activeSources || 0}</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10">
                    <CheckCircle size={24} className="text-green-400" />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border-subtle bg-bg-surface p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text-muted">Items Found</p>
                    <p className="mt-1 text-2xl font-bold text-text-primary">{stats?.totalItemsFound || 0}</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
                    <Plus size={24} className="text-blue-400" />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border-subtle bg-bg-surface p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text-muted">Last Run</p>
                    <p className="mt-1 text-lg font-bold text-text-primary">
                      {stats?.lastRun
                        ? new Date(stats.lastRun).toLocaleDateString()
                        : 'Never'}
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/10">
                    <Clock size={24} className="text-purple-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Run Crawl Button */}
            <div className="mb-8 flex justify-end">
              <button
                onClick={handleRunCrawl}
                disabled={running}
                className="btn-primary inline-flex items-center gap-2"
              >
                {running ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play size={18} />
                    Run Crawl Now
                  </>
                )}
              </button>
            </div>

            {/* Sources List */}
            <div className="mb-8 rounded-xl border border-border-subtle bg-bg-surface overflow-hidden">
              <div className="border-b border-border-subtle px-6 py-4">
                <h2 className="text-lg font-semibold text-text-primary">Configured Sources</h2>
              </div>

              {sources.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <p className="text-text-muted">No sources configured yet.</p>
                  <Link href="/admin/crawler" className="btn-primary mt-4 inline-flex items-center gap-2">
                    <Plus size={18} />
                    Add Source
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-border-subtle">
                  {sources.map((source) => (
                    <div
                      key={source.id}
                      className="flex items-center justify-between px-6 py-4 hover:bg-bg-elevated/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-bg-elevated border border-border">
                          <Activity size={20} className={source.active ? 'text-green-400' : 'text-text-muted'} />
                        </div>
                        <div>
                          <p className="font-medium text-text-primary">{source.name}</p>
                          <div className="flex items-center gap-2 text-sm text-text-muted">
                            <span className="capitalize">{source.type}</span>
                            <span>•</span>
                            <a
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 hover:text-accent-primary transition-colors"
                            >
                              {new URL(source.url).hostname}
                              <ExternalLink size={12} />
                            </a>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-text-secondary">{source.totalRuns} runs</p>
                          <p className="text-xs text-text-muted">
                            {source.lastCompleted
                              ? `Last: ${new Date(source.lastCompleted).toLocaleDateString()}`
                              : 'Never completed'}
                          </p>
                        </div>

                        <button
                          onClick={() => handleToggleSource(source.id, source.active)}
                          className="text-text-muted hover:text-accent-primary transition-colors"
                          title={source.active ? 'Deactivate' : 'Activate'}
                        >
                          {source.active ? (
                            <ToggleRight size={24} className="text-green-400" />
                          ) : (
                            <ToggleLeft size={24} />
                          )}
                        </button>

                        <button
                          onClick={() => handleDeleteSource(source.id)}
                          className="text-text-muted hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Crawl History */}
            <div className="rounded-xl border border-border-subtle bg-bg-surface overflow-hidden">
              <div className="border-b border-border-subtle px-6 py-4">
                <h2 className="text-lg font-semibold text-text-primary">Recent Crawl History</h2>
              </div>

              {recentHistory.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <p className="text-text-muted">No crawl history yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border-subtle bg-bg-elevated/50">
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">
                          Source
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">
                          Items Found
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">
                          Items Added
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">
                          Started
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                      {recentHistory.map((entry) => (
                        <tr key={entry.id} className="hover:bg-bg-elevated/50 transition-colors">
                          <td className="whitespace-nowrap px-6 py-4">
                            <div>
                              <p className="font-medium text-text-primary">{entry.sourceName}</p>
                              <p className="text-xs text-text-muted capitalize">{entry.sourceType}</p>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
                            {entry.status === 'completed' && (
                              <span className="inline-flex items-center gap-1 text-green-400">
                                <CheckCircle size={14} />
                                Completed
                              </span>
                            )}
                            {entry.status === 'running' && (
                              <span className="inline-flex items-center gap-1 text-blue-400">
                                <div className="h-3 w-3 animate-spin rounded-full border-2 border-blue-400/30 border-t-blue-400" />
                                Running
                              </span>
                            )}
                            {entry.status === 'failed' && (
                              <span className="inline-flex items-center gap-1 text-red-400">
                                <XCircle size={14} />
                                Failed
                              </span>
                            )}
                            {entry.status === 'pending' && (
                              <span className="inline-flex items-center gap-1 text-yellow-400">
                                <Clock size={14} />
                                Pending
                              </span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-text-secondary">
                            {entry.itemsFound}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-text-secondary">
                            {entry.itemsAdded}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-text-muted text-sm">
                            {new Date(entry.startedAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      <footer className="border-t border-border-subtle py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-text-muted sm:px-6 lg:px-8">
          <p>&copy; {new Date().getFullYear()} Claw Dealership. OpenClaw Alternatives Directory.</p>
        </div>
      </footer>
    </div>
  );
}
