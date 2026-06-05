import type { CardEntry, Color, Format, SourceError } from './core';

export interface ProfileStats {
  colorProfile: ColorProfile;
  curveProfile: CurveProfile;
  formatProfile: FormatProfile;
  cardOverlap: CardOverlapProfile;
  archetypeProfile: ArchetypeProfile;
  sourceErrors?: SourceError[];
}

export interface ColorProfile {
  colorFrequency: Record<Color, number>;
  identityDistribution: Record<string, number>;
  mostPlayedColor: Color;
}

export interface CurveProfile {
  averageCurve: Record<number, number>;
  overallAverageCmc: number;
}

export interface FormatProfile {
  // Partial: formats with zero decks are omitted rather than stored as 0
  formatCounts: Partial<Record<Format, number>>;
  primaryFormat: Format;
}

export interface CardOverlapProfile {
  staples: StapleEntry[];
  petCards: CardEntry[];
}

export interface StapleEntry {
  scryfallId: string;
  name: string;
  deckCount: number;
  totalCopies: number;
}

export interface ArchetypeProfile {
  aggro: number;
  midrange: number;
  control: number;
  combo: number;
}
