import {
  forwardRef,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from 'react';
import {
  A,
  B,
  C,
  CENTROID,
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
import { photoUrl } from '../data/officials';
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
  signBlue: '#002868', // Old Glory Blue
  signRed: '#bf0a30', // Old Glory Red
  signInk: '#ffffff',
} as const;

type Props = {
  placed: PlacedOfficial[];
  interactive?: boolean;
  showAllNames?: boolean;
  /** Panels the hover callout must never cover; it dodges above/below them. */
  avoidLeftRef?: RefObject<HTMLElement | null>;
  avoidRightRef?: RefObject<HTMLElement | null>;
  onHoverBary?: (b: Bary | null) => void;
  onPlace?: (b: Bary) => void;
};

// Hover-callout card sizing (px) used for on-screen collision avoidance.
const CARD_W = 272;
const CARD_H = 132;
const CARD_GAP = 12; // offset from the hockey-stick shaft end
const PANEL_GAP = 12; // clearance kept when dodging a panel
const EDGE_GAP = 8; // min gap from the viewport edge
const BLADE_LEN = 8; // hockey-stick blade length off the marker (viewBox units)
const MARKER_R = 2.5; // photo-marker radius (viewBox units)
const MARKER_HIT_R = 4; // invisible hover/click target radius

const unit = (x: number, y: number) => {
  const len = Math.hypot(x, y) || 1e-9;
  return { x: x / len, y: y / len };
};

type CalloutLayout = {
  cardStyle: CSSProperties; // width / left / top for the card wrapper
  linePoints: string; // hockey-stick polyline, viewBox units
  endDot: { x: number; y: number }; // viewBox units
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
  {
    placed,
    interactive = false,
    showAllNames = false,
    avoidLeftRef,
    avoidRightRef,
    onHoverBary,
    onPlace,
  },
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
  const callout = useMemo(
    () => (hovered ? buildCallout(fromBarycentric(hovered.bary)) : null),
    [hovered],
  );

  // Position the hover callout so it never covers the flanking panels: it keeps
  // its natural spot out in the gutter unless that overlaps a panel, in which
  // case it slides fully above or below (whichever it is nearer). The
  // hockey-stick line is rebuilt to terminate at wherever the card ends up.
  const [calloutLayout, setCalloutLayout] = useState<CalloutLayout | null>(null);

  useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!callout || !svg) {
      setCalloutLayout(null);
      return;
    }

    const resolve = () => {
      const board = svg.getBoundingClientRect();
      if (!board.width || !board.height) return;
      const toVb = (px: number) => (px / board.width) * 100;

      const anchorX =
        callout.side === 'right' ? CARD_GAP : -(CARD_W + CARD_GAP);
      let leftVp = board.left + (callout.end.x / 100) * board.width + anchorX;
      leftVp = Math.max(
        EDGE_GAP,
        Math.min(leftVp, window.innerWidth - CARD_W - EDGE_GAP),
      );

      const centerYVp = board.top + (callout.end.y / 100) * board.height;
      let topVp = centerYVp - CARD_H / 2;

      const panel =
        callout.side === 'right'
          ? avoidRightRef?.current
          : avoidLeftRef?.current;
      if (panel) {
        const p = panel.getBoundingClientRect();
        const hitX = leftVp < p.right && leftVp + CARD_W > p.left;
        const hitY = topVp < p.bottom && topVp + CARD_H > p.top;
        if (hitX && hitY) {
          const upTop = p.top - PANEL_GAP - CARD_H;
          const downTop = p.bottom + PANEL_GAP;
          const preferUp = centerYVp < (p.top + p.bottom) / 2;
          if (preferUp) {
            topVp = upTop >= EDGE_GAP ? upTop : downTop;
          } else {
            topVp =
              downTop + CARD_H <= window.innerHeight - EDGE_GAP
                ? downTop
                : upTop;
          }
        }
      }

      topVp = Math.max(
        EDGE_GAP,
        Math.min(topVp, window.innerHeight - CARD_H - EDGE_GAP),
      );

      const cardLeft = leftVp - board.left;
      const cardTop = topVp - board.top;

      // Attach the line to the card edge facing the triangle, at its mid-height.
      const attachXpx =
        callout.side === 'right' ? cardLeft : cardLeft + CARD_W;
      const ax = toVb(attachXpx);
      const ay = toVb(cardTop + CARD_H / 2);
      const { marker } = callout;

      // One-bend hockey stick: a short blade off the marker, then a single
      // straight shaft to the card. Blade direction = average of "straight out
      // from the triangle centre" and "straight at the card", so the bend stays
      // gentle wherever the card ends up (never a right angle).
      const toCard = unit(ax - marker.x, ay - marker.y);
      const outward = unit(marker.x - CENTROID.x, marker.y - CENTROID.y);
      const sum = { x: outward.x + toCard.x, y: outward.y + toCard.y };
      const blade =
        Math.hypot(sum.x, sum.y) < 1e-3 ? toCard : unit(sum.x, sum.y);
      const ex = marker.x + blade.x * BLADE_LEN;
      const ey = marker.y + blade.y * BLADE_LEN;

      setCalloutLayout({
        cardStyle: { width: CARD_W, left: cardLeft, top: cardTop },
        linePoints: `${marker.x},${marker.y} ${ex},${ey} ${ax},${ay}`,
        endDot: { x: ax, y: ay },
      });
    };

    resolve();
    window.addEventListener('resize', resolve);
    window.addEventListener('scroll', resolve, { capture: true, passive: true });
    return () => {
      window.removeEventListener('resize', resolve);
      window.removeEventListener('scroll', resolve, { capture: true });
    };
  }, [hoveredId, callout, avoidLeftRef, avoidRightRef]);

  const ghostBary = pending ?? ghost;
  const ghostPt = interactive && ghostBary ? fromBarycentric(ghostBary) : null;

  return (
    <div ref={ref} className="relative aspect-square w-full select-none">
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
          <linearGradient id={`fill-${gradId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#160d10" />
            <stop offset="100%" stopColor="#0c0709" />
          </linearGradient>
          <clipPath id={`sign-clip-${gradId}`}>
            <polygon points={TRIANGLE_POINTS} />
          </clipPath>
          <clipPath id={`marker-clip-${gradId}`}>
            <circle r={MARKER_R} />
          </clipPath>
          <filter id={`glow-${gradId}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.1" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* base fill */}
        <polygon points={TRIANGLE_POINTS} fill={`url(#fill-${gradId})`} />

        {/* faint MAGA yard sign, clipped to the triangle */}
        <g clipPath={`url(#sign-clip-${gradId})`} opacity={0.18}>
          <MagaSign />
        </g>

        {/* barycentric grid, over the sign */}
        <g stroke={COLOR.grid} strokeWidth={0.25}>
          {GRID.map((s, i) => (
            <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} />
          ))}
        </g>

        {/* glowing crimson edge, on top */}
        <polygon
          points={TRIANGLE_POINTS}
          fill="none"
          stroke={COLOR.blood}
          strokeWidth={0.7}
          strokeLinejoin="round"
          filter={`url(#glow-${gradId})`}
        />

        {/* placed markers — small desaturated photo of the person */}
        {placed.map((p) => {
          const pt = fromBarycentric(p.bary);
          const isNewest = interactive && p.order === placed.length;
          return (
            <g key={p.official.id} data-marker={p.official.id}>
              <g transform={`translate(${pt.x} ${pt.y})`} pointerEvents="none">
                <circle r={MARKER_R + 0.7} fill={COLOR.bloodFaint} />
                <image
                  href={photoUrl(p.official.photo)}
                  x={-MARKER_R}
                  y={-MARKER_R}
                  width={MARKER_R * 2}
                  height={MARKER_R * 2}
                  preserveAspectRatio="xMidYMin slice"
                  clipPath={`url(#marker-clip-${gradId})`}
                  style={{ filter: 'saturate(0.55)' }}
                />
                <circle
                  r={MARKER_R}
                  fill="none"
                  stroke={isNewest ? COLOR.blood : COLOR.boneFaint}
                  strokeWidth={isNewest ? 0.7 : 0.45}
                  className={isNewest ? 'dtom-pulse' : undefined}
                />
              </g>
              {showAllNames && (
                <text
                  x={pt.x}
                  y={pt.y - MARKER_R - 1.6}
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
                r={MARKER_HIT_R}
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
        {callout && calloutLayout && (
          <g pointerEvents="none">
            <polyline
              points={calloutLayout.linePoints}
              pathLength={1}
              fill="none"
              stroke={COLOR.blood}
              strokeWidth={0.6}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="dtom-draw"
            />
            <circle cx={callout.marker.x} cy={callout.marker.y} r={0.9} fill={COLOR.blood} />
            <circle
              cx={calloutLayout.endDot.x}
              cy={calloutLayout.endDot.y}
              r={0.9}
              fill={COLOR.blood}
            />
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

      {hovered && calloutLayout && (
        <div
          className="pointer-events-none absolute z-20"
          style={calloutLayout.cardStyle}
        >
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

/**
 * A stylised recreation of a classic blue "Make America Great Again" yard sign,
 * authored in the board's 0–100 viewBox space so it over-covers the triangle and
 * is cropped by the caller's clip path. Rendered at low opacity as a backdrop.
 */
function MagaSign() {
  const text = {
    textAnchor: 'middle' as const,
    fontFamily: "'Archivo Black', Inter, system-ui, sans-serif",
    fill: COLOR.signInk,
  };
  return (
    <>
      <rect x={-10} y={0} width={120} height={100} fill={COLOR.signBlue} />
      <rect x={-10} y={62} width={120} height={3.6} fill={COLOR.signRed} />
      <text x={50} y={60} fontSize={14} letterSpacing={1.6} {...text}>
        TRUMP
      </text>
      <text x={50} y={74} fontSize={5.5} letterSpacing={1} {...text}>
        MAKE AMERICA
      </text>
      <text x={50} y={81} fontSize={5.5} letterSpacing={1} {...text}>
        GREAT AGAIN!
      </text>
    </>
  );
}

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
  const dy = align === 'top' ? -4 : 5.4;
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
