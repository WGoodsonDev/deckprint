import type { CardType } from '@/types/core';
import type { ProfileStats } from '@/types/stats';
import { colorIdentityName } from './colorIdentityNames';

function dominantKey<T extends string>(
  counts: Record<T, number>,
  exclude: T[] = []
): T | null {
  const entries = (Object.entries(counts) as [T, number][]).filter(
    ([key, value]) => !exclude.includes(key) && value > 0
  );
  if (entries.length === 0) return null;

  const maxValue = Math.max(...entries.map(([, value]) => value));
  const atMax = entries.filter(([, value]) => value === maxValue);
  return atMax.length === 1 ? atMax[0][0] : null;
}

function colorComponent(stats: ProfileStats): string | null {
  const dominantIdentity = dominantKey(stats.colorProfile.identityDistribution);
  if (dominantIdentity) return colorIdentityName(dominantIdentity);

  // Tie across identities (or no decks) — fall back to the single most-played color.
  return Object.keys(stats.colorProfile.identityDistribution).length > 0
    ? colorIdentityName(stats.colorProfile.mostPlayedColor)
    : null;
}

function cardTypeComponent(stats: ProfileStats): string | null {
  const dominantType = dominantKey<CardType>(stats.cardTypeProfile.averageByType, ['Land']);
  return dominantType ? `${dominantType}-Heavy` : null;
}

export function generateDeckbuilderLabel(stats: ProfileStats): string {
  return [colorComponent(stats), cardTypeComponent(stats), 'Grinder']
    .filter((part): part is string => Boolean(part))
    .join(' ');
}
