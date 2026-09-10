import { photoUrl, type Official } from '../data/officials';
import { CanvassBadge } from './CanvassBadge';

export function CalloutCard({ official }: { official: Official }) {
  return (
    <div className="flex w-full items-center gap-3 rounded-lg border border-white/10 bg-raised/95 p-3 shadow-2xl backdrop-blur-sm ring-glow">
      <img
        src={photoUrl(official.photo)}
        alt={official.name}
        loading="lazy"
        className="h-16 w-16 shrink-0 rounded-md object-cover grayscale-[35%]"
      />
      <div className="min-w-0">
        <div className="font-display text-sm leading-tight text-bone">
          {official.name}
        </div>
        <div className="mt-0.5 text-xs leading-snug text-ash">
          {official.position}
        </div>
        {official.dggCanvass && <CanvassBadge canvass={official.dggCanvass} />}
      </div>
    </div>
  );
}
