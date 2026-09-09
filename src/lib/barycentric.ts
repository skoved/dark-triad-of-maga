/**
 * Triangle geometry for the Dark Triad board.
 *
 * The board lives in a normalized SVG space with viewBox "0 0 100 100".
 * Corners (with padding so labels/markers/lines have room):
 *   A = Narcissism        top-center
 *   B = Machiavellianism  bottom-left
 *   C = Psychopathy       bottom-right
 *
 * A barycentric weight triple {n, m, p} always sums to 1 and *is* the trait
 * ratio at that location. Placements are stored as these weights so they are
 * resolution-independent.
 */

export type Point = { x: number; y: number };
export type Bary = { n: number; m: number; p: number };
export type Trait = 'n' | 'm' | 'p';

export const VIEWBOX = 100;

export const A: Point = { x: 50, y: 10 }; // Narcissism
export const B: Point = { x: 10, y: 87 }; // Machiavellianism
export const C: Point = { x: 90, y: 87 }; // Psychopathy

export const TRIANGLE_POINTS = `${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y}`;

export const TRAIT_LABEL: Record<Trait, string> = {
  n: 'Narcissism',
  m: 'Machiavellianism',
  p: 'Psychopathy',
};

export const TRAIT_DEFINITION: Record<Trait, string> = {
  n: 'Characterized by grandiosity, pride, egotism, and a lack of empathy.',
  m: 'Characterized by manipulativeness, indifference to morality, lack of empathy, and a calculated focus on self-interest.',
  p: 'Characterized by continuous antisocial behavior, impulsivity, selfishness, callous and unemotional traits, and remorselessness.',
};

const DET =
  (B.y - C.y) * (A.x - C.x) + (C.x - B.x) * (A.y - C.y);

/** Cartesian point -> barycentric weights (may be negative if outside). */
export function toBarycentric(pt: Point): Bary {
  const n =
    ((B.y - C.y) * (pt.x - C.x) + (C.x - B.x) * (pt.y - C.y)) / DET;
  const m =
    ((C.y - A.y) * (pt.x - C.x) + (A.x - C.x) * (pt.y - C.y)) / DET;
  const p = 1 - n - m;
  return { n, m, p };
}

/** Barycentric weights -> Cartesian point in the 0..100 board space. */
export function fromBarycentric(b: Bary): Point {
  return {
    x: b.n * A.x + b.m * B.x + b.p * C.x,
    y: b.n * A.y + b.m * B.y + b.p * C.y,
  };
}

const EPS = 1e-9;

export function isInside(pt: Point): boolean {
  const { n, m, p } = toBarycentric(pt);
  return n >= -EPS && m >= -EPS && p >= -EPS;
}

/** Clamp negative weights to 0 and renormalize so the triple is a valid ratio. */
export function normalizeBary(b: Bary): Bary {
  const n = Math.max(0, b.n);
  const m = Math.max(0, b.m);
  const p = Math.max(0, b.p);
  const sum = n + m + p || 1;
  return { n: n / sum, m: m / sum, p: p / sum };
}

/**
 * Project a point onto (or into) the triangle. Points inside are returned
 * unchanged; points outside land on the nearest edge or vertex.
 */
export function clampToTriangle(pt: Point): Point {
  if (isInside(pt)) return pt;
  return fromBarycentric(normalizeBary(toBarycentric(pt)));
}

export const CENTROID: Point = fromBarycentric({
  n: 1 / 3,
  m: 1 / 3,
  p: 1 / 3,
});

/** Whichever trait has the highest weight. Ties resolve n > m > p. */
export function dominantTrait(b: Bary): Trait {
  if (b.n >= b.m && b.n >= b.p) return 'n';
  if (b.m >= b.p) return 'm';
  return 'p';
}

/** Integer percentages that always sum to exactly 100 (largest-remainder). */
export function toPercents(b: Bary): Record<Trait, number> {
  const raw: Record<Trait, number> = {
    n: b.n * 100,
    m: b.m * 100,
    p: b.p * 100,
  };
  const floors: Record<Trait, number> = {
    n: Math.floor(raw.n),
    m: Math.floor(raw.m),
    p: Math.floor(raw.p),
  };
  let remainder = 100 - (floors.n + floors.m + floors.p);
  const order = (['n', 'm', 'p'] as Trait[]).sort(
    (a, c) => raw[c] - floors[c] - (raw[a] - floors[a]),
  );
  for (const t of order) {
    if (remainder <= 0) break;
    floors[t] += 1;
    remainder -= 1;
  }
  return floors;
}
