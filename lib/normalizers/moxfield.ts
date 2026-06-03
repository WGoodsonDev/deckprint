import type { MoxfieldDeckCard, MoxfieldDeckResponse } from '@/types/moxfield';
import type { CardEntry, CardType, Color, Deck, Format } from '@/types/core';

const VALID_FORMATS = new Set<string>([
  'commander',
  'pioneer',
  'modern',
  'standard',
  'legacy',
  'vintage',
  'pauper',
  'draft',
  'sealed',
]);

const SUPER_TYPE_SET = new Set<string>([
  'Legendary',
  'Snow',
  'Basic',
  'World',
  'Ongoing',
]);

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

function normalizeMoxfieldFormat(format: string): Format {
  const lower = format.toLowerCase();
  return VALID_FORMATS.has(lower) ? (lower as Format) : 'other';
}

function parseTypeLine(typeLine: string): {
  superTypes: string[];
  cardTypes: CardType[];
  subTypes: string[];
} {
  const [typeSection = '', subTypeSection = ''] = typeLine.split(/ — | - /);
  const tokens = typeSection.trim().split(/\s+/).filter(Boolean);

  const superTypes: string[] = [];
  const rawTypes: string[] = [];

  for (const token of tokens) {
    if (SUPER_TYPE_SET.has(token)) {
      superTypes.push(token);
    } else {
      rawTypes.push(token);
    }
  }

  const cardTypes = rawTypes.map<CardType>((t) =>
    CARD_TYPE_SET.has(t) ? (t as CardType) : 'Other'
  );
  const subTypes = subTypeSection.trim() ? subTypeSection.trim().split(/\s+/) : [];

  return { superTypes, cardTypes, subTypes };
}

function sortByWubrg(colors: Color[]): Color[] {
  return [...new Set(colors)].sort(
    (a, b) => WUBRG_ORDER.indexOf(a) - WUBRG_ORDER.indexOf(b)
  );
}

function normalizeEntry(
  entry: MoxfieldDeckCard,
  boardType: CardEntry['boardType']
): CardEntry {
  const { superTypes, cardTypes, subTypes } = parseTypeLine(entry.card.type_line);

  return {
    scryfallId: entry.card.uniqueCardId,
    name: entry.card.name,
    quantity: entry.quantity,
    boardType,
    manaCost: entry.card.mana_cost ?? null,
    cmc: entry.card.cmc,
    colors: entry.card.colors as Color[],
    colorIdentity: entry.card.color_identity as Color[],
    typeLine: entry.card.type_line,
    superTypes,
    cardTypes,
    subTypes,
    setCode: entry.card.set,
    isCommander: boardType === 'commander',
    isFoil: entry.isFoil,
    isProxy: entry.isProxy,
  };
}

export function normalizeMoxfieldDeck(deck: MoxfieldDeckResponse): Deck {
  const commanders = Object.values(deck.commanders).map((e) =>
    normalizeEntry(e, 'commander')
  );
  const companions = Object.values(deck.companions).map((e) =>
    normalizeEntry(e, 'companion')
  );
  const mainboard = Object.values(deck.mainboard).map((e) =>
    normalizeEntry(e, 'mainboard')
  );
  const sideboard = Object.values(deck.sideboard).map((e) =>
    normalizeEntry(e, 'sideboard')
  );

  const allEntries = [...commanders, ...companions, ...mainboard, ...sideboard];
  const allColorIdentities = allEntries.flatMap((e) => e.colorIdentity);
  const colorIdentity = sortByWubrg(allColorIdentities);

  const cardCount = mainboard.reduce((sum, e) => sum + e.quantity, 0);
  const description = deck.description.trim() || null;

  return {
    id: `moxfield:${deck.id}`,
    sourcePlatform: 'moxfield',
    sourceId: deck.id,
    sourceUrl: deck.publicUrl,
    name: deck.name,
    description,
    format: normalizeMoxfieldFormat(deck.format),
    colorIdentity,
    commanders,
    mainboard,
    sideboard,
    companions,
    cardCount,
    uniqueCardCount: mainboard.length,
    includedInProfile: true,
    createdAt: deck.createdAtUtc,
    updatedAt: deck.lastUpdatedAtUtc,
  };
}
