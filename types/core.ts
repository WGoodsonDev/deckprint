export type Color = 'W' | 'U' | 'B' | 'R' | 'G' | 'C';

export type Platform = 'moxfield' | 'archidekt';

export type Format =
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

export type CardType =
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

export interface CardEntry {
  scryfallId: string;
  name: string;
  quantity: number;

  boardType: 'mainboard' | 'sideboard' | 'commander' | 'companion';

  manaCost: string | null;
  cmc: number;
  colors: Color[];
  colorIdentity: Color[];

  typeLine: string;
  superTypes: string[];
  cardTypes: CardType[];
  subTypes: string[];

  setCode: string;
  isCommander: boolean;
  isFoil: boolean;
  isProxy: boolean;
}

export interface Deck {
  // Platform-prefixed to guarantee uniqueness across sources, e.g. "moxfield:abc123"
  id: string;
  sourcePlatform: Platform;
  sourceId: string;
  sourceUrl: string;

  name: string;
  description: string | null;
  format: Format;
  colorIdentity: Color[];
  commanders: CardEntry[];

  mainboard: CardEntry[];
  sideboard: CardEntry[];
  companions: CardEntry[];

  // Pre-computed at normalization time to avoid repeated iteration in aggregators
  cardCount: number;
  uniqueCardCount: number;

  // Managed by client state — server always returns all decks
  includedInProfile: boolean;

  createdAt: string;
  updatedAt: string;
}

export interface PlatformSource {
  platform: Platform;
  username: string;
  deckCount: number;
}

export interface UserProfile {
  sources: PlatformSource[];
  decks: Deck[];
  fetchedAt: string;
}
