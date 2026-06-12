'use client';

import { useMemo, useState } from 'react';
import type { Deck, Format } from '@/types/core';
import { ColorIdentityPips } from './ColorIdentityPips';
import { DeckFilters, DEFAULT_DECK_FILTERS, type DeckFiltersState } from './DeckFilters';

interface DeckSelectorProps {
  decks: Deck[];
  includedIds: Set<string>;
  isRefetching: boolean;
  onToggle: (deckId: string) => void;
}

function formatLabel(format: string): string {
  return format.charAt(0).toUpperCase() + format.slice(1);
}

function matchesFilters(deck: Deck, filters: DeckFiltersState): boolean {
  if (filters.format !== 'all' && deck.format !== filters.format) {
    return false;
  }
  if (filters.colors.length > 0 && !filters.colors.every((color) => deck.colorIdentity.includes(color))) {
    return false;
  }
  if (filters.minCardCount !== '' && deck.cardCount < Number(filters.minCardCount)) {
    return false;
  }
  if (filters.maxCardCount !== '' && deck.cardCount > Number(filters.maxCardCount)) {
    return false;
  }
  return true;
}

export function DeckSelector({ decks, includedIds, isRefetching, onToggle }: DeckSelectorProps) {
  const [filters, setFilters] = useState<DeckFiltersState>(DEFAULT_DECK_FILTERS);

  const availableFormats = useMemo(() => {
    const formats = new Set<Format>(decks.map((deck) => deck.format));
    return Array.from(formats).sort();
  }, [decks]);

  const filteredDecks = useMemo(
    () => decks.filter((deck) => matchesFilters(deck, filters)),
    [decks, filters]
  );

  if (decks.length === 0) {
    return <p className="text-sm text-zinc-400">No decks found.</p>;
  }

  const includedCount = includedIds.size;

  return (
    <div>
      <DeckFilters availableFormats={availableFormats} filters={filters} onChange={setFilters} />
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-zinc-500">
          {includedCount} of {decks.length} deck{decks.length !== 1 ? 's' : ''} included
          {filteredDecks.length !== decks.length && (
            <span className="ml-2 text-zinc-400">
              (showing {filteredDecks.length})
            </span>
          )}
          {isRefetching && (
            <span className="ml-2 text-indigo-500">Updating…</span>
          )}
        </p>
      </div>
      {filteredDecks.length === 0 ? (
        <p className="text-sm text-zinc-400">No decks match the current filters.</p>
      ) : (
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {filteredDecks.map((deck) => {
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
      )}
    </div>
  );
}
