import { beforeEach, describe, expect, it, vi } from 'vitest';

function makeLocalStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => (map.has(k) ? map.get(k)! : null),
    setItem: (k: string, v: string) => void map.set(k, String(v)),
    removeItem: (k: string) => void map.delete(k),
    clear: () => map.clear(),
    key: (i: number) => [...map.keys()][i] ?? null,
    get length() {
      return map.size;
    },
  };
}

vi.stubGlobal('localStorage', makeLocalStorage());

// import after the stub is in place
const { loadState, saveState, clearState, freshState } = await import('./storage');
const { OFFICIALS } = await import('../data/officials');

beforeEach(() => localStorage.clear());

describe('storage', () => {
  it('returns null when nothing is stored', () => {
    expect(loadState()).toBeNull();
  });

  it('round-trips a saved game', () => {
    const state = {
      ...freshState(),
      phase: 'playing' as const,
      currentIndex: 2,
      placements: [
        { id: OFFICIALS[0].id, n: 0.5, m: 0.25, p: 0.25 },
        { id: OFFICIALS[1].id, n: 0.1, m: 0.1, p: 0.8 },
      ],
    };
    saveState(state);
    expect(loadState()).toEqual(state);
  });

  it('clearState wipes the slot', () => {
    saveState({ ...freshState(), phase: 'playing' });
    clearState();
    expect(loadState()).toBeNull();
  });

  it('rejects a wrong version', () => {
    localStorage.setItem('dtom:v1', JSON.stringify({ ...freshState(), version: 99 }));
    expect(loadState()).toBeNull();
  });

  it('rejects a roster mismatch', () => {
    const bad = { ...freshState(), order: ['nobody-here', ...freshState().order.slice(1)] };
    localStorage.setItem('dtom:v1', JSON.stringify(bad));
    expect(loadState()).toBeNull();
  });

  it('rejects malformed placements', () => {
    const bad = {
      ...freshState(),
      phase: 'playing',
      placements: [{ id: OFFICIALS[0].id, n: 'lots', m: 0, p: 0 }],
    };
    localStorage.setItem('dtom:v1', JSON.stringify(bad));
    expect(loadState()).toBeNull();
  });

  it('survives non-JSON garbage', () => {
    localStorage.setItem('dtom:v1', '{not json');
    expect(loadState()).toBeNull();
  });
});
