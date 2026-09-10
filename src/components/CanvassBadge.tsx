import type { Official } from '../data/officials';

type Canvass = NonNullable<Official['dggCanvass']>;

function Megaphone({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m3 11 18-5v12L3 14v-3z" />
      <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
    </svg>
  );
}

/**
 * "Digital Ground Game is canvassing for the opponent" badge: a megaphone icon
 * plus the event name. `linked` wraps it in an external link to the signup form
 * (used on the "Place this person" box); without it, it's plain text (callout).
 */
export function CanvassBadge({
  canvass,
  linked = false,
}: {
  canvass: Canvass;
  linked?: boolean;
}) {
  const base =
    'mt-1.5 flex items-center gap-1.5 text-xs font-medium text-canvass';
  const inner = (
    <>
      <Megaphone className="h-3.5 w-3.5 shrink-0" />
      <span className="min-w-0 truncate">{canvass.eventName}</span>
    </>
  );

  return linked ? (
    <a
      href={canvass.signupUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`${base} underline decoration-canvass/50 underline-offset-2 transition-colors hover:text-bone`}
    >
      {inner}
    </a>
  ) : (
    <div className={base}>{inner}</div>
  );
}
