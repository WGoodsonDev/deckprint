import { describe, it, expect } from 'vitest';
import { computeFormatProfile } from '@/lib/aggregators/format';
import { makeDeck } from './fixtures';

describe('computeFormatProfile', () => {
  it('counts decks per format and identifies the primary format', () => {
    const decks = [
      makeDeck({ format: 'commander' }),
      makeDeck({ format: 'commander' }),
      makeDeck({ format: 'commander' }),
      makeDeck({ format: 'pioneer' }),
      makeDeck({ format: 'pioneer' }),
      makeDeck({ format: 'modern' }),
    ];
    const result = computeFormatProfile(decks);

    expect(result.formatCounts).toEqual({ commander: 3, pioneer: 2, modern: 1 });
    expect(result.primaryFormat).toBe('commander');
  });

  it('returns the single format as primary when all decks share one format', () => {
    const decks = [
      makeDeck({ format: 'legacy' }),
      makeDeck({ format: 'legacy' }),
    ];
    const result = computeFormatProfile(decks);

    expect(result.formatCounts).toEqual({ legacy: 2 });
    expect(result.primaryFormat).toBe('legacy');
  });

  it('breaks ties using Format enum order — commander before pioneer', () => {
    const decks = [
      makeDeck({ format: 'pioneer' }),
      makeDeck({ format: 'pioneer' }),
      makeDeck({ format: 'commander' }),
      makeDeck({ format: 'commander' }),
    ];
    const result = computeFormatProfile(decks);

    expect(result.formatCounts).toEqual({ commander: 2, pioneer: 2 });
    expect(result.primaryFormat).toBe('commander');
  });

  it('omits formats with zero decks from formatCounts', () => {
    const decks = [makeDeck({ format: 'modern' })];
    const result = computeFormatProfile(decks);

    expect(Object.keys(result.formatCounts)).toEqual(['modern']);
  });

  it('returns empty formatCounts and primaryFormat "other" for empty input', () => {
    const result = computeFormatProfile([]);

    expect(result.formatCounts).toEqual({});
    expect(result.primaryFormat).toBe('other');
  });
});
