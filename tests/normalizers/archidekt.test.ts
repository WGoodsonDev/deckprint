import { describe, it, expect } from 'vitest';
import { normalizeCard, normalizeDeck } from '@/lib/normalizers/archidekt';
import type { ArchidektCard, ArchidektDeckResponse } from '@/types/archidekt';

// ── Fixtures ─────────────────────────────────────────────────────────────────

function makeCard(overrides: Partial<ArchidektCard> = {}): ArchidektCard {
  return {
    quantity: 1,
    categories: ['Creature'],
    modifier: 'Normal',
    card: {
      uid: 'abc-123',
      oracleCard: {
        name: 'Llanowar Elves',
        manaCost: '{G}',
        cmc: 1,
        types: ['Creature'],
        superTypes: [],
        subTypes: ['Elf', 'Druid'],
        colorIdentity: ['Green'],
        colors: ['Green'],
        faces: [],
      },
      edition: { editioncode: 'dom' },
    },
    ...overrides,
  };
}

function makeDeckMetadata(
  overrides: Partial<ArchidektDeckResponse> = {}
): ArchidektDeckResponse {
  return {
    id: 42,
    name: 'Test Deck',
    description: 'A test deck',
    deckFormat: 3,
    owner: { username: 'testuser' },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-06-01T00:00:00Z',
    categories: [],
    private: false,
    unlisted: false,
    ...overrides,
  };
}

// ── normalizeCard ─────────────────────────────────────────────────────────────

