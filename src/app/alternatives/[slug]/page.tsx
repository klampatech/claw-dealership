import { getAlternativeBySlug } from '@/lib/db';
import Header from '@/components/Header';
import Link from 'next/link';
import { ArrowLeft, Star, Github, ExternalLink, Check } from 'lucide-react';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ slug: string }>;
}

const languageColors: Record<string, string> = {
  Python: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  Rust: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  TypeScript: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Go: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  C: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  Zig: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export default async function AlternativePage({ params }: PageProps) {
  const { slug } = await params;
  const alternative = await getAlternativeBySlug(slug);

  if (!alternative) {
    notFound();
  }

  const langColor = languageColors[alternative.language] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';

  return (
    <div className="min-h-screen bg-bg-primary">
      <Header />

      <main className="mx-auto max-w-4xl px-4 pt-24 pb-12 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="mb-6 inline-flex items-center text-sm text-text-secondary hover:text-accent-primary transition-colors"
        >
          <ArrowLeft size={18} className="mr-2" />
          Back to directory
        </Link>

        <div className="rounded-xl border border-border-subtle bg-bg-surface p-6 sm:p-8 animate-fade-in">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-text-primary font-heading">{alternative.name}</h1>
              <p className="mt-2 text-lg text-text-secondary">{alternative.description}</p>
            </div>
            {alternative.stars != null && (
              <div className="flex items-center gap-2 rounded-lg bg-bg-elevated border border-border px-4 py-2">
                <Star size={20} className="text-accent-secondary" />
                <span className="font-semibold text-text-primary">
                  {alternative.stars.toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* Full Description */}
          {alternative.fullDescription && (
            <p className="mt-6 text-text-secondary leading-relaxed">{alternative.fullDescription}</p>
          )}

          {/* Tags */}
          <div className="mt-8 flex flex-wrap gap-2">
            <span className={`badge ${langColor} border`}>
              {alternative.language}
            </span>
            <span className="badge bg-purple-500/20 text-purple-400 border border-purple-500/30">
              {alternative.category}
            </span>
            {alternative.security === 'sandboxed' ? (
              <span className="badge bg-green-500/20 text-green-400 border border-green-500/30">
                <Check size={14} className="mr-1" />
                {alternative.security}
              </span>
            ) : (
              <span className="badge badge-secondary">
                {alternative.security}
              </span>
            )}
          </div>

          {/* Details Grid */}
          <div className="mt-8 border-t border-border-subtle pt-8">
            <h2 className="text-lg font-semibold text-text-primary font-heading">Details</h2>
            <dl className="mt-4 grid gap-6 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">Deployment</dt>
                <dd className="flex flex-wrap gap-2">
                  {alternative.deployment.map((dep: string) => (
                    <span
                      key={dep}
                      className="badge badge-secondary"
                    >
                      {dep}
                    </span>
                  ))}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">Hardware</dt>
                <dd className="flex flex-wrap gap-2">
                  {alternative.hardware.map((hw: string) => (
                    <span
                      key={hw}
                      className="badge badge-secondary"
                    >
                      {hw}
                    </span>
                  ))}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">Use Cases</dt>
                <dd className="flex flex-wrap gap-2">
                  {alternative.useCases.map((uc: string) => (
                    <span
                      key={uc}
                      className="badge badge-secondary"
                    >
                      {uc}
                    </span>
                  ))}
                </dd>
              </div>
            </dl>
          </div>

          {/* Features */}
          {alternative.features.length > 0 && (
            <div className="mt-8 border-t border-border-subtle pt-8">
              <h2 className="text-lg font-semibold text-text-primary font-heading">Features</h2>
              <ul className="mt-4 space-y-3">
                {alternative.features.map((feature: string, i: number) => (
                  <li key={i} className="flex items-start text-text-secondary">
                    <span className="mr-3 mt-1 text-accent-primary">›</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* CTA */}
          <div className="mt-8 border-t border-border-subtle pt-8">
            <a
              href={alternative.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary inline-flex items-center gap-2"
            >
              <Github size={20} />
              View on GitHub
              <ExternalLink size={16} />
            </a>
          </div>
        </div>
      </main>

      <footer className="border-t border-border-subtle py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-text-muted sm:px-6 lg:px-8">
          <p>&copy; {new Date().getFullYear()} Claw Dealership. OpenClaw Alternatives Directory.</p>
        </div>
      </footer>
    </div>
  );
}
