import { FetchError } from '@/types/errors';
import type {
  ArchidektCardsResponse,
  ArchidektDeckResponse,
  ArchidektNextData,
  ArchidektProfileDeckSummary,
} from '@/types/archidekt';

const ARCHIDEKT_API_BASE = 'https://archidekt.com/api';
const ARCHIDEKT_PROFILE_BASE = 'https://archidekt.com/u';
const FETCH_TIMEOUT_MS = 10_000;

// Matches the <script id="__NEXT_DATA__"> tag Next.js injects into SSR pages
const NEXT_DATA_PATTERN =
  /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/;

export async function fetchUserDeckSummaries(
  username: string
): Promise<ArchidektProfileDeckSummary[]> {
  const url = `${ARCHIDEKT_PROFILE_BASE}/${encodeURIComponent(username)}`;
  let response: Response;

  try {
    response = await fetch(url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch {
    throw new FetchError(
      'archidekt',
      'network_error',
      `Network error fetching Archidekt profile for "${username}"`
    );
  }

  if (response.status === 404) {
    return [];
  }

  if (response.status === 429) {
    throw new FetchError(
      'archidekt',
      'rate_limited',
      `Rate limited fetching Archidekt profile for "${username}"`,
      429
    );
  }

  if (response.status === 401 || response.status === 403) {
    throw new FetchError(
      'archidekt',
      'auth_required',
      `Auth required fetching Archidekt profile for "${username}"`,
      response.status
    );
  }

  if (!response.ok) {
    throw new FetchError(
      'archidekt',
      'unknown',
      `Unexpected status ${response.status} fetching profile for "${username}"`,
      response.status
    );
  }

  const html = await response.text();
  const match = html.match(NEXT_DATA_PATTERN);

  if (!match) {
    throw new FetchError(
      'archidekt',
      'unknown',
      `__NEXT_DATA__ not found in profile page for "${username}"`
    );
  }

  let data: ArchidektNextData;
  try {
    // Cast is justified: we've matched the script tag and the shape is
    // defined by Archidekt's SSR output for user profile pages.
    data = JSON.parse(match[1]) as ArchidektNextData;
  } catch {
    throw new FetchError(
      'archidekt',
      'unknown',
      `Failed to parse __NEXT_DATA__ for "${username}"`
    );
  }

  const decks = data?.props?.pageProps?.user?.decks;

  if (!Array.isArray(decks)) {
    return [];
  }

  return decks.filter((deck) => !deck.private && !deck.unlisted);
}

export async function fetchDeckMetadata(
  deckId: number
): Promise<ArchidektDeckResponse> {
  const url = `${ARCHIDEKT_API_BASE}/decks/${deckId}/`;
  let response: Response;

  try {
    response = await fetch(url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch {
    throw new FetchError(
      'archidekt',
      'network_error',
      `Network error fetching metadata for deck ${deckId}`
    );
  }

  if (response.status === 404) {
    throw new FetchError('archidekt', 'not_found', `Deck ${deckId} not found`, 404);
  }

  if (response.status === 429) {
    throw new FetchError(
      'archidekt',
      'rate_limited',
      `Rate limited fetching deck ${deckId}`,
      429
    );
  }

  if (response.status === 401 || response.status === 403) {
    throw new FetchError(
      'archidekt',
      'auth_required',
      `Auth required fetching deck ${deckId}`,
      response.status
    );
  }

  if (!response.ok) {
    throw new FetchError(
      'archidekt',
      'unknown',
      `Unexpected status ${response.status} fetching deck ${deckId}`,
      response.status
    );
  }

  return response.json() as Promise<ArchidektDeckResponse>;
}

export async function fetchDeckCards(
  deckId: number
): Promise<ArchidektCardsResponse> {
  const url = `${ARCHIDEKT_API_BASE}/decks/${deckId}/cards/`;
  let response: Response;

  try {
    response = await fetch(url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch {
    throw new FetchError(
      'archidekt',
      'network_error',
      `Network error fetching cards for deck ${deckId}`
    );
  }

  if (response.status === 404) {
    throw new FetchError(
      'archidekt',
      'not_found',
      `Deck ${deckId} not found`,
      404
    );
  }

  if (response.status === 429) {
    throw new FetchError(
      'archidekt',
      'rate_limited',
      `Rate limited fetching cards for deck ${deckId}`,
      429
    );
  }

  if (response.status === 401 || response.status === 403) {
    throw new FetchError(
      'archidekt',
      'auth_required',
      `Auth required fetching cards for deck ${deckId}`,
      response.status
    );
  }

  if (!response.ok) {
    throw new FetchError(
      'archidekt',
      'unknown',
      `Unexpected status ${response.status} fetching cards for deck ${deckId}`,
      response.status
    );
  }

  return response.json() as Promise<ArchidektCardsResponse>;
}
