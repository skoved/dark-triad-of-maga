import { useState, type RefObject } from 'react';
import { toPng } from 'html-to-image';

export function ExportPngButton({
  targetRef,
}: {
  targetRef: RefObject<HTMLElement | null>;
}) {
  const [busy, setBusy] = useState(false);

  async function handleExport() {
    const node = targetRef.current;
    if (!node || busy) return;
    setBusy(true);
    try {
      const dataUrl = await toPng(node, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: '#0a0a0b',
      });
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = 'dark-triad-of-maga.png';
      link.click();
    } catch (err) {
      console.error('PNG export failed', err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={busy}
      className="rounded-md border border-white/15 bg-surface/90 px-5 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-ash transition hover:text-bone disabled:opacity-50"
    >
      {busy ? 'Rendering…' : 'Download image'}
    </button>
  );
}
