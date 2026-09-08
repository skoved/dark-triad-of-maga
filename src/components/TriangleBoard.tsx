import {
  forwardRef,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import {
  A,
  B,
  C,
  TRIANGLE_POINTS,
  fromBarycentric,
  isInside,
  normalizeBary,
  toBarycentric,
  type Bary,
  type Point,
} from '../lib/barycentric';
import { buildCallout } from '../lib/hockeyStick';
import { CalloutCard } from './CalloutCard';
import type { PlacedOfficial } from '../hooks/useGameState';

// Hex literals (not CSS vars): SVG presentation attributes don't resolve var(),
// and hard values also keep the PNG export faithful.
const COLOR = {
  blood: '#e11d48',
  bloodFaint: 'rgba(225,29,72,0.18)',
  bone: '#ecebe8',
  boneFaint: 'rgba(236,235,232,0.6)',
  grid: 'rgba(236,235,232,0.08)',
  ink: '#0c0709',
  narc: '#a78bfa',
  mach: '#86b787',
  psych: '#ef6b6b',
} as const;

type Props = {
  placed: PlacedOfficial[];
  interactive?: boolean;
  showAllNames?: boolean;
  onHoverBary?: (b: Bary | null) => void;
  onPlace?: (b: Bary) => void;
};

const GRID_STEPS = [0.2, 0.4, 0.6, 0.8];

type Seg = { x1: number; y1: number; x2: number; y2: number };

const GRID: Seg[] = GRID_STEPS.flatMap((t) => {
  const seg = (a: Bary, b: Bary): Seg => {
    const p1 = fromBarycentric(a);
    const p2 = fromBarycentric(b);
    return { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y };
  };
  return [
    seg({ n: t, m: 1 - t, p: 0 }, { n: t, m: 0, p: 1 - t }),
    seg({ n: 1 - t, m: t, p: 0 }, { n: 0, m: t, p: 1 - t }),
    seg({ n: 1 - t, m: 0, p: t }, { n: 0, m: 1 - t, p: t }),
  ];
});

export const TriangleBoard = forwardRef<HTMLDivElement, Props>(function TriangleBoard(
  { placed, interactive = false, showAllNames = false, onHoverBary, onPlace },
  ref,
) {
  const gradId = useId().replace(/:/g, '');
  const svgRef = useRef<SVGSVGElement>(null);
  const lastPointerType = useRef<string>('mouse');

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [ghost, setGhost] = useState<Bary | null>(null);
  const [pending, setPending] = useState<Bary | null>(null);

  function eventToBoard(e: { clientX: number; clientY: number }): Point | null {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    return {
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    };
  }

  function handlePointerMove(e: ReactPointerEvent) {
    if (!interactive || pending) return;
    const raw = eventToBoard(e);
    if (!raw || !isInside(raw)) {
      setGhost(null);
      onHoverBary?.(null);
      return;
    }
    const bary = normalizeBary(toBarycentric(raw));
    setGhost(bary);
    onHoverBary?.(bary);
  }

  function handlePointerLeave() {
    setGhost(null);
    setHoveredId(null);
    if (!pending) onHoverBary?.(null);
  }

  function handleClick(e: ReactMouseEvent) {
    if (!interactive) return;
    const raw = eventToBoard(e);
    if (!raw || !isInside(raw)) return;
    const bary = normalizeBary(toBarycentric(raw));
    if (lastPointerType.current === 'touch') {
      setPending(bary);
      setGhost(bary);
      onHoverBary?.(bary);
    } else {
      onPlace?.(bary);
    }
  }

  const hovered = placed.find((p) => p.official.id === hoveredId) ?? null;
  const callout = hovered ? buildCallout(fromBarycentric(hovered.bary)) : null;

  let cardStyle: CSSProperties | undefined;
  if (callout) {
    cardStyle = {
      left: `${callout.end.x}%`,
      top: `${callout.end.y}%`,
      transform:
        callout.side === 'right'
          ? 'translate(8px, -50%)'
          : 'translate(calc(-100% - 8px), -50%)',
    };
  }

  const ghostBary = pending ?? ghost;
  const ghostPt = interactive && ghostBary ? fromBarycentric(ghostBary) : null;

  return (
    <div
      ref={ref}
      className="relative mx-auto aspect-square w-full max-w-[560px] select-none"
    >
      <svg
        ref={svgRef}
        viewBox="0 0 100 100"
        className="absolute inset-0 h-full w-full overflow-visible"
        style={{ touchAction: 'none', cursor: interactive ? 'crosshair' : 'default' }}
        onPointerDown={(e) => {
          lastPointerType.current = e.pointerType || 'mouse';
        }}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onClick={handleClick}
      >
        <defs>
          <radialGradient id={`fill-${gradId}`} cx="50%" cy="30%" r="75%">
            <stop offset="0%" stopColor="#2a1119" />
            <stop offset="55%" stopColor="#170b0e" />
            <stop offset="100%" stopColor="#0b0608" />
          </radialGradient>
          <filter id={`glow-${gradId}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.1" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <polygon
          points={TRIANGLE_POINTS}
          fill={`url(#fill-${gradId})`}
          stroke={COLOR.blood}
          strokeWidth={0.7}
          strokeLinejoin="round"
          filter={`url(#glow-${gradId})`}
        />

        <g stroke={COLOR.grid} strokeWidth={0.25}>
          {GRID.map((s, i) => (
            <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} />
          ))}
        </g>

        {/* placed markers */}
        {placed.map((p) => {
          const pt = fromBarycentric(p.bary);
          return (
            <g key={p.official.id}>
              <circle cx={pt.x} cy={pt.y} r={2.6} fill={COLOR.bloodFaint} />
              <path
                d={`M${pt.x} ${pt.y - 1.6} L${pt.x + 1.6} ${pt.y} L${pt.x} ${
                  pt.y + 1.6
                } L${pt.x - 1.6} ${pt.y} Z`}
                fill={COLOR.blood}
                stroke={COLOR.boneFaint}
                strokeWidth={0.3}
                className={
                  interactive && p.order === placed.length
                    ? 'dtom-pulse'
                    : undefined
                }
              />
              {showAllNames && (
                <text
                  x={pt.x}
                  y={pt.y - 3}
                  textAnchor="middle"
                  fontSize={2.3}
                  fontFamily="Inter, system-ui, sans-serif"
                  fill={COLOR.bone}
                  stroke={COLOR.ink}
                  strokeWidth={0.7}
                  style={{ paintOrder: 'stroke' }}
                >
                  {p.official.name}
                </text>
              )}
              <circle
                cx={pt.x}
                cy={pt.y}
                r={4}
                fill="transparent"
                style={{ cursor: 'pointer' }}
                onPointerEnter={() => setHoveredId(p.official.id)}
                onPointerLeave={() =>
                  setHoveredId((cur) => (cur === p.official.id ? null : cur))
                }
                onClick={(e) => {
                  e.stopPropagation();
                  setHoveredId((cur) =>
                    cur === p.official.id ? null : p.official.id,
                  );
                }}
              />
            </g>
          );
        })}

        {/* hockey-stick callout */}
        {callout && (
          <g pointerEvents="none">
            <polyline
              points={callout.points}
              fill="none"
              stroke={COLOR.blood}
              strokeWidth={0.6}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="dtom-draw"
            />
            <circle cx={callout.marker.x} cy={callout.marker.y} r={0.9} fill={COLOR.blood} />
            <circle cx={callout.end.x} cy={callout.end.y} r={0.9} fill={COLOR.blood} />
          </g>
        )}

        {/* ghost / pending marker */}
        {ghostPt && (
          <g pointerEvents="none">
            <circle
              cx={ghostPt.x}
              cy={ghostPt.y}
              r={2}
              fill="none"
              stroke={COLOR.bone}
              strokeWidth={0.4}
              strokeDasharray="1 1"
              className={pending ? undefined : 'dtom-spin'}
            />
            <circle cx={ghostPt.x} cy={ghostPt.y} r={0.5} fill={COLOR.bone} />
          </g>
        )}

        {/* corner labels */}
        <CornerLabel pt={A} align="top" color={COLOR.narc}>
          Narcissism
        </CornerLabel>
        <CornerLabel pt={B} align="bottom-left" color={COLOR.mach}>
          Machiavellianism
        </CornerLabel>
        <CornerLabel pt={C} align="bottom-right" color={COLOR.psych}>
          Psychopathy
        </CornerLabel>
      </svg>

      {hovered && cardStyle && (
        <div className="pointer-events-none absolute z-20" style={cardStyle}>
          <CalloutCard official={hovered.official} />
        </div>
      )}

      {pending && (
        <div className="absolute inset-x-0 bottom-2 z-20 flex justify-center gap-2">
          <button
            type="button"
            onClick={() => {
              onPlace?.(pending);
              setPending(null);
            }}
            className="rounded-md border border-blood/60 bg-blood/20 px-5 py-2 font-display text-xs uppercase tracking-[0.18em] text-bone ring-glow"
          >
            Place here
          </button>
          <button
            type="button"
            onClick={() => {
              setPending(null);
              onHoverBary?.(null);
            }}
            className="rounded-md border border-white/15 bg-surface/90 px-4 py-2 text-xs uppercase tracking-[0.18em] text-ash"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
});

function CornerLabel({
  pt,
  align,
  color,
  children,
}: {
  pt: Point;
  align: 'top' | 'bottom-left' | 'bottom-right';
  color: string;
  children: string;
}) {
  const anchor =
    align === 'top' ? 'middle' : align === 'bottom-left' ? 'start' : 'end';
  const dy = align === 'top' ? -3.4 : 5.4;
  const dx = align === 'bottom-left' ? -2 : align === 'bottom-right' ? 2 : 0;
  return (
    <text
      x={pt.x + dx}
      y={pt.y + dy}
      textAnchor={anchor}
      fontSize={3.1}
      fontFamily="'Archivo Black', Inter, system-ui, sans-serif"
      fill={color}
      letterSpacing={0.35}
      style={{ textTransform: 'uppercase' }}
    >
      {children}
    </text>
  );
}
