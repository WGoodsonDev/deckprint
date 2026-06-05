'use client';

import { useState } from 'react';

interface UsernameFormProps {
  onSubmit: (moxfield: string, archidekt: string) => void;
  isLoading: boolean;
}

export function UsernameForm({ onSubmit, isLoading }: UsernameFormProps) {
  const [moxfield, setMoxfield] = useState('');
  const [archidekt, setArchidekt] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const m = moxfield.trim();
    const a = archidekt.trim();
    if (!m && !a) {
      setValidationError('Enter at least one username.');
      return;
    }
    setValidationError(null);
    onSubmit(m, a);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="moxfield-input" className="text-sm font-medium text-zinc-700">
          Moxfield username
        </label>
        <input
          id="moxfield-input"
          type="text"
          value={moxfield}
          onChange={(e) => setMoxfield(e.target.value)}
          placeholder="e.g. tehgoyf"
          disabled={isLoading}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="archidekt-input" className="text-sm font-medium text-zinc-700">
          Archidekt username
        </label>
        <input
          id="archidekt-input"
          type="text"
          value={archidekt}
          onChange={(e) => setArchidekt(e.target.value)}
          placeholder="e.g. saffronolive"
          disabled={isLoading}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
        />
      </div>
      <div className="flex flex-col gap-1 sm:pb-0">
        {validationError && (
          <p className="text-sm text-red-600">{validationError}</p>
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
