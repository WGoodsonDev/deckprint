import { NextRequest, NextResponse } from 'next/server';
import { resolveUserDecks } from '@/lib/userDecks';
import { computeProfileStats } from '@/lib/aggregators';
import { FetchError } from '@/types/errors';
import type { Platform } from '@/types/core';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;
  const username = searchParams.get('username')?.trim();
  const platform = searchParams.get('platform');
  const includeParam = searchParams.get('include');

  if (!username) {
    return NextResponse.json({ error: 'username is required' }, { status: 400 });
  }

  const VALID_PLATFORMS: Platform[] = ['archidekt', 'moxfield'];
  if (!platform || !VALID_PLATFORMS.includes(platform as Platform)) {
    return NextResponse.json({ error: 'Unsupported platform' }, { status: 400 });
  }
  const validatedPlatform = platform as Platform; // safe: just validated above

  try {
    const allDecks = await resolveUserDecks(username, validatedPlatform);

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
