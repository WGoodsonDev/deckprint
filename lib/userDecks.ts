import {
  fetchUserDeckSummaries,
  fetchDeckMetadata,
  fetchDeckCards,
} from '@/lib/fetchers/archidekt';
import { normalizeDeck } from '@/lib/normalizers/archidekt';
import {
  fetchMoxfieldUserDecks,
  fetchMoxfieldDeck,
} from '@/lib/fetchers/moxfield';
import { normalizeMoxfieldDeck } from '@/lib/normalizers/moxfield';
import { getCached, setCached, deckCacheKey } from '@/lib/cache/redis';
import { FetchError } from '@/types/errors';
import type { Deck, Platform } from '@/types/core';

// Returns all successfully fetched decks for a user.
// Per-deck errors are warned and skipped; only total-failure errors propagate.
export async function resolveUserDecks(
  username: string,
  platform: Platform
): Promise<Deck[]> {
  if (platform === 'archidekt') {
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

  if (platform === 'moxfield') {
    const summaries = await fetchMoxfieldUserDecks(username);

    const decks = await Promise.all(
      summaries.map(async (summary): Promise<Deck | null> => {
        const cacheKey = deckCacheKey('moxfield', summary.id);
        const cached = await getCached<Deck>(cacheKey);
        if (cached) return cached;

        try {
          const raw = await fetchMoxfieldDeck(summary.id);
          const deck = normalizeMoxfieldDeck(raw);
          await setCached(cacheKey, deck);
          return deck;
        } catch (error) {
          if (error instanceof FetchError) {
            console.warn(
              `Skipping Moxfield deck ${summary.id} (${summary.name}): ${error.message}`
            );
            return null;
          }
          const message = error instanceof Error ? error.message : String(error);
          console.warn(
            `Skipping Moxfield deck ${summary.id} (${summary.name}) due to unexpected error: ${message}`
          );
          return null;
        }
      })
    );

    return decks.filter((d): d is Deck => d !== null);
  }

  // Unreachable — routes validate platform before calling this
  throw new Error(`Unsupported platform: ${platform}`);
}
