import type { ProfileStats } from '@/types/stats';
import { generateDeckbuilderLabel } from '@/lib/labelGenerator';

interface DeckbuilderLabelProps {
  stats: ProfileStats;
}

export function DeckbuilderLabel({ stats }: DeckbuilderLabelProps) {
  return (
    <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
      {generateDeckbuilderLabel(stats)}
    </h2>
  );
}
