import { describe, it, expect } from 'vitest';
import { computeArchetypeProfile } from '@/lib/aggregators/archetype';
import { makeCard, makeDeck } from './fixtures';

describe('computeArchetypeProfile', () => {
  it('scores high aggro for a deck with many creatures and low average cmc', () => {
    const deck = makeDeck({
      mainboard: [
        // 30 creatures at cmc 1 — high creature density, low avg cmc
        makeCard({ cmc: 1, quantity: 30, cardTypes: ['Creature'] }),
        makeCard({ cmc: 2, quantity: 5, cardTypes: ['Instant'] }),
      ],
    });
    const result = computeArchetypeProfile([deck]);

    expect(result.aggro).toBeGreaterThan(0.5);
    expect(result.control).toBeLessThan(result.aggro);
  });

  it('scores high control for a deck with few creatures and many instants/sorceries', () => {
    const deck = makeDeck({
      mainboard: [
        makeCard({ cmc: 4, quantity: 2, cardTypes: ['Creature'] }),
        makeCard({ cmc: 2, quantity: 20, cardTypes: ['Instant'] }),
        makeCard({ cmc: 3, quantity: 10, cardTypes: ['Sorcery'] }),
      ],
    });
    const result = computeArchetypeProfile([deck]);

    expect(result.control).toBeGreaterThan(0.5);
    expect(result.aggro).toBeLessThan(result.control);
  });

  it('returns all scores as 0 for empty input', () => {
    const result = computeArchetypeProfile([]);

    expect(result.aggro).toBe(0);
    expect(result.midrange).toBe(0);
    expect(result.control).toBe(0);
    expect(result.combo).toBe(0);
  });

  it('does not throw when a deck contains only lands', () => {
    const allLands = makeDeck({
      mainboard: [makeCard({ cmc: 0, quantity: 40, cardTypes: ['Land'] })],
    });

    expect(() => computeArchetypeProfile([allLands])).not.toThrow();

    const result = computeArchetypeProfile([allLands]);
    expect(result.aggro).toBe(0);
    expect(result.control).toBe(0);
    expect(result.midrange).toBe(0);
    expect(result.combo).toBe(0);
  });
});
