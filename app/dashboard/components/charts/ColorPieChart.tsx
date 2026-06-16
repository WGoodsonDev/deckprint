'use client';

import { useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
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
const LEGEND_COLUMN_THRESHOLD = 10;

const COLOR_COMBINATION_NAMES: Record<string, string> = {
  // Mono
  W: 'White', U: 'Blue', B: 'Black', R: 'Red', G: 'Green', C: 'Colorless',
  // 2-color guilds
  WU: 'Azorius', WB: 'Orzhov', WR: 'Boros', WG: 'Selesnya',
  UB: 'Dimir', UR: 'Izzet', UG: 'Simic',
  BR: 'Rakdos', BG: 'Golgari',
  RG: 'Gruul',
  // 3-color shards
  WUB: 'Esper', UBR: 'Grixis', BRG: 'Jund', WRG: 'Naya', WUG: 'Bant',
  // 3-color wedges
  WBG: 'Abzan', WUR: 'Jeskai', UBG: 'Sultai', WBR: 'Mardu', URG: 'Temur',
  // 4-color
  WUBR: 'Artifice', UBRG: 'Chaos', WBRG: 'Aggression', WURG: 'Altruism', WUBG: 'Growth',
  // 5-color
  WUBRG: 'Five-Color',
};

function patternId(identity: string): string {
  return `color-pattern-${identity}`;
}

function identityFill(identity: string): string {
  if (identity.length === 1) {
    return SINGLE_COLOR_HEX[identity as Color] ?? '#cccccc';
  }
  return `url(#${patternId(identity)})`;
}

function formatIdentityLabel(identity: string, useColorNames: boolean): string {
  if (useColorNames && COLOR_COMBINATION_NAMES[identity]) {
    return COLOR_COMBINATION_NAMES[identity];
  }
  if (identity === 'C') return 'Colorless';
  return identity.split('').join('/');
}

export function ColorPieChart({ data, isLoading, error }: ColorPieChartProps) {
  const [showColorNames, setShowColorNames] = useState(false);

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
    <div>
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

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 400, height: 192 }}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
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
                return [`${count} deck${count !== 1 ? 's' : ''}`, formatIdentityLabel(item.payload.name, showColorNames)];
              }}
              contentStyle={{
                backgroundColor: 'var(--chart-tooltip-bg)',
                borderColor: 'var(--chart-tooltip-border)',
                color: 'var(--chart-tooltip-text)',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className={`mt-3 grid gap-x-6 gap-y-1 text-xs text-[color:var(--chart-axis-text)] ${
        entries.length > LEGEND_COLUMN_THRESHOLD ? 'grid-cols-2' : 'grid-cols-1'
      }`}>
        {chartData.map((entry) => (
          <div key={entry.name} className="flex items-center gap-1.5">
            <svg width="12" height="12" className="flex-shrink-0 rounded-sm overflow-hidden">
              <rect width="12" height="12" fill={identityFill(entry.name)} />
            </svg>
            <span>
              {formatIdentityLabel(entry.name, showColorNames)}{' '}
              {(percentByIdentity.get(entry.name) ?? 0).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setShowColorNames((prev) => !prev)}
        className="mt-3 text-xs text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 underline underline-offset-2"
      >
        {showColorNames ? 'Show color spellings' : 'Show color names'}
      </button>
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
