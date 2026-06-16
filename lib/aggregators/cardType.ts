import type { CardType, Deck } from '@/types/core';
import type { CardTypeProfile } from '@/types/stats';

const ALL_CARD_TYPES: CardType[] = [
  'Creature', 'Instant', 'Sorcery', 'Enchantment', 'Artifact',
  'Planeswalker', 'Land', 'Battle', 'Kindred', 'Other',
];

export const computeCardTypeProfile = (decks: Deck[]): CardTypeProfile => {
  const typeSums: Record<CardType, number> = Object.fromEntries(
    ALL_CARD_TYPES.map((t) => [t, 0])
  ) as Record<CardType, number>;

  if (decks.length === 0) {
    return { averageByType: typeSums };
  }

  for (const deck of decks) {
    const cards = [...deck.mainboard, ...deck.commanders];
    const deckTypeCounts: Record<CardType, number> = Object.fromEntries(
      ALL_CARD_TYPES.map((t) => [t, 0])
    ) as Record<CardType, number>;

    for (const card of cards) {
      const primaryType: CardType = card.cardTypes.length > 0 ? card.cardTypes[0] : 'Other';
      deckTypeCounts[primaryType] += card.quantity;
    }

    for (const cardType of ALL_CARD_TYPES) {
      typeSums[cardType] += deckTypeCounts[cardType];
    }
  }

  const averageByType: Record<CardType, number> = Object.fromEntries(
    ALL_CARD_TYPES.map((t) => [t, typeSums[t] / decks.length])
  ) as Record<CardType, number>;

  return { averageByType };
};
