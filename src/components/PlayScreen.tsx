import { useState } from 'react';
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

  return (
    <div className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-6 px-4 py-6">
      <header className="flex items-center justify-between">
        <span className="font-display text-sm uppercase tracking-[0.2em] text-ash">
          The Dark Triad of MAGA
        </span>
        <span className="text-xs text-faint">
          Click the triangle to lock in a placement
        </span>
      </header>

      <div className="grid flex-1 items-start gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        <div className="order-2 flex flex-col gap-4 lg:order-1">
          <PersonPrompt official={official} index={index} total={total} />
          <TraitReadout bary={hoverBary} />
        </div>

        <div className="order-1 lg:order-2">
          <TriangleBoard
            placed={placed}
            interactive
            onHoverBary={setHoverBary}
            onPlace={(b) => {
              onPlace(b);
              setHoverBary(null);
            }}
          />
        </div>
      </div>
    </div>
  );
}
