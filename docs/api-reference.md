# API Reference

This document covers the external APIs consumed by Deckprint. These are
community-documented endpoints — neither Moxfield nor Archidekt officially
publishes a supported public API. Treat all endpoints as potentially unstable.
All fetchers must fail gracefully and surface errors clearly.

All raw response types defined here are distinct from internal types defined in
`/docs/data-model.md`. Normalizers are responsible for the mapping between them.

---

## Moxfield

### Base URL
```
https://api2.moxfield.com
```

### Known Stability
Community-reverse-engineered. No official documentation. **As of May 2026,
all server-side requests are blocked by Cloudflare WAF (HTTP 403), regardless
of User-Agent.** The API appears to require browser-originated requests with
valid challenge cookies. This is a critical open risk for Phase 2 — the
fetcher strategy for Moxfield must be resolved before implementation begins.
Response shapes below are based on prior community documentation and have not
been directly verified via API testing.

---

### Endpoints

#### List a User's Decks
```
GET /v2/users/{username}/decks
```

**Query Parameters**

| Parameter     | Type   | Default      | Notes                             |
|---------------|--------|--------------|-----------------------------------|
| pageNumber    | number | 1            | 1-indexed                         |
| pageSize      | number | 12           | Max observed: 100                 |
| sortType      | string | "updated"    | Also accepts "name", "created"    |
| sortDirection | string | "descending" | Also accepts "ascending"          |

**Response Shape (abbreviated)**
```typescript
interface MoxfieldDeckListResponse {
  pageNumber: number;
  pageSize: number;
  totalResults: number;
  totalPages: number;
  data: MoxfieldDeckSummary[];
}

interface MoxfieldDeckSummary {
  id: string;                   // Deck ID — use for full deck fetch
  name: string;
  description: string;
  format: string;               // e.g. "commander", "pioneer" — normalize to Format
  areCommentsEnabled: boolean;
  isShared: boolean;
  publicUrl: string;
  publicId: string;
  likeCount: number;
  viewCount: number;
  commentCount: number;
  colors: string[];             // e.g. ["W", "U", "B"]
  colorPercentages: Record<string, number>;
  colorIdentity: string[];
  createdAtUtc: string;         // ISO 8601
  lastUpdatedAtUtc: string;     // ISO 8601
  mainCardCount: number;
  commanders: MoxfieldCardSummary[];
}

interface MoxfieldCardSummary {
  quantity: number;
  card: {
    id: string;                 // Moxfield internal ID — do not use as canonical
    uniqueCardId: string;       // Scryfall ID — use this as canonical scryfallId
    name: string;
    cmc: number;
    type_line: string;
    color_identity: string[];
    colors: string[];
    mana_cost: string;
    set: string;                // Set code e.g. "MH3"
  }
}
```

**Notes**
- Pagination is required for users with more than 100 decks. Fetch all pages
  before normalizing.
- `isShared` does not reliably indicate public visibility. Treat all results
  from this endpoint as public.

---

#### Get Full Deck
```
GET /v2/decks/all/{deckId}
```

**Response Shape (abbreviated)**
```typescript
interface MoxfieldDeckResponse {
  id: string;
  name: string;
  description: string;
  format: string;
  publicUrl: string;
  createdAtUtc: string;
  lastUpdatedAtUtc: string;
  commanders: Record<string, MoxfieldDeckCard>;
  companions: Record<string, MoxfieldDeckCard>;
  mainboard: Record<string, MoxfieldDeckCard>;
  sideboard: Record<string, MoxfieldDeckCard>;
}

interface MoxfieldDeckCard {
  quantity: number;
  isFoil: boolean;
  isProxy: boolean;
  card: {
    uniqueCardId: string;       // Scryfall ID — canonical identifier
    name: string;
    mana_cost: string | null;
    cmc: number;
    type_line: string;
    color_identity: string[];
    colors: string[];
    set: string;
  }
}
```

