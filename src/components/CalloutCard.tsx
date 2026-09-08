import { photoUrl, type Official } from '../data/officials';

export function CalloutCard({ official }: { official: Official }) {
  return (
    <div className="flex w-48 items-center gap-3 rounded-lg border border-white/10 bg-raised/95 p-2.5 shadow-2xl backdrop-blur-sm ring-glow">
      <img
        src={photoUrl(official.photo)}
        alt={official.name}
        loading="lazy"
        className="h-14 w-14 shrink-0 rounded-md object-cover grayscale-[35%]"
      />
      <div className="min-w-0">
        <div className="font-display text-sm leading-tight text-bone">
          {official.name}
        </div>
        <div className="mt-0.5 text-xs leading-snug text-ash">
          {official.position}
        </div>
      </div>
    </div>
  );
}