describe('normalizeCard', () => {
  it('maps basic fields correctly', () => {
    const result = normalizeCard(makeCard());

    expect(result.scryfallId).toBe('abc-123');
    expect(result.name).toBe('Llanowar Elves');
    expect(result.quantity).toBe(1);
    expect(result.cmc).toBe(1);
    expect(result.manaCost).toBe('{G}');
    expect(result.setCode).toBe('DOM');
    expect(result.isProxy).toBe(false);
  });

  it('upcases setCode', () => {
    const result = normalizeCard(makeCard());
    expect(result.setCode).toBe('DOM');
  });

  it('maps English color names to single letters', () => {
    const result = normalizeCard(makeCard());
    expect(result.colors).toEqual(['G']);
    expect(result.colorIdentity).toEqual(['G']);
  });

  it('maps multi-color cards correctly', () => {
    const card = makeCard({
      card: {
        uid: 'xyz',
        oracleCard: {
          name: 'Atraxa',
          manaCost: '{G}{W}{U}{B}',
          cmc: 4,
          types: ['Creature'],
          superTypes: ['Legendary'],
          subTypes: ['Phyrexian', 'Praetor'],
          colorIdentity: ['White', 'Blue', 'Black', 'Green'],
          colors: ['White', 'Blue', 'Black', 'Green'],
          faces: [],
        },
        edition: { editioncode: 'c16' },
      },
    });
    const result = normalizeCard(card);
    expect(result.colorIdentity).toEqual(['W', 'U', 'B', 'G']);
    expect(result.colors).toEqual(['W', 'U', 'B', 'G']);
  });

  it('builds typeLine from superTypes, types, and subTypes', () => {
    const result = normalizeCard(makeCard());
    expect(result.typeLine).toBe('Creature — Elf Druid');
  });

  it('builds typeLine with superType and no subTypes', () => {
    const card = makeCard({
      card: {
        uid: 'abc',
        oracleCard: {
          name: 'Emrakul',
          manaCost: '{15}',
          cmc: 15,
          types: ['Creature'],
          superTypes: ['Legendary'],
          subTypes: [],
          colorIdentity: [],
          colors: [],
          faces: [],
        },
        edition: { editioncode: 'emn' },
      },
    });
    expect(normalizeCard(card).typeLine).toBe('Legendary Creature');
  });

  it('defaults to mainboard when categories is null', () => {
    const result = normalizeCard(makeCard({ categories: null }));
    expect(result.boardType).toBe('mainboard');
    expect(result.isCommander).toBe(false);
  });

  it('defaults to mainboard for non-board category names', () => {
    const result = normalizeCard(makeCard({ categories: ['Creature', 'Ramp'] }));
    expect(result.boardType).toBe('mainboard');
  });

  it('sets boardType to commander when categories includes Commander', () => {
    const result = normalizeCard(makeCard({ categories: ['Commander'] }));
    expect(result.boardType).toBe('commander');
    expect(result.isCommander).toBe(true);
  });

  it('sets boardType to sideboard', () => {
    const result = normalizeCard(makeCard({ categories: ['Sideboard'] }));
    expect(result.boardType).toBe('sideboard');
    expect(result.isCommander).toBe(false);
  });

  it('sets boardType to companion', () => {
    const result = normalizeCard(makeCard({ categories: ['Companion'] }));
    expect(result.boardType).toBe('companion');
  });

  it('sets isFoil for Foil modifier', () => {
    expect(normalizeCard(makeCard({ modifier: 'Foil' })).isFoil).toBe(true);
  });

  it('sets isFoil for Etched modifier', () => {
    expect(normalizeCard(makeCard({ modifier: 'Etched' })).isFoil).toBe(true);
  });

  it('clears isFoil for Normal modifier', () => {
    expect(normalizeCard(makeCard({ modifier: 'Normal' })).isFoil).toBe(false);
  });

  it('uses faces[0] fields for double-faced cards', () => {
    const card = makeCard({
      card: {
        uid: 'dfc-uid',
        oracleCard: {
          name: '',
          manaCost: '',
          cmc: 3,
          types: [],
          superTypes: [],
          subTypes: [],
          colorIdentity: ['Green'],
          colors: ['Green'],
          faces: [
            {
              name: 'Huntmaster of the Fells',
              manaCost: '{2}{R}{G}',
              types: ['Creature'],
              superTypes: ['Legendary'],
              subTypes: ['Human', 'Werewolf'],
              colors: ['Red', 'Green'],
            },
            {
              name: 'Ravager of the Fells',
              manaCost: '',
              types: ['Creature'],
              superTypes: ['Legendary'],
              subTypes: ['Werewolf'],
              colors: ['Red', 'Green'],
            },
          ],
        },
        edition: { editioncode: 'dka' },
      },
    });
    const result = normalizeCard(card);
    expect(result.name).toBe('Huntmaster of the Fells');
    expect(result.manaCost).toBe('{2}{R}{G}');
    expect(result.typeLine).toBe('Legendary Creature — Human Werewolf');
  });

  it('maps unknown color names to nothing (skips them)', () => {
    const card = makeCard({
      card: {
        uid: 'x',
        oracleCard: {
          name: 'X',
          manaCost: '',
          cmc: 0,
          types: ['Land'],
          superTypes: [],
          subTypes: [],
          colorIdentity: ['Purple'],
          colors: [],
          faces: [],
        },
        edition: { editioncode: 'eld' },
      },
    });
    expect(normalizeCard(card).colorIdentity).toEqual([]);
  });

  it('maps unknown card types to Other', () => {
    const card = makeCard({
      card: {
        uid: 'x',
        oracleCard: {
          name: 'X',
          manaCost: '',
          cmc: 0,
          types: ['Conspiracy'],
          superTypes: [],
          subTypes: [],
          colorIdentity: [],
          colors: [],
          faces: [],
        },
        edition: { editioncode: 'cns' },
      },
    });
    expect(normalizeCard(card).cardTypes).toEqual(['Other']);
  });
});

// ── normalizeDeck ─────────────────────────────────────────────────────────────

