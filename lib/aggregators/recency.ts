import type { Deck } from '@/types/core';
import type { RecencyProfile } from '@/types/stats';

const DAY_MS = 24 * 60 * 60 * 1000;

export const computeRecencyProfile = (decks: Deck[], now: Date = new Date()): RecencyProfile => {
  if (decks.length === 0) {
    return { within30Days: 0, within90Days: 0, within365Days: 0, olderThan365Days: 0, mostRecentDeck: null };
  }

  const nowMs = now.getTime();

  let within30Days = 0;
  let within90Days = 0;
  let within365Days = 0;
  let olderThan365Days = 0;
  let mostRecentMs = -Infinity;
  let mostRecentDeck: { name: string; updatedAt: string } | null = null;

  for (const deck of decks) {
    const updatedMs = new Date(deck.updatedAt).getTime();
    const ageDays = (nowMs - updatedMs) / DAY_MS;

    if (ageDays <= 30) {
      within30Days++;
    } else if (ageDays <= 90) {
      within90Days++;
    } else if (ageDays <= 365) {
      within365Days++;
    } else {
      olderThan365Days++;
    }

    if (updatedMs > mostRecentMs) {
      mostRecentMs = updatedMs;
      mostRecentDeck = { name: deck.name, updatedAt: deck.updatedAt };
    }
  }

  return { within30Days, within90Days, within365Days, olderThan365Days, mostRecentDeck };
};
