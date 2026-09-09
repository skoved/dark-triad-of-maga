import { useRef, useState } from 'react';
import { TRAIT_DEFINITION, type Bary } from '../lib/barycentric';
import type { Official } from '../data/officials';
import type { PlacedOfficial } from '../hooks/useGameState';
import { PersonPrompt } from './PersonPrompt';
import { TraitReadout } from './TraitReadout';
import { TriangleBoard } from './TriangleBoard';

export function PlayScreen({
  official,
  index,
  total,
  placed,
  onPlace,
}: {
  official: Official;
  index: number;
  total: number;
  placed: PlacedOfficial[];
  onPlace: (b: Bary) => void;
}) {
  const [hoverBary, setHoverBary] = useState<Bary | null>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);

  const defClass = 'text-center text-sm leading-snug text-faint';

  return (
    <div className="flex min-h-dvh flex-col px-4 py-3 lg:h-dvh lg:overflow-hidden">
      <header className="mx-auto w-full max-w-[1800px] shrink-0">
        <span className="font-display text-base uppercase tracking-[0.2em] text-ash">
          The Dark Triad of MAGA
        </span>
      </header>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 py-1 lg:flex-row">
        <div
          ref={leftPanelRef}
          className="order-2 w-full max-w-[26rem] lg:order-1 lg:flex-1"
        >
          <PersonPrompt official={official} index={index} total={total} />
        </div>

        {/* board with each trait's definition glued to the matching edge */}
        <div className="order-1 flex shrink-0 flex-col items-center gap-1.5 lg:order-2">
          <p className={`${defClass} max-w-[36rem]`}>{TRAIT_DEFINITION.n}</p>

          <div className="aspect-square w-[min(90vw,58dvh)] lg:w-[min(44vw,calc(100dvh-15rem))]">
            <TriangleBoard
              placed={placed}
              interactive
              avoidLeftRef={leftPanelRef}
              avoidRightRef={rightPanelRef}
              onHoverBary={setHoverBary}
              onPlace={(b) => {
                onPlace(b);
                setHoverBary(null);
              }}
            />
          </div>

          <div className="grid w-full max-w-[46rem] grid-cols-1 gap-x-10 lg:grid-cols-2">
            <p className={defClass}>{TRAIT_DEFINITION.m}</p>
            <p className={defClass}>{TRAIT_DEFINITION.p}</p>
          </div>
        </div>

        <div
          ref={rightPanelRef}
          className="order-3 w-full max-w-[26rem] lg:flex-1"
        >
          <TraitReadout bary={hoverBary} />
        </div>
      </div>

      <p className="mt-2 shrink-0 text-center text-sm text-faint">
        Click the triangle to lock in a placement
      </p>
    </div>
  );
}
