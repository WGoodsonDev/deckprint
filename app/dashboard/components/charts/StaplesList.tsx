'use client';

import type { CardOverlapProfile } from '@/types/stats';

interface StaplesListProps {
  data: CardOverlapProfile | null;
  isLoading: boolean;
  error: string | null;
}

export function StaplesList({ data, isLoading, error }: StaplesListProps) {
  if (isLoading) {
    return <ChartPlaceholder label="Loading staples…" />;
  }

  if (error) {
    return <ChartPlaceholder label={error} isError />;
  }

  if (!data || data.staples.length === 0) {
    return <ChartPlaceholder label="No card data available." />;
  }

  return (
    <div className="space-y-6">
      {data.staples.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-zinc-700 mb-2 dark:text-zinc-200">
            Staples — in 3+ decks
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                  <th className="pb-1 pr-4 font-medium">Card</th>
                  <th className="pb-1 pr-4 font-medium text-right">Decks</th>
                  <th className="pb-1 font-medium text-right">Copies</th>
                </tr>
              </thead>
              <tbody>
                {data.staples.slice(0, 20).map((staple) => (
                  <tr key={staple.scryfallId} className="border-b border-zinc-100 last:border-0 dark:border-zinc-800">
                    <td className="py-1.5 pr-4 font-medium text-zinc-900 dark:text-zinc-100">{staple.name}</td>
                    <td className="py-1.5 pr-4 text-right text-zinc-600 dark:text-zinc-400">{staple.deckCount}</td>
                    <td className="py-1.5 text-right text-zinc-600 dark:text-zinc-400">{staple.totalCopies}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.staples.length > 20 && (
            <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
              Showing top 20 of {data.staples.length}
            </p>
          )}
        </section>
      )}
    </div>
  );
}

function ChartPlaceholder({ label, isError }: { label: string; isError?: boolean }) {
  return (
    <div className={`flex h-24 items-center justify-center text-sm ${isError ? 'text-red-500' : 'text-zinc-400 dark:text-zinc-500'}`}>
      {label}
    </div>
  );
}
