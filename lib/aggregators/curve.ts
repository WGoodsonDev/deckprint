import type { Deck } from '@/types/core';
import type { CurveProfile } from '@/types/stats';

export const computeCurveProfile = (decks: Deck[]): CurveProfile => {
  if (decks.length === 0) {
    return { averageCurve: {}, overallAverageCmc: 0 };
  }

  const cmcSums: Record<number, number> = {};
  let totalWeightedCmc = 0;
  let totalNonLandQuantity = 0;

  for (const deck of decks) {
    const nonLandCards = deck.mainboard.filter(c => !c.cardTypes.includes('Land'));
    const deckCmcCounts: Record<number, number> = {};

    for (const card of nonLandCards) {
      deckCmcCounts[card.cmc] = (deckCmcCounts[card.cmc] ?? 0) + card.quantity;
      totalWeightedCmc += card.cmc * card.quantity;
      totalNonLandQuantity += card.quantity;
    }

    for (const [cmc, count] of Object.entries(deckCmcCounts)) {
      cmcSums[Number(cmc)] = (cmcSums[Number(cmc)] ?? 0) + count;
    }
  }

  const averageCurve: Record<number, number> = {};
  for (const [cmc, sum] of Object.entries(cmcSums)) {
    averageCurve[Number(cmc)] = sum / decks.length;
  }

  const overallAverageCmc =
    totalNonLandQuantity === 0 ? 0 : totalWeightedCmc / totalNonLandQuantity;

  return { averageCurve, overallAverageCmc };
};
