import { describe, it, expect } from 'vitest';
import { computeCardOverlap } from '@/lib/aggregators/overlap';
import { makeCard, makeDeck } from './fixtures';

describe('computeCardOverlap', () => {
  it('classifies a card appearing in 3+ decks as a staple with correct deckCount', () => {
    const sharedCard = makeCard({ scryfallId: 'sol-ring', name: 'Sol Ring', quantity: 1 });
    const deck1 = makeDeck({ id: 'deck-1', mainboard: [sharedCard] });
    const deck2 = makeDeck({ id: 'deck-2', mainboard: [sharedCard] });
    const deck3 = makeDeck({ id: 'deck-3', mainboard: [sharedCard] });

    const result = computeCardOverlap([deck1, deck2, deck3]);

    expect(result.staples).toHaveLength(1);
    expect(result.staples[0]).toMatchObject({
      scryfallId: 'sol-ring',
      name: 'Sol Ring',
      deckCount: 3,
      totalCopies: 3,
    });
  });

  it('does not classify a card appearing in exactly 2 decks as a staple', () => {
    const sharedCard = makeCard({ scryfallId: 'sol-ring', name: 'Sol Ring', quantity: 1 });
    const deck1 = makeDeck({ id: 'deck-1', mainboard: [sharedCard] });
    const deck2 = makeDeck({ id: 'deck-2', mainboard: [sharedCard] });

    const result = computeCardOverlap([deck1, deck2]);

    expect(result.staples).toHaveLength(0);
  });

  it('does not classify a card appearing in only one deck as a staple', () => {
    const deck1 = makeDeck({ id: 'deck-1', mainboard: [makeCard({ scryfallId: 'a', name: 'Counterspell' })] });
    const deck2 = makeDeck({ id: 'deck-2', mainboard: [makeCard({ scryfallId: 'b', name: 'Lightning Bolt' })] });

    const result = computeCardOverlap([deck1, deck2]);

    expect(result.staples).toHaveLength(0);
  });

  it('counts a card as a staple when it appears as commander in one deck and mainboard in two others', () => {
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
    const deck3 = makeDeck({ id: 'deck-3', mainboard: [asMainboard] });

    const result = computeCardOverlap([deck1, deck2, deck3]);

    expect(result.staples).toHaveLength(1);
    expect(result.staples[0].deckCount).toBe(3);
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
    const deck3 = makeDeck({ id: 'deck-3', sideboard: [sideboardCard] });

    const result = computeCardOverlap([deck1, deck2, deck3]);

    expect(result.staples).toHaveLength(0);
  });

  it('sorts staples by deckCount descending, then totalCopies descending as tiebreaker', () => {
    const inFour = makeCard({ scryfallId: 'a', name: 'Sol Ring', quantity: 1 });
    const inFourMoreCopies = makeCard({ scryfallId: 'b', name: 'Arcane Signet', quantity: 2 });
    const inThree = makeCard({ scryfallId: 'c', name: 'Command Tower', quantity: 1 });

    const deck1 = makeDeck({ id: 'deck-1', mainboard: [inFour, inFourMoreCopies, inThree] });
    const deck2 = makeDeck({ id: 'deck-2', mainboard: [inFour, inFourMoreCopies, inThree] });
    const deck3 = makeDeck({ id: 'deck-3', mainboard: [inFour, inFourMoreCopies, inThree] });
    const deck4 = makeDeck({ id: 'deck-4', mainboard: [inFour, inFourMoreCopies] });

    const result = computeCardOverlap([deck1, deck2, deck3, deck4]);

    // inFour and inFourMoreCopies appear in 4 decks — tiebreak on totalCopies
    // inFourMoreCopies: 4 decks * 2 copies = 8 total → comes first
    // inFour: 4 decks * 1 copy = 4 total → comes second
    // inThree: 3 decks → comes last
    expect(result.staples[0].scryfallId).toBe('b');
    expect(result.staples[1].scryfallId).toBe('a');
    expect(result.staples[2].scryfallId).toBe('c');
  });

  it('returns no staples for a single deck', () => {
    const deck = makeDeck({
      id: 'deck-1',
      mainboard: [
        makeCard({ scryfallId: 'a', name: 'Sol Ring' }),
        makeCard({ scryfallId: 'b', name: 'Arcane Signet' }),
      ],
    });

    const result = computeCardOverlap([deck]);

    expect(result.staples).toHaveLength(0);
  });

  it('returns empty arrays for empty input', () => {
    const result = computeCardOverlap([]);

    expect(result.staples).toEqual([]);
  });
});
