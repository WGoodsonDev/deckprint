import type { CardType } from '@/types/core';
import type { ProfileStats } from '@/types/stats';
import { colorIdentityName } from './colorIdentityNames';

export const LOW_CURVE_THRESHOLD = 2.5;
const HIGH_CMC_THRESHOLD = 3.5;
const VERSATILE_THRESHOLD = 10;
const SPECIALIST_THRESHOLD = 3;
const LOW_STAPLE_RATE_THRESHOLD = 0.05;
const TACTICIAN_INSTANT_THRESHOLD = 0.18;
const ARCHITECT_PERMANENT_THRESHOLD = 0.2;

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
  const { identityDistribution } = stats.colorProfile;
  const identities = Object.keys(identityDistribution);
  if (identities.length === 0) return null;

  // Score each candidate identity by how many deck-instances contain it as a color subset.
  // E.g. BG ⊆ WBG and BG ⊆ UBG and BG ⊆ BG, so BG scores higher than any individual 3-color identity.
  const scored = identities.map((candidate) => {
    const candidateColors = new Set(candidate.split(''));
    const subsetCount = Object.entries(identityDistribution).reduce(
      (sum, [key, count]) => {
        const deckColors = new Set(key.split(''));
        return [...candidateColors].every((c) => deckColors.has(c)) ? sum + count : sum;
      },
      0
    );
    return {
      identity: candidate,
      subsetCount,
      colorCount: candidate.length,
      deckCount: identityDistribution[candidate] ?? 0,
    };
  });

  // Prefer highest subset coverage, then most colors (multicolor over mono), then most explicitly played.
  scored.sort((a, b) => {
    if (b.subsetCount !== a.subsetCount) return b.subsetCount - a.subsetCount;
    if (b.colorCount !== a.colorCount) return b.colorCount - a.colorCount;
    return b.deckCount - a.deckCount;
  });

  // If any multicolor identity exists, mono should never win — it would only win by coverage,
  // not because it's the player's actual identity.
  const multicolor = scored.filter((s) => s.colorCount > 1);
  return colorIdentityName((multicolor.length > 0 ? multicolor : scored)[0].identity);
}

function speedComponent(stats: ProfileStats): string | null {
  const { overallAverageCmc } = stats.curveProfile;
  if (overallAverageCmc < LOW_CURVE_THRESHOLD) return 'Low-Curve';
  if (overallAverageCmc > HIGH_CMC_THRESHOLD) return 'High-CMC';
  return null;
}

function deckCountComponent(stats: ProfileStats): string | null {
  if (stats.deckCount >= VERSATILE_THRESHOLD) return 'Versatile';
  if (stats.deckCount <= SPECIALIST_THRESHOLD && stats.deckCount > 0) return 'Specialist';
  return null;
}

function cardTypeComponent(stats: ProfileStats): string | null {
  const dominantType = dominantKey<CardType>(stats.cardTypeProfile.averageByType, ['Land']);
  return dominantType ? `${dominantType}-Heavy` : null;
}

function tailWord(stats: ProfileStats): string {
  const { averageByType } = stats.cardTypeProfile;
  const totalNonLandAvg = Object.entries(averageByType)
    .filter(([type]) => type !== 'Land')
    .reduce((sum, [, val]) => sum + val, 0);

  const dominantType = dominantKey<CardType>(averageByType, ['Land']);
  const { overallAverageCmc } = stats.curveProfile;
  const stapleRate =
    stats.uniqueCardCount > 0
      ? stats.cardOverlap.staples.length / stats.uniqueCardCount
      : 0;

  if (stapleRate <= LOW_STAPLE_RATE_THRESHOLD) return 'Brewer';

  if (
    totalNonLandAvg > 0 &&
    averageByType['Instant'] / totalNonLandAvg >= TACTICIAN_INSTANT_THRESHOLD
  )
    return 'Tactician';

  if (
    totalNonLandAvg > 0 &&
    (averageByType['Enchantment'] + averageByType['Artifact']) / totalNonLandAvg >=
      ARCHITECT_PERMANENT_THRESHOLD
  )
    return 'Architect';

  if (dominantType === 'Creature' && overallAverageCmc <= LOW_CURVE_THRESHOLD)
    return 'Pilot';

  return 'Grinder';
}

export function generateDeckbuilderLabel(stats: ProfileStats): string {
  return [
    colorComponent(stats),
    speedComponent(stats),
    deckCountComponent(stats),
    cardTypeComponent(stats),
    tailWord(stats),
  ]
    .filter((part): part is string => Boolean(part))
    .join(' ');
}
