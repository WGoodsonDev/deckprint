import type { Deck } from '@/types/core';
import type { ArchetypeProfile } from '@/types/stats';

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

function midrangeTent(
  value: number,
  peakLow: number,
  peakHigh: number,
  floor: number,
  ceil: number
): number {
  if (value <= floor || value >= ceil) return 0;
  if (value < peakLow) return (value - floor) / (peakLow - floor);
  if (value <= peakHigh) return 1;
  return (ceil - value) / (ceil - peakHigh);
}

interface DeckMetrics {
  creatureDensity: number;
  instantSorceryDensity: number;
  artifactEnchantmentDensity: number;
  avgCmc: number;
}

function computeDeckMetrics(deck: Deck): DeckMetrics {
  const nonLandCards = deck.mainboard.filter(c => !c.cardTypes.includes('Land'));
  const totalQuantity = nonLandCards.reduce((sum, c) => sum + c.quantity, 0);

  if (totalQuantity === 0) {
    return { creatureDensity: 0, instantSorceryDensity: 0, artifactEnchantmentDensity: 0, avgCmc: 0 };
  }

  let creatureQty = 0;
  let instantSorceryQty = 0;
  let artifactEnchantmentQty = 0;
  let totalWeightedCmc = 0;

  for (const card of nonLandCards) {
    if (card.cardTypes.includes('Creature')) creatureQty += card.quantity;
    if (card.cardTypes.includes('Instant') || card.cardTypes.includes('Sorcery')) {
      instantSorceryQty += card.quantity;
    }
    if (card.cardTypes.includes('Artifact') || card.cardTypes.includes('Enchantment')) {
      artifactEnchantmentQty += card.quantity;
    }
    totalWeightedCmc += card.cmc * card.quantity;
  }

  return {
    creatureDensity: creatureQty / totalQuantity,
    instantSorceryDensity: instantSorceryQty / totalQuantity,
    artifactEnchantmentDensity: artifactEnchantmentQty / totalQuantity,
    avgCmc: totalWeightedCmc / totalQuantity,
  };
}

export const computeArchetypeProfile = (decks: Deck[]): ArchetypeProfile => {
  if (decks.length === 0) {
    return { aggro: 0, midrange: 0, control: 0, combo: 0 };
  }

  const metrics = decks.map(computeDeckMetrics);
  const n = decks.length;

  const creatureDensity = metrics.reduce((sum, m) => sum + m.creatureDensity, 0) / n;
  const instantSorceryDensity = metrics.reduce((sum, m) => sum + m.instantSorceryDensity, 0) / n;
  const artifactEnchantmentDensity = metrics.reduce((sum, m) => sum + m.artifactEnchantmentDensity, 0) / n;
  const avgCmc = metrics.reduce((sum, m) => sum + m.avgCmc, 0) / n;

  const aggro = Math.min(
    clamp((creatureDensity - 0.2) / 0.25, 0, 1),
    clamp((3.5 - avgCmc) / 1.5, 0, 1)
  );

  const control =
    clamp((0.35 - creatureDensity) / 0.25, 0, 1) *
    clamp(instantSorceryDensity / 0.4, 0, 1);

  const midrange =
    midrangeTent(creatureDensity, 0.3, 0.4, 0, 0.6) *
    midrangeTent(avgCmc, 2.5, 3.5, 0, 5.0);

  const combo =
    clamp((artifactEnchantmentDensity - 0.1) / 0.25, 0, 1) *
    clamp((0.4 - creatureDensity) / 0.2, 0, 1);

  return { aggro, midrange, control, combo };
};
