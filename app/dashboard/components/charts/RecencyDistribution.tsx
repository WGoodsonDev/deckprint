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
import type { RecencyProfile } from '@/types/stats';

interface RecencyDistributionProps {
  data: RecencyProfile | null;
  isLoading: boolean;
  error: string | null;
}

function relativeTime(isoString: string): string {
  const days = Math.floor((Date.now() - new Date(isoString).getTime()) / (24 * 60 * 60 * 1000));
  if (days === 0) return 'today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months === 1) return '1 month ago';
  if (months < 12) return `${months} months ago`;
  const years = Math.floor(days / 365);
  return years === 1 ? '1 year ago' : `${years} years ago`;
}

export function RecencyDistribution({ data, isLoading, error }: RecencyDistributionProps) {
  if (isLoading) return <ChartShell label="Loading recency…" />;
  if (error) return <ChartShell label={error} isError />;
  if (!data) return <ChartShell label="No recency data available." />;

  const chartData = [
    { label: 'Last 30 days', count: data.within30Days },
    { label: '1–3 months',   count: data.within90Days },
    { label: '3–12 months',  count: data.within365Days },
    { label: '1+ year',      count: data.olderThan365Days },
  ];

  return (
    <div>
      {data.mostRecentDeck && (
        <p className="text-xs text-zinc-500 mb-1 dark:text-zinc-400 truncate">
          Most recently updated:{' '}
          <span className="font-semibold text-zinc-700 dark:text-zinc-200">
            {data.mostRecentDeck.name}
          </span>{' '}
          · {relativeTime(data.mostRecentDeck.updatedAt)}
        </p>
      )}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 400, height: 192 }}>
          <BarChart data={chartData} margin={{ top: 0, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--chart-axis-text)' }} />
            <YAxis tick={{ fontSize: 12, fill: 'var(--chart-axis-text)' }} allowDecimals={false} />
            <Tooltip
              formatter={(value) => [value ?? '', 'Decks']}
              contentStyle={{
                backgroundColor: 'var(--chart-tooltip-bg)',
                borderColor: 'var(--chart-tooltip-border)',
                color: 'var(--chart-tooltip-text)',
              }}
            />
            <Bar dataKey="count" fill="var(--chart-bar-primary)" radius={[3, 3, 0, 0]} />
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