**Notes**
- `commanders`, `companions`, `mainboard`, and `sideboard` are all keyed
  objects (not arrays). Keys are card names. Iterate with `Object.values()`.
- A card's `boardType` in the internal model is inferred from which key it
  appears under in this response.
- `uniqueCardId` is the Scryfall ID and must be used as `scryfallId` in the
  internal model.

---

## Archidekt

### Base URL
```
https://archidekt.com/api
```

### Known Stability
More openly documented than Moxfield. Archidekt has acknowledged community API
usage. Still treat as unofficial — no SLA or versioning guarantees. Verified
accessible via server-side requests as of May 2026, with the endpoint changes
noted below.

---

### Endpoints

#### List a User's Decks

> **Status as of May 2026:** Requires authentication. `GET /decks/?owner=`
> returns HTTP 404 ("Client Unavailable"). `GET /decks/small/?owner=` returns
> HTTP 401. No unauthenticated list endpoint has been found. **This endpoint
> is currently a blocker for Archidekt support and must be resolved in Phase 2.**

```
GET /decks/small/?owner={username}   ← requires authentication (401)
```

**Query Parameters**

| Parameter | Type   | Notes                                           |
|-----------|--------|-------------------------------------------------|
| owner     | string | Archidekt username                              |
| formats   | number | Optional format filter — omit to fetch all      |
| page      | number | 1-indexed pagination                            |
| pageSize  | number | Default 48                                      |
| orderBy   | string | e.g. "lastUpdate", "-lastUpdate" for descending |

**Response Shape (abbreviated — unverified, auth required)**
```typescript
interface ArchidektDeckListResponse {
  count: number;
  next: string | null;          // URL for next page, or null if last page
  previous: string | null;
  results: ArchidektDeckSummary[];
}

interface ArchidektDeckSummary {
  id: number;                   // Deck ID — use for full deck fetch
  name: string;
  owner: { username: string };
  deckFormat: number;           // Numeric format ID — see Format Map below
  featured: string;             // Featured card image URL
  createdAt: string;            // ISO 8601
  updatedAt: string;            // ISO 8601
  cardCount: number;
}
```

**Archidekt Format ID Map**

Verified against the pyrchidekt open-source library and live API sampling
(May 2026). The original community documentation had IDs 3–5 and 9 wrong.

```typescript
const ARCHIDEKT_FORMAT_MAP: Record<number, Format> = {
  1:  'standard',
  2:  'modern',
  3:  'commander',   // was incorrectly documented as 'legacy'
  4:  'legacy',      // was incorrectly documented as 'vintage'
  5:  'vintage',     // was incorrectly documented as 'commander'
  6:  'pauper',
  // 7:  custom
  // 8:  frontier / oldschool
  // 9:  future standard
  // 10: penny dreadful
  // 11: 1v1 commander
  // 12: duel commander
  // 13: brawl
  // 14: oathbreaker
  15: 'pioneer',     // was incorrectly documented as 9
  // 16: historic
  // 17: pauper commander
  // 18: alchemy
  // 19: explorer
  // 20: historic brawl
  // 21: gladiator
  // 22: premodern
  // 23: predh
  // 24: timeless
  // 25: canadian highlander
  // All others → 'other'
};
```

Note: `draft` and `sealed` are in the internal `Format` type for potential
future use but do not correspond to any known Archidekt format ID.

---

#### Get Deck Metadata
```
GET /decks/{deckId}/
GET /decks/{deckId}/small/     ← same shape, but cards array is always empty
```

**Response Shape (verified May 2026)**
```typescript
interface ArchidektDeckResponse {
  id: number;
  name: string;
  description: string;
  deckFormat: number;           // NOTE: field is "deckFormat", not "format"
  owner: { username: string };
  createdAt: string;
  updatedAt: string;
  categories: ArchidektDeckCategory[];
  private: boolean;
  unlisted: boolean;
}

interface ArchidektDeckCategory {
  id: number;
  name: string;
  isPremier: boolean;           // true for the primary board categories
  includedInDeck: boolean;
  includedInPrice: boolean;
}
```

