import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchMoxfieldUserDecks,
  fetchMoxfieldDeck,
} from '@/lib/fetchers/moxfield';
import { FetchError } from '@/types/errors';

// ── Helpers ───────────────────────────────────────────────────────────────────

function mockFetch(status: number, body: unknown): void {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(body),
      text: () =>
        Promise.resolve(typeof body === 'string' ? body : JSON.stringify(body)),
    })
  );
}

function mockFetchNetworkError(): void {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network failure')));
}

function makeDeckSummary(id: string = 'deck-abc') {
  return {
    id,
    name: 'Test Deck',
    description: '',
    format: 'commander',
    areCommentsEnabled: true,
    isShared: true,
    publicUrl: `https://moxfield.com/decks/${id}`,
    publicId: id,
    likeCount: 0,
    viewCount: 0,
    commentCount: 0,
    colors: ['G'],
    colorPercentages: { G: 1 },
    colorIdentity: ['G'],
    createdAtUtc: '2024-01-01T00:00:00Z',
    lastUpdatedAtUtc: '2024-06-01T00:00:00Z',
    mainCardCount: 99,
    commanders: [],
  };
}

function makeDeckListResponse(
  data: ReturnType<typeof makeDeckSummary>[],
  totalPages = 1
) {
  return {
    pageNumber: 1,
    pageSize: 100,
    totalResults: data.length,
    totalPages,
    data,
  };
}

const MOCK_DECK_RESPONSE = {
  id: 'deck-abc',
  name: 'Test Deck',
  description: 'A commander deck',
  format: 'commander',
  publicUrl: 'https://moxfield.com/decks/deck-abc',
  createdAtUtc: '2024-01-01T00:00:00Z',
  lastUpdatedAtUtc: '2024-06-01T00:00:00Z',
  commanders: {},
  companions: {},
  mainboard: {},
  sideboard: {},
};

// ── fetchMoxfieldUserDecks ────────────────────────────────────────────────────

describe('fetchMoxfieldUserDecks', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('returns deck summaries on a single-page response', async () => {
    mockFetch(200, makeDeckListResponse([makeDeckSummary()]));
    const result = await fetchMoxfieldUserDecks('testuser');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('deck-abc');
  });

  it('assembles multi-page results in order', async () => {
    const page1Summary = makeDeckSummary('deck-1');
    const page2Summary = makeDeckSummary('deck-2');

    vi.stubGlobal(
      'fetch',
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              pageNumber: 1,
              pageSize: 100,
              totalResults: 2,
              totalPages: 2,
              data: [page1Summary],
            }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              pageNumber: 2,
              pageSize: 100,
              totalResults: 2,
              totalPages: 2,
              data: [page2Summary],
            }),
        })
    );

    const result = await fetchMoxfieldUserDecks('testuser');
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('deck-1');
    expect(result[1].id).toBe('deck-2');
  });

  it('returns empty array on 404 (user not found)', async () => {
    mockFetch(404, {});
    const result = await fetchMoxfieldUserDecks('nobody');
    expect(result).toEqual([]);
  });

  it('throws FetchError with auth_required on 403', async () => {
    mockFetch(403, {});
    await expect(fetchMoxfieldUserDecks('testuser')).rejects.toMatchObject({
      reason: 'auth_required',
      statusCode: 403,
      platform: 'moxfield',
    });
  });

  it('throws FetchError with rate_limited on 429', async () => {
    mockFetch(429, {});
    await expect(fetchMoxfieldUserDecks('testuser')).rejects.toMatchObject({
      reason: 'rate_limited',
      statusCode: 429,
    });
  });

  it('throws FetchError with network_error on network failure', async () => {
    mockFetchNetworkError();
    let caught: unknown;
    try {
      await fetchMoxfieldUserDecks('testuser');
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(FetchError);
    expect(caught).toMatchObject({ reason: 'network_error', platform: 'moxfield' });
  });
});

// ── fetchMoxfieldDeck ─────────────────────────────────────────────────────────

describe('fetchMoxfieldDeck', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('returns full deck data on success', async () => {
    mockFetch(200, MOCK_DECK_RESPONSE);
    const result = await fetchMoxfieldDeck('deck-abc');
    expect(result.id).toBe('deck-abc');
    expect(result.name).toBe('Test Deck');
  });

  it('throws FetchError with not_found on 404', async () => {
    mockFetch(404, {});
    await expect(fetchMoxfieldDeck('deck-abc')).rejects.toMatchObject({
      reason: 'not_found',
      statusCode: 404,
    });
  });

  it('throws FetchError with auth_required on 403', async () => {
    mockFetch(403, {});
    await expect(fetchMoxfieldDeck('deck-abc')).rejects.toMatchObject({
      reason: 'auth_required',
      statusCode: 403,
      platform: 'moxfield',
    });
  });

  it('throws FetchError with rate_limited on 429', async () => {
    mockFetch(429, {});
    await expect(fetchMoxfieldDeck('deck-abc')).rejects.toMatchObject({
      reason: 'rate_limited',
      statusCode: 429,
    });
  });

  it('throws FetchError with network_error on network failure', async () => {
    mockFetchNetworkError();
    await expect(fetchMoxfieldDeck('deck-abc')).rejects.toMatchObject({
      reason: 'network_error',
      platform: 'moxfield',
    });
  });
});
