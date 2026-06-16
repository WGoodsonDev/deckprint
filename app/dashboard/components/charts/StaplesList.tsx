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
    return <ChartPlaceholder label="No staples found across included decks." />;
  }

  const visible = data.staples.slice(0, 30);

  return (
    <div>
      <h3 className="text-sm font-semibold text-zinc-700 mb-2 dark:text-zinc-200">
        Staples — in 3+ decks
      </h3>
      <div className="flex flex-wrap gap-1.5">
        {visible.map((staple) => (
          <span
            key={staple.scryfallId}
            className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
          >
            {staple.name} · {staple.deckCount} deck{staple.deckCount !== 1 ? 's' : ''}
          </span>
        ))}
      </div>
      {data.staples.length > 30 && (
        <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
          Showing top 30 of {data.staples.length}
        </p>
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
