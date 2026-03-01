'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import FilterSidebar from '@/components/FilterSidebar';
import AlternativeCard from '@/components/AlternativeCard';
import { FilterState, Alternative } from '@/types';
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
