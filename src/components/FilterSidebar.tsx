'use client';

import { Funnel, X } from 'lucide-react';
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
  { value: 'all', label: 'All Security' },
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

const languages = [
  { value: 'all', label: 'All Languages' },
  { value: 'Python', label: 'Python' },
  { value: 'Rust', label: 'Rust' },
  { value: 'TypeScript', label: 'TypeScript' },
  { value: 'Go', label: 'Go' },
  { value: 'C', label: 'C' },
  { value: 'Zig', label: 'Zig' },
];

export default function FilterSidebar({ filters, onFilterChange, onClearFilters }: FilterSidebarProps) {
  const hasFilters =
    filters.category !== 'all' ||
    filters.security !== 'all' ||
    filters.deployment !== 'all' ||
    filters.hardware !== 'all' ||
    filters.useCase !== 'all' ||
    filters.language !== 'all';

  return (
    <aside className="w-full lg:w-64 shrink-0">
      <div className="sticky top-24 rounded-xl border border-border-subtle bg-bg-surface p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Funnel size={18} className="text-accent-primary" />
            <h2 className="font-semibold text-text-primary font-heading text-sm">Filters</h2>
          </div>
          {hasFilters && (
            <button
              onClick={onClearFilters}
              className="text-xs text-text-muted hover:text-accent-primary transition-colors flex items-center gap-1"
            >
              <X size={14} />
              Clear
            </button>
          )}
        </div>

        <div className="space-y-5">
          {/* Language */}
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
              Language
            </label>
            <select
              value={filters.language}
              onChange={(e) => onFilterChange({ language: e.target.value })}
              className="input w-full text-sm py-2.5"
            >
              {languages.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) => onFilterChange({ category: e.target.value })}
              className="input w-full text-sm py-2.5"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Security */}
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
              Security
            </label>
            <select
              value={filters.security}
              onChange={(e) => onFilterChange({ security: e.target.value })}
              className="input w-full text-sm py-2.5"
            >
              {securityLevels.map((sec) => (
                <option key={sec.value} value={sec.value}>
                  {sec.label}
                </option>
              ))}
            </select>
          </div>

          {/* Deployment */}
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
              Deployment
            </label>
            <select
              value={filters.deployment}
              onChange={(e) => onFilterChange({ deployment: e.target.value })}
              className="input w-full text-sm py-2.5"
            >
              {deployments.map((dep) => (
                <option key={dep.value} value={dep.value}>
                  {dep.label}
                </option>
              ))}
            </select>
          </div>

          {/* Hardware */}
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
              Hardware
            </label>
            <select
              value={filters.hardware}
              onChange={(e) => onFilterChange({ hardware: e.target.value })}
              className="input w-full text-sm py-2.5"
            >
              {hardware.map((hw) => (
                <option key={hw.value} value={hw.value}>
                  {hw.label}
                </option>
              ))}
            </select>
          </div>

          {/* Use Case */}
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
              Use Case
            </label>
            <select
              value={filters.useCase}
              onChange={(e) => onFilterChange({ useCase: e.target.value })}
              className="input w-full text-sm py-2.5"
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
