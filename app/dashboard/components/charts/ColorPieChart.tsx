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

interface ColorPieChartProps {
  data: ColorProfile | null;
  isLoading: boolean;
  error: string | null;
}

const SINGLE_COLOR_HEX: Record<string, string> = {
  W: '#d4c060',
  U: '#1472b8',
  B: '#3c3c3c',
  R: '#e05030',
  G: '#18a060',
  C: '#a8a8a8',
};

const MULTICOLOR_HEX = '#e8c840';

function identityColor(identity: string): string {
  if (identity.length === 1) return SINGLE_COLOR_HEX[identity] ?? '#cccccc';
  return MULTICOLOR_HEX;
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

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label={({ name, percent }) =>
              (percent ?? 0) > 0.04 ? `${name} ${((percent ?? 0) * 100).toFixed(0)}%` : ''
            }
            labelLine={false}
          >
            {chartData.map((entry) => (
              <Cell key={entry.name} fill={identityColor(entry.name)} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => {
              const count = typeof value === 'number' ? value : 0;
              return [`${count} deck${count !== 1 ? 's' : ''}`, 'Count'];
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function ChartShell({ label, isError }: { label: string; isError?: boolean }) {
  return (
    <div className={`flex h-56 items-center justify-center text-sm ${isError ? 'text-red-500' : 'text-zinc-400'}`}>
      {label}
    </div>
  );
}
