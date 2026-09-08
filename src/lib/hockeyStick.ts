/**
 * Builds the bent "hockey stick" callout that reaches out of the triangle
 * from a placed marker: a short leg poking outward past the edge, then a
 * 90-degree bend into a long horizontal shaft ending where the info card sits.
 *
 * All coordinates are in the board's 0..100 SVG space.
 */

import { CENTROID, type Point } from './barycentric';

export type Callout = {
  /** polyline vertices: marker -> elbow -> shaft end */
  points: string;
  marker: Point;
  elbow: Point;
  end: Point;
  /** which side the card should hang off / align to */
  side: 'left' | 'right';
};

const SHORT_LEG = 8; // outward poke past the marker
const SHAFT_LEN = 16; // horizontal run to the card anchor
const MIN_X = 4;
const MAX_X = 96;

export function buildCallout(marker: Point): Callout {
  const dx = marker.x - CENTROID.x;
  const dy = marker.y - CENTROID.y;
  const len = Math.hypot(dx, dy) || 1;
  const outward = { x: dx / len, y: dy / len };

  const elbow: Point = {
    x: marker.x + outward.x * SHORT_LEG,
    y: marker.y + outward.y * SHORT_LEG,
  };

  // Hang the card toward whichever horizontal edge the marker is nearer.
  const side: 'left' | 'right' = marker.x <= 50 ? 'left' : 'right';
  const shaftDir = side === 'right' ? 1 : -1;

  const end: Point = {
    x: Math.max(MIN_X, Math.min(MAX_X, elbow.x + shaftDir * SHAFT_LEN)),
    y: elbow.y,
  };

  return {
    points: `${marker.x},${marker.y} ${elbow.x},${elbow.y} ${end.x},${end.y}`,
    marker,
    elbow,
    end,
    side,
  };
}
