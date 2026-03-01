'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import FilterSidebar from '@/components/FilterSidebar';
import AlternativeCard from '@/components/AlternativeCard';
import { FilterState, Alternative } from '@/types';
import { Search, ArrowUpDown, Frown } from 'lucide-react';

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

async function fetchAlternatives(filters: FilterState): Promise<Alternative[]> {
  const params = new URLSearchParams();
  if (filters.category !== 'all') params.set('category', filters.category);
  if (filters.security !== 'all') params.set('security', filters.security);
  if (filters.deployment !== 'all') params.set('deployment', filters.deployment);
  if (filters.hardware !== 'all') params.set('hardware', filters.hardware);
  if (filters.useCase !== 'all') params.set('useCase', filters.useCase);
  if (filters.search) params.set('search', filters.search);

  const res = await fetch(`/api/alternatives?${params.toString()}`);
  if (!res.ok) return [];
  return res.json();
}

export default function Home() {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [alternatives, setAlternatives] = useState<Alternative[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        let data = await fetchAlternatives(filters);

        // Filter by language client-side
        if (filters.language && filters.language !== 'all') {
          data = data.filter((alt) => alt.language === filters.language);
        }

        // Sort
        if (filters.sortBy === 'stars') {
          data.sort((a, b) => (b.stars || 0) - (a.stars || 0));
        } else if (filters.sortBy === 'newest') {
          data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }

        setAlternatives(data);
      } catch (error) {
        console.error('Failed to fetch alternatives:', error);
        setAlternatives([]);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [filters]);

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleClearFilters = () => {
    setFilters(defaultFilters);
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      <Header />

      <main className="mx-auto max-w-7xl px-4 pt-24 pb-12 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="mb-12 text-center animate-fade-in">
          <h1 className="mb-4 text-4xl sm:text-5xl font-bold tracking-tight">
            <span className="text-text-primary">OpenClaw </span>
            <span className="gradient-text">Alternatives</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-text-secondary">
            Discover and compare open-source AI agents in the OpenClaw ecosystem.
            Find the perfect agent for your needs.
          </p>
        </div>

        {/* Search Bar */}
        <div className="mx-auto mb-10 max-w-xl animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="relative">
            <Search
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
            />
            <input
              type="text"
              placeholder="Search alternatives..."
              value={filters.search}
              onChange={(e) => handleFilterChange({ search: e.target.value })}
              className="input w-full py-4 pl-12 pr-4 text-base"
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
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm text-text-secondary">
                {loading ? (
                  <span className="text-text-muted">Loading...</span>
                ) : (
                  <>
                    Showing <span className="text-text-primary font-medium">{alternatives.length}</span> alternatives
                  </>
                )}
              </p>
              <div className="flex items-center gap-2">
                <ArrowUpDown size={18} className="text-text-muted" />
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange({ sortBy: e.target.value })}
                  className="input py-2 px-3 text-sm"
                >
                  <option value="name">Name</option>
                  <option value="stars">Stars</option>
                  <option value="newest">Newest</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-52 skeleton rounded-xl" />
                ))}
              </div>
            ) : alternatives.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
                {alternatives.map((alt) => (
                  <AlternativeCard key={alt.id} alternative={alt} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-bg-surface py-16 text-center">
                <Frown size={48} className="text-text-muted mb-4" />
                <p className="text-lg font-medium text-text-primary">No alternatives found</p>
                <p className="mt-1 text-text-secondary">Try adjusting your filters or search query</p>
                <button
                  onClick={handleClearFilters}
                  className="btn-primary mt-6"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border-subtle py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-text-muted sm:px-6 lg:px-8">
          <p>&copy; {new Date().getFullYear()} Claw Dealership. OpenClaw Alternatives Directory.</p>
        </div>
      </footer>
    </div>
  );
}
