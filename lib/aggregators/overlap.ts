import type { Deck, CardEntry } from '@/types/core';
import type { CardOverlapProfile, StapleEntry } from '@/types/stats';

type CardAccumulator = {
  name: string;
  deckIds: Set<string>;
  totalCopies: number;
  entry: CardEntry;
};

export const computeCardOverlap = (decks: Deck[]): CardOverlapProfile => {
  if (decks.length === 0) {
    return { staples: [], petCards: [] };
  }

  const cardData = new Map<string, CardAccumulator>();

  for (const deck of decks) {
    const relevantCards = [...deck.mainboard, ...deck.commanders];

    for (const card of relevantCards) {
      const existing = cardData.get(card.scryfallId);
      if (existing) {
        existing.deckIds.add(deck.id);
        existing.totalCopies += card.quantity;
      } else {
        cardData.set(card.scryfallId, {
          name: card.name,
          deckIds: new Set([deck.id]),
          totalCopies: card.quantity,
          entry: card,
        });
      }
    }
  }

  const staples: StapleEntry[] = [];
  const petCards: CardEntry[] = [];

  for (const [scryfallId, data] of cardData) {
    if (data.deckIds.size > 1) {
      staples.push({
        scryfallId,
        name: data.name,
        deckCount: data.deckIds.size,
        totalCopies: data.totalCopies,
      });
    } else {
      petCards.push(data.entry);
    }
  }

  staples.sort((a, b) => b.deckCount - a.deckCount || b.totalCopies - a.totalCopies);
  petCards.sort((a, b) => a.name.localeCompare(b.name));

  return { staples, petCards };
};
