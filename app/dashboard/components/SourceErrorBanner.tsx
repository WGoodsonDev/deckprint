'use client';

import type { SourceError } from '@/types/core';

interface SourceErrorBannerProps {
  errors: SourceError[];
}

const REASON_LABELS: Record<string, string> = {
  auth_required: 'is currently unavailable (authentication required)',
  not_found: 'username not found',
  rate_limited: 'rate limit reached — try again later',
  network_error: 'could not be reached',
  unknown: 'returned an unexpected error',
};

export function SourceErrorBanner({ errors }: SourceErrorBannerProps) {
  if (errors.length === 0) return null;

  return (
    <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
      <p className="font-semibold mb-1">Partial data — some sources unavailable:</p>
      <ul className="list-disc list-inside space-y-0.5">
        {errors.map((err) => (
          <li key={`${err.platform}:${err.username}`}>
            <span className="capitalize font-medium">{err.platform}</span> ({err.username}){' '}
            {REASON_LABELS[err.reason] ?? err.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
