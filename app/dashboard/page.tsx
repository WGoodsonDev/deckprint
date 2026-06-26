'use client';

import { useState } from 'react';
import type { UserProfile } from '@/types/core';
import type { ProfileStats } from '@/types/stats';
import Link from 'next/link';
import { buildStatsUrl } from '@/lib/buildStatsUrl';
import { buildReportUrl } from '@/lib/buildReportUrl';
import { UsernameForm } from './components/UsernameForm';
import { DeckSelector } from './components/DeckSelector';
import { SourceErrorBanner } from './components/SourceErrorBanner';
import { ThemeToggle } from './components/ThemeToggle';
import { ColorPieChart } from './components/charts/ColorPieChart';
import { CurveHistogram } from './components/charts/CurveHistogram';
import { RecencyDistribution } from './components/charts/RecencyDistribution';
import { CardTypeComposition } from './components/charts/CardTypeComposition';
import { StaplesList } from './components/charts/StaplesList';

type PagePhase = 'idle' | 'loading' | 'loaded' | 'error';

interface ActiveQuery {
  moxfield: string;
  archidekt: string;
}

export default function DashboardPage() {
  const [phase, setPhase] = useState<PagePhase>('idle');
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [statsData, setStatsData] = useState<ProfileStats | null>(null);
  const [includedDeckIds, setIncludedDeckIds] = useState<Set<string>>(new Set());
  const [isStatsRefetching, setIsStatsRefetching] = useState(false);
  const [activeQuery, setActiveQuery] = useState<ActiveQuery | null>(null);

  const handleSubmit = async (moxfield: string, archidekt: string) => {
    setPhase('loading');
    setFetchError(null);
    setProfileData(null);
    setStatsData(null);

    const query: ActiveQuery = { moxfield, archidekt };
    setActiveQuery(query);

    const params = new URLSearchParams();
    if (moxfield) params.set('moxfield', moxfield);
    if (archidekt) params.set('archidekt', archidekt);
    const queryString = params.toString();

    try {
      const [profileRes, statsRes] = await Promise.all([
        fetch(`/api/profile?${queryString}`),
        fetch(`/api/stats?${queryString}`),
      ]);

      if (!profileRes.ok) {
        const body = await profileRes.json().catch(() => ({}));
        setFetchError((body as { error?: string }).error ?? 'Failed to fetch profile.');
        setPhase('error');
        return;
      }
      if (!statsRes.ok) {
        const body = await statsRes.json().catch(() => ({}));
        setFetchError((body as { error?: string }).error ?? 'Failed to fetch stats.');
        setPhase('error');
        return;
      }

      const profile: UserProfile = await profileRes.json();
      const stats: ProfileStats = await statsRes.json();
      const allIds = new Set(profile.decks.map((d) => d.id));

      setProfileData(profile);
      setStatsData(stats);
      setIncludedDeckIds(allIds);
      setPhase('loaded');
    } catch {
      setFetchError('Network error. Please check your connection and try again.');
      setPhase('error');
    }
  };

  const handleSelectionChange = async (ids: Set<string>) => {
    if (!activeQuery || !profileData || isStatsRefetching) return;
    setIncludedDeckIds(ids);
    if (ids.size === 0) return;
    setIsStatsRefetching(true);
    try {
      const url = buildStatsUrl(activeQuery.moxfield, activeQuery.archidekt, ids, profileData.decks.length);
      const res = await fetch(url);
      if (res.ok) {
        const stats: ProfileStats = await res.json();
        setStatsData(stats);
      }
    } finally {
      setIsStatsRefetching(false);
    }
  };

  const handleSelectAll = () => {
    if (!profileData) return;
    handleSelectionChange(new Set(profileData.decks.map((d) => d.id)));
  };

  const handleDeselectAll = () => {
    setIncludedDeckIds(new Set());
  };

  const handleDeckToggle = async (deckId: string) => {
    if (!activeQuery || !profileData || isStatsRefetching) return;

    const newIds = new Set(includedDeckIds);
    if (newIds.has(deckId)) {
      newIds.delete(deckId);
    } else {
      newIds.add(deckId);
    }
    setIncludedDeckIds(newIds);

    if (newIds.size === 0) return;

    setIsStatsRefetching(true);
    try {
      const url = buildStatsUrl(
        activeQuery.moxfield,
        activeQuery.archidekt,
        newIds,
        profileData.decks.length
      );
      const res = await fetch(url);
      if (res.ok) {
        const stats: ProfileStats = await res.json();
        setStatsData(stats);
      }
    } finally {
      setIsStatsRefetching(false);
    }
  };

  const isInitialLoading = phase === 'loading';
  const sourceErrors = statsData?.sourceErrors ?? profileData?.sourceErrors ?? [];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <header className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight dark:text-zinc-50">Deckprint</h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Your Magic: The Gathering deckbuilder profile
            </p>
          </div>
          <ThemeToggle />
        </header>

        <div className="mb-8">
          <UsernameForm onSubmit={handleSubmit} isLoading={isInitialLoading} />
        </div>

        {phase === 'error' && fetchError && (
          <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {fetchError}
          </div>
        )}

        {phase === 'loading' && (
          <div className="space-y-8">
            <Section title="Your Decks">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonBlock key={i} className="h-24 rounded-lg" />
                ))}
              </div>
            </Section>
            <Section title="Identity">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Card title="Color Identity"><SkeletonBlock className="h-52" /></Card>
                <Card title="Deck Recency"><SkeletonBlock className="h-52" /></Card>
              </div>
            </Section>
            <Section title="Playing Habits">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Card title="Mana Curve"><SkeletonBlock className="h-52" /></Card>
                <Card title="Card Type Composition"><SkeletonBlock className="h-52" /></Card>
              </div>
            </Section>
            <Section title="Collection">
              <Card title="Cards Across Decks"><SkeletonBlock className="h-40" /></Card>
            </Section>
          </div>
        )}

        {phase === 'loaded' && (
          <div className="space-y-8">
            {sourceErrors.length > 0 && (
              <SourceErrorBanner errors={sourceErrors} />
            )}

            {activeQuery && profileData && (
              <div className="flex justify-end">
                <Link
                  href={buildReportUrl(
                    activeQuery.moxfield,
                    activeQuery.archidekt,
                    includedDeckIds,
                    profileData.decks.length
                  )}
                  className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  Generate Report Card
                </Link>
              </div>
            )}

            {profileData && (
              <Section title="Your Decks">
                <DeckSelector
                  decks={profileData.decks}
                  includedIds={includedDeckIds}
                  isRefetching={isStatsRefetching}
                  onToggle={handleDeckToggle}
                  onSelectAll={handleSelectAll}
                  onDeselectAll={handleDeselectAll}
                  onSelectionChange={handleSelectionChange}
                />
              </Section>
            )}

            <div className={isStatsRefetching ? 'opacity-50 transition-opacity duration-200 pointer-events-none' : 'transition-opacity duration-200'}>
              <div className="space-y-8">
                <Section title="Identity">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <Card title="Color Identity">
                      <ColorPieChart
                        data={statsData?.colorProfile ?? null}
                        isLoading={false}
                        error={null}
                      />
                    </Card>
                    <Card title="Deck Recency">
                      <RecencyDistribution
                        data={statsData?.recencyProfile ?? null}
                        isLoading={false}
                        error={null}
                      />
                    </Card>
                  </div>
                </Section>

                <Section title="Playing Habits">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <Card title="Mana Curve">
                      <CurveHistogram
                        data={statsData?.curveProfile ?? null}
                        isLoading={false}
                        error={null}
                      />
                    </Card>
                    <Card title="Card Type Composition">
                      <CardTypeComposition
                        data={statsData?.cardTypeProfile ?? null}
                        isLoading={false}
                        error={null}
                      />
                    </Card>
                  </div>
                </Section>

                <Section title="Collection">
                  <Card title="Cards Across Decks">
                    <StaplesList
                      data={statsData?.cardOverlap ?? null}
                      isLoading={false}
                      error={null}
                    />
                  </Card>
                </Section>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-zinc-800 mb-3 dark:text-zinc-100">{title}</h2>
      {children}
    </section>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="text-sm font-semibold text-zinc-700 mb-3 dark:text-zinc-200">{title}</h3>
      {children}
    </div>
  );
}

function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-zinc-200 dark:bg-zinc-800 ${className}`} />;
}