describe('normalizeDeck', () => {
  it('sets platform-prefixed id and sourceUrl', () => {
    const result = normalizeDeck(makeDeckMetadata(), []);
    expect(result.id).toBe('archidekt:42');
    expect(result.sourceId).toBe('42');
    expect(result.sourceUrl).toBe('https://archidekt.com/decks/42');
    expect(result.sourcePlatform).toBe('archidekt');
  });

  it('maps deckFormat 3 to commander', () => {
    expect(normalizeDeck(makeDeckMetadata({ deckFormat: 3 }), []).format).toBe(
      'commander'
    );
  });

  it('maps deckFormat 5 to vintage', () => {
    expect(normalizeDeck(makeDeckMetadata({ deckFormat: 5 }), []).format).toBe(
      'vintage'
    );
  });

  it('maps unknown deckFormat to other', () => {
    expect(normalizeDeck(makeDeckMetadata({ deckFormat: 99 }), []).format).toBe(
      'other'
    );
  });

  it('defaults includedInProfile to true', () => {
    expect(normalizeDeck(makeDeckMetadata(), []).includedInProfile).toBe(true);
  });

  it('returns empty card arrays for a deck with no cards', () => {
    const result = normalizeDeck(makeDeckMetadata(), []);
    expect(result.mainboard).toEqual([]);
    expect(result.sideboard).toEqual([]);
    expect(result.commanders).toEqual([]);
    expect(result.companions).toEqual([]);
    expect(result.cardCount).toBe(0);
    expect(result.uniqueCardCount).toBe(0);
  });

  it('routes cards to correct board arrays', () => {
    const cards = [
      makeCard({ categories: ['Creature'] }),
      makeCard({ categories: ['Commander'] }),
      makeCard({ categories: ['Sideboard'] }),
      makeCard({ categories: ['Companion'] }),
    ];
    const result = normalizeDeck(makeDeckMetadata(), cards);
    expect(result.mainboard).toHaveLength(1);
    expect(result.commanders).toHaveLength(1);
    expect(result.sideboard).toHaveLength(1);
    expect(result.companions).toHaveLength(1);
  });

  it('computes cardCount as sum of mainboard quantities', () => {
    const cards = [
      makeCard({ quantity: 4 }),
      makeCard({ quantity: 3 }),
      makeCard({ categories: ['Commander'] }),
    ];
    const result = normalizeDeck(makeDeckMetadata(), cards);
    expect(result.cardCount).toBe(7);
  });

  it('computes uniqueCardCount as number of distinct mainboard entries', () => {
    const cards = [makeCard({ quantity: 4 }), makeCard({ quantity: 2 })];
    const result = normalizeDeck(makeDeckMetadata(), cards);
    expect(result.uniqueCardCount).toBe(2);
  });

  it('computes colorIdentity as union of all card colorIdentities in WUBRG order', () => {
    const cards = [
      makeCard({
        card: {
          uid: '1',
          oracleCard: {
            name: 'A',
            manaCost: '',
            cmc: 1,
            types: ['Creature'],
            superTypes: [],
            subTypes: [],
            colorIdentity: ['Red'],
            colors: ['Red'],
            faces: [],
          },
          edition: { editioncode: 'xxx' },
        },
      }),
      makeCard({
        card: {
          uid: '2',
          oracleCard: {
            name: 'B',
            manaCost: '',
            cmc: 1,
            types: ['Creature'],
            superTypes: [],
            subTypes: [],
            colorIdentity: ['White', 'Blue'],
            colors: ['White', 'Blue'],
            faces: [],
          },
          edition: { editioncode: 'xxx' },
        },
      }),
    ];
    const result = normalizeDeck(makeDeckMetadata(), cards);
    expect(result.colorIdentity).toEqual(['W', 'U', 'R']);
  });

  it('sets null description when metadata description is empty string', () => {
    const result = normalizeDeck(makeDeckMetadata({ description: '' }), []);
    expect(result.description).toBeNull();
  });

  it('returns empty commanders array for a non-Commander format (Modern) deck', () => {
    const cards = [makeCard({ categories: ['Creature'] })];
    const result = normalizeDeck(makeDeckMetadata({ deckFormat: 2 }), cards);
    expect(result.commanders).toEqual([]);
    expect(result.format).toBe('modern');
  });
});
