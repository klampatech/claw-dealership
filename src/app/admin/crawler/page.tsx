'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Header from '@/components/Header';
import Link from 'next/link';
import {
  ArrowLeft,
  Activity,
  Play,
  Plus,
  Trash2,
  ExternalLink,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

interface CrawlerSource {
  id: string;
  name: string;
  type: string;
  url: string;
  active: boolean;
  lastChecked: string | null;
  createdAt: string;
}

interface CrawlHistoryEntry {
  id: string;
  sourceId: string;
  sourceName: string;
  sourceType: string;
  status: string;
  itemsFound: number;
  itemsAdded: number;
  errors: string | null;
  startedAt: string;
  completedAt: string | null;
}

async function fetchSources() {
  const res = await fetch('/api/crawler/sources');
  if (!res.ok) return null;
  return res.json();
}

async function fetchHistory(sourceId?: string, limit = 50) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (sourceId) params.set('sourceId', sourceId);
  const res = await fetch(`/api/crawler/history?${params.toString()}`);
  if (!res.ok) return null;
  return res.json();
}

export default function CrawlerAdminPage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [sources, setSources] = useState<CrawlerSource[]>([]);
  const [history, setHistory] = useState<CrawlHistoryEntry[]>([]);
  const [running, setRunning] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterSourceId, setFilterSourceId] = useState<string>('');
  const [newSource, setNewSource] = useState({
    name: '',
    type: 'rss',
    url: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') return;
    loadData();
  }, [status]);

  useEffect(() => {
    loadHistory();
  }, [filterSourceId]);

  async function loadData() {
    setLoading(true);
    try {
      const [sourcesData, historyData] = await Promise.all([
        fetchSources(),
        fetchHistory(),
      ]);
      if (sourcesData) {
        setSources(sourcesData.sources);
      }
      if (historyData) {
        setHistory(historyData.history);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadHistory() {
    try {
      const data = await fetchHistory(filterSourceId || undefined);
      if (data) {
        setHistory(data.history);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
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

  async function handleAddSource(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch('/api/crawler/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSource),
      });
      if (res.ok) {
        setShowAddForm(false);
        setNewSource({ name: '', type: 'rss', url: '' });
        await loadData();
      }
    } catch (error) {
      console.error('Failed to add source:', error);
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
        await loadData();
      }
    } catch (error) {
      console.error('Failed to delete source:', error);
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
              You must be signed in to access the crawler management.
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
        {/* Back Link */}
        <Link
          href="/admin"
          className="mb-6 inline-flex items-center text-sm text-text-secondary hover:text-accent-primary transition-colors"
        >
          <ArrowLeft size={18} className="mr-2" />
          Back to Admin Dashboard
        </Link>

        {/* Page Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-text-primary font-heading">Crawler Management</h1>
              <p className="mt-2 text-text-secondary">Configure data sources and view crawl history</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={loadData}
                className="btn-secondary inline-flex items-center gap-2"
              >
                <RefreshCw size={18} />
                Refresh
              </button>
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
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-accent-primary" />
          </div>
        ) : (
          <>
            {/* Source Management */}
            <div className="mb-8 rounded-xl border border-border-subtle bg-bg-surface overflow-hidden">
              <div className="flex items-center justify-between border-b border-border-subtle px-6 py-4">
                <h2 className="text-lg font-semibold text-text-primary">Data Sources</h2>
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="btn-secondary inline-flex items-center gap-2 text-sm"
                >
                  <Plus size={16} />
                  Add Source
                </button>
              </div>

              {/* Add Source Form */}
              {showAddForm && (
                <div className="border-b border-border-subtle bg-bg-elevated/50 p-6">
                  <form onSubmit={handleAddSource} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-text-secondary">Name</label>
                        <input
                          type="text"
                          required
                          value={newSource.name}
                          onChange={(e) => setNewSource((prev) => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g., AI Agents Subreddit"
                          className="input w-full"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-text-secondary">Type</label>
                        <select
                          value={newSource.type}
                          onChange={(e) => setNewSource((prev) => ({ ...prev, type: e.target.value }))}
                          className="input w-full"
                        >
                          <option value="rss">RSS Feed</option>
                          <option value="subreddit">Subreddit</option>
                          <option value="api">API</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-text-secondary">URL</label>
                        <input
                          type="url"
                          required
                          value={newSource.url}
                          onChange={(e) => setNewSource((prev) => ({ ...prev, url: e.target.value }))}
                          placeholder="https://..."
                          className="input w-full"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setShowAddForm(false)}
                        className="btn-secondary text-sm"
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn-primary text-sm">
                        Add Source
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {sources.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <Activity size={48} className="mx-auto mb-4 text-text-muted" />
                  <p className="text-text-muted">No sources configured yet.</p>
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="btn-primary mt-4 inline-flex items-center gap-2"
                  >
                    <Plus size={18} />
                    Add Your First Source
                  </button>
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
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">
                          URL
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">
                          Last Checked
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">
                          Status
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                      {sources.map((source) => (
                        <tr key={source.id} className="hover:bg-bg-elevated/50 transition-colors">
                          <td className="whitespace-nowrap px-6 py-4">
                            <p className="font-medium text-text-primary">{source.name}</p>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
                            <span className="inline-flex items-center rounded-full bg-bg-elevated px-2.5 py-0.5 text-xs font-medium text-text-secondary capitalize border border-border">
                              {source.type}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
                            {source.type === 'rss' || source.type === 'api' ? (
                              <a
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-accent-primary transition-colors"
                              >
                                {(() => {
                                  try {
                                    return new URL(source.url).hostname;
                                  } catch {
                                    return source.url;
                                  }
                                })()}
                                <ExternalLink size={12} />
                              </a>
                            ) : (
                              <span className="text-sm text-text-muted">r/{source.url}</span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-text-muted">
                            {source.lastChecked
                              ? new Date(source.lastChecked).toLocaleString()
                              : 'Never'}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
                            <button
                              onClick={() => handleToggleSource(source.id, source.active)}
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                                source.active
                                  ? 'bg-green-500/10 text-green-400'
                                  : 'bg-gray-500/10 text-gray-400'
                              }`}
                            >
                              {source.active ? (
                                <>
                                  <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                                  Active
                                </>
                              ) : (
                                <>
                                  <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                                  Inactive
                                </>
                              )}
                            </button>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-right">
                            <button
                              onClick={() => handleDeleteSource(source.id)}
                              className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-red-400 transition-colors"
                            >
                              <Trash2 size={16} />
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Crawl History */}
            <div className="rounded-xl border border-border-subtle bg-bg-surface overflow-hidden">
              <div className="flex items-center justify-between border-b border-border-subtle px-6 py-4">
                <h2 className="text-lg font-semibold text-text-primary">Crawl History</h2>
                <div className="flex items-center gap-3">
                  <label className="text-sm text-text-muted">Filter by source:</label>
                  <select
                    value={filterSourceId}
                    onChange={(e) => setFilterSourceId(e.target.value)}
                    className="input py-1.5 px-3 text-sm"
                  >
                    <option value="">All Sources</option>
                    {sources.map((source) => (
                      <option key={source.id} value={source.id}>
                        {source.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {history.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <Clock size={48} className="mx-auto mb-4 text-text-muted" />
                  <p className="text-text-muted">No crawl history yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-bg-surface">
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
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">
                          Completed
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">
                          Duration
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                      {history.map((entry) => {
                        const startTime = new Date(entry.startedAt).getTime();
                        const endTime = entry.completedAt
                          ? new Date(entry.completedAt).getTime()
                          : null;
                        const duration = endTime ? endTime - startTime : null;

                        return (
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
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-text-muted">
                              {new Date(entry.startedAt).toLocaleString()}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-text-muted">
                              {entry.completedAt
                                ? new Date(entry.completedAt).toLocaleString()
                                : '-'}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-text-muted">
                              {duration !== null
                                ? duration < 60000
                                  ? `${Math.round(duration / 1000)}s`
                                  : `${Math.round(duration / 60000)}m`
                                : '-'}
                            </td>
                          </tr>
                        );
                      })}
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
