'use client';

import type { Deck } from '@/types/core';
import { ColorIdentityPips } from './ColorIdentityPips';

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
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-zinc-500">
          {includedCount} of {decks.length} deck{decks.length !== 1 ? 's' : ''} included
          {isRefetching && (
            <span className="ml-2 text-indigo-500">Updating…</span>
          )}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {decks.map((deck) => {
          const included = includedIds.has(deck.id);
          return (
            <button
              key={deck.id}
              type="button"
              aria-pressed={included}
              disabled={isRefetching}
              onClick={() => onToggle(deck.id)}
              className={`flex flex-col gap-1.5 rounded-lg border px-3 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                included
                  ? 'border-indigo-200 bg-indigo-50 hover:bg-indigo-100'
                  : 'border-zinc-200 bg-white opacity-60 hover:opacity-100'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className={`text-sm font-medium ${included ? 'text-zinc-900' : 'text-zinc-500'}`}>
                  {deck.name}
                </span>
                <ColorIdentityPips colorIdentity={deck.colorIdentity} />
              </div>
              <p className="text-xs text-zinc-400">
                {formatLabel(deck.format)} · {deck.cardCount} cards
              </p>
              {deck.commanders.length > 0 && (
                <p className="truncate text-xs text-zinc-500">
                  {deck.commanders.map((commander) => commander.name).join(' / ')}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
