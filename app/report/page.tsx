'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { ProfileStats } from '@/types/stats';
import { SourceErrorBanner } from '@/app/dashboard/components/SourceErrorBanner';
import { ReportCard } from './components/ReportCard';
import { ExportButton } from './components/ExportButton';
import { CopyLinkButton } from './components/CopyLinkButton';

type PagePhase = 'loading' | 'loaded' | 'error';

export default function ReportPage() {
  return (
    <Suspense fallback={<ReportPageShell><LoadingState /></ReportPageShell>}>
      <ReportPageContent />
    </Suspense>
  );
}

function ReportPageContent() {
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();
  const hasQuery = searchParams.has('moxfield') || searchParams.has('archidekt');

  if (!hasQuery) {
    return (
      <ReportPageShell>
        <EmptyState />
      </ReportPageShell>
    );
  }

  return (
    <ReportPageShell>
      <ReportData key={queryString} queryString={queryString} />
    </ReportPageShell>
  );
}

function ReportData({ queryString }: { queryString: string }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<PagePhase>('loading');
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [stats, setStats] = useState<ProfileStats | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/stats?${queryString}`)
      .then(async (res) => {
        if (cancelled) return;
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setFetchError((body as { error?: string }).error ?? 'Failed to load report data.');
          setPhase('error');
          return;
        }
        const data: ProfileStats = await res.json();
        setStats(data);
        setPhase('loaded');
      })
      .catch(() => {
        if (cancelled) return;
        setFetchError('Network error. Please check your connection and try again.');
        setPhase('error');
      });

    return () => {
      cancelled = true;
    };
  }, [queryString]);

  if (phase === 'loading') return <LoadingState />;

  if (phase === 'error') {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
        {fetchError}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-4">
      {stats.sourceErrors && stats.sourceErrors.length > 0 && (
        <SourceErrorBanner errors={stats.sourceErrors} />
      )}
      <div ref={cardRef}>
        <ReportCard stats={stats} />
      </div>
      <div className="flex items-center gap-2">
        <ExportButton targetRef={cardRef} />
        <CopyLinkButton />
      </div>
    </div>
  );
}

function ReportPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight dark:text-zinc-50">
            Report Card
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Your shareable Deckprint profile
          </p>
        </header>
        {children}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="animate-pulse rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="h-6 w-2/3 rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="mt-4 h-40 rounded bg-zinc-200 dark:bg-zinc-800" />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-6 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
      No profile to show. Generate a report card from your{' '}
      <Link href="/dashboard" className="font-medium text-zinc-900 underline dark:text-zinc-50">
        dashboard
      </Link>
      .
    </div>
  );
}
