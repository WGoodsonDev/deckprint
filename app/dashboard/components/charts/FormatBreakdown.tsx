'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import type { FormatProfile } from '@/types/stats';

interface FormatBreakdownProps {
  data: FormatProfile | null;
  isLoading: boolean;
  error: string | null;
}

const PRIMARY_FORMAT_THRESHOLD = 0.8;

function capitalizeFormat(format: string): string {
  return format.charAt(0).toUpperCase() + format.slice(1);
}

export function FormatBreakdown({ data, isLoading, error }: FormatBreakdownProps) {
  if (isLoading) return <ChartShell label="Loading formats…" />;
  if (error) return <ChartShell label={error} isError />;

  const formatEntries = data ? Object.entries(data.formatCounts) : [];

  if (formatEntries.length === 0) return <ChartShell label="No format data available." />;

  const chartData = formatEntries
    .sort((a, b) => b[1]! - a[1]!)
    .map(([format, count]) => ({
      format: capitalizeFormat(format),
      count: count ?? 0,
      isPrimary: format === data?.primaryFormat,
    }));

  const totalDecks = chartData.reduce((sum, e) => sum + e.count, 0);
  const primaryCount = data ? (data.formatCounts[data.primaryFormat] ?? 0) : 0;
  const isDominant = totalDecks > 0 && primaryCount / totalDecks >= PRIMARY_FORMAT_THRESHOLD;

  if (isDominant && data) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-2">
        <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
          {capitalizeFormat(data.primaryFormat)}
        </p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {primaryCount} of {totalDecks} deck{totalDecks !== 1 ? 's' : ''} ({Math.round((primaryCount / totalDecks) * 100)}%)
        </p>
      </div>
    );
  }

  return (
    <div>
      {data && (
        <p className="text-xs text-zinc-500 mb-1 dark:text-zinc-400">
          Primary format:{' '}
          <span className="font-semibold text-zinc-700 dark:text-zinc-200">{capitalizeFormat(data.primaryFormat)}</span>
        </p>
      )}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 400, height: 192 }}>
          <BarChart data={chartData} margin={{ top: 0, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
            <XAxis dataKey="format" tick={{ fontSize: 11, fill: 'var(--chart-axis-text)' }} />
            <YAxis tick={{ fontSize: 12, fill: 'var(--chart-axis-text)' }} allowDecimals={false} />
            <Tooltip
              formatter={(value) => [value ?? '', 'Decks']}
              contentStyle={{
                backgroundColor: 'var(--chart-tooltip-bg)',
                borderColor: 'var(--chart-tooltip-border)',
                color: 'var(--chart-tooltip-text)',
              }}
            />
            <Bar dataKey="count" radius={[3, 3, 0, 0]}>
              {chartData.map((entry) => (
                <Cell
                  key={entry.format}
                  fill={entry.isPrimary ? 'var(--chart-bar-primary)' : 'var(--chart-bar-secondary)'}
                />
              ))}
            </Bar>
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