#### Get Deck Cards
```
GET /decks/{deckId}/cards/
```

Cards are a separate endpoint — they are NOT included in the deck metadata
response above. This is a change from earlier API behavior.

**Response Shape (verified May 2026)**
```typescript
type ArchidektCardsResponse = ArchidektCard[];

interface ArchidektCard {
  quantity: number;
  categories: string[] | null;  // User-defined category names. Null on older decks.
  modifier: 'Normal' | 'Foil' | 'Etched';
  card: {
    uid: string;                // Scryfall ID — canonical identifier
    oracleCard: {
      name: string;
      manaCost: string;         // Raw mana cost string e.g. "{2}{G}{G}"
                                // NOTE: field is "manaCost", not "manaSymbols"
      cmc: number;
      types: string[];          // NOTE: field is "types" (array), not "typeLine" (string)
      colorIdentity: string[];  // Full English names: "Green", "Black" — NOT single letters
      colors: string[];         // Same: "Green", "Black" — NOT "G", "B"
      faces: ArchidektFace[];   // Non-empty only for double-faced cards
    };
    edition: {
      editioncode: string;      // Set code e.g. "mh3" (lowercase)
    };
  }
}

interface ArchidektFace {
  name: string;
  manaCost: string;
  types: string[];
  colors: string[];
}
```

**Notes**
- **Board type** is inferred from `categories`. The field contains user-defined
  category names (e.g. "Creature", "Instant") — not fixed board slot identifiers.
  Map as follows:
  - `categories` includes `"Commander"` → `boardType: 'commander'`
  - `categories` includes `"Sideboard"` → `boardType: 'sideboard'`
  - `categories` includes `"Companion"` → `boardType: 'companion'`
  - `categories` is `null` or contains anything else → `boardType: 'mainboard'`
- `card.uid` is the Scryfall ID and must be used as `scryfallId`.
- `modifier` maps to `isFoil: true` when value is `'Foil'` or `'Etched'`.
- Archidekt does not expose an `isProxy` field. Default to `false`.
- `colorIdentity` and `colors` use full English color names. Normalizer must
  map them: `"White"→"W"`, `"Blue"→"U"`, `"Black"→"B"`, `"Red"→"R"`,
  `"Green"→"G"`, `"Colorless"→"C"`.
- `edition.editioncode` is lowercase (e.g. `"mh3"`). Normalizers may uppercase
  if needed for consistency.

---

## Error Handling Expectations

All fetchers must handle the following cases explicitly:

| Scenario                  | Expected behavior                                       |
|---------------------------|---------------------------------------------------------|
| Username not found        | Return empty deck list, do not throw                    |
| API unreachable (network) | Throw a typed `FetchError` with `platform` and `reason` |
| Rate limited (429)        | Throw a typed `FetchError`, surface to UI               |
| Auth required (401/403)   | Throw a typed `FetchError` with `reason: 'auth_required'`, surface to UI |
| Unexpected shape          | Log a warning, skip the offending deck, continue        |
| Empty deck list           | Return empty array — valid state, not an error          |

```typescript
interface FetchError {
  platform: Platform;
  reason: 'not_found' | 'rate_limited' | 'auth_required' | 'network_error' | 'unknown';
  message: string;
  statusCode?: number;
}
```

---

## Notes

- **Never use Moxfield's internal `id` field on card objects** as a canonical
  identifier. Always use `uniqueCardId` (Scryfall ID).
- **Never use Archidekt's internal numeric deck `id`** as the app's deck ID.
  Prefix it: `archidekt:${id}`.
- Both APIs paginate. Fetchers are responsible for assembling all pages before
  returning. Do not expose pagination to the normalizer layer.
- Archidekt response shapes were verified via direct API testing in May 2026.
  Moxfield shapes are unverified — server-side requests are currently blocked
  by Cloudflare WAF. Validate all shapes at runtime and fail gracefully if
  fields are missing or renamed.
