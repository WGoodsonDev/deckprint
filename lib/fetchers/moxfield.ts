import { FetchError } from '@/types/errors';
import type {
  MoxfieldDeckListResponse,
  MoxfieldDeckResponse,
  MoxfieldDeckSummary,
} from '@/types/moxfield';

const MOXFIELD_API_BASE = 'https://api2.moxfield.com';
const FETCH_TIMEOUT_MS = 10_000;

function handleMoxfieldResponse(response: Response, context: string): void {
  if (response.status === 429) {
    throw new FetchError('moxfield', 'rate_limited', `Rate limited: ${context}`, 429);
  }
  if (response.status === 401 || response.status === 403) {
    throw new FetchError(
      'moxfield',
      'auth_required',
      `Auth required: ${context}`,
      response.status
    );
  }
  if (!response.ok) {
    throw new FetchError(
      'moxfield',
      'unknown',
      `Unexpected status ${response.status}: ${context}`,
      response.status
    );
  }
}

async function fetchDecksPage(
  username: string,
  pageNumber: number
): Promise<MoxfieldDeckListResponse> {
  const url = `${MOXFIELD_API_BASE}/v2/users/${encodeURIComponent(username)}/decks?pageSize=100&pageNumber=${pageNumber}`;
  let response: Response;

  try {
    response = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  } catch {
    throw new FetchError(
      'moxfield',
      'network_error',
      `Network error fetching Moxfield decks for "${username}"`
    );
  }

  handleMoxfieldResponse(response, `decks for "${username}" page ${pageNumber}`);
  return response.json() as Promise<MoxfieldDeckListResponse>;
}

// Returns all public decks for a Moxfield user (all pages assembled).
// Returns an empty array if the user is not found (404).
export async function fetchMoxfieldUserDecks(
  username: string
): Promise<MoxfieldDeckSummary[]> {
  const url = `${MOXFIELD_API_BASE}/v2/users/${encodeURIComponent(username)}/decks?pageSize=100&pageNumber=1`;
  let firstResponse: Response;

  try {
    firstResponse = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  } catch {
    throw new FetchError(
      'moxfield',
      'network_error',
      `Network error fetching Moxfield decks for "${username}"`
    );
  }

  if (firstResponse.status === 404) return [];

  handleMoxfieldResponse(firstResponse, `decks for "${username}"`);

  const first = (await firstResponse.json()) as MoxfieldDeckListResponse;
  if (first.totalPages <= 1) return first.data;

  const allDecks = [...first.data];
  for (let page = 2; page <= first.totalPages; page++) {
    const result = await fetchDecksPage(username, page);
    allDecks.push(...result.data);
  }

  return allDecks;
}

// Returns full deck data for a single deck ID.
export async function fetchMoxfieldDeck(
  deckId: string
): Promise<MoxfieldDeckResponse> {
  const url = `${MOXFIELD_API_BASE}/v2/decks/all/${encodeURIComponent(deckId)}`;
  let response: Response;

  try {
    response = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  } catch {
    throw new FetchError(
      'moxfield',
      'network_error',
      `Network error fetching Moxfield deck ${deckId}`
    );
  }

  if (response.status === 404) {
    throw new FetchError('moxfield', 'not_found', `Deck ${deckId} not found`, 404);
  }

  handleMoxfieldResponse(response, `deck ${deckId}`);
  return response.json() as Promise<MoxfieldDeckResponse>;
}
