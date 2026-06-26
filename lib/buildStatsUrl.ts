export function buildProfileQueryParams(
  moxfield: string,
  archidekt: string,
  includedIds: Set<string>,
  totalDeckCount: number
): URLSearchParams {
  const params = new URLSearchParams();
  if (moxfield) params.set('moxfield', moxfield);
  if (archidekt) params.set('archidekt', archidekt);
  if (includedIds.size > 0 && includedIds.size < totalDeckCount) {
    params.set('include', Array.from(includedIds).join(','));
  }
  return params;
}

export function buildStatsUrl(
  moxfield: string,
  archidekt: string,
  includedIds: Set<string>,
  totalDeckCount: number
): string {
  const params = buildProfileQueryParams(moxfield, archidekt, includedIds, totalDeckCount);
  return `/api/stats?${params.toString()}`;
}
