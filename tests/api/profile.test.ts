import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/profile/route';
import { FetchError } from '@/types/errors';
import { makeDeck } from '../aggregators/fixtures';

vi.mock('@/lib/userDecks', () => ({
  resolveUserDecks: vi.fn(),
}));

import { resolveUserDecks } from '@/lib/userDecks';

const mockResolveUserDecks = vi.mocked(resolveUserDecks);

function makeRequest(params: Record<string, string>): NextRequest {
  const url = new URL('http://localhost/api/profile');
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  return new NextRequest(url.toString());
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/profile', () => {
  it('returns 200 with one source entry for archidekt-only request', async () => {
    const decks = [makeDeck({ id: 'archidekt:1' }), makeDeck({ id: 'archidekt:2' })];
    mockResolveUserDecks.mockResolvedValue(decks);

    const res = await GET(makeRequest({ archidekt: 'testuser' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.sources).toHaveLength(1);
    expect(body.sources[0]).toEqual({ platform: 'archidekt', username: 'testuser', deckCount: 2 });
    expect(body.decks).toHaveLength(2);
    expect(mockResolveUserDecks).toHaveBeenCalledWith('testuser', 'archidekt');
  });

  it('returns 200 with one source entry for moxfield-only request', async () => {
    const decks = [makeDeck({ id: 'moxfield:1' })];
    mockResolveUserDecks.mockResolvedValue(decks);

    const res = await GET(makeRequest({ moxfield: 'moxuser' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.sources).toHaveLength(1);
    expect(body.sources[0]).toEqual({ platform: 'moxfield', username: 'moxuser', deckCount: 1 });
    expect(body.decks).toHaveLength(1);
    expect(mockResolveUserDecks).toHaveBeenCalledWith('moxuser', 'moxfield');
  });

  it('returns 200 with two source entries and merged decks when both platforms provided', async () => {
    const archiDecks = [makeDeck({ id: 'archidekt:1' }), makeDeck({ id: 'archidekt:2' })];
    const moxDecks = [makeDeck({ id: 'moxfield:1' })];
    mockResolveUserDecks.mockImplementation((_username, platform) =>
      Promise.resolve(platform === 'archidekt' ? archiDecks : moxDecks)
    );

    const res = await GET(makeRequest({ archidekt: 'archiuser', moxfield: 'moxuser' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.sources).toHaveLength(2);
    expect(body.sources.find((s: { platform: string }) => s.platform === 'moxfield')).toEqual({
      platform: 'moxfield', username: 'moxuser', deckCount: 1,
    });
    expect(body.sources.find((s: { platform: string }) => s.platform === 'archidekt')).toEqual({
      platform: 'archidekt', username: 'archiuser', deckCount: 2,
    });
    expect(body.decks).toHaveLength(3);
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

  it('returns 403 when resolveUserDecks throws FetchError auth_required', async () => {
    mockResolveUserDecks.mockRejectedValue(
      new FetchError('moxfield', 'auth_required', 'Cloudflare blocked request')
    );

    const res = await GET(makeRequest({ moxfield: 'moxuser' }));
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe('Cloudflare blocked request');
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

  it('returns 200 with partial data when one source fails with auth_required', async () => {
    const archiDecks = [makeDeck({ id: 'archidekt:1' }), makeDeck({ id: 'archidekt:2' })];
    mockResolveUserDecks.mockImplementation((_username, platform) => {
      if (platform === 'moxfield')
        return Promise.reject(new FetchError('moxfield', 'auth_required', 'Cloudflare blocked request'));
      return Promise.resolve(archiDecks);
    });

    const res = await GET(makeRequest({ moxfield: 'moxuser', archidekt: 'archiuser' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.sources).toHaveLength(1);
    expect(body.sources[0].platform).toBe('archidekt');
    expect(body.decks).toHaveLength(2);
    expect(body.sourceErrors).toHaveLength(1);
    expect(body.sourceErrors[0]).toMatchObject({
      platform: 'moxfield',
      username: 'moxuser',
      reason: 'auth_required',
    });
  });

  it('returns 200 with partial data when one source fails with not_found', async () => {
    const archiDecks = [makeDeck({ id: 'archidekt:1' })];
    mockResolveUserDecks.mockImplementation((_username, platform) => {
      if (platform === 'moxfield')
        return Promise.reject(new FetchError('moxfield', 'not_found', 'User not found'));
      return Promise.resolve(archiDecks);
    });

    const res = await GET(makeRequest({ moxfield: 'ghost', archidekt: 'archiuser' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.sources).toHaveLength(1);
    expect(body.decks).toHaveLength(1);
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
