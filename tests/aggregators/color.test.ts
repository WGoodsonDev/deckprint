import { describe, it, expect } from 'vitest';
import { computeColorProfile } from '@/lib/aggregators/color';
import { makeDeck } from './fixtures';

describe('computeColorProfile', () => {
  it('returns correct frequency and distribution for a single-color deck', () => {
    const decks = [makeDeck({ colorIdentity: ['W'] })];
    const result = computeColorProfile(decks);

    expect(result.colorFrequency.W).toBe(1);
    expect(result.colorFrequency.U).toBe(0);
    expect(result.colorFrequency.B).toBe(0);
    expect(result.colorFrequency.R).toBe(0);
    expect(result.colorFrequency.G).toBe(0);
    expect(result.colorFrequency.C).toBe(0);
    expect(result.identityDistribution).toEqual({ W: 1 });
    expect(result.mostPlayedColor).toBe('W');
  });

  it('sorts multi-color identities into canonical WUBRG order for the distribution key', () => {
    const decks = [makeDeck({ colorIdentity: ['R', 'U', 'B'] })];
    const result = computeColorProfile(decks);

    expect(result.identityDistribution).toEqual({ UBR: 1 });
  });

  it('expresses colorFrequency as a fraction across multiple decks', () => {
    const decks = [
      makeDeck({ colorIdentity: ['W'] }),
      makeDeck({ colorIdentity: ['U', 'R'] }),
    ];
    const result = computeColorProfile(decks);

    expect(result.colorFrequency.W).toBe(0.5);
    expect(result.colorFrequency.U).toBe(0.5);
    expect(result.colorFrequency.R).toBe(0.5);
    expect(result.colorFrequency.B).toBe(0);
    expect(result.identityDistribution).toEqual({ W: 1, UR: 1 });
  });

  it('maps a colorless deck (empty colorIdentity) to "C" in distribution and frequency', () => {
    const decks = [makeDeck({ colorIdentity: [] })];
    const result = computeColorProfile(decks);

    expect(result.identityDistribution).toEqual({ C: 1 });
    expect(result.colorFrequency.C).toBe(1);
  });

  it('applies WUBRG tiebreak when multiple colors share the highest frequency', () => {
    const decks = [
      makeDeck({ colorIdentity: ['W'] }),
      makeDeck({ colorIdentity: ['U'] }),
    ];
    const result = computeColorProfile(decks);

    // W and U both at 0.5 — W wins by WUBRG order
    expect(result.colorFrequency.W).toBe(0.5);
    expect(result.colorFrequency.U).toBe(0.5);
    expect(result.mostPlayedColor).toBe('W');
  });

  it('returns zero frequencies, empty distribution, and mostPlayedColor "W" for empty input', () => {
    const result = computeColorProfile([]);

    expect(result.colorFrequency).toEqual({ W: 0, U: 0, B: 0, R: 0, G: 0, C: 0 });
    expect(result.identityDistribution).toEqual({});
    expect(result.mostPlayedColor).toBe('W');
  });
});
