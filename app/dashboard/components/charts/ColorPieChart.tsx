'use client';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { ColorProfile } from '@/types/stats';
import type { Color } from '@/types/core';
import { SINGLE_COLOR_HEX } from '../ColorIdentityPips';

interface ColorPieChartProps {
  data: ColorProfile | null;
  isLoading: boolean;
  error: string | null;
}

const STRIPE_SIZE = 8;

function patternId(identity: string): string {
  return `color-pattern-${identity}`;
}

function identityFill(identity: string): string {
  if (identity.length === 1) {
    return SINGLE_COLOR_HEX[identity as Color] ?? '#cccccc';
  }
  return `url(#${patternId(identity)})`;
}

function formatIdentityLabel(identity: string): string {
  if (identity === 'C') return 'Colorless';
  return identity.split('').join('/');
}

export function ColorPieChart({ data, isLoading, error }: ColorPieChartProps) {
  if (isLoading) return <ChartShell label="Loading colors…" />;
  if (error) return <ChartShell label={error} isError />;

  const entries = data
    ? Object.entries(data.identityDistribution).sort((a, b) => b[1] - a[1])
    : [];

  if (entries.length === 0) return <ChartShell label="No color data available." />;

  const chartData = entries.map(([identity, count]) => ({
    name: identity,
    value: count,
  }));

  const multicolorIdentities = chartData
    .map((entry) => entry.name)
    .filter((identity) => identity.length > 1);

  const totalCount = chartData.reduce((sum, entry) => sum + entry.value, 0);
  const percentByIdentity = new Map(
    chartData.map((entry) => [entry.name, (entry.value / totalCount) * 100])
  );

  return (
    <div className="h-64">
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <defs>
          {multicolorIdentities.map((identity) => {
            const colors = identity.split('') as Color[];
            const stripeWidth = STRIPE_SIZE / colors.length;
            return (
              <pattern
                key={identity}
                id={patternId(identity)}
                width={STRIPE_SIZE}
                height={STRIPE_SIZE}
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(45)"
              >
                {colors.map((color, i) => (
                  <rect
                    key={color}
                    x={i * stripeWidth}
                    y={0}
                    width={stripeWidth}
                    height={STRIPE_SIZE}
                    fill={SINGLE_COLOR_HEX[color] ?? '#cccccc'}
                  />
                ))}
              </pattern>
            );
          })}
        </defs>
      </svg>
      <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 400, height: 256 }}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="40%"
            cy="50%"
            outerRadius={80}
          >
            {chartData.map((entry) => (
              <Cell key={entry.name} fill={identityFill(entry.name)} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, _name, item) => {
              const count = typeof value === 'number' ? value : 0;
              return [`${count} deck${count !== 1 ? 's' : ''}`, formatIdentityLabel(item.payload.name)];
            }}
            contentStyle={{
              backgroundColor: 'var(--chart-tooltip-bg)',
              borderColor: 'var(--chart-tooltip-border)',
              color: 'var(--chart-tooltip-text)',
            }}
          />
          <Legend
            layout="vertical"
            verticalAlign="middle"
            align="right"
            wrapperStyle={{ color: 'var(--chart-axis-text)' }}
            formatter={(value) => {
              const percent = percentByIdentity.get(String(value)) ?? 0;
              return `${formatIdentityLabel(String(value))} ${percent.toFixed(0)}%`;
            }}
          />
        </PieChart>
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
