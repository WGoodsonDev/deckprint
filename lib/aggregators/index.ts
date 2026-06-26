import type { Deck } from '@/types/core';
import type { ProfileStats } from '@/types/stats';
import { computeColorProfile } from './color';
import { computeCurveProfile } from './curve';
import { computeRecencyProfile } from './recency';
import { computeCardOverlap } from './overlap';
import { computeCardTypeProfile } from './cardType';

export function computeProfileStats(decks: Deck[]): ProfileStats {
  const uniqueIds = new Set(
    decks.flatMap((d) => [...d.mainboard, ...d.commanders].map((c) => c.scryfallId))
  );
  return {
    deckCount: decks.length,
    uniqueCardCount: uniqueIds.size,
    colorProfile: computeColorProfile(decks),
    curveProfile: computeCurveProfile(decks),
    recencyProfile: computeRecencyProfile(decks),
    cardOverlap: computeCardOverlap(decks),
    cardTypeProfile: computeCardTypeProfile(decks),
  };
}
