import { buildProfileQueryParams } from './buildStatsUrl';

export function buildReportUrl(
  moxfield: string,
  archidekt: string,
  includedIds: Set<string>,
  totalDeckCount: number
): string {
  const params = buildProfileQueryParams(moxfield, archidekt, includedIds, totalDeckCount);
  return `/report?${params.toString()}`;
}
