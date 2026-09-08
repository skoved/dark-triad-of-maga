import { useCallback, useEffect, useMemo, useReducer } from 'react';
import {
  clearState,
  freshState,
  loadState,
  saveState,
  type GameState,
} from '../lib/storage';
import { OFFICIALS, OFFICIALS_BY_ID, type Official } from '../data/officials';
import type { Bary } from '../lib/barycentric';

export type Action =
  | { type: 'newGame' }
  | { type: 'place'; bary: Bary }
  | { type: 'reset' };

function shuffled<T>(input: readonly T[]): T[] {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'newGame':
      return {
        version: 1,
        phase: 'playing',
        order: shuffled(OFFICIALS.map((o) => o.id)),
        currentIndex: 0,
        placements: [],
      };

    case 'place': {
      if (state.phase !== 'playing') return state;
      const id = state.order[state.currentIndex];
      if (!id) return state;
      const nextIndex = state.currentIndex + 1;
      return {
        ...state,
        placements: [
          ...state.placements,
          { id, n: action.bary.n, m: action.bary.m, p: action.bary.p },
        ],
        currentIndex: nextIndex,
        phase: nextIndex >= state.order.length ? 'summary' : 'playing',
      };
    }

    case 'reset':
      return freshState();

    default:
      return state;
  }
}

function init(): GameState {
  return loadState() ?? freshState();
}

export type PlacedOfficial = {
  official: Official;
  bary: Bary;
  order: number;
};

export function useGameState() {
  const [state, dispatch] = useReducer(reducer, undefined, init);

  useEffect(() => {
    if (state.phase === 'title' && state.placements.length === 0) {
      clearState();
    } else {
      saveState(state);
    }
  }, [state]);

  const newGame = useCallback(() => dispatch({ type: 'newGame' }), []);
  const reset = useCallback(() => dispatch({ type: 'reset' }), []);
  const place = useCallback((bary: Bary) => dispatch({ type: 'place', bary }), []);

  const currentOfficial = useMemo<Official | null>(() => {
    if (state.phase !== 'playing') return null;
    const id = state.order[state.currentIndex];
    return id ? OFFICIALS_BY_ID.get(id) ?? null : null;
  }, [state.phase, state.order, state.currentIndex]);

  const placed = useMemo<PlacedOfficial[]>(
    () =>
      state.placements.flatMap((pl, i) => {
        const official = OFFICIALS_BY_ID.get(pl.id);
        if (!official) return [];
        return [{ official, bary: { n: pl.n, m: pl.m, p: pl.p }, order: i + 1 }];
      }),
    [state.placements],
  );

  return {
    phase: state.phase,
    total: state.order.length,
    currentIndex: state.currentIndex,
    currentOfficial,
    placed,
    newGame,
    place,
    reset,
  };
}
