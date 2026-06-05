'use client';

import type { Deck } from '@/types/core';

interface DeckSelectorProps {
  decks: Deck[];
  includedIds: Set<string>;
  isRefetching: boolean;
  onToggle: (deckId: string) => void;
}

function formatLabel(format: string): string {
  return format.charAt(0).toUpperCase() + format.slice(1);
}

export function DeckSelector({ decks, includedIds, isRefetching, onToggle }: DeckSelectorProps) {
  if (decks.length === 0) {
    return <p className="text-sm text-zinc-400">No decks found.</p>;
  }

  const includedCount = includedIds.size;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-zinc-500">
          {includedCount} of {decks.length} deck{decks.length !== 1 ? 's' : ''} included
          {isRefetching && (
            <span className="ml-2 text-indigo-500">Updating…</span>
          )}
        </p>
      </div>
      <ul className="space-y-1.5">
        {decks.map((deck) => {
          const included = includedIds.has(deck.id);
          return (
            <li key={deck.id}>
              <label className="flex cursor-pointer items-center gap-3 rounded-md border border-zinc-200 px-3 py-2 hover:bg-zinc-50">
                <input
                  type="checkbox"
                  checked={included}
                  disabled={isRefetching}
                  onChange={() => onToggle(deck.id)}
                  className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                />
                <span className={`flex-1 text-sm font-medium ${included ? 'text-zinc-900' : 'text-zinc-400'}`}>
                  {deck.name}
                </span>
                <span className="text-xs text-zinc-400">
                  {formatLabel(deck.format)} · {deck.cardCount} cards
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
