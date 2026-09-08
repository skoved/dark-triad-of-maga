import { toPercents, type Bary, type Trait } from '../lib/barycentric';

const ROWS: { key: Trait; label: string; color: string; bar: string }[] = [
  { key: 'n', label: 'Narcissism', color: 'text-narc', bar: 'bg-narc' },
  { key: 'm', label: 'Machiavellianism', color: 'text-mach', bar: 'bg-mach' },
  { key: 'p', label: 'Psychopathy', color: 'text-psych', bar: 'bg-psych' },
];

export function TraitReadout({
  bary,
  locked = false,
}: {
  bary: Bary | null;
  locked?: boolean;
}) {
  const pct = bary ? toPercents(bary) : null;

  return (
    <div
      className={`w-full rounded-lg border border-white/10 bg-surface/80 p-4 transition ${
        locked ? 'ring-glow' : ''
      }`}
    >
      <div className="mb-3 flex items-baseline justify-between">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-ash">
          Trait mix
        </span>
        <span className="text-[10px] uppercase tracking-widest text-faint">
          {locked ? 'locked' : bary ? 'at cursor' : 'hover the triangle'}
        </span>
      </div>

      <div className="space-y-3">
        {ROWS.map((row) => {
          const value = pct ? pct[row.key] : 0;
          return (
            <div key={row.key}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className={`font-medium ${row.color}`}>{row.label}</span>
                <span className="tabular-nums text-bone">
                  {pct ? `${value}%` : '—'}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                <div
                  className={`h-full rounded-full ${row.bar} transition-[width] duration-150 ease-out`}
                  style={{ width: `${value}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
