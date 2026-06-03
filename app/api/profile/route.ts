import { NextRequest, NextResponse } from 'next/server';
import { resolveUserDecks } from '@/lib/userDecks';
import { FetchError } from '@/types/errors';
import type { Deck, Platform, PlatformSource, SourceError, UserProfile } from '@/types/core';

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

  const platforms: Array<{ username: string; platform: Platform } | null> = [
    moxfield ? { username: moxfield, platform: 'moxfield' } : null,
    archidekt ? { username: archidekt, platform: 'archidekt' } : null,
  ];

  const results = await Promise.allSettled(
    platforms.map((p) =>
      p ? resolveUserDecks(p.username, p.platform) : Promise.resolve(null)
    )
  );

  const sources: PlatformSource[] = [];
  const allDecks: Deck[] = [];
  const sourceErrors: SourceError[] = [];

  for (let i = 0; i < platforms.length; i++) {
    const p = platforms[i];
    if (!p) continue;
    const result = results[i];
    if (result.status === 'fulfilled' && result.value) {
      sources.push({ platform: p.platform, username: p.username, deckCount: result.value.length });
      allDecks.push(...result.value);
    } else if (result.status === 'rejected') {
      const err = result.reason;
      sourceErrors.push({
        platform: p.platform,
        username: p.username,
        reason: err instanceof FetchError ? err.reason : 'unknown',
        message: err instanceof FetchError ? err.message : 'Unexpected error',
      });
      if (!(err instanceof FetchError)) {
        console.error(`Unexpected error fetching ${p.platform}:`, err);
      }
    }
  }

  if (sources.length === 0) {
    const first = sourceErrors[0];
    const status =
      first.reason === 'not_found'     ? 404 :
      first.reason === 'auth_required' ? 403 :
      first.reason === 'rate_limited'  ? 429 : 502;
    return NextResponse.json({ error: first.message }, { status });
  }

  const profile: UserProfile = {
    sources,
    ...(sourceErrors.length > 0 && { sourceErrors }),
    decks: allDecks,
    fetchedAt: new Date().toISOString(),
  };

  return NextResponse.json(profile);
}
