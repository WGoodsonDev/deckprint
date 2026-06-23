import type { Deck } from '@/types/core';
import type { CardOverlapProfile, StapleEntry } from '@/types/stats';

const STAPLE_THRESHOLD = 3;
const BASIC_LAND_SUPERTYPE = 'Basic';

type CardAccumulator = {
  name: string;
  deckIds: Set<string>;
  totalCopies: number;
};

export const computeCardOverlap = (decks: Deck[]): CardOverlapProfile => {
  if (decks.length === 0) {
    return { staples: [] };
  }

  const cardData = new Map<string, CardAccumulator>();

  for (const deck of decks) {
    const relevantCards = [...deck.mainboard, ...deck.commanders];

    for (const card of relevantCards) {
      if (card.superTypes.includes(BASIC_LAND_SUPERTYPE)) continue;
      const existing = cardData.get(card.scryfallId);
      if (existing) {
        existing.deckIds.add(deck.id);
        existing.totalCopies += card.quantity;
      } else {
        cardData.set(card.scryfallId, {
          name: card.name,
          deckIds: new Set([deck.id]),
          totalCopies: card.quantity,
        });
      }
    }
  }

  const staples: StapleEntry[] = [];

  for (const [scryfallId, data] of cardData) {
    if (data.deckIds.size >= STAPLE_THRESHOLD) {
      staples.push({
        scryfallId,
        name: data.name,
        deckCount: data.deckIds.size,
        totalCopies: data.totalCopies,
      });
    }
  }

  staples.sort((a, b) => b.deckCount - a.deckCount || b.totalCopies - a.totalCopies);

  return { staples };
};
