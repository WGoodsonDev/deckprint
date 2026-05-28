import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchUserDeckSummaries,
  fetchDeckMetadata,
  fetchDeckCards,
} from '@/lib/fetchers/archidekt';
import { FetchError } from '@/types/errors';

// ── Helpers ───────────────────────────────────────────────────────────────────

function mockFetch(status: number, body: unknown): void {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(body),
      text: () => Promise.resolve(typeof body === 'string' ? body : JSON.stringify(body)),
    })
  );
}

function mockFetchNetworkError(): void {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network failure')));
}

function makeProfileHtml(decks: unknown[]): string {
  const nextData = {
    props: { pageProps: { user: { decks } } },
  };
  return `<html><head></head><body><script id="__NEXT_DATA__" type="application/json">${JSON.stringify(nextData)}</script></body></html>`;
}

const MOCK_DECK_SUMMARY = {
  id: 42,
  name: 'Test Deck',
  deckFormat: 5,
  updatedAt: '2024-01-01T00:00:00Z',
  private: false,
  unlisted: false,
  colors: { W: 0, U: 0, B: 0, R: 0, G: 10 },
  featured: '',
  theorycrafted: false,
};

const MOCK_DECK_METADATA = {
  id: 42,
  name: 'Test Deck',
  description: '',
  deckFormat: 5,
  owner: { username: 'testuser' },
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  categories: [],
  private: false,
  unlisted: false,
};

const MOCK_CARDS = [
  {
    quantity: 1,
    categories: ['Creature'],
    modifier: 'Normal',
    card: {
      uid: 'abc-123',
      oracleCard: {
        name: 'Llanowar Elves',
        manaCost: '{G}',
        cmc: 1,
        types: ['Creature'],
        superTypes: [],
        subTypes: ['Elf', 'Druid'],
        colorIdentity: ['Green'],
        colors: ['Green'],
        faces: [],
      },
      edition: { editioncode: 'dom' },
    },
  },
];

// ── fetchUserDeckSummaries ────────────────────────────────────────────────────

describe('fetchUserDeckSummaries', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('returns public deck summaries from __NEXT_DATA__', async () => {
    mockFetch(200, makeProfileHtml([MOCK_DECK_SUMMARY]));
    const result = await fetchUserDeckSummaries('testuser');
    // fetch receives HTML as text(), so mock text() returns the HTML string
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(42);
  });

  it('filters out private decks', async () => {
    const privateDeck = { ...MOCK_DECK_SUMMARY, private: true };
    mockFetch(200, makeProfileHtml([MOCK_DECK_SUMMARY, privateDeck]));
    const result = await fetchUserDeckSummaries('testuser');
    expect(result).toHaveLength(1);
  });

  it('filters out unlisted decks', async () => {
    const unlistedDeck = { ...MOCK_DECK_SUMMARY, id: 99, unlisted: true };
    mockFetch(200, makeProfileHtml([MOCK_DECK_SUMMARY, unlistedDeck]));
    const result = await fetchUserDeckSummaries('testuser');
    expect(result).toHaveLength(1);
  });

  it('returns empty array for a 404 response', async () => {
    mockFetch(404, '');
    const result = await fetchUserDeckSummaries('nobody');
    expect(result).toEqual([]);
  });

  it('returns empty array when user has no decks', async () => {
    mockFetch(200, makeProfileHtml([]));
    const result = await fetchUserDeckSummaries('emptyuser');
    expect(result).toEqual([]);
  });

  it('throws FetchError with network_error on network failure', async () => {
    mockFetchNetworkError();
    await expect(fetchUserDeckSummaries('testuser')).rejects.toBeInstanceOf(
      FetchError
    );
    await expect(fetchUserDeckSummaries('testuser')).rejects.toMatchObject({
      reason: 'network_error',
      platform: 'archidekt',
    });
  });

  it('throws FetchError with unknown on non-200 non-404 status', async () => {
    mockFetch(500, '');
    await expect(fetchUserDeckSummaries('testuser')).rejects.toMatchObject({
      reason: 'unknown',
      statusCode: 500,
    });
  });
});

// ── fetchDeckMetadata ────────────────────────────────────────────────────────

describe('fetchDeckMetadata', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('returns deck metadata on success', async () => {
    mockFetch(200, MOCK_DECK_METADATA);
    const result = await fetchDeckMetadata(42);
    expect(result.id).toBe(42);
    expect(result.name).toBe('Test Deck');
  });

  it('throws FetchError with not_found on 404', async () => {
    mockFetch(404, {});
    await expect(fetchDeckMetadata(42)).rejects.toMatchObject({
      reason: 'not_found',
      statusCode: 404,
    });
  });

  it('throws FetchError with rate_limited on 429', async () => {
    mockFetch(429, {});
    await expect(fetchDeckMetadata(42)).rejects.toMatchObject({
      reason: 'rate_limited',
      statusCode: 429,
    });
  });

  it('throws FetchError with auth_required on 401', async () => {
    mockFetch(401, {});
    await expect(fetchDeckMetadata(42)).rejects.toMatchObject({
      reason: 'auth_required',
      statusCode: 401,
    });
  });

  it('throws FetchError with network_error on network failure', async () => {
    mockFetchNetworkError();
    await expect(fetchDeckMetadata(42)).rejects.toMatchObject({
      reason: 'network_error',
      platform: 'archidekt',
    });
  });
});

// ── fetchDeckCards ────────────────────────────────────────────────────────────

describe('fetchDeckCards', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('returns card array on success', async () => {
    mockFetch(200, MOCK_CARDS);
    const result = await fetchDeckCards(42);
    expect(result).toHaveLength(1);
    expect(result[0].card.uid).toBe('abc-123');
  });

  it('throws FetchError with not_found on 404', async () => {
    mockFetch(404, {});
    await expect(fetchDeckCards(42)).rejects.toMatchObject({
      reason: 'not_found',
      statusCode: 404,
    });
  });

  it('throws FetchError with rate_limited on 429', async () => {
    mockFetch(429, {});
    await expect(fetchDeckCards(42)).rejects.toMatchObject({
      reason: 'rate_limited',
      statusCode: 429,
    });
  });

  it('throws FetchError with auth_required on 403', async () => {
    mockFetch(403, {});
    await expect(fetchDeckCards(42)).rejects.toMatchObject({
      reason: 'auth_required',
      statusCode: 403,
    });
  });

  it('throws FetchError with network_error on network failure', async () => {
    mockFetchNetworkError();
    await expect(fetchDeckCards(42)).rejects.toMatchObject({
      reason: 'network_error',
    });
  });
});
