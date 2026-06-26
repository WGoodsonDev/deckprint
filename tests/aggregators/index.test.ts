import { describe, it, expect } from 'vitest';
import { computeProfileStats } from '@/lib/aggregators/index';
import { makeCard, makeDeck } from './fixtures';

describe('computeProfileStats — deckCount and uniqueCardCount', () => {
  it('returns zero counts for an empty deck list', () => {
    const result = computeProfileStats([]);
    expect(result.deckCount).toBe(0);
    expect(result.uniqueCardCount).toBe(0);
  });

  it('counts decks correctly', () => {
    const decks = [makeDeck(), makeDeck(), makeDeck()];
    const result = computeProfileStats(decks);
    expect(result.deckCount).toBe(3);
  });

  it('counts unique cards across mainboard and commanders, deduplicating shared cards', () => {
    const shared = makeCard({ scryfallId: 'sol-ring', name: 'Sol Ring' });
    const unique1 = makeCard({ scryfallId: 'card-a', name: 'Card A' });
    const unique2 = makeCard({ scryfallId: 'card-b', name: 'Card B' });
    const deck1 = makeDeck({ mainboard: [shared, unique1] });
    const deck2 = makeDeck({ mainboard: [shared, unique2] });

    const result = computeProfileStats([deck1, deck2]);
    // sol-ring appears in both decks but counts once
    expect(result.uniqueCardCount).toBe(3);
  });

  it('includes commander cards in unique card count', () => {
    const commander = makeCard({
      scryfallId: 'kaalia',
      name: 'Kaalia of the Vast',
      boardType: 'commander',
    });
    const deck = makeDeck({ commanders: [commander] });

    const result = computeProfileStats([deck]);
    expect(result.uniqueCardCount).toBe(1);
  });

  it('a card in both mainboard and commanders across decks is counted once', () => {
    const card = makeCard({ scryfallId: 'arcane-signet', name: 'Arcane Signet' });
    const deck1 = makeDeck({ mainboard: [card] });
    const deck2 = makeDeck({ commanders: [card] });

    const result = computeProfileStats([deck1, deck2]);
    expect(result.uniqueCardCount).toBe(1);
  });
});
