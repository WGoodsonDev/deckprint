import {
  fetchUserDeckSummaries,
  fetchDeckMetadata,
  fetchDeckCards,
} from '@/lib/fetchers/archidekt';
import { normalizeDeck } from '@/lib/normalizers/archidekt';
import { getCached, setCached, deckCacheKey } from '@/lib/cache/redis';
import { FetchError } from '@/types/errors';
import type { Deck } from '@/types/core';

// Returns all successfully fetched decks for a user.
// Per-deck errors are warned and skipped; only total-failure errors propagate.
export async function resolveUserDecks(username: string): Promise<Deck[]> {
  const summaries = await fetchUserDeckSummaries(username);

  const decks = await Promise.all(
    summaries.map(async (summary): Promise<Deck | null> => {
      const cacheKey = deckCacheKey('archidekt', String(summary.id));
      const cached = await getCached<Deck>(cacheKey);
      if (cached) return cached;

      try {
        const [metadata, cards] = await Promise.all([
          fetchDeckMetadata(summary.id),
          fetchDeckCards(summary.id),
        ]);
        const deck = normalizeDeck(metadata, cards);
        await setCached(cacheKey, deck);
        return deck;
      } catch (error) {
        if (error instanceof FetchError) {
          console.warn(
            `Skipping deck ${summary.id} (${summary.name}): ${error.message}`
          );
          return null;
        }
        const message = error instanceof Error ? error.message : String(error);
        console.warn(
          `Skipping deck ${summary.id} (${summary.name}) due to unexpected error: ${message}`
        );
        return null;
      }
    })
  );

  return decks.filter((d): d is Deck => d !== null);
}
