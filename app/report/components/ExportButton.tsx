'use client';

import { useState, type RefObject } from 'react';
import { domToPng } from 'modern-screenshot';

interface ExportButtonProps {
  targetRef: RefObject<HTMLDivElement | null>;
}

export function ExportButton({ targetRef }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleExport = async () => {
    if (!targetRef.current) return;
    setIsExporting(true);
    setExportError(null);
    try {
      const dataUrl = await domToPng(targetRef.current);
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
    <div>
      <button
        type="button"
        onClick={handleExport}
        disabled={isExporting}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {isExporting ? 'Exporting…' : 'Export as PNG'}
      </button>
      {exportError && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{exportError}</p>
      )}
    </div>
  );
}
