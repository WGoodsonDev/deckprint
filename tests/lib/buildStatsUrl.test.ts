import { describe, it, expect } from 'vitest';
import { buildStatsUrl } from '@/lib/buildStatsUrl';

describe('buildStatsUrl', () => {
  it('includes both usernames when provided', () => {
    const url = buildStatsUrl('tehgoyf', 'saffronolive', new Set(['a', 'b']), 2);
    expect(url).toBe('/api/stats?moxfield=tehgoyf&archidekt=saffronolive');
  });

  it('omits blank moxfield username', () => {
    const url = buildStatsUrl('', 'saffronolive', new Set(['a', 'b']), 2);
    expect(url).toBe('/api/stats?archidekt=saffronolive');
  });

  it('omits blank archidekt username', () => {
    const url = buildStatsUrl('tehgoyf', '', new Set(['a', 'b']), 2);
    expect(url).toBe('/api/stats?moxfield=tehgoyf');
  });

  it('appends include param when some decks are excluded', () => {
    const url = buildStatsUrl('', 'saffronolive', new Set(['archidekt:111']), 3);
    expect(url).toBe('/api/stats?archidekt=saffronolive&include=archidekt%3A111');
  });

  it('omits include param when all decks are included', () => {
    const url = buildStatsUrl('', 'saffronolive', new Set(['a', 'b', 'c']), 3);
    expect(url).toBe('/api/stats?archidekt=saffronolive');
  });

  it('omits include param when no decks are included', () => {
    const url = buildStatsUrl('', 'saffronolive', new Set(), 3);
    expect(url).toBe('/api/stats?archidekt=saffronolive');
  });

  it('includes multiple IDs joined by comma', () => {
    const url = buildStatsUrl('', 'saffronolive', new Set(['a', 'b']), 3);
    const parsed = new URL(url, 'http://localhost');
    const include = parsed.searchParams.get('include');
    expect(include).not.toBeNull();
    const ids = include!.split(',').sort();
    expect(ids).toEqual(['a', 'b']);
  });
});
