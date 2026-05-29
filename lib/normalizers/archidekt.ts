import type {
  ArchidektCard,
  ArchidektCardsResponse,
  ArchidektDeckResponse,
  ArchidektOracleCard,
} from '@/types/archidekt';
import type { CardEntry, CardType, Color, Deck, Format } from '@/types/core';

// Verified against pyrchidekt library and live API sampling (May 2026).
// Formats not in our Format union (brawl, oathbreaker, etc.) fall through to 'other'.
const FORMAT_MAP: Record<number, Format> = {
  1:  'standard',
  2:  'modern',
  3:  'commander',
  4:  'legacy',
  5:  'vintage',
  6:  'pauper',
  15: 'pioneer',
};

const COLOR_MAP: Record<string, Color> = {
  White: 'W',
  Blue: 'U',
  Black: 'B',
  Red: 'R',
  Green: 'G',
  Colorless: 'C',
};

const CARD_TYPE_SET = new Set<string>([
  'Creature',
  'Instant',
  'Sorcery',
  'Enchantment',
  'Artifact',
  'Planeswalker',
  'Land',
  'Battle',
  'Kindred',
]);

const WUBRG_ORDER: Color[] = ['W', 'U', 'B', 'R', 'G', 'C'];

function normalizeFormat(deckFormat: number): Format {
  return FORMAT_MAP[deckFormat] ?? 'other';
}

function normalizeColor(name: string): Color | null {
  return COLOR_MAP[name] ?? null;
}

function normalizeColors(names: string[]): Color[] {
  return names.flatMap((n) => {
    const c = normalizeColor(n);
    return c !== null ? [c] : [];
  });
}

function normalizeCardTypes(types: string[]): CardType[] {
  return types.map((t) => (CARD_TYPE_SET.has(t) ? (t as CardType) : 'Other'));
}

function normalizeBoardType(
  categories: string[] | null
): CardEntry['boardType'] {
  if (!categories) return 'mainboard';
  if (categories.includes('Commander')) return 'commander';
  if (categories.includes('Sideboard')) return 'sideboard';
  if (categories.includes('Companion')) return 'companion';
  return 'mainboard';
}

function buildTypeLine(
  superTypes: string[],
  types: string[],
  subTypes: string[]
): string {
  const base = [...superTypes, ...types].join(' ');
  return subTypes.length > 0 ? `${base} — ${subTypes.join(' ')}` : base;
}

function resolveOracleFields(oracle: ArchidektOracleCard): {
  name: string;
  manaCost: string | null;
  types: string[];
  superTypes: string[];
  subTypes: string[];
} {
  // For double-faced cards, top-level fields may be absent — fall back to faces[0]
  const face = oracle.faces?.[0];
  return {
    name: oracle.name || face?.name || '',
    manaCost: oracle.manaCost || face?.manaCost || null,
    types: oracle.types?.length ? oracle.types : (face?.types ?? []),
    superTypes: oracle.superTypes?.length
      ? oracle.superTypes
      : (face?.superTypes ?? []),
    subTypes: oracle.subTypes?.length ? oracle.subTypes : (face?.subTypes ?? []),
  };
}

function sortByWubrg(colors: Color[]): Color[] {
  return [...new Set(colors)].sort(
    (a, b) => WUBRG_ORDER.indexOf(a) - WUBRG_ORDER.indexOf(b)
  );
}

export function normalizeCard(raw: ArchidektCard): CardEntry {
  const oracle = raw.card.oracleCard;
  const { name, manaCost, types, superTypes, subTypes } =
    resolveOracleFields(oracle);

  const boardType = normalizeBoardType(raw.categories);

  return {
    scryfallId: raw.card.uid,
    name,
    quantity: raw.quantity,
    boardType,
    manaCost: manaCost || null,
    cmc: oracle.cmc,
    colors: normalizeColors(oracle.colors),
    colorIdentity: normalizeColors(oracle.colorIdentity),
    typeLine: buildTypeLine(superTypes, types, subTypes),
    superTypes,
    cardTypes: normalizeCardTypes(types),
    subTypes,
    setCode: raw.card.edition.editioncode.toUpperCase(),
    isCommander: boardType === 'commander',
    isFoil: raw.modifier === 'Foil' || raw.modifier === 'Etched',
    isProxy: false,
  };
}

export function normalizeDeck(
  metadata: ArchidektDeckResponse,
  cards: ArchidektCardsResponse
): Deck {
  const normalized = cards.map(normalizeCard);

  const mainboard = normalized.filter((c) => c.boardType === 'mainboard');
  const sideboard = normalized.filter((c) => c.boardType === 'sideboard');
  const commanders = normalized.filter((c) => c.boardType === 'commander');
  const companions = normalized.filter((c) => c.boardType === 'companion');

  const allColorIdentities = normalized.flatMap((c) => c.colorIdentity);
  const colorIdentity = sortByWubrg(allColorIdentities);

  const cardCount = mainboard.reduce((sum, c) => sum + c.quantity, 0);

  return {
    id: `archidekt:${metadata.id}`,
    sourcePlatform: 'archidekt',
    sourceId: String(metadata.id),
    sourceUrl: `https://archidekt.com/decks/${metadata.id}`,
    name: metadata.name,
    description: metadata.description || null,
    format: normalizeFormat(metadata.deckFormat),
    colorIdentity,
    commanders,
    mainboard,
    sideboard,
    companions,
    cardCount,
    uniqueCardCount: mainboard.length,
    includedInProfile: true,
    createdAt: metadata.createdAt,
    updatedAt: metadata.updatedAt,
  };
}
