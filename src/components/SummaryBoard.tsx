import { useRef } from 'react';
import {
  dominantTrait,
  TRAIT_LABEL,
  toPercents,
  type Trait,
} from '../lib/barycentric';
import { photoUrl } from '../data/officials';
import type { PlacedOfficial } from '../hooks/useGameState';
import { TriangleBoard } from './TriangleBoard';
import { ExportPngButton } from './ExportPngButton';

const TRAIT_ORDER: Trait[] = ['n', 'm', 'p'];
const TRAIT_TEXT: Record<Trait, string> = {
  n: 'text-narc',
  m: 'text-mach',
  p: 'text-psych',
};
const TRAIT_BAR: Record<Trait, string> = {
  n: 'bg-narc',
  m: 'bg-mach',
  p: 'bg-psych',
};

export function SummaryBoard({
  placed,
  onReset,
}: {
  placed: PlacedOfficial[];
  onReset: () => void;
}) {
  const boardRef = useRef<HTMLDivElement>(null);

  const ranked = [...placed].sort((a, b) => {
    const da = dominantTrait(a.bary);
    const db = dominantTrait(b.bary);
    if (da !== db) return TRAIT_ORDER.indexOf(da) - TRAIT_ORDER.indexOf(db);
    return b.bary[db] - a.bary[da];
  });

  return (
    <div className="mx-auto flex max-w-[110rem] flex-col gap-8 px-4 py-10">
      <header className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blood">
          The verdict
        </p>
        <h1 className="mt-2 font-display text-4xl text-bone text-glow sm:text-5xl">
          The Dark Triad of MAGA
        </h1>
        <p className="mt-2 text-sm text-ash">
          Every figure, placed. Hover a marker to inspect it.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex flex-col items-center gap-4">
          <div className="mx-auto aspect-square w-full max-w-[720px] lg:w-[min(72dvh,44vw)]">
            <TriangleBoard ref={boardRef} placed={placed} showAllNames />
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <ExportPngButton targetRef={boardRef} />
            <button
              type="button"
              onClick={onReset}
              className="rounded-md border border-blood/60 bg-blood/10 px-6 py-3 font-display text-sm uppercase tracking-[0.18em] text-bone transition hover:bg-blood/20 hover:ring-glow"
            >
              Start over
            </button>
          </div>
        </div>

        <ul className="divide-y divide-white/5 overflow-hidden rounded-lg border border-white/10 bg-surface/60 lg:max-h-[82dvh] lg:overflow-y-auto">
          {ranked.map((p) => {
            const dom = dominantTrait(p.bary);
            const pct = toPercents(p.bary);
            return (
              <li key={p.official.id} className="flex items-center gap-4 p-4">
                <img
                  src={photoUrl(p.official.photo)}
                  alt={p.official.name}
                  className="h-12 w-12 shrink-0 rounded-md object-cover grayscale-[35%]"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate font-display text-base text-bone">
                      {p.official.name}
                    </span>
                    <span
                      className={`shrink-0 text-xs font-semibold uppercase tracking-widest ${TRAIT_TEXT[dom]}`}
                    >
                      {TRAIT_LABEL[dom]}
                    </span>
                  </div>
                  <div className="truncate text-sm text-faint">
                    {p.official.position}
                  </div>
                  <div className="mt-1.5 flex h-1.5 overflow-hidden rounded-full bg-white/5">
                    {TRAIT_ORDER.map((t) => (
                      <div
                        key={t}
                        className={TRAIT_BAR[t]}
                        style={{ width: `${pct[t]}%` }}
                      />
                    ))}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
