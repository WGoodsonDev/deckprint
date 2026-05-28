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
Community-reverse-engineered. No official documentation. Has historically been
available for public deck data without authentication. Subject to change without
notice. Monitor for 401/403 responses as a signal that access has been restricted.

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
usage. Still treat as unofficial — no SLA or versioning guarantees.

---

### Endpoints

#### List a User's Decks
```
GET /decks/?owner={username}&formats={formatId}
```

**Query Parameters**

| Parameter | Type   | Notes                                           |
|-----------|--------|-------------------------------------------------|
| owner     | string | Archidekt username                              |
| formats   | number | Optional format filter — omit to fetch all      |
| page      | number | 1-indexed pagination                            |
| pageSize  | number | Default 48                                      |
| orderBy   | string | e.g. "lastUpdate", "-lastUpdate" for descending |

**Response Shape (abbreviated)**
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
  format: number;               // Numeric format ID — see Format Map below
  featured: string;             // Featured card name
  deckColors: {
    colorIdentity: string[];    // e.g. ["B", "G", "U"]
  };
  createdAt: string;            // ISO 8601
  updatedAt: string;            // ISO 8601
  cardCount: number;
}
```

**Archidekt Format ID Map**
```typescript
// NOTE: This map may require updates as Archidekt adds new formats.
// Flag as a maintenance point during each audit.
const ARCHIDEKT_FORMAT_MAP: Record<number, Format> = {
  1:  'standard',
  2:  'modern',
  3:  'legacy',
  4:  'vintage',
  5:  'commander',
  6:  'pauper',
  9:  'pioneer',
  10: 'draft',
  11: 'sealed',
  // All others → 'other'
};
```

---

#### Get Full Deck
```
GET /decks/{deckId}/small/
```

**Response Shape (abbreviated)**
```typescript
interface ArchidektDeckResponse {
  id: number;
  name: string;
  description: string;
  format: number;
  owner: { username: string };
  createdAt: string;
  updatedAt: string;
  cards: ArchidektCard[];
}

interface ArchidektCard {
  quantity: number;
  categories: string[];         // e.g. ["Commander"], ["Mainboard"], ["Sideboard"]
  modifier: 'Normal' | 'Foil' | 'Etched';
  card: {
    uid: string;                // Scryfall ID — canonical identifier
    oracleCard: {
      name: string;
      manaSymbols: string;      // Raw mana cost string e.g. "{2}{G}{G}"
      cmc: number;
      typeLine: string;
      colorIdentity: string[];
      colors: string[];
    };
    edition: {
      editioncode: string;      // Set code e.g. "MH3"
    };
  }
}
```

**Notes**
- Board type is inferred from `categories`. Map as follows:
  - `categories` includes `"Commander"` → `boardType: 'commander'`
  - `categories` includes `"Sideboard"` → `boardType: 'sideboard'`
  - `categories` includes `"Companion"` → `boardType: 'companion'`
  - All others → `boardType: 'mainboard'`
- `card.uid` is the Scryfall ID and must be used as `scryfallId`.
- `modifier` maps to `isFoil: true` when value is `'Foil'` or `'Etched'`.
- Archidekt does not expose an `isProxy` field. Default to `false`.

---

## Error Handling Expectations

All fetchers must handle the following cases explicitly:

| Scenario                  | Expected behavior                                       |
|---------------------------|---------------------------------------------------------|
| Username not found        | Return empty deck list, do not throw                    |
| API unreachable (network) | Throw a typed `FetchError` with `platform` and `reason` |
| Rate limited (429)        | Throw a typed `FetchError`, surface to UI               |
| Unexpected shape          | Log a warning, skip the offending deck, continue        |
| Empty deck list           | Return empty array — valid state, not an error          |

```typescript
interface FetchError {
  platform: Platform;
  reason: 'not_found' | 'rate_limited' | 'network_error' | 'unknown';
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
- Response shapes documented here are based on community observation as of
  early 2026. Validate shapes at runtime and fail gracefully if fields are
  missing or renamed.
