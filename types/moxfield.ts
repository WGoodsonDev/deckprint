// External API types for Moxfield responses.
// These are NOT verified via live testing as of May 2026 — Cloudflare WAF
// blocks all server-side requests. Treat as potentially stale.
// See /docs/api-reference.md for details.

export interface MoxfieldDeckListResponse {
  pageNumber: number;
  pageSize: number;
  totalResults: number;
  totalPages: number;
  data: MoxfieldDeckSummary[];
}

export interface MoxfieldDeckSummary {
  id: string;
  name: string;
  description: string;
  format: string;
  areCommentsEnabled: boolean;
  isShared: boolean;
  publicUrl: string;
  publicId: string;
  likeCount: number;
  viewCount: number;
  commentCount: number;
  colors: string[];
  colorPercentages: Record<string, number>;
  colorIdentity: string[];
  createdAtUtc: string;
  lastUpdatedAtUtc: string;
  mainCardCount: number;
  commanders: MoxfieldCardSummary[];
}

export interface MoxfieldCardSummary {
  quantity: number;
  card: {
    id: string;
    uniqueCardId: string;
    name: string;
    cmc: number;
    type_line: string;
    color_identity: string[];
    colors: string[];
    mana_cost: string;
    set: string;
  };
}

export interface MoxfieldDeckResponse {
  id: string;
  name: string;
  description: string;
  format: string;
  publicUrl: string;
  createdAtUtc: string;
  lastUpdatedAtUtc: string;
  commanders: Record<string, MoxfieldDeckCard>;
  companions: Record<string, MoxfieldDeckCard>;
  mainboard: Record<string, MoxfieldDeckCard>;
  sideboard: Record<string, MoxfieldDeckCard>;
}

export interface MoxfieldDeckCard {
  quantity: number;
  isFoil: boolean;
  isProxy: boolean;
  card: {
    uniqueCardId: string;
    name: string;
    mana_cost: string | null;
    cmc: number;
    type_line: string;
    color_identity: string[];
    colors: string[];
    set: string;
  };
}
