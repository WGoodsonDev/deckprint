import type { Deck, Color } from '@/types/core';
import type { ColorProfile } from '@/types/stats';

const COLOR_ORDER: Color[] = ['W', 'U', 'B', 'R', 'G', 'C'];

export const computeColorProfile = (decks: Deck[]): ColorProfile => {
  const colorFrequency: Record<Color, number> = { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0 };

  if (decks.length === 0) {
    return { colorFrequency, identityDistribution: {}, mostPlayedColor: 'W' };
  }

  const identityDistribution: Record<string, number> = {};

  for (const deck of decks) {
    const identity = deck.colorIdentity;

    if (identity.length === 0) {
      colorFrequency['C']++;
      identityDistribution['C'] = (identityDistribution['C'] ?? 0) + 1;
    } else {
      for (const color of identity) {
        colorFrequency[color]++;
      }
      const key = COLOR_ORDER.filter(c => identity.includes(c)).join('');
      identityDistribution[key] = (identityDistribution[key] ?? 0) + 1;
    }
  }

  for (const color of COLOR_ORDER) {
    colorFrequency[color] /= decks.length;
  }

  let mostPlayedColor: Color = COLOR_ORDER[0];
  for (const color of COLOR_ORDER) {
    if (colorFrequency[color] > colorFrequency[mostPlayedColor]) {
      mostPlayedColor = color;
    }
  }

  return { colorFrequency, identityDistribution, mostPlayedColor };
};
