'use client';

import { useState } from 'react';
import type { UserProfile } from '@/types/core';
import type { ProfileStats } from '@/types/stats';
import { buildStatsUrl } from '@/lib/buildStatsUrl';
import { UsernameForm } from './components/UsernameForm';
import { DeckSelector } from './components/DeckSelector';
import { SourceErrorBanner } from './components/SourceErrorBanner';
import { ThemeToggle } from './components/ThemeToggle';
import { ColorPieChart } from './components/charts/ColorPieChart';
import { CurveHistogram } from './components/charts/CurveHistogram';
import { FormatBreakdown } from './components/charts/FormatBreakdown';
import { ArchetypeRadar } from './components/charts/ArchetypeRadar';
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

        {phase === 'loaded' && (
          <div className="space-y-8">
            {sourceErrors.length > 0 && (
              <SourceErrorBanner errors={sourceErrors} />
            )}

            {profileData && (
              <Section title="Your Decks">
                <DeckSelector
                  decks={profileData.decks}
                  includedIds={includedDeckIds}
                  isRefetching={isStatsRefetching}
                  onToggle={handleDeckToggle}
                />
              </Section>
            )}

            <Section title="Identity">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Card title="Color Identity">
                  <ColorPieChart
                    data={statsData?.colorProfile ?? null}
                    isLoading={false}
                    error={null}
                  />
                </Card>
                <Card title="Format Breakdown">
                  <FormatBreakdown
                    data={statsData?.formatProfile ?? null}
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
                <Card title="Archetype Fingerprint">
                  <ArchetypeRadar
                    data={statsData?.archetypeProfile ?? null}
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
