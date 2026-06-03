import { NextRequest, NextResponse } from 'next/server';
import { resolveUserDecks } from '@/lib/userDecks';
import { FetchError } from '@/types/errors';
import type { Deck, PlatformSource, UserProfile } from '@/types/core';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;
  const moxfield = searchParams.get('moxfield')?.trim() || null;
  const archidekt = searchParams.get('archidekt')?.trim() || null;

  if (!moxfield && !archidekt) {
    return NextResponse.json(
      { error: 'At least one of moxfield or archidekt is required' },
      { status: 400 }
    );
  }

  try {
    const results = await Promise.all([
      moxfield ? resolveUserDecks(moxfield, 'moxfield') : Promise.resolve(null),
      archidekt ? resolveUserDecks(archidekt, 'archidekt') : Promise.resolve(null),
    ]);

    const sources: PlatformSource[] = [];
    const allDecks: Deck[] = [];

    if (moxfield && results[0]) {
      sources.push({ platform: 'moxfield', username: moxfield, deckCount: results[0].length });
      allDecks.push(...results[0]);
    }
    if (archidekt && results[1]) {
      sources.push({ platform: 'archidekt', username: archidekt, deckCount: results[1].length });
      allDecks.push(...results[1]);
    }

    const profile: UserProfile = {
      sources,
      decks: allDecks,
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
