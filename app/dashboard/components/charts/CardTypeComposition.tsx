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
import type { CardTypeProfile } from '@/types/stats';

interface CardTypeCompositionProps {
  data: CardTypeProfile | null;
  isLoading: boolean;
  error: string | null;
}

export function CardTypeComposition({ data, isLoading, error }: CardTypeCompositionProps) {
  if (isLoading) return <ChartShell label="Loading card types…" />;
  if (error) return <ChartShell label={error} isError />;

  if (!data) return <ChartShell label="No card type data available." />;

  const chartData = Object.entries(data.averageByType)
    .filter(([, avg]) => avg > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([type, avg]) => ({ type, avg: Number(avg.toFixed(2)) }));

  if (chartData.length === 0) return <ChartShell label="No card type data available." />;

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 400, height: 256 }}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--chart-axis-text)' }} allowDecimals />
          <YAxis type="category" dataKey="type" tick={{ fontSize: 11, fill: 'var(--chart-axis-text)' }} width={88} />
          <Tooltip
            formatter={(value) => [value ?? '', 'Avg per deck']}
            contentStyle={{
              backgroundColor: 'var(--chart-tooltip-bg)',
              borderColor: 'var(--chart-tooltip-border)',
              color: 'var(--chart-tooltip-text)',
            }}
          />
          <Bar dataKey="avg" fill="var(--chart-bar-primary)" radius={[0, 3, 3, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ChartShell({ label, isError }: { label: string; isError?: boolean }) {
  return (
    <div className={`flex h-64 items-center justify-center text-sm ${isError ? 'text-red-500' : 'text-zinc-400 dark:text-zinc-500'}`}>
      {label}
    </div>
  );
}
