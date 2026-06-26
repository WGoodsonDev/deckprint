import type { CardType, Color, SourceError } from './core';

export interface ProfileStats {
  deckCount: number;
  uniqueCardCount: number;
  colorProfile: ColorProfile;
  curveProfile: CurveProfile;
  recencyProfile: RecencyProfile;
  cardOverlap: CardOverlapProfile;
  cardTypeProfile: CardTypeProfile;
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

export interface RecencyProfile {
  within30Days: number;
  within90Days: number;
  within365Days: number;
  olderThan365Days: number;
  mostRecentDeck: { name: string; updatedAt: string } | null;
}

export interface CardOverlapProfile {
  staples: StapleEntry[];
}

export interface StapleEntry {
  scryfallId: string;
  name: string;
  deckCount: number;
  totalCopies: number;
}

export interface CardTypeProfile {
  averageByType: Record<CardType, number>;
}
