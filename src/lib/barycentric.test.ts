import { describe, expect, it } from 'vitest';
import {
  A,
  B,
  C,
  clampToTriangle,
  dominantTrait,
  fromBarycentric,
  isInside,
  toBarycentric,
  toPercents,
  type Point,
} from './barycentric';

const close = (a: number, b: number, eps = 1e-6) => Math.abs(a - b) < eps;

describe('toBarycentric', () => {
  it('maps each vertex to a unit weight', () => {
    expect(toBarycentric(A)).toMatchObject({ n: expect.closeTo(1, 6) });
    expect(toBarycentric(B)).toMatchObject({ m: expect.closeTo(1, 6) });
    expect(toBarycentric(C)).toMatchObject({ p: expect.closeTo(1, 6) });
  });

  it('maps the centroid to equal thirds', () => {
    const centroid = {
      x: (A.x + B.x + C.x) / 3,
      y: (A.y + B.y + C.y) / 3,
    };
    const b = toBarycentric(centroid);
    expect(close(b.n, 1 / 3)).toBe(true);
    expect(close(b.m, 1 / 3)).toBe(true);
    expect(close(b.p, 1 / 3)).toBe(true);
  });

  it('weights always sum to 1', () => {
    for (const pt of [A, B, C, { x: 0, y: 0 }, { x: 50, y: 50 }, { x: 200, y: -30 }]) {
      const b = toBarycentric(pt);
      expect(close(b.n + b.m + b.p, 1)).toBe(true);
    }
  });
});

describe('round trip', () => {
  it('fromBarycentric(toBarycentric(p)) ~= p for interior points', () => {
    let seed = 42;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 2 ** 32;
    };
    for (let i = 0; i < 200; i++) {
      let r1 = rand();
      let r2 = rand();
      if (r1 + r2 > 1) {
        r1 = 1 - r1;
        r2 = 1 - r2;
      }
      const p: Point = {
        x: A.x + r1 * (B.x - A.x) + r2 * (C.x - A.x),
        y: A.y + r1 * (B.y - A.y) + r2 * (C.y - A.y),
      };
      const back = fromBarycentric(toBarycentric(p));
      expect(close(back.x, p.x, 1e-4)).toBe(true);
      expect(close(back.y, p.y, 1e-4)).toBe(true);
    }
  });
});

describe('clampToTriangle', () => {
  it('leaves interior points untouched', () => {
    const p = { x: 50, y: 60 };
    expect(clampToTriangle(p)).toEqual(p);
  });

  it('pulls exterior points onto the triangle', () => {
    const outside = { x: -50, y: 200 };
    const clamped = clampToTriangle(outside);
    expect(isInside(clamped)).toBe(true);
    const b = toBarycentric(clamped);
    // at least one weight is ~0 -> it landed on the boundary
    expect(Math.min(b.n, b.m, b.p)).toBeLessThan(1e-6);
  });
});

describe('dominantTrait', () => {
  it('picks the largest weight', () => {
    expect(dominantTrait({ n: 0.5, m: 0.3, p: 0.2 })).toBe('n');
    expect(dominantTrait({ n: 0.1, m: 0.6, p: 0.3 })).toBe('m');
    expect(dominantTrait({ n: 0.2, m: 0.2, p: 0.6 })).toBe('p');
  });
});

describe('toPercents', () => {
  it('always sums to exactly 100', () => {
    for (const b of [
      { n: 1 / 3, m: 1 / 3, p: 1 / 3 },
      { n: 0.111, m: 0.444, p: 0.445 },
      { n: 0.9999, m: 0.00005, p: 0.00005 },
      { n: 0, m: 0.5, p: 0.5 },
    ]) {
      const pct = toPercents(b);
      expect(pct.n + pct.m + pct.p).toBe(100);
    }
  });
});
