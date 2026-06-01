import type { Deck } from '@/types/core';
import type { ProfileStats } from '@/types/stats';
import { computeColorProfile } from './color';
import { computeCurveProfile } from './curve';
import { computeFormatProfile } from './format';
import { computeCardOverlap } from './overlap';
import { computeArchetypeProfile } from './archetype';

export function computeProfileStats(decks: Deck[]): ProfileStats {
  return {
    colorProfile: computeColorProfile(decks),
    curveProfile: computeCurveProfile(decks),
    formatProfile: computeFormatProfile(decks),
    cardOverlap: computeCardOverlap(decks),
    archetypeProfile: computeArchetypeProfile(decks),
  };
}
