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
