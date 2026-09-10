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
    <div className="flex min-h-dvh flex-col gap-4 px-4 py-6 lg:h-dvh lg:overflow-hidden">
      <header className="shrink-0 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blood">
          The verdict
        </p>
        <h1 className="mt-1 font-display text-3xl text-bone text-glow sm:text-4xl">
          The Dark Triad of MAGA
        </h1>
        <p className="mt-1 text-sm text-ash">
          Every figure, placed. Hover a marker to inspect it.
        </p>
      </header>

      <div className="mx-auto flex min-h-0 w-full max-w-[110rem] flex-1 flex-col gap-6 lg:flex-row">
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <div className="aspect-square w-[min(92vw,58dvh)] lg:w-[min(46vw,calc(100dvh-17rem))]">
            <TriangleBoard ref={boardRef} placed={placed} showAllNames />
          </div>
        </div>

        <ul className="max-h-[65vh] min-h-0 flex-1 divide-y divide-white/5 overflow-x-hidden overflow-y-auto rounded-lg border border-white/10 bg-surface/60 lg:max-h-none lg:max-w-[42rem]">
          {ranked.map((p) => {
            const dom = dominantTrait(p.bary);
            const pct = toPercents(p.bary);
            return (
              <li key={p.official.id} className="flex items-center gap-4 p-4">
                <img
                  src={photoUrl(p.official.photo)}
                  alt={p.official.name}
                  className="h-12 w-12 shrink-0 rounded-md object-cover object-top grayscale-[35%]"
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

      <div className="flex shrink-0 flex-wrap items-center justify-center gap-3">
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
  );
}
