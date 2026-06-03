import { describe, it, expect } from 'vitest';
import { normalizeMoxfieldDeck } from '@/lib/normalizers/moxfield';
import type { MoxfieldDeckCard, MoxfieldDeckResponse } from '@/types/moxfield';

// ── Fixtures ─────────────────────────────────────────────────────────────────

function makeCard(
  overrides: Partial<MoxfieldDeckCard> = {}
): MoxfieldDeckCard {
  return {
    quantity: 1,
    isFoil: false,
    isProxy: false,
    card: {
      uniqueCardId: 'scryfall-abc',
      name: 'Llanowar Elves',
      mana_cost: '{G}',
      cmc: 1,
      type_line: 'Creature — Elf Druid',
      color_identity: ['G'],
      colors: ['G'],
      set: 'DOM',
    },
    ...overrides,
  };
}

function makeDeck(
  overrides: Partial<MoxfieldDeckResponse> = {}
): MoxfieldDeckResponse {
  return {
    id: 'deck-abc',
    name: 'Test Deck',
    description: 'A test deck',
    format: 'commander',
    publicUrl: 'https://moxfield.com/decks/deck-abc',
    createdAtUtc: '2024-01-01T00:00:00Z',
    lastUpdatedAtUtc: '2024-06-01T00:00:00Z',
    commanders: {},
    companions: {},
    mainboard: {},
    sideboard: {},
    ...overrides,
  };
}

// ── normalizeMoxfieldDeck ─────────────────────────────────────────────────────

