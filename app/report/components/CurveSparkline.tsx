import type { CurveProfile } from '@/types/stats';

interface CurveSparklineProps {
  curveProfile: CurveProfile;
}

const CMC_BUCKETS = [0, 1, 2, 3, 4, 5, 6];

export function CurveSparkline({ curveProfile }: CurveSparklineProps) {
  const { averageCurve, overallAverageCmc } = curveProfile;

  // Aggregate all CMC values >= 6 into the 6+ bucket
  const bucketValues: Record<number, number> = {};
  for (const bucket of CMC_BUCKETS) {
    bucketValues[bucket] = 0;
  }
  for (const [cmc, count] of Object.entries(averageCurve)) {
    const n = Number(cmc);
    const bucket = n >= 6 ? 6 : n;
    bucketValues[bucket] = (bucketValues[bucket] ?? 0) + count;
  }

  const maxValue = Math.max(...Object.values(bucketValues), 1);
  const isEmpty = maxValue === 0 || Object.keys(averageCurve).length === 0;

  if (isEmpty) {
    return (
      <div className="text-xs text-zinc-400 dark:text-zinc-500">No curve data.</div>
    );
  }

  return (
    <div>
      <div className="flex gap-1 h-10">
        {CMC_BUCKETS.map((bucket) => {
          const value = bucketValues[bucket] ?? 0;
          const heightPct = (value / maxValue) * 100;
          return (
            <div key={bucket} className="flex flex-col justify-end flex-1">
              <div
                className="w-full rounded-sm bg-zinc-400 dark:bg-zinc-500"
                style={{ height: `${heightPct}%`, minHeight: value > 0 ? '2px' : '0' }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-1 mt-0.5">
        {CMC_BUCKETS.map((bucket) => (
          <div key={bucket} className="flex-1 text-center text-[10px] text-zinc-400 dark:text-zinc-500">
            {bucket === 6 ? '6+' : bucket}
          </div>
        ))}
      </div>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
        Avg CMC: {overallAverageCmc.toFixed(2)}
      </p>
    </div>
  );
}
