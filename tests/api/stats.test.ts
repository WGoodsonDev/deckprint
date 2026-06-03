import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/stats/route';
import { FetchError } from '@/types/errors';
import { makeDeck } from '../aggregators/fixtures';

vi.mock('@/lib/userDecks', () => ({
  resolveUserDecks: vi.fn(),
}));

import { resolveUserDecks } from '@/lib/userDecks';

const mockResolveUserDecks = vi.mocked(resolveUserDecks);

function makeRequest(params: Record<string, string>): NextRequest {
  const url = new URL('http://localhost/api/stats');
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  return new NextRequest(url.toString());
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/stats', () => {
  it('returns 200 with ProfileStats for all decks when no include param', async () => {
    const decks = [
      makeDeck({ id: 'archidekt:1' }),
      makeDeck({ id: 'archidekt:2' }),
    ];
    mockResolveUserDecks.mockResolvedValue(decks);

    const res = await GET(makeRequest({ username: 'testuser', platform: 'archidekt' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toHaveProperty('colorProfile');
    expect(body).toHaveProperty('curveProfile');
    expect(body).toHaveProperty('formatProfile');
    expect(body).toHaveProperty('cardOverlap');
    expect(body).toHaveProperty('archetypeProfile');
    expect(mockResolveUserDecks).toHaveBeenCalledWith('testuser', 'archidekt');
  });

  it('passes only matching decks to computeProfileStats when include param is set', async () => {
    const decks = [
      makeDeck({ id: 'archidekt:1' }),
      makeDeck({ id: 'archidekt:2' }),
      makeDeck({ id: 'archidekt:3' }),
    ];
    mockResolveUserDecks.mockResolvedValue(decks);

    const res = await GET(
      makeRequest({ username: 'testuser', platform: 'archidekt', include: 'archidekt:1,archidekt:3' })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    // formatProfile.formatCounts should reflect exactly 2 commander decks
    // (makeDeck defaults to format: 'commander')
    expect(body.formatProfile.formatCounts.commander).toBe(2);
  });

  it('returns 200 with zero-value stats when include contains only unrecognized IDs', async () => {
    const decks = [makeDeck({ id: 'archidekt:1' })];
    mockResolveUserDecks.mockResolvedValue(decks);

    const res = await GET(
      makeRequest({ username: 'testuser', platform: 'archidekt', include: 'archidekt:999' })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toHaveProperty('colorProfile');
    // No decks matched — format counts should be empty
    expect(Object.keys(body.formatProfile.formatCounts)).toHaveLength(0);
  });

  it('returns 400 when username is missing', async () => {
    const res = await GET(makeRequest({ platform: 'archidekt' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/username/i);
  });

  it('returns 400 when platform is unsupported', async () => {
    const res = await GET(makeRequest({ username: 'testuser', platform: 'hearthstone' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/platform/i);
  });

  it('returns 404 when resolveUserDecks throws FetchError not_found', async () => {
    mockResolveUserDecks.mockRejectedValue(
      new FetchError('archidekt', 'not_found', 'User not found')
    );

    const res = await GET(makeRequest({ username: 'ghost', platform: 'archidekt' }));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('User not found');
  });

  it('returns 429 when resolveUserDecks throws FetchError rate_limited', async () => {
    mockResolveUserDecks.mockRejectedValue(
      new FetchError('archidekt', 'rate_limited', 'Rate limited')
    );

    const res = await GET(makeRequest({ username: 'testuser', platform: 'archidekt' }));
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body.error).toBe('Rate limited');
  });
});
