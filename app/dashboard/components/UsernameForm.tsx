'use client';

import { useState } from 'react';

interface UsernameFormProps {
  onSubmit: (moxfield: string, archidekt: string) => void;
  isLoading: boolean;
}

type PlatformSelection = 'moxfield' | 'archidekt' | 'both';

const PLATFORM_OPTIONS: { value: PlatformSelection; label: string }[] = [
  { value: 'moxfield', label: 'Moxfield' },
  { value: 'archidekt', label: 'Archidekt' },
  { value: 'both', label: 'Both' },
];

export function UsernameForm({ onSubmit, isLoading }: UsernameFormProps) {
  const [platform, setPlatform] = useState<PlatformSelection>('archidekt');
  const [moxfield, setMoxfield] = useState('');
  const [archidekt, setArchidekt] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const m = platform !== 'archidekt' ? moxfield.trim() : '';
    const a = platform !== 'moxfield' ? archidekt.trim() : '';
    if (!m && !a) {
      setValidationError('Enter at least one username.');
      return;
    }
    setValidationError(null);
    onSubmit(m, a);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
      <fieldset className="flex flex-col gap-1">
        <legend className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Platform</legend>
        <div className="flex gap-4 py-2">
          {PLATFORM_OPTIONS.map((option) => (
            <label key={option.value} className="flex items-center gap-1.5 text-sm text-zinc-700 dark:text-zinc-300">
              <input
                type="radio"
                name="platform"
                value={option.value}
                checked={platform === option.value}
                onChange={() => setPlatform(option.value)}
                disabled={isLoading}
                className="accent-indigo-600"
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>

      {platform !== 'archidekt' && (
        <div className="flex flex-col gap-1">
          <label htmlFor="moxfield-input" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Moxfield username
          </label>
          <input
            id="moxfield-input"
            type="text"
            value={moxfield}
            onChange={(e) => setMoxfield(e.target.value)}
            placeholder="e.g. tehgoyf"
            disabled={isLoading}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
          />
        </div>
      )}

      {platform !== 'moxfield' && (
        <div className="flex flex-col gap-1">
          <label htmlFor="archidekt-input" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Archidekt username
          </label>
          <input
            id="archidekt-input"
            type="text"
            value={archidekt}
            onChange={(e) => setArchidekt(e.target.value)}
            placeholder="e.g. saffronolive"
            disabled={isLoading}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
          />
        </div>
      )}

      <div className="flex flex-col gap-1 sm:pb-0">
        {validationError && (
          <p className="text-sm text-red-600 dark:text-red-400">{validationError}</p>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-md bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Loading…' : 'Build Profile'}
        </button>
      </div>
    </form>
  );
}
