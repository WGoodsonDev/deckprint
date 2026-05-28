import { NextRequest, NextResponse } from 'next/server';
import {
  fetchUserDeckSummaries,
  fetchDeckMetadata,
  fetchDeckCards,
} from '@/lib/fetchers/archidekt';
import { normalizeDeck } from '@/lib/normalizers/archidekt';
import { getCached, setCached, deckCacheKey } from '@/lib/cache/redis';
import { FetchError } from '@/types/errors';
import type { Deck, UserProfile } from '@/types/core';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;
  const username = searchParams.get('username')?.trim();
  const platform = searchParams.get('platform');

  if (!username) {
    return NextResponse.json({ error: 'username is required' }, { status: 400 });
  }

  if (platform !== 'archidekt') {
    return NextResponse.json(
      { error: 'Only platform=archidekt is supported' },
      { status: 400 }
    );
  }

  try {
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
          throw error;
        }
      })
    );

    const validDecks = decks.filter((d): d is Deck => d !== null);

    const profile: UserProfile = {
      sources: [
        {
          platform: 'archidekt',
          username,
          deckCount: validDecks.length,
        },
      ],
      decks: validDecks,
      fetchedAt: new Date().toISOString(),
    };

    return NextResponse.json(profile);
  } catch (error) {
    if (error instanceof FetchError) {
      const status =
        error.reason === 'not_found'
          ? 404
          : error.reason === 'auth_required'
            ? 403
            : error.reason === 'rate_limited'
              ? 429
              : 502;

      return NextResponse.json({ error: error.message }, { status });
    }

    console.error('Unexpected error in /api/profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
