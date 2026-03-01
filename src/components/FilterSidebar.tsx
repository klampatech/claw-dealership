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
