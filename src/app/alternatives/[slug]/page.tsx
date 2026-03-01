import { getAlternativeBySlug } from '@/lib/db';
import Header from '@/components/Header';
import Link from 'next/link';
import { ArrowLeft, Star, Github, ExternalLink } from 'lucide-react';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function AlternativePage({ params }: PageProps) {
  const { slug } = await params;
  const alternative = await getAlternativeBySlug(slug);

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
