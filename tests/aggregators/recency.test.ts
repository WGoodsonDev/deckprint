import { describe, it, expect } from 'vitest';
import { computeRecencyProfile } from '@/lib/aggregators/recency';
import { makeDeck } from './fixtures';

const DAY_MS = 24 * 60 * 60 * 1000;

function daysAgo(now: Date, days: number): string {
  return new Date(now.getTime() - days * DAY_MS).toISOString();
}

describe('computeRecencyProfile', () => {
  it('returns all zeros and null mostRecentDeck for empty input', () => {
    const result = computeRecencyProfile([]);
    expect(result).toEqual({
      within30Days: 0,
      within90Days: 0,
      within365Days: 0,
      olderThan365Days: 0,
      mostRecentDeck: null,
    });
  });

  it('places a deck updated 1 day ago in within30Days', () => {
    const now = new Date();
    const deck = makeDeck({ updatedAt: daysAgo(now, 1) });
    const result = computeRecencyProfile([deck], now);
    expect(result.within30Days).toBe(1);
    expect(result.within90Days).toBe(0);
    expect(result.within365Days).toBe(0);
    expect(result.olderThan365Days).toBe(0);
  });

  it('places a deck updated exactly 30 days ago in within30Days', () => {
    const now = new Date();
    const deck = makeDeck({ updatedAt: daysAgo(now, 30) });
    const result = computeRecencyProfile([deck], now);
    expect(result.within30Days).toBe(1);
  });

  it('places a deck updated 60 days ago in within90Days', () => {
    const now = new Date();
    const deck = makeDeck({ updatedAt: daysAgo(now, 60) });
    const result = computeRecencyProfile([deck], now);
    expect(result.within90Days).toBe(1);
    expect(result.within30Days).toBe(0);
  });

  it('places a deck updated exactly 365 days ago in within365Days', () => {
    const now = new Date();
    const deck = makeDeck({ updatedAt: daysAgo(now, 365) });
    const result = computeRecencyProfile([deck], now);
    expect(result.within365Days).toBe(1);
  });

  it('places a deck updated 200 days ago in within365Days', () => {
    const now = new Date();
    const deck = makeDeck({ updatedAt: daysAgo(now, 200) });
    const result = computeRecencyProfile([deck], now);
    expect(result.within365Days).toBe(1);
  });

  it('places a deck updated 400 days ago in olderThan365Days', () => {
    const now = new Date();
    const deck = makeDeck({ updatedAt: daysAgo(now, 400) });
    const result = computeRecencyProfile([deck], now);
    expect(result.olderThan365Days).toBe(1);
  });

  it('correctly counts multiple decks across all buckets', () => {
    const now = new Date();
    const decks = [
      makeDeck({ updatedAt: daysAgo(now, 5) }),
      makeDeck({ updatedAt: daysAgo(now, 20) }),
      makeDeck({ updatedAt: daysAgo(now, 60) }),
      makeDeck({ updatedAt: daysAgo(now, 200) }),
      makeDeck({ updatedAt: daysAgo(now, 500) }),
      makeDeck({ updatedAt: daysAgo(now, 700) }),
    ];
    const result = computeRecencyProfile(decks, now);
    expect(result.within30Days).toBe(2);
    expect(result.within90Days).toBe(1);
    expect(result.within365Days).toBe(1);
    expect(result.olderThan365Days).toBe(2);
  });

  it('identifies the most recently updated deck', () => {
    const now = new Date();
    const older = makeDeck({ name: 'Old Deck', updatedAt: daysAgo(now, 100) });
    const newer = makeDeck({ name: 'New Deck', updatedAt: daysAgo(now, 5) });
    const result = computeRecencyProfile([older, newer], now);
    expect(result.mostRecentDeck?.name).toBe('New Deck');
  });

  it('mostRecentDeck is set even when all decks are old', () => {
    const now = new Date();
    const deck = makeDeck({ name: 'Ancient Deck', updatedAt: daysAgo(now, 800) });
    const result = computeRecencyProfile([deck], now);
    expect(result.mostRecentDeck?.name).toBe('Ancient Deck');
  });
});
