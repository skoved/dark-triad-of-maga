import { photoUrl, type Official } from '../data/officials';

export function PersonPrompt({
  official,
  index,
  total,
}: {
  official: Official;
  index: number;
  total: number;
}) {
  return (
    <div className="w-full rounded-lg border border-white/10 bg-surface/80 p-4">
      <div className="mb-3 flex items-center justify-between text-[10px] uppercase tracking-widest text-faint">
        <span>Place this person</span>
        <span className="tabular-nums text-ash">
          {index + 1} / {total}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <img
          src={photoUrl(official.photo)}
          alt={official.name}
          className="h-20 w-20 shrink-0 rounded-md border border-white/10 object-cover grayscale-[35%]"
        />
        <div className="min-w-0">
          <div className="font-display text-lg leading-tight text-bone">
            {official.name}
          </div>
          <div className="mt-1 text-sm leading-snug text-ash">
            {official.position}
          </div>
        </div>
      </div>

      <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full bg-blood transition-[width] duration-300"
          style={{ width: `${(index / total) * 100}%` }}
        />
      </div>
    </div>
  );
}
