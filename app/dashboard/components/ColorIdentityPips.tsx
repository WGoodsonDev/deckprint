import type { Color } from '@/types/core';

export const SINGLE_COLOR_HEX: Record<Color, string> = {
  W: '#d4c060',
  U: '#1472b8',
  B: '#3c3c3c',
  R: '#e05030',
  G: '#18a060',
  C: '#a8a8a8',
};

const COLOR_ORDER: Color[] = ['W', 'U', 'B', 'R', 'G'];

interface ColorIdentityPipsProps {
  colorIdentity: Color[];
}

export function ColorIdentityPips({ colorIdentity }: ColorIdentityPipsProps) {
  if (colorIdentity.length === 0) {
    return (
      <span
        className="inline-block h-3 w-3 rounded-full ring-1 ring-zinc-300"
        style={{ backgroundColor: SINGLE_COLOR_HEX.C }}
        title="Colorless"
      />
    );
  }

  const ordered = COLOR_ORDER.filter((color) => colorIdentity.includes(color));

  return (
    <span className="flex gap-0.5">
      {ordered.map((color) => (
        <span
          key={color}
          className="inline-block h-3 w-3 rounded-full ring-1 ring-zinc-300"
          style={{ backgroundColor: SINGLE_COLOR_HEX[color] }}
          title={color}
        />
      ))}
    </span>
  );
}
