import { describe, it, expect } from 'vitest';
import { computeCurveProfile } from '@/lib/aggregators/curve';
import { makeCard, makeDeck } from './fixtures';

describe('computeCurveProfile', () => {
  it('computes averageCurve and overallAverageCmc for a single deck', () => {
    const deck = makeDeck({
      mainboard: [
        makeCard({ cmc: 1, quantity: 4, cardTypes: ['Creature'] }),
        makeCard({ cmc: 2, quantity: 4, cardTypes: ['Instant'] }),
        makeCard({ cmc: 3, quantity: 4, cardTypes: ['Sorcery'] }),
      ],
    });
    const result = computeCurveProfile([deck]);

    expect(result.averageCurve[1]).toBe(4);
    expect(result.averageCurve[2]).toBe(4);
    expect(result.averageCurve[3]).toBe(4);
    // (1*4 + 2*4 + 3*4) / 12 = 2.0
    expect(result.overallAverageCmc).toBe(2);
  });

  it('excludes lands from both averageCurve and overallAverageCmc', () => {
    const deck = makeDeck({
      mainboard: [
        makeCard({ cmc: 1, quantity: 4, cardTypes: ['Creature'] }),
        makeCard({ cmc: 0, quantity: 36, cardTypes: ['Land'] }),
      ],
    });
    const result = computeCurveProfile([deck]);

    expect(result.averageCurve[0]).toBeUndefined();
    expect(result.averageCurve[1]).toBe(4);
    expect(result.overallAverageCmc).toBe(1);
  });

  it('averages cmc counts across all decks including decks with zero at a given cmc', () => {
    const deck1 = makeDeck({
      mainboard: [makeCard({ cmc: 2, quantity: 3, cardTypes: ['Creature'] })],
    });
    const deck2 = makeDeck({
      mainboard: [
        makeCard({ cmc: 2, quantity: 5, cardTypes: ['Creature'] }),
        makeCard({ cmc: 3, quantity: 2, cardTypes: ['Instant'] }),
      ],
    });
    const result = computeCurveProfile([deck1, deck2]);

    // cmc 2: (3 + 5) / 2 = 4
    expect(result.averageCurve[2]).toBe(4);
    // cmc 3: (0 + 2) / 2 = 1 — deck1 has zero at cmc 3, still in denominator
    expect(result.averageCurve[3]).toBe(1);
    // overallAverageCmc: (2*3 + 2*5 + 3*2) / (3+5+2) = 22/10 = 2.2
    expect(result.overallAverageCmc).toBeCloseTo(2.2);
  });

  it('contributes zero non-land cards from an all-land deck without dividing by zero', () => {
    const allLands = makeDeck({
      mainboard: [makeCard({ cmc: 0, quantity: 40, cardTypes: ['Land'] })],
    });
    const withSpells = makeDeck({
      mainboard: [makeCard({ cmc: 2, quantity: 4, cardTypes: ['Creature'] })],
    });
    const result = computeCurveProfile([allLands, withSpells]);

    // cmc 2: (0 + 4) / 2 = 2 — all-land deck contributes zero, counted in denominator
    expect(result.averageCurve[2]).toBe(2);
    expect(result.overallAverageCmc).toBe(2);
  });

  it('returns empty averageCurve and overallAverageCmc of 0 for empty input', () => {
    const result = computeCurveProfile([]);

    expect(result.averageCurve).toEqual({});
    expect(result.overallAverageCmc).toBe(0);
  });
});
