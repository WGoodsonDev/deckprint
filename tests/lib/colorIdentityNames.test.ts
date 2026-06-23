import { describe, it, expect } from 'vitest';
import { colorIdentityName } from '@/lib/colorIdentityNames';

describe('colorIdentityName', () => {
  it('names colorless identities', () => {
    expect(colorIdentityName('C')).toBe('Colorless');
    expect(colorIdentityName('')).toBe('Colorless');
  });

  it('names mono-color identities', () => {
    expect(colorIdentityName('W')).toBe('Mono-White');
    expect(colorIdentityName('G')).toBe('Mono-Green');
  });

  it('names two-color guilds regardless of input letter order', () => {
    expect(colorIdentityName('UB')).toBe('Dimir');
    expect(colorIdentityName('BU')).toBe('Dimir');
    expect(colorIdentityName('WR')).toBe('Boros');
  });

  it('names three-color wedges and shards', () => {
    expect(colorIdentityName('UBG')).toBe('Sultai');
    expect(colorIdentityName('WUR')).toBe('Jeskai');
    expect(colorIdentityName('BRG')).toBe('Jund');
  });

  it('names four-color identities as Non-X', () => {
    expect(colorIdentityName('UBRG')).toBe('Non-White');
    expect(colorIdentityName('WUBR')).toBe('Non-Green');
  });

  it('names the five-color identity', () => {
    expect(colorIdentityName('WUBRG')).toBe('Five-Color');
  });
});
