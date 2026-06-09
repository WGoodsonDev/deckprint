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

    const res = await GET(makeRequest({ archidekt: 'testuser' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toHaveProperty('colorProfile');
    expect(body).toHaveProperty('curveProfile');
    expect(body).toHaveProperty('formatProfile');
    expect(body).toHaveProperty('cardOverlap');
    expect(body).toHaveProperty('archetypeProfile');
    expect(body.sourceErrors).toBeUndefined();
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
      makeRequest({ archidekt: 'testuser', include: 'archidekt:1,archidekt:3' })
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
      makeRequest({ archidekt: 'testuser', include: 'archidekt:999' })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toHaveProperty('colorProfile');
    // No decks matched — format counts should be empty
    expect(Object.keys(body.formatProfile.formatCounts)).toHaveLength(0);
  });

  it('returns 200 with merged stats when both platforms are provided', async () => {
    const archiDecks = [makeDeck({ id: 'archidekt:1' }), makeDeck({ id: 'archidekt:2' })];
    const moxDecks = [makeDeck({ id: 'moxfield:1' })];
    mockResolveUserDecks.mockImplementation((_username, platform) =>
      Promise.resolve(platform === 'archidekt' ? archiDecks : moxDecks)
    );

    const res = await GET(makeRequest({ archidekt: 'archiuser', moxfield: 'moxuser' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.formatProfile.formatCounts.commander).toBe(3);
  });

  it('returns 400 when neither moxfield nor archidekt param is provided', async () => {
    const res = await GET(makeRequest({}));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/moxfield|archidekt|at least one/i);
  });

  it('returns 404 when resolveUserDecks throws FetchError not_found', async () => {
    mockResolveUserDecks.mockRejectedValue(
      new FetchError('archidekt', 'not_found', 'User not found')
    );

    const res = await GET(makeRequest({ archidekt: 'ghost' }));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('User not found');
  });

  it('returns 429 when resolveUserDecks throws FetchError rate_limited', async () => {
    mockResolveUserDecks.mockRejectedValue(
      new FetchError('archidekt', 'rate_limited', 'Rate limited')
    );

    const res = await GET(makeRequest({ archidekt: 'testuser' }));
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body.error).toBe('Rate limited');
  });

  it('returns 200 with partial stats when one source fails with auth_required', async () => {
    const archiDecks = [makeDeck({ id: 'archidekt:1' }), makeDeck({ id: 'archidekt:2' })];
    mockResolveUserDecks.mockImplementation((_username, platform) => {
      if (platform === 'moxfield')
        return Promise.reject(new FetchError('moxfield', 'auth_required', 'Cloudflare blocked request'));
      return Promise.resolve(archiDecks);
    });

    const res = await GET(makeRequest({ moxfield: 'moxuser', archidekt: 'archiuser' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toHaveProperty('colorProfile');
    expect(body.formatProfile.formatCounts.commander).toBe(2);
    expect(body.sourceErrors).toHaveLength(1);
    expect(body.sourceErrors[0]).toMatchObject({
      platform: 'moxfield',
      username: 'moxuser',
      reason: 'auth_required',
    });
  });

  it('returns 200 with partial stats when one source fails with not_found', async () => {
    const archiDecks = [makeDeck({ id: 'archidekt:1' })];
    mockResolveUserDecks.mockImplementation((_username, platform) => {
      if (platform === 'moxfield')
        return Promise.reject(new FetchError('moxfield', 'not_found', 'User not found'));
      return Promise.resolve(archiDecks);
    });

    const res = await GET(makeRequest({ moxfield: 'ghost', archidekt: 'archiuser' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.formatProfile.formatCounts.commander).toBe(1);
    expect(body.sourceErrors).toHaveLength(1);
    expect(body.sourceErrors[0].reason).toBe('not_found');
  });

  it('returns 404 when both sources fail and first error is not_found', async () => {
    mockResolveUserDecks.mockImplementation((_username, platform) => {
      if (platform === 'moxfield')
        return Promise.reject(new FetchError('moxfield', 'not_found', 'Moxfield user not found'));
      return Promise.reject(new FetchError('archidekt', 'not_found', 'Archidekt user not found'));
    });

    const res = await GET(makeRequest({ moxfield: 'ghost', archidekt: 'ghost2' }));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('Moxfield user not found');
  });

  it('returns status derived from first error when both sources fail with different reasons', async () => {
    mockResolveUserDecks.mockImplementation((_username, platform) => {
      if (platform === 'moxfield')
        return Promise.reject(new FetchError('moxfield', 'auth_required', 'Cloudflare blocked request'));
      return Promise.reject(new FetchError('archidekt', 'not_found', 'Archidekt user not found'));
    });

    const res = await GET(makeRequest({ moxfield: 'moxuser', archidekt: 'ghost' }));
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe('Cloudflare blocked request');
  });
});
