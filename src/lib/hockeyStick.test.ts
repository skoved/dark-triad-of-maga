import { describe, expect, it } from 'vitest';
import { buildCallout } from './hockeyStick';
import { CENTROID, fromBarycentric } from './barycentric';

describe('buildCallout', () => {
  it('hangs the card left for left-of-centre markers and right otherwise', () => {
    const left = buildCallout(fromBarycentric({ n: 0.1, m: 0.8, p: 0.1 }));
    const right = buildCallout(fromBarycentric({ n: 0.1, m: 0.1, p: 0.8 }));
    expect(left.side).toBe('left');
    expect(right.side).toBe('right');
  });

  it('keeps the shaft end on the canvas', () => {
    for (const b of [
      { n: 0.98, m: 0.01, p: 0.01 },
      { n: 0.01, m: 0.98, p: 0.01 },
      { n: 0.01, m: 0.01, p: 0.98 },
      { n: 1 / 3, m: 1 / 3, p: 1 / 3 },
    ]) {
      const c = buildCallout(fromBarycentric(b));
      expect(c.end.x).toBeGreaterThanOrEqual(4);
      expect(c.end.x).toBeLessThanOrEqual(96);
    }
  });

  it('elbow sits further from the centroid than the marker', () => {
    const marker = fromBarycentric({ n: 0.2, m: 0.2, p: 0.6 });
    const c = buildCallout(marker);
    const dMarker = Math.hypot(marker.x - CENTROID.x, marker.y - CENTROID.y);
    const dElbow = Math.hypot(c.elbow.x - CENTROID.x, c.elbow.y - CENTROID.y);
    expect(dElbow).toBeGreaterThan(dMarker);
  });

  it('produces a 3-point polyline', () => {
    const c = buildCallout(fromBarycentric({ n: 0.5, m: 0.3, p: 0.2 }));
    expect(c.points.trim().split(/\s+/)).toHaveLength(3);
  });
});
