import { describe, it, expect } from 'vitest';
import type { ProfileStats } from '@/types/stats';
import { generateDeckbuilderLabel } from '@/lib/labelGenerator';

function makeStats(overrides: Partial<ProfileStats> = {}): ProfileStats {
  return {
    colorProfile: {
      colorFrequency: { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0 },
      identityDistribution: {},
      mostPlayedColor: 'W',
    },
    curveProfile: { averageCurve: {}, overallAverageCmc: 0 },
    recencyProfile: {
      within30Days: 0,
      within90Days: 0,
      within365Days: 0,
      olderThan365Days: 0,
      mostRecentDeck: null,
    },
    cardOverlap: { staples: [] },
    cardTypeProfile: {
      averageByType: {
        Creature: 0,
        Instant: 0,
        Sorcery: 0,
        Enchantment: 0,
        Artifact: 0,
        Planeswalker: 0,
        Land: 0,
        Battle: 0,
        Kindred: 0,
        Other: 0,
      },
    },
    ...overrides,
  };
}

describe('generateDeckbuilderLabel', () => {
  it('combines a dominant color identity and dominant non-land card type', () => {
    const stats = makeStats({
      colorProfile: {
        colorFrequency: { W: 0, U: 1, B: 1, R: 0, G: 1, C: 0 },
        identityDistribution: { UBG: 1 },
        mostPlayedColor: 'U',
      },
      cardTypeProfile: {
        averageByType: {
          Creature: 20,
          Instant: 5,
          Sorcery: 5,
          Enchantment: 2,
          Artifact: 2,
          Planeswalker: 0,
          Land: 37,
          Battle: 0,
          Kindred: 0,
          Other: 0,
        },
      },
    });

    expect(generateDeckbuilderLabel(stats)).toBe('Sultai Creature-Heavy Grinder');
  });

  it('still produces a label for a single deck', () => {
    const stats = makeStats({
      colorProfile: {
        colorFrequency: { W: 1, U: 0, B: 0, R: 0, G: 0, C: 0 },
        identityDistribution: { W: 1 },
        mostPlayedColor: 'W',
      },
      cardTypeProfile: {
        averageByType: {
          Creature: 0,
          Instant: 10,
          Sorcery: 0,
          Enchantment: 0,
          Artifact: 0,
          Planeswalker: 0,
          Land: 36,
          Battle: 0,
          Kindred: 0,
          Other: 0,
        },
      },
    });

    expect(generateDeckbuilderLabel(stats)).toBe('Mono-White Instant-Heavy Grinder');
  });

  it('falls back to the single most-played color when identities are perfectly tied', () => {
    const stats = makeStats({
      colorProfile: {
        colorFrequency: { W: 0.5, U: 0.5, B: 0, R: 0, G: 0, C: 0 },
        identityDistribution: { W: 1, U: 1 },
        mostPlayedColor: 'W',
      },
    });

    expect(generateDeckbuilderLabel(stats)).toBe('Mono-White Grinder');
  });

  it('omits the card-type component when non-land types are tied', () => {
    const stats = makeStats({
      colorProfile: {
        colorFrequency: { W: 1, U: 0, B: 0, R: 0, G: 0, C: 0 },
        identityDistribution: { W: 1 },
        mostPlayedColor: 'W',
      },
      cardTypeProfile: {
        averageByType: {
          Creature: 10,
          Instant: 10,
          Sorcery: 0,
          Enchantment: 0,
          Artifact: 0,
          Planeswalker: 0,
          Land: 36,
          Battle: 0,
          Kindred: 0,
          Other: 0,
        },
      },
    });

    expect(generateDeckbuilderLabel(stats)).toBe('Mono-White Grinder');
  });

  it('omits the color component when there are zero decks', () => {
    const stats = makeStats();
    expect(generateDeckbuilderLabel(stats)).toBe('Grinder');
  });
});
