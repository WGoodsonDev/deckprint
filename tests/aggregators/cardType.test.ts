import { describe, it, expect } from 'vitest';
import { computeCardTypeProfile } from '@/lib/aggregators/cardType';
import { makeCard, makeDeck } from './fixtures';
import type { CardType } from '@/types/core';

const ALL_CARD_TYPES: CardType[] = [
  'Creature', 'Instant', 'Sorcery', 'Enchantment', 'Artifact',
  'Planeswalker', 'Land', 'Battle', 'Kindred', 'Other',
];

describe('computeCardTypeProfile', () => {
  it('returns all card types set to 0 for empty input', () => {
    const result = computeCardTypeProfile([]);

    for (const cardType of ALL_CARD_TYPES) {
      expect(result.averageByType[cardType]).toBe(0);
    }
  });

  it('all card types are present in output regardless of whether they appear in decks', () => {
    const deck = makeDeck({
      mainboard: [makeCard({ scryfallId: 'a', cardTypes: ['Creature'], quantity: 1 })],
    });

    const result = computeCardTypeProfile([deck]);

    for (const cardType of ALL_CARD_TYPES) {
      expect(result.averageByType).toHaveProperty(cardType);
    }
  });

  it('returns per-deck counts directly for a single deck', () => {
    const deck = makeDeck({
      mainboard: [
        makeCard({ scryfallId: 'a', cardTypes: ['Creature'], quantity: 3 }),
        makeCard({ scryfallId: 'b', cardTypes: ['Instant'], quantity: 2 }),
        makeCard({ scryfallId: 'c', cardTypes: ['Land'], quantity: 35 }),
      ],
    });

    const result = computeCardTypeProfile([deck]);

    expect(result.averageByType['Creature']).toBe(3);
    expect(result.averageByType['Instant']).toBe(2);
    expect(result.averageByType['Land']).toBe(35);
    expect(result.averageByType['Sorcery']).toBe(0);
  });

  it('correctly averages card type counts across multiple decks', () => {
    const deck1 = makeDeck({
      mainboard: [
        makeCard({ scryfallId: 'a', cardTypes: ['Creature'], quantity: 20 }),
        makeCard({ scryfallId: 'b', cardTypes: ['Land'], quantity: 40 }),
      ],
    });
    const deck2 = makeDeck({
      mainboard: [
        makeCard({ scryfallId: 'c', cardTypes: ['Creature'], quantity: 10 }),
        makeCard({ scryfallId: 'd', cardTypes: ['Instant'], quantity: 15 }),
        makeCard({ scryfallId: 'e', cardTypes: ['Land'], quantity: 36 }),
      ],
    });

    const result = computeCardTypeProfile([deck1, deck2]);

    expect(result.averageByType['Creature']).toBe(15);   // (20 + 10) / 2
    expect(result.averageByType['Instant']).toBe(7.5);   // (0 + 15) / 2
    expect(result.averageByType['Land']).toBe(38);       // (40 + 36) / 2
  });

  it('uses the primary (first) cardType for classification', () => {
    const deck = makeDeck({
      mainboard: [
        makeCard({ scryfallId: 'a', cardTypes: ['Artifact', 'Creature'], quantity: 2 }),
      ],
    });

    const result = computeCardTypeProfile([deck]);

    expect(result.averageByType['Artifact']).toBe(2);
    expect(result.averageByType['Creature']).toBe(0);
  });

  it('falls back to Other for cards with no cardTypes', () => {
    const deck = makeDeck({
      mainboard: [
        makeCard({ scryfallId: 'a', cardTypes: [], quantity: 1 }),
      ],
    });

    const result = computeCardTypeProfile([deck]);

    expect(result.averageByType['Other']).toBe(1);
  });

  it('counts commander cards alongside mainboard cards', () => {
    const commander = makeCard({
      scryfallId: 'a',
      cardTypes: ['Creature'],
      boardType: 'commander',
      quantity: 1,
    });
    const deck = makeDeck({
      commanders: [commander],
      mainboard: [makeCard({ scryfallId: 'b', cardTypes: ['Creature'], quantity: 4 })],
    });

    const result = computeCardTypeProfile([deck]);

    expect(result.averageByType['Creature']).toBe(5);
  });
});
