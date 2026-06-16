'use client';

import type { Color, Format } from '@/types/core';
import { SINGLE_COLOR_HEX } from './ColorIdentityPips';

export const COLOR_ORDER: Color[] = ['W', 'U', 'B', 'R', 'G', 'C'];

export interface DeckFiltersState {
  format: Format | 'all';
  colors: Color[];
  minCardCount: string;
  maxCardCount: string;
}

export const DEFAULT_DECK_FILTERS: DeckFiltersState = {
  format: 'all',
  colors: [...COLOR_ORDER],
  minCardCount: '',
  maxCardCount: '',
};

export function isDeckFiltersActive(filters: DeckFiltersState): boolean {
  return (
    filters.format !== 'all' ||
    filters.colors.length < COLOR_ORDER.length ||
    filters.minCardCount !== '' ||
    filters.maxCardCount !== ''
  );
}

function formatLabel(format: string): string {
  return format.charAt(0).toUpperCase() + format.slice(1);
}

interface DeckFiltersProps {
  availableFormats: Format[];
  filters: DeckFiltersState;
  onChange: (filters: DeckFiltersState) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

export function DeckFilters({ availableFormats, filters, onChange, onSelectAll, onDeselectAll }: DeckFiltersProps) {
  const toggleColor = (color: Color) => {
    const colors = filters.colors.includes(color)
      ? filters.colors.filter((existing) => existing !== color)
      : [...filters.colors, color];
    onChange({ ...filters, colors });
  };

  return (
    <div className="mb-3 flex flex-wrap items-end gap-3 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-col gap-1">
        <label htmlFor="deck-filter-format" className="text-xs text-zinc-500 dark:text-zinc-400">
          Format
        </label>
        <select
          id="deck-filter-format"
          value={filters.format}
          onChange={(event) => onChange({ ...filters, format: event.target.value as Format | 'all' })}
          className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
        >
          <option value="all">All formats</option>
          {availableFormats.map((format) => (
            <option key={format} value={format}>
              {formatLabel(format)}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs text-zinc-500 dark:text-zinc-400">Color identity</span>
        <div className="flex gap-1">
          {COLOR_ORDER.map((color) => {
            const active = filters.colors.includes(color);
            return (
              <button
                key={color}
                type="button"
                aria-pressed={active}
                title={color}
                onClick={() => toggleColor(color)}
                className={`h-6 w-6 rounded-full ring-1 transition-opacity ${
                  active
                    ? 'ring-2 ring-indigo-400'
                    : 'ring-zinc-300 opacity-40 hover:opacity-70 dark:ring-zinc-600'
                }`}
                style={{ backgroundColor: SINGLE_COLOR_HEX[color] }}
              />
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs text-zinc-500 dark:text-zinc-400">Card count</span>
        <div className="flex items-center gap-1">
          <input
            type="number"
            min={0}
            placeholder="Min"
            value={filters.minCardCount}
            onChange={(event) => onChange({ ...filters, minCardCount: event.target.value })}
            className="w-16 rounded-md border border-zinc-200 bg-white px-2 py-1 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
          />
          <span className="text-xs text-zinc-400 dark:text-zinc-500">to</span>
          <input
            type="number"
            min={0}
            placeholder="Max"
            value={filters.maxCardCount}
            onChange={(event) => onChange({ ...filters, maxCardCount: event.target.value })}
            className="w-16 rounded-md border border-zinc-200 bg-white px-2 py-1 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
          />
        </div>
      </div>

      <div className="flex items-end gap-2 ml-auto">
        <button
          type="button"
          onClick={onSelectAll}
          className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
        >
          Select all
        </button>
        <button
          type="button"
          onClick={onDeselectAll}
          className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
        >
          Deselect all
        </button>
        {isDeckFiltersActive(filters) && (
          <button
            type="button"
            onClick={() => onChange(DEFAULT_DECK_FILTERS)}
            className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
