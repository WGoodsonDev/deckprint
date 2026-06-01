import { describe, it, expect } from 'vitest';
import { computeCardOverlap } from '@/lib/aggregators/overlap';
import { makeCard, makeDeck } from './fixtures';

describe('computeCardOverlap', () => {
  it('classifies a card appearing in two decks as a staple with correct deckCount', () => {
    const sharedCard = makeCard({ scryfallId: 'sol-ring', name: 'Sol Ring', quantity: 1 });
    const deck1 = makeDeck({ id: 'deck-1', mainboard: [sharedCard] });
    const deck2 = makeDeck({ id: 'deck-2', mainboard: [sharedCard] });

    const result = computeCardOverlap([deck1, deck2]);

    expect(result.staples).toHaveLength(1);
    expect(result.staples[0]).toMatchObject({
      scryfallId: 'sol-ring',
      name: 'Sol Ring',
      deckCount: 2,
      totalCopies: 2,
    });
    expect(result.petCards).toHaveLength(0);
  });

  it('classifies a card appearing in only one deck as a pet card', () => {
    const deck1 = makeDeck({ id: 'deck-1', mainboard: [makeCard({ scryfallId: 'a', name: 'Counterspell' })] });
    const deck2 = makeDeck({ id: 'deck-2', mainboard: [makeCard({ scryfallId: 'b', name: 'Lightning Bolt' })] });

    const result = computeCardOverlap([deck1, deck2]);

    expect(result.staples).toHaveLength(0);
    expect(result.petCards).toHaveLength(2);
  });

  it('counts a card as a staple when it appears as commander in one deck and mainboard in another', () => {
    const asCommander = makeCard({
      scryfallId: 'atraxa',
      name: 'Atraxa, Praetors\' Voice',
      boardType: 'commander',
      quantity: 1,
    });
    const asMainboard = makeCard({
      scryfallId: 'atraxa',
      name: 'Atraxa, Praetors\' Voice',
      boardType: 'mainboard',
      quantity: 1,
    });
    const deck1 = makeDeck({ id: 'deck-1', commanders: [asCommander] });
    const deck2 = makeDeck({ id: 'deck-2', mainboard: [asMainboard] });

    const result = computeCardOverlap([deck1, deck2]);

    expect(result.staples).toHaveLength(1);
    expect(result.staples[0].deckCount).toBe(2);
    expect(result.petCards).toHaveLength(0);
  });

  it('excludes sideboard cards from overlap analysis', () => {
    const sideboardCard = makeCard({
      scryfallId: 'graveyard-hate',
      name: 'Rest in Peace',
      boardType: 'sideboard',
      quantity: 2,
    });
    const deck1 = makeDeck({ id: 'deck-1', sideboard: [sideboardCard] });
    const deck2 = makeDeck({ id: 'deck-2', sideboard: [sideboardCard] });

    const result = computeCardOverlap([deck1, deck2]);

    expect(result.staples).toHaveLength(0);
    expect(result.petCards).toHaveLength(0);
  });

  it('sorts staples by deckCount descending, then totalCopies descending as tiebreaker', () => {
    const inThree = makeCard({ scryfallId: 'a', name: 'Sol Ring', quantity: 1 });
    const inThreeMoreCopies = makeCard({ scryfallId: 'b', name: 'Arcane Signet', quantity: 2 });
    const inTwo = makeCard({ scryfallId: 'c', name: 'Command Tower', quantity: 1 });

    const deck1 = makeDeck({ id: 'deck-1', mainboard: [inThree, inThreeMoreCopies, inTwo] });
    const deck2 = makeDeck({ id: 'deck-2', mainboard: [inThree, inThreeMoreCopies, inTwo] });
    const deck3 = makeDeck({ id: 'deck-3', mainboard: [inThree, inThreeMoreCopies] });

    const result = computeCardOverlap([deck1, deck2, deck3]);

    // Both inThree and inThreeMoreCopies appear in 3 decks — tiebreak on totalCopies
    // inThreeMoreCopies: 3 decks * 2 copies = 6 total → comes first
    // inThree: 3 decks * 1 copy = 3 total → comes second
    // inTwo: 2 decks → comes last
    expect(result.staples[0].scryfallId).toBe('b');
    expect(result.staples[1].scryfallId).toBe('a');
    expect(result.staples[2].scryfallId).toBe('c');
  });

  it('sorts pet cards by name ascending', () => {
    const deck1 = makeDeck({ id: 'deck-1', mainboard: [makeCard({ scryfallId: 'a', name: 'Thoughtseize' })] });
    const deck2 = makeDeck({ id: 'deck-2', mainboard: [makeCard({ scryfallId: 'b', name: 'Lightning Bolt' })] });
    const deck3 = makeDeck({ id: 'deck-3', mainboard: [makeCard({ scryfallId: 'c', name: 'Counterspell' })] });

    const result = computeCardOverlap([deck1, deck2, deck3]);

    expect(result.petCards.map(c => c.name)).toEqual([
      'Counterspell',
      'Lightning Bolt',
      'Thoughtseize',
    ]);
  });

  it('returns all cards as pet cards and no staples for a single deck', () => {
    const deck = makeDeck({
      id: 'deck-1',
      mainboard: [
        makeCard({ scryfallId: 'a', name: 'Sol Ring' }),
        makeCard({ scryfallId: 'b', name: 'Arcane Signet' }),
      ],
    });

    const result = computeCardOverlap([deck]);

    expect(result.staples).toHaveLength(0);
    expect(result.petCards).toHaveLength(2);
  });

  it('returns empty arrays for empty input', () => {
    const result = computeCardOverlap([]);

    expect(result.staples).toEqual([]);
    expect(result.petCards).toEqual([]);
  });
});
