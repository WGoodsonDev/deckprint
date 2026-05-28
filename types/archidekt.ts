// External API types for Archidekt responses.
// Verified via live API testing May 2026. See /docs/api-reference.md.

export interface ArchidektDeckResponse {
  id: number;
  name: string;
  description: string;
  deckFormat: number;
  owner: { username: string };
  createdAt: string;
  updatedAt: string;
  categories: ArchidektDeckCategory[];
  private: boolean;
  unlisted: boolean;
}

export interface ArchidektDeckCategory {
  id: number;
  name: string;
  isPremier: boolean;
  includedInDeck: boolean;
  includedInPrice: boolean;
}

// GET /decks/{id}/cards/ returns this array directly
export type ArchidektCardsResponse = ArchidektCard[];

export interface ArchidektCard {
  quantity: number;
  // User-defined category names (e.g. "Creature", "Commander"). May be null
  // on older decks. Board type is inferred by checking for the specific strings
  // "Commander", "Sideboard", "Companion" — everything else is mainboard.
  categories: string[] | null;
  modifier: 'Normal' | 'Foil' | 'Etched';
  card: {
    uid: string;
    oracleCard: ArchidektOracleCard;
    edition: {
      editioncode: string;
    };
  };
}

export interface ArchidektOracleCard {
  name: string;
  // Field is "manaCost", not "manaSymbols" — e.g. "{2}{G}{G}"
  manaCost: string;
  cmc: number;
  // Field is "types" (string[]), not "typeLine" (string)
  types: string[];
  // Full English color names: "Green", "Black" — NOT single letters "G", "B"
  colorIdentity: string[];
  colors: string[];
  // Non-empty only for double-faced cards
  faces: ArchidektFace[];
}

export interface ArchidektFace {
  name: string;
  manaCost: string;
  types: string[];
  colors: string[];
}

// Deck list (requires authentication as of May 2026)
export interface ArchidektDeckListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ArchidektDeckSummary[];
}

export interface ArchidektDeckSummary {
  id: number;
  name: string;
  owner: { username: string };
  deckFormat: number;
  featured: string;
  createdAt: string;
  updatedAt: string;
  cardCount: number;
}
