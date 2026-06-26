import { describe, it, expect } from 'vitest';
import type { ProfileStats } from '@/types/stats';
import { generateDeckbuilderLabel } from '@/lib/labelGenerator';

const BASE_CARD_TYPES = {
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
};

// Default profile: mid-range in every dimension → produces Grinder with no descriptor components.
// stapleRate = 10/100 = 0.1 (> LOW_STAPLE_RATE_THRESHOLD); Instant/25 = 0.12 (< TACTICIAN);
// perm/25 = 0 (< ARCHITECT); cmc 3.0 > LOW_CURVE_THRESHOLD → not Pilot; deckCount 5 = middle range.
const DEFAULT_STAPLES = Array.from({ length: 10 }, (_, i) => ({
  scryfallId: `staple-${i}`,
  name: `Staple ${i}`,
  deckCount: 3,
  totalCopies: 3,
}));

function makeStats(overrides: Partial<ProfileStats> = {}): ProfileStats {
  return {
    deckCount: 5,
    uniqueCardCount: 100,
    colorProfile: {
      colorFrequency: { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0 },
      identityDistribution: {},
      mostPlayedColor: 'W',
    },
    curveProfile: { averageCurve: {}, overallAverageCmc: 3.0 },
    recencyProfile: {
      within30Days: 0,
      within90Days: 0,
      within365Days: 0,
      olderThan365Days: 0,
      mostRecentDeck: null,
    },
    cardOverlap: { staples: DEFAULT_STAPLES },
    cardTypeProfile: {
      averageByType: { ...BASE_CARD_TYPES, Creature: 20, Instant: 3, Sorcery: 2, Land: 37 },
    },
    ...overrides,
  };
}

