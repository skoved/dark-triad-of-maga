import { photoUrl, type Official } from '../data/officials';
import { CanvassBadge } from './CanvassBadge';

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
    <div className="w-full rounded-lg border border-white/10 bg-surface/80 p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-2 text-xs uppercase tracking-wide text-faint">
        <span className="min-w-0 truncate">Place this person</span>
        <span className="shrink-0 whitespace-nowrap tabular-nums text-ash">
          {index + 1} / {total}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <img
          src={photoUrl(official.photo)}
          alt={official.name}
          className="h-20 w-20 shrink-0 rounded-md border border-white/10 object-cover object-top grayscale-[35%] sm:h-24 sm:w-24"
        />
        <div className="min-w-[12rem] flex-1">
          <div className="font-display text-lg leading-tight text-bone break-words">
            {official.name}
          </div>
          <div className="mt-1 break-words text-sm leading-snug text-ash">
            {official.position}
          </div>
          {official.dggCanvass && (
            <CanvassBadge canvass={official.dggCanvass} linked />
          )}
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
