import type { Color } from '@/types/core';

const WUBRG_ORDER: Color[] = ['W', 'U', 'B', 'R', 'G'];

const MONO_NAMES: Record<Color, string> = {
  W: 'Mono-White',
  U: 'Mono-Blue',
  B: 'Mono-Black',
  R: 'Mono-Red',
  G: 'Mono-Green',
  C: 'Colorless',
};

const GUILD_NAMES: Record<string, string> = {
  WU: 'Azorius',
  UB: 'Dimir',
  BR: 'Rakdos',
  RG: 'Gruul',
  WG: 'Selesnya',
  WB: 'Orzhov',
  UR: 'Izzet',
  BG: 'Golgari',
  WR: 'Boros',
  UG: 'Simic',
};

const WEDGE_SHARD_NAMES: Record<string, string> = {
  WUB: 'Esper',
  UBR: 'Grixis',
  BRG: 'Jund',
  WRG: 'Naya',
  WUG: 'Bant',
  WBG: 'Abzan',
  WUR: 'Jeskai',
  UBG: 'Sultai',
  WBR: 'Mardu',
  URG: 'Temur',
};

const NON_X_NAMES: Record<string, string> = {
  UBRG: 'Non-White',
  WBRG: 'Non-Blue',
  WURG: 'Non-Black',
  WUBG: 'Non-Red',
  WUBR: 'Non-Green',
};

function canonicalOrder(identity: string): Color[] {
  const colors = new Set(identity.split('') as Color[]);
  return WUBRG_ORDER.filter((color) => colors.has(color));
}

export function colorIdentityName(identity: string): string {
  if (identity === '' || identity === 'C') return 'Colorless';

  const ordered = canonicalOrder(identity);
  const key = ordered.join('');

  switch (ordered.length) {
    case 1:
      return MONO_NAMES[ordered[0]];
    case 2:
      return GUILD_NAMES[key] ?? key;
    case 3:
      return WEDGE_SHARD_NAMES[key] ?? key;
    case 4:
      return NON_X_NAMES[key] ?? key;
    case 5:
      return 'Five-Color';
    default:
      return 'Colorless';
  }
}
