import type { Deck, Format } from '@/types/core';
import type { FormatProfile } from '@/types/stats';

const FORMAT_ORDER: Format[] = [
  'commander', 'pioneer', 'modern', 'standard', 'legacy',
  'vintage', 'pauper', 'draft', 'sealed', 'other',
];

export const computeFormatProfile = (decks: Deck[]): FormatProfile => {
  if (decks.length === 0) {
    return { formatCounts: {}, primaryFormat: 'other' };
  }

  const formatCounts: Partial<Record<Format, number>> = {};

  for (const deck of decks) {
    formatCounts[deck.format] = (formatCounts[deck.format] ?? 0) + 1;
  }

  let primaryFormat: Format = 'other';
  let maxCount = 0;

  for (const format of FORMAT_ORDER) {
    const count = formatCounts[format] ?? 0;
    if (count > maxCount) {
      maxCount = count;
      primaryFormat = format;
    }
  }

  return { formatCounts, primaryFormat };
};
