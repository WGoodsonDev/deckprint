# Data Model

This document defines the internal data model for Deckprint. All normalizers
must map to these types. All aggregators must consume these types. External API
response types are defined separately in `/docs/api-reference.md`.

---

## Core Types

### `CardEntry`
Represents a single card as it appears in a deck.

```typescript
interface CardEntry {
  // Identification
  scryfallId: string;          // Scryfall ID — the canonical cross-platform identifier
  name: string;                // Card name (exact, as it appears on Scryfall)
  quantity: number;            // Number of copies in the deck

  // Classification
  boardType: 'mainboard'       // Standard deck slot
            | 'sideboard'      // Sideboard (constructed formats)
            | 'commander'      // Commander zone
            | 'companion';     // Companion zone

  // Mana & Cost
  manaCost: string | null;     // Raw mana cost string e.g. "{2}{G}{G}"
  cmc: number;                 // Converted mana cost (numeric)
  colors: Color[];             // Colors of the card itself
  colorIdentity: Color[];      // Full color identity (includes pip-less identity)

  // Type
  typeLine: string;            // Full type line e.g. "Legendary Creature — Elf Druid"
  superTypes: string[];        // e.g. ["Legendary", "Snow"]
  cardTypes: CardType[];       // e.g. ["Creature", "Enchantment"]
  subTypes: string[];          // e.g. ["Elf", "Druid"]

  // Metadata
  setCode: string;             // e.g. "MH3"
  isCommander: boolean;        // True if this card is the deck's commander
  isFoil: boolean;
  isProxy: boolean;
}
```

### `Deck`
Represents a single deck belonging to a user.

```typescript
interface Deck {
  // Identification
  id: string;                  // Internal app ID (platform-prefixed, e.g. "moxfield:abc123")
  sourcePlatform: Platform;    // Where this deck was fetched from
  sourceId: string;            // The platform's own deck ID
  sourceUrl: string;           // Direct link back to the deck on its platform

  // Metadata
  name: string;
  description: string | null;
  format: Format;
  colorIdentity: Color[];      // Union of all commander/card color identities
  commanders: CardEntry[];     // Empty array for non-Commander formats

  // Cards
  mainboard: CardEntry[];
  sideboard: CardEntry[];
  companions: CardEntry[];

  // Stats (pre-computed at normalization time for performance)
  cardCount: number;           // Total mainboard card count
  uniqueCardCount: number;     // Distinct card names in mainboard

  // Inclusion — always true as returned by the server; deck filtering is
  // applied at the API route level via the ?include= query param, not by
  // toggling this field.
  includedInProfile: boolean;

  // Timestamps
  createdAt: string;           // ISO 8601
  updatedAt: string;           // ISO 8601
}
```

### `UserProfile`
Represents a user's full cross-platform deck collection as loaded into the app.

```typescript
interface UserProfile {
  sources: PlatformSource[];      // One entry per connected platform that succeeded
  sourceErrors?: SourceError[];   // Omitted entirely when all sources succeed
  decks: Deck[];                  // All fetched decks, across all platforms
  fetchedAt: string;              // ISO 8601 — when this profile was last fetched
}

interface PlatformSource {
  platform: Platform;
  username: string;
  deckCount: number;
}

interface SourceError {
  platform: Platform;
  username: string;
  reason: FetchErrorReason;   // from /types/errors — not redeclared here
  message: string;
}
```

---

## Enum / Union Types

```typescript
type Color = 'W' | 'U' | 'B' | 'R' | 'G' | 'C';  // C = Colorless

type Platform = 'moxfield' | 'archidekt';

type Format =
  | 'commander'
  | 'pioneer'
  | 'modern'
  | 'standard'
  | 'legacy'
  | 'vintage'
  | 'pauper'
  | 'draft'
  | 'sealed'
  | 'other';

type CardType =
  | 'Creature'
  | 'Instant'
  | 'Sorcery'
  | 'Enchantment'
  | 'Artifact'
  | 'Planeswalker'
  | 'Land'
  | 'Battle'
  | 'Kindred'
  | 'Other';
```

---

## Aggregation Output Types
These are the types that aggregators return and the dashboard consumes.

```typescript
interface ProfileStats {
  colorProfile: ColorProfile;
  curveProfile: CurveProfile;
  recencyProfile: RecencyProfile;
  cardOverlap: CardOverlapProfile;
  cardTypeProfile: CardTypeProfile;
  sourceErrors?: SourceError[];   // Passed through from the API route, not produced by aggregators
}

interface ColorProfile {
  // What fraction of decks include each color (0–1)
  colorFrequency: Record<Color, number>;
  // How many decks are exactly each color identity combination
  identityDistribution: Record<string, number>; // e.g. {"WUB": 4, "G": 1}
  mostPlayedColor: Color;
}

interface CurveProfile {
  // Average CMC distribution across all included decks
  averageCurve: Record<number, number>; // cmc → average card count at that cmc
  overallAverageCmc: number;
}

interface RecencyProfile {
  // Deck counts by age bucket, based on updatedAt
  within30Days: number;
  within90Days: number;
  within365Days: number;
  olderThan365Days: number;
  mostRecentDeck: { name: string; updatedAt: string } | null;
}

interface CardOverlapProfile {
  // Cards appearing in 3+ decks, sorted by deckCount descending
  staples: StapleEntry[];
}

interface StapleEntry {
  scryfallId: string;
  name: string;
  deckCount: number;             // How many decks include this card
  totalCopies: number;           // Sum of quantity across all decks
}

interface CardTypeProfile {
  // Average count per CardType across all included decks (per-deck-then-average)
  // Primary type only: card.cardTypes[0], or 'Other' if cardTypes is empty
  averageByType: Record<CardType, number>;
}
```

---

## Notes

- **Scryfall as the canonical source:** `scryfallId` is the cross-platform
  identifier of record. Both Moxfield and Archidekt expose Scryfall IDs.
  Normalizers must always resolve to this ID.
- **Deck filtering** is applied at the API route level via `?include=<id,id,...>`
  on `/api/stats`. The `includedInProfile` field on `Deck` is always `true` as
  returned by the server; it is not toggled by the client.
- **Staple threshold** is 3+ decks (`STAPLE_THRESHOLD = 3` in `overlap.ts`).
  Basic lands are excluded by supertype guard (`superTypes.includes('Basic')`),
  which covers Snow-Covered basics and Wastes automatically.
- **`Format` values** should be normalized to lowercase at normalization time.
  Unknown formats map to `'other'`.
