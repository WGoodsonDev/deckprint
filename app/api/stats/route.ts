import { NextRequest, NextResponse } from 'next/server';
import { resolveUserDecks } from '@/lib/userDecks';
import { computeProfileStats } from '@/lib/aggregators';
import { FetchError } from '@/types/errors';
import type { Deck } from '@/types/core';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;
  const moxfield = searchParams.get('moxfield')?.trim() || null;
  const archidekt = searchParams.get('archidekt')?.trim() || null;
  const includeParam = searchParams.get('include');

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

    const allDecks: Deck[] = [];
    if (moxfield && results[0]) allDecks.push(...results[0]);
    if (archidekt && results[1]) allDecks.push(...results[1]);

    const decks =
      includeParam !== null
        ? (() => {
            const ids = new Set(includeParam.split(',').map((s) => s.trim()));
            return allDecks.filter((d) => ids.has(d.id));
          })()
        : allDecks;

    return NextResponse.json(computeProfileStats(decks));
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

    console.error('Unexpected error in /api/stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
