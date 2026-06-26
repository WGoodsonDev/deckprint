import type { Color } from '@/types/core';
import type { ProfileStats } from '@/types/stats';
import { ColorIdentityPips } from '@/app/dashboard/components/ColorIdentityPips';
import { CardTypeComposition } from '@/app/dashboard/components/charts/CardTypeComposition';
import { CurveSparkline } from './CurveSparkline';
import { DeckbuilderLabel } from './DeckbuilderLabel';

interface ReportCardProps {
  stats: ProfileStats;
}

const COLOR_ORDER: Color[] = ['W', 'U', 'B', 'R', 'G'];

export function ReportCard({ stats }: ReportCardProps) {
  const presentColors = COLOR_ORDER.filter(
    (color) => stats.colorProfile.colorFrequency[color] > 0
  );
  const topStaples = stats.cardOverlap.staples.slice(0, 5);
  const identityCount = Object.keys(stats.colorProfile.identityDistribution).length;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 space-y-1">
        <DeckbuilderLabel stats={stats} />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {stats.deckCount} deck{stats.deckCount !== 1 ? 's' : ''} · {stats.uniqueCardCount} unique card{stats.uniqueCardCount !== 1 ? 's' : ''}
          {identityCount > 0 && (
            <> · {identityCount} color {identityCount === 1 ? 'identity' : 'identities'}</>
          )}
        </p>
        <div className="flex items-center gap-2">
          <ColorIdentityPips colorIdentity={presentColors} />
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {presentColors
              .map(
                (color) =>
                  `${color} ${(stats.colorProfile.colorFrequency[color] * 100).toFixed(0)}%`
              )
              .join(' · ')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold text-zinc-700 mb-2 dark:text-zinc-200">
            Top Staples
          </h3>
          {topStaples.length === 0 ? (
            <p className="text-sm text-zinc-400 dark:text-zinc-500">No staples found.</p>
          ) : (
            <ol className="space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
              {topStaples.map((staple, index) => (
                <li key={staple.scryfallId}>
                  {index + 1}. {staple.name}{' '}
                  <span className="text-zinc-400 dark:text-zinc-500">
                    — {staple.deckCount} deck{staple.deckCount !== 1 ? 's' : ''}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div>
          <h3 className="text-sm font-semibold text-zinc-700 mb-2 dark:text-zinc-200">
            Card Type Composition
          </h3>
          <CardTypeComposition data={stats.cardTypeProfile} isLoading={false} error={null} />
        </div>

        <div>
          <h3 className="text-sm font-semibold text-zinc-700 mb-2 dark:text-zinc-200">
            Mana Curve
          </h3>
          <CurveSparkline curveProfile={stats.curveProfile} />
        </div>
      </div>
    </div>
  );
}
