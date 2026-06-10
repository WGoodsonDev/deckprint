'use client';

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { ArchetypeProfile } from '@/types/stats';

interface ArchetypeRadarProps {
  data: ArchetypeProfile | null;
  isLoading: boolean;
  error: string | null;
}

export function ArchetypeRadar({ data, isLoading, error }: ArchetypeRadarProps) {
  if (isLoading) return <ChartShell label="Loading archetypes…" />;
  if (error) return <ChartShell label={error} isError />;
  if (!data) return <ChartShell label="No archetype data available." />;

  const allZero =
    data.aggro === 0 && data.midrange === 0 && data.control === 0 && data.combo === 0;
  if (allZero) return <ChartShell label="No archetype data available." />;

  const chartData = [
    { subject: 'Aggro', score: data.aggro },
    { subject: 'Midrange', score: data.midrange },
    { subject: 'Control', score: data.control },
    { subject: 'Combo', score: data.combo },
  ];

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 400, height: 224 }}>
        <RadarChart data={chartData}>
          <PolarGrid stroke="#e4e4e7" />
          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 1]}
            tick={{ fontSize: 10 }}
            tickCount={3}
          />
          <Radar
            dataKey="score"
            stroke="#6366f1"
            fill="#6366f1"
            fillOpacity={0.35}
          />
          <Tooltip
            formatter={(value) => {
              const score = typeof value === 'number' ? value : 0;
              return [score.toFixed(2), 'Score'];
            }}
          />
        </RadarChart>
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
