import { describe, expect, it } from 'vitest';
import { reducer } from './useGameState';
import { freshState, type GameState } from '../lib/storage';
import { OFFICIALS } from '../data/officials';

const CENTER = { n: 1 / 3, m: 1 / 3, p: 1 / 3 };

function playing(): GameState {
  return reducer(freshState(), { type: 'newGame' });
}

describe('game reducer', () => {
  it('newGame starts a shuffled, empty, playing game', () => {
    const s = playing();
    expect(s.phase).toBe('playing');
    expect(s.currentIndex).toBe(0);
    expect(s.placements).toEqual([]);
    expect(s.order).toHaveLength(OFFICIALS.length);
    expect(new Set(s.order).size).toBe(OFFICIALS.length);
  });

  it('place records a placement for the current person and advances', () => {
    const s0 = playing();
    const s1 = reducer(s0, { type: 'place', bary: CENTER });
    expect(s1.currentIndex).toBe(1);
    expect(s1.placements).toEqual([{ id: s0.order[0], n: 1 / 3, m: 1 / 3, p: 1 / 3 }]);
    expect(s1.phase).toBe('playing');
  });

  it('flips to summary after the final placement', () => {
    let s = playing();
    for (let i = 0; i < OFFICIALS.length; i++) {
      expect(s.phase).toBe('playing');
      s = reducer(s, { type: 'place', bary: CENTER });
    }
    expect(s.phase).toBe('summary');
    expect(s.placements).toHaveLength(OFFICIALS.length);
    expect(s.currentIndex).toBe(OFFICIALS.length);
  });

  it('ignores place once not playing', () => {
    let s = playing();
    for (let i = 0; i < OFFICIALS.length; i++) {
      s = reducer(s, { type: 'place', bary: CENTER });
    }
    const after = reducer(s, { type: 'place', bary: CENTER });
    expect(after).toBe(s);
  });

  it('reset returns to a clean title state', () => {
    let s = playing();
    s = reducer(s, { type: 'place', bary: CENTER });
    const r = reducer(s, { type: 'reset' });
    expect(r.phase).toBe('title');
    expect(r.placements).toEqual([]);
    expect(r.currentIndex).toBe(0);
  });
});
