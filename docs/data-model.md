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

  // Inclusion
  includedInProfile: boolean;  // Whether this deck is active in the current profile

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
  formatProfile: FormatProfile;
  cardOverlap: CardOverlapProfile;
  archetypeProfile: ArchetypeProfile;
  sourceErrors?: SourceError[];   // Omitted entirely when all sources succeed
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

interface FormatProfile {
  // Partial: formats with zero decks are omitted rather than stored as 0
  formatCounts: Partial<Record<Format, number>>;
  primaryFormat: Format;         // Most common format across decks
}

interface CardOverlapProfile {
  // Cards appearing in more than one deck
  staples: StapleEntry[];
  // Cards appearing in exactly one deck
  petCards: CardEntry[];
}

interface StapleEntry {
  scryfallId: string;
  name: string;
  deckCount: number;             // How many decks include this card
  totalCopies: number;           // Sum of quantity across all decks
}

interface ArchetypeProfile {
  // Rough breakdown inferred from curve + card type density
  aggro: number;                 // 0–1 score
  midrange: number;
  control: number;
  combo: number;
}
```

---

## Notes

- **Scryfall as the canonical source:** `scryfallId` is the cross-platform
  identifier of record. Both Moxfield and Archidekt expose Scryfall IDs.
  Normalizers must always resolve to this ID.
- **`includedInProfile`** is managed by client state, not the server. The server
  always returns all decks; the client filters by this flag before passing to
  aggregators.
- **`ArchetypeProfile` scores** are heuristic and approximate — they are
  intended for display, not precision analysis.
- **`Format` values** should be normalized to lowercase at normalization time.
  Unknown formats map to `'other'`.
