'use client';

import { useState, type RefObject } from 'react';
import { domToPng } from 'modern-screenshot';

type ExportPreset = 'auto' | 'square' | 'widescreen';

const PRESET_DIMENSIONS: Record<Exclude<ExportPreset, 'auto'>, { width: number; height: number }> = {
  square: { width: 800, height: 800 },
  widescreen: { width: 1200, height: 675 },
};

const PRESET_LABELS: Record<ExportPreset, string> = {
  auto: 'Auto',
  square: 'Square',
  widescreen: 'Widescreen',
};

interface ExportButtonProps {
  targetRef: RefObject<HTMLDivElement | null>;
}

export function ExportButton({ targetRef }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [preset, setPreset] = useState<ExportPreset>('auto');

  const handleExport = async () => {
    if (!targetRef.current) return;
    setIsExporting(true);
    setExportError(null);
    try {
      const options = preset !== 'auto' ? PRESET_DIMENSIONS[preset] : {};
      const dataUrl = await domToPng(targetRef.current, options);
      const link = document.createElement('a');
      link.download = 'deckprint-report-card.png';
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('PNG export failed:', error);
      setExportError('Failed to export PNG. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1 rounded-md border border-zinc-300 p-1 w-fit dark:border-zinc-700">
        {(['auto', 'square', 'widescreen'] as ExportPreset[]).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPreset(p)}
            className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
              preset === p
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
            }`}
          >
            {PRESET_LABELS[p]}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={handleExport}
        disabled={isExporting}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {isExporting ? 'Exporting…' : 'Export as PNG'}
      </button>
      {exportError && (
        <p className="text-sm text-red-600 dark:text-red-400">{exportError}</p>
      )}
    </div>
  );
}
