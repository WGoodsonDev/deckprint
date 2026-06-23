'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { CurveProfile } from '@/types/stats';

interface CurveHistogramProps {
  data: CurveProfile | null;
  isLoading: boolean;
  error: string | null;
}

const HIGH_CMC_THRESHOLD = 7;

export function CurveHistogram({ data, isLoading, error }: CurveHistogramProps) {
  if (isLoading) return <ChartShell label="Loading curve…" />;
  if (error) return <ChartShell label={error} isError />;

  const curveEntries = data ? Object.entries(data.averageCurve) : [];

  if (curveEntries.length === 0) return <ChartShell label="No curve data available." />;

  // Bucket CMC ≥ HIGH_CMC_THRESHOLD into a single "7+" bar
  const buckets: Record<string, number> = {};
  for (const [cmcStr, avg] of curveEntries) {
    const cmc = Number(cmcStr);
    const key = cmc >= HIGH_CMC_THRESHOLD ? `${HIGH_CMC_THRESHOLD}+` : String(cmc);
    buckets[key] = (buckets[key] ?? 0) + avg;
  }

  const chartData = Object.entries(buckets)
    .sort((a, b) => {
      const aNum = a[0].endsWith('+') ? HIGH_CMC_THRESHOLD : Number(a[0]);
      const bNum = b[0].endsWith('+') ? HIGH_CMC_THRESHOLD : Number(b[0]);
      return aNum - bNum;
    })
    .map(([cmc, avg]) => ({ cmc, avg: Number(avg.toFixed(2)) }));

  return (
    <div>
      {data && (
        <p className="text-xs text-zinc-500 mb-1 dark:text-zinc-400">
          Avg mana value: <span className="font-semibold text-zinc-700 dark:text-zinc-200">{data.overallAverageCmc.toFixed(2)}</span>
        </p>
      )}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 400, height: 192 }}>
          <BarChart data={chartData} margin={{ top: 0, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
            <XAxis dataKey="cmc" tick={{ fontSize: 12, fill: 'var(--chart-axis-text)' }} />
            <YAxis tick={{ fontSize: 12, fill: 'var(--chart-axis-text)' }} />
            <Tooltip
              formatter={(value) => [value ?? '', 'Avg copies']}
              labelFormatter={(label) => `CMC ${label}`}
              contentStyle={{
                backgroundColor: 'var(--chart-tooltip-bg)',
                borderColor: 'var(--chart-tooltip-border)',
                color: 'var(--chart-tooltip-text)',
              }}
            />
            <Bar dataKey="avg" fill="var(--chart-bar-primary)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function ChartShell({ label, isError }: { label: string; isError?: boolean }) {
  return (
    <div className={`flex h-56 items-center justify-center text-sm ${isError ? 'text-red-500' : 'text-zinc-400 dark:text-zinc-500'}`}>
      {label}
    </div>
  );
}
