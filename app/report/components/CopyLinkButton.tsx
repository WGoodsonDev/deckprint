'use client';

import { useState, useEffect } from 'react';

export function CopyLinkButton() {
  const [copied, setCopied] = useState(false);
  const [available, setAvailable] = useState(false);
  const [copyError, setCopyError] = useState(false);

  useEffect(() => {
    setAvailable(typeof navigator !== 'undefined' && Boolean(navigator.clipboard));
  }, []);

  if (!available) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setCopyError(false);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyError(true);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleCopy}
        className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
      >
        {copied ? 'Copied!' : 'Copy link'}
      </button>
      {copyError && (
        <span className="text-sm text-red-600 dark:text-red-400">
          Copy failed.
        </span>
      )}
    </div>
  );
}
