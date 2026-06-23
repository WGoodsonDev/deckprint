import { describe, it, expect } from 'vitest';
import { buildReportUrl } from '@/lib/buildReportUrl';

describe('buildReportUrl', () => {
  it('includes both usernames when provided', () => {
    const url = buildReportUrl('tehgoyf', 'saffronolive', new Set(['a', 'b']), 2);
    expect(url).toBe('/report?moxfield=tehgoyf&archidekt=saffronolive');
  });

  it('omits blank usernames', () => {
    const url = buildReportUrl('', 'saffronolive', new Set(['a', 'b']), 2);
    expect(url).toBe('/report?archidekt=saffronolive');
  });

  it('appends include param when some decks are excluded', () => {
    const url = buildReportUrl('', 'saffronolive', new Set(['archidekt:111']), 3);
    expect(url).toBe('/report?archidekt=saffronolive&include=archidekt%3A111');
  });

  it('omits include param when all decks are included', () => {
    const url = buildReportUrl('', 'saffronolive', new Set(['a', 'b', 'c']), 3);
    expect(url).toBe('/report?archidekt=saffronolive');
  });
});
