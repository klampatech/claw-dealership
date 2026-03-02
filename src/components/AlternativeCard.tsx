import Link from 'next/link';
import { Star, ArrowRight, Download } from 'phosphor-react';
import { Alternative } from '@/types';

interface AlternativeCardProps {
  alternative: Alternative;
}

const languageColors: Record<string, string> = {
  Python: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  Rust: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  TypeScript: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Go: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  C: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  Zig: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export default function AlternativeCard({ alternative }: AlternativeCardProps) {
  const langColor = languageColors[alternative.language] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';

  return (
    <Link href={`/alternatives/${alternative.slug}`} className="block">
      <div className="group h-full rounded-xl border border-border-subtle bg-bg-surface p-5 card-hover relative overflow-hidden">
        {/* Subtle gradient accent on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-accent-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        <div className="relative">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-text-primary group-hover:text-accent-primary transition-colors truncate">
                {alternative.name}
              </h3>
              <p className="mt-1.5 text-sm text-text-secondary line-clamp-2 leading-relaxed">
                {alternative.description}
              </p>
            </div>

            <div className="flex items-center gap-3 ml-3 shrink-0">
              {alternative.stars != null && (
                <div className="flex items-center gap-1.5">
                  <Star
                    size={16}
                    className="text-accent-secondary"
                  />
                  <span className="text-sm font-medium text-text-secondary">
                    {alternative.stars >= 1000
                      ? `${(alternative.stars / 1000).toFixed(1)}k`
                      : alternative.stars.toLocaleString()}
                  </span>
                </div>
              )}
              {alternative.downloads != null && (
                <div className="flex items-center gap-1.5">
                  <Download
                    size={16}
                    className="text-blue-400"
                  />
                  <span className="text-sm font-medium text-text-secondary">
                    {alternative.downloads >= 1000
                      ? `${(alternative.downloads / 1000).toFixed(1)}k`
                      : alternative.downloads.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="mt-4 flex flex-wrap gap-2">
            <span className={`badge ${langColor} border`}>
              {alternative.language}
            </span>
            {alternative.deployment.slice(0, 2).map((dep) => (
              <span
                key={dep}
                className="badge badge-secondary"
              >
                {dep}
              </span>
            ))}
            {alternative.security === 'sandboxed' && (
              <span className="badge bg-green-500/20 text-green-400 border border-green-500/30">
                sandboxed
              </span>
            )}
          </div>

          {/* Footer */}
          <div className="mt-4 flex items-center text-sm text-accent-primary opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-8px] group-hover:translate-x-0">
            <span className="font-medium">View details</span>
            <ArrowRight size={16} className="ml-1" />
          </div>
        </div>
      </div>
    </Link>
  );
}
