import { useRef, useState } from 'react';
import type { Bary } from '../lib/barycentric';
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

  return (
    <div className="flex min-h-dvh flex-col px-4 py-4">
      <header className="mx-auto w-full max-w-[1800px]">
        <span className="font-display text-base uppercase tracking-[0.2em] text-ash">
          The Dark Triad of MAGA
        </span>
      </header>

      <div className="flex flex-1 items-center justify-center">
        <div className="grid w-full max-w-[1800px] grid-cols-1 items-center justify-items-center gap-6 lg:grid-cols-[minmax(16rem,1fr)_auto_minmax(16rem,1fr)]">
          <div
            ref={leftPanelRef}
            className="order-2 w-full max-w-[26rem] lg:order-1 lg:justify-self-end"
          >
            <PersonPrompt official={official} index={index} total={total} />
          </div>

          <div className="order-1 aspect-square w-[min(92vw,64dvh)] lg:order-2 lg:w-[min(82dvh,44vw)]">
            <TriangleBoard
              placed={placed}
              interactive
              showDefinitions
              avoidLeftRef={leftPanelRef}
              avoidRightRef={rightPanelRef}
              onHoverBary={setHoverBary}
              onPlace={(b) => {
                onPlace(b);
                setHoverBary(null);
              }}
            />
          </div>

          <div
            ref={rightPanelRef}
            className="order-3 w-full max-w-[26rem] lg:justify-self-start"
          >
            <TraitReadout bary={hoverBary} />
          </div>
        </div>
      </div>

      <p className="mt-3 text-center text-sm text-faint">
        Click the triangle to lock in a placement
      </p>
    </div>
  );
}