describe('generateDeckbuilderLabel', () => {
  // --- Color + type + tail (baseline) ---

  it('combines a dominant color identity and dominant non-land card type', () => {
    const stats = makeStats({
      colorProfile: {
        colorFrequency: { W: 0, U: 1, B: 1, R: 0, G: 1, C: 0 },
        identityDistribution: { UBG: 1 },
        mostPlayedColor: 'U',
      },
      cardTypeProfile: {
        // Instant: 5/30 ≈ 0.17 < TACTICIAN_THRESHOLD → Grinder
        averageByType: { ...BASE_CARD_TYPES, Creature: 20, Instant: 5, Sorcery: 5, Land: 37 },
      },
    });

    expect(generateDeckbuilderLabel(stats)).toBe('Sultai Creature-Heavy Grinder');
  });

  it('still produces a label for a single deck', () => {
    const stats = makeStats({
      deckCount: 1,
      colorProfile: {
        colorFrequency: { W: 1, U: 0, B: 0, R: 0, G: 0, C: 0 },
        identityDistribution: { W: 1 },
        mostPlayedColor: 'W',
      },
      cardTypeProfile: {
        // Instant-Heavy; Instant/10 = 1.0 > TACTICIAN_THRESHOLD → Tactician is correct
        averageByType: { ...BASE_CARD_TYPES, Instant: 10, Land: 36 },
      },
    });

    expect(generateDeckbuilderLabel(stats)).toBe('Mono-White Specialist Instant-Heavy Tactician');
  });

  it('picks the identity with highest subset coverage when identities are tied in deck count', () => {
    // BG ⊆ WBG, BG ⊆ UBG, BG ⊆ BG → subset count 3; WBG and UBG each score 1. BG wins.
    const stats = makeStats({
      colorProfile: {
        colorFrequency: { W: 0.33, U: 0.33, B: 1, R: 0, G: 1, C: 0 },
        identityDistribution: { WBG: 1, UBG: 1, BG: 1 },
        mostPlayedColor: 'B',
      },
    });

    expect(generateDeckbuilderLabel(stats)).toContain('Golgari');
  });

  it('prefers multicolor over mono when subset coverage is equal', () => {
    // WU: WU⊆WU(1) = 1. B: B⊆B(1) = 1. Both score 1. WU has colorCount=2, B has colorCount=1 → WU wins.
    const stats = makeStats({
      colorProfile: {
        colorFrequency: { W: 0.5, U: 0.5, B: 0.5, R: 0, G: 0, C: 0 },
        identityDistribution: { WU: 1, B: 1 },
        mostPlayedColor: 'U',
      },
    });
    expect(generateDeckbuilderLabel(stats)).toContain('Azorius');
  });

  it('omits the card-type component when two non-land types are tied', () => {
    const stats = makeStats({
      colorProfile: {
        colorFrequency: { W: 1, U: 0, B: 0, R: 0, G: 0, C: 0 },
        identityDistribution: { W: 1 },
        mostPlayedColor: 'W',
      },
      cardTypeProfile: {
        // Creature = Sorcery → no dominant type; Instant = 0 → no Tactician
        averageByType: { ...BASE_CARD_TYPES, Creature: 10, Sorcery: 10, Land: 36 },
      },
    });

    expect(generateDeckbuilderLabel(stats)).toBe('Mono-White Grinder');
  });

  it('omits the color component when there are zero decks', () => {
    const stats = makeStats({
      deckCount: 0,
      uniqueCardCount: 0,
      cardOverlap: { staples: [] },
      colorProfile: {
        colorFrequency: { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0 },
        identityDistribution: {},
        mostPlayedColor: 'W',
      },
      cardTypeProfile: { averageByType: { ...BASE_CARD_TYPES } },
    });
    // uniqueCardCount = 0 → stapleRate = 0 → Brewer
    expect(generateDeckbuilderLabel(stats)).toBe('Brewer');
  });

  // --- Speed component ---

  it('adds Low-Curve when avg CMC is below 2.5', () => {
    const stats = makeStats({
      curveProfile: { averageCurve: {}, overallAverageCmc: 2.0 },
    });
    expect(generateDeckbuilderLabel(stats)).toContain('Low-Curve');
  });

  it('adds High-CMC when avg CMC is above 3.5', () => {
    const stats = makeStats({
      curveProfile: { averageCurve: {}, overallAverageCmc: 4.0 },
    });
    expect(generateDeckbuilderLabel(stats)).toContain('High-CMC');
  });

  it('omits the speed component when avg CMC is between thresholds', () => {
    const stats = makeStats({
      curveProfile: { averageCurve: {}, overallAverageCmc: 3.0 },
    });
    const label = generateDeckbuilderLabel(stats);
    expect(label).not.toContain('Low-Curve');
    expect(label).not.toContain('High-CMC');
  });

  it('omits speed at exactly 2.5 (threshold is exclusive)', () => {
    const stats = makeStats({
      curveProfile: { averageCurve: {}, overallAverageCmc: 2.5 },
    });
    const label = generateDeckbuilderLabel(stats);
    expect(label).not.toContain('Low-Curve');
    expect(label).not.toContain('High-CMC');
  });

  it('omits speed at exactly 3.5 (threshold is exclusive)', () => {
    const stats = makeStats({
      curveProfile: { averageCurve: {}, overallAverageCmc: 3.5 },
    });
    const label = generateDeckbuilderLabel(stats);
    expect(label).not.toContain('Low-Curve');
    expect(label).not.toContain('High-CMC');
  });

  // --- Deck count descriptor ---

  it('adds Versatile when deckCount >= VERSATILE_THRESHOLD (10)', () => {
    const stats = makeStats({ deckCount: 10 });
    expect(generateDeckbuilderLabel(stats)).toContain('Versatile');
  });

  it('adds Specialist when deckCount <= SPECIALIST_THRESHOLD (3) and > 0', () => {
    const stats = makeStats({ deckCount: 3 });
    expect(generateDeckbuilderLabel(stats)).toContain('Specialist');
  });

  it('omits deck count descriptor in the middle range (4-9)', () => {
    const stats = makeStats({ deckCount: 5 });
    const label = generateDeckbuilderLabel(stats);
    expect(label).not.toContain('Versatile');
    expect(label).not.toContain('Specialist');
  });

  it('omits Specialist when deckCount is 0', () => {
    const stats = makeStats({ deckCount: 0 });
    expect(generateDeckbuilderLabel(stats)).not.toContain('Specialist');
  });

  // --- Tail word branches ---

  it('tail is Brewer when staple rate is at or below LOW_STAPLE_RATE_THRESHOLD', () => {
    const stats = makeStats({
      uniqueCardCount: 200,
      cardOverlap: {
        staples: [{ scryfallId: 'a', name: 'A', deckCount: 3, totalCopies: 3 }],
      },
    });
    // 1/200 = 0.005 <= 0.05
    expect(generateDeckbuilderLabel(stats)).toContain('Brewer');
  });

  it('tail is Tactician when instant share >= TACTICIAN_INSTANT_THRESHOLD', () => {
    const stats = makeStats({
      cardTypeProfile: {
        // Instant: 20/35 ≈ 0.57 > 0.18; staple rate = 0.1 > 0.05
        averageByType: { ...BASE_CARD_TYPES, Instant: 20, Creature: 10, Sorcery: 5, Land: 37 },
      },
    });
    expect(generateDeckbuilderLabel(stats)).toContain('Tactician');
  });

  it('tail is Architect when enchantment+artifact share >= ARCHITECT_PERMANENT_THRESHOLD', () => {
    const stats = makeStats({
      cardTypeProfile: {
        // (12+10)/30 ≈ 0.73 > 0.2; Instant/30 = 0.1 < 0.18; staple rate = 0.1 > 0.05
        averageByType: { ...BASE_CARD_TYPES, Enchantment: 12, Artifact: 10, Creature: 5, Instant: 3, Land: 37 },
      },
    });
    expect(generateDeckbuilderLabel(stats)).toContain('Architect');
  });

  it('tail is Pilot when dominant type is Creature and avg CMC <= LOW_CURVE_THRESHOLD', () => {
    const stats = makeStats({
      curveProfile: { averageCurve: {}, overallAverageCmc: 2.1 },
      cardTypeProfile: {
        // Creature dominant; Instant/27 ≈ 0.07 < 0.18; perm = 0; cmc 2.1 <= 2.5
        averageByType: { ...BASE_CARD_TYPES, Creature: 25, Instant: 2, Land: 37 },
      },
    });
    expect(generateDeckbuilderLabel(stats)).toContain('Pilot');
  });

  it('tail falls back to Grinder when no other signal matches', () => {
    const stats = makeStats({
      curveProfile: { averageCurve: {}, overallAverageCmc: 3.0 },
      cardTypeProfile: {
        // staple rate 0.1 > 0.05; Instant/23 ≈ 0.13 < 0.18; perm/23 = 0; cmc 3.0 > 2.5 → Grinder
        averageByType: { ...BASE_CARD_TYPES, Creature: 20, Instant: 3, Land: 37 },
      },
    });
    expect(generateDeckbuilderLabel(stats)).toContain('Grinder');
  });
});