describe('normalizeMoxfieldDeck', () => {
  it('sets platform-prefixed id and source fields', () => {
    const result = normalizeMoxfieldDeck(makeDeck());
    expect(result.id).toBe('moxfield:deck-abc');
    expect(result.sourceId).toBe('deck-abc');
    expect(result.sourceUrl).toBe('https://moxfield.com/decks/deck-abc');
    expect(result.sourcePlatform).toBe('moxfield');
  });

  it('maps format string directly', () => {
    expect(normalizeMoxfieldDeck(makeDeck({ format: 'commander' })).format).toBe('commander');
    expect(normalizeMoxfieldDeck(makeDeck({ format: 'pioneer' })).format).toBe('pioneer');
  });

  it('maps unknown format to other', () => {
    expect(normalizeMoxfieldDeck(makeDeck({ format: 'duel_commander' })).format).toBe('other');
  });

  it('sets null description when description is empty string', () => {
    const result = normalizeMoxfieldDeck(makeDeck({ description: '' }));
    expect(result.description).toBeNull();
  });

  it('sets null description when description is whitespace only', () => {
    const result = normalizeMoxfieldDeck(makeDeck({ description: '   ' }));
    expect(result.description).toBeNull();
  });

  it('preserves non-empty description', () => {
    const result = normalizeMoxfieldDeck(makeDeck({ description: 'My deck' }));
    expect(result.description).toBe('My deck');
  });

  it('defaults includedInProfile to true', () => {
    expect(normalizeMoxfieldDeck(makeDeck()).includedInProfile).toBe(true);
  });

  it('returns empty card arrays for a deck with no cards', () => {
    const result = normalizeMoxfieldDeck(makeDeck());
    expect(result.mainboard).toEqual([]);
    expect(result.sideboard).toEqual([]);
    expect(result.commanders).toEqual([]);
    expect(result.companions).toEqual([]);
    expect(result.cardCount).toBe(0);
    expect(result.uniqueCardCount).toBe(0);
  });

  it('routes cards to correct board arrays', () => {
    const result = normalizeMoxfieldDeck(
      makeDeck({
        commanders: { 'Atraxa': makeCard({ card: { ...makeCard().card, name: 'Atraxa', uniqueCardId: 'cmdr-id' } }) },
        companions: { 'Yorion': makeCard({ card: { ...makeCard().card, name: 'Yorion', uniqueCardId: 'comp-id' } }) },
        mainboard: { 'Llanowar Elves': makeCard() },
        sideboard: { 'Nature\'s Claim': makeCard({ card: { ...makeCard().card, name: "Nature's Claim", uniqueCardId: 'side-id' } }) },
      })
    );
    expect(result.commanders).toHaveLength(1);
    expect(result.companions).toHaveLength(1);
    expect(result.mainboard).toHaveLength(1);
    expect(result.sideboard).toHaveLength(1);
  });

  it('sets isCommander true for commanders board only', () => {
    const result = normalizeMoxfieldDeck(
      makeDeck({
        commanders: { 'Atraxa': makeCard({ card: { ...makeCard().card, uniqueCardId: 'cmdr' } }) },
        mainboard: { 'Llanowar Elves': makeCard({ card: { ...makeCard().card, uniqueCardId: 'main' } }) },
      })
    );
    expect(result.commanders[0].isCommander).toBe(true);
    expect(result.commanders[0].boardType).toBe('commander');
    expect(result.mainboard[0].isCommander).toBe(false);
    expect(result.mainboard[0].boardType).toBe('mainboard');
  });

  it('uses uniqueCardId as scryfallId', () => {
    const result = normalizeMoxfieldDeck(
      makeDeck({ mainboard: { 'Llanowar Elves': makeCard() } })
    );
    expect(result.mainboard[0].scryfallId).toBe('scryfall-abc');
  });

  it('maps isFoil and isProxy from entry', () => {
    const result = normalizeMoxfieldDeck(
      makeDeck({
        mainboard: {
          'Foil Card': makeCard({ isFoil: true, isProxy: true }),
        },
      })
    );
    expect(result.mainboard[0].isFoil).toBe(true);
    expect(result.mainboard[0].isProxy).toBe(true);
  });

  it('computes cardCount as sum of mainboard quantities', () => {
    const result = normalizeMoxfieldDeck(
      makeDeck({
        commanders: { 'Atraxa': makeCard({ quantity: 1, card: { ...makeCard().card, uniqueCardId: 'cmdr' } }) },
        mainboard: {
          'Llanowar Elves': makeCard({ quantity: 4 }),
          'Birds of Paradise': makeCard({ quantity: 3, card: { ...makeCard().card, uniqueCardId: 'bop' } }),
        },
      })
    );
    expect(result.cardCount).toBe(7);
  });

  it('computes uniqueCardCount as number of distinct mainboard entries', () => {
    const result = normalizeMoxfieldDeck(
      makeDeck({
        mainboard: {
          'Llanowar Elves': makeCard({ quantity: 4 }),
          'Birds of Paradise': makeCard({ quantity: 2, card: { ...makeCard().card, uniqueCardId: 'bop' } }),
        },
      })
    );
    expect(result.uniqueCardCount).toBe(2);
  });

  it('derives colorIdentity from all boards in WUBRG order', () => {
    const result = normalizeMoxfieldDeck(
      makeDeck({
        commanders: {
          'Atraxa': makeCard({
            card: {
              ...makeCard().card,
              uniqueCardId: 'atraxa',
              color_identity: ['W', 'U', 'B', 'G'],
              colors: ['W', 'U', 'B', 'G'],
            },
          }),
        },
        mainboard: {
          'Lightning Bolt': makeCard({
            card: {
              ...makeCard().card,
              uniqueCardId: 'bolt',
              color_identity: ['R'],
              colors: ['R'],
            },
          }),
        },
      })
    );
    expect(result.colorIdentity).toEqual(['W', 'U', 'B', 'R', 'G']);
  });

  it('deduplicates colorIdentity entries', () => {
    const result = normalizeMoxfieldDeck(
      makeDeck({
        mainboard: {
          'Card1': makeCard({ card: { ...makeCard().card, uniqueCardId: 'c1', color_identity: ['G'], colors: ['G'] } }),
          'Card2': makeCard({ card: { ...makeCard().card, uniqueCardId: 'c2', color_identity: ['G', 'W'], colors: ['G', 'W'] } }),
        },
      })
    );
    expect(result.colorIdentity).toEqual(['W', 'G']);
  });

  it('parses type_line into superTypes, cardTypes, and subTypes', () => {
    const result = normalizeMoxfieldDeck(
      makeDeck({ mainboard: { 'Llanowar Elves': makeCard() } })
    );
    const card = result.mainboard[0];
    expect(card.typeLine).toBe('Creature — Elf Druid');
    expect(card.superTypes).toEqual([]);
    expect(card.cardTypes).toEqual(['Creature']);
    expect(card.subTypes).toEqual(['Elf', 'Druid']);
  });

  it('extracts supertypes from type_line', () => {
    const result = normalizeMoxfieldDeck(
      makeDeck({
        commanders: {
          'Atraxa': makeCard({
            card: { ...makeCard().card, uniqueCardId: 'atraxa', type_line: 'Legendary Creature — Phyrexian Praetor' },
          }),
        },
      })
    );
    expect(result.commanders[0].superTypes).toEqual(['Legendary']);
    expect(result.commanders[0].cardTypes).toEqual(['Creature']);
    expect(result.commanders[0].subTypes).toEqual(['Phyrexian', 'Praetor']);
  });

  it('maps unknown type tokens to Other', () => {
    const result = normalizeMoxfieldDeck(
      makeDeck({
        mainboard: {
          'Conspiracy': makeCard({
            card: { ...makeCard().card, uniqueCardId: 'cons', type_line: 'Conspiracy' },
          }),
        },
      })
    );
    expect(result.mainboard[0].cardTypes).toEqual(['Other']);
  });

  it('handles Land type line with no subtypes', () => {
    const result = normalizeMoxfieldDeck(
      makeDeck({
        mainboard: {
          'Wastes': makeCard({
            card: { ...makeCard().card, uniqueCardId: 'wastes', type_line: 'Basic Land' },
          }),
        },
      })
    );
    const card = result.mainboard[0];
    expect(card.superTypes).toEqual(['Basic']);
    expect(card.cardTypes).toEqual(['Land']);
    expect(card.subTypes).toEqual([]);
  });
});
