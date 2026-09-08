import { OFFICIALS, OFFICIALS_BY_ID } from '../data/officials';

export type Phase = 'title' | 'playing' | 'summary';

export type Placement = {
  id: string;
  /** barycentric weights, each 0..1, summing to 1 */
  n: number;
  m: number;
  p: number;
};

export type GameState = {
  version: 1;
  phase: Phase;
  /** official ids in presentation order (shuffled once per new game) */
  order: string[];
  currentIndex: number;
  placements: Placement[];
};

const KEY = 'dtom:v1';

export function freshState(): GameState {
  return {
    version: 1,
    phase: 'title',
    order: OFFICIALS.map((o) => o.id),
    currentIndex: 0,
    placements: [],
  };
}

function isFiniteWeight(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v) && v >= -1e-6 && v <= 1 + 1e-6;
}

/** Load a saved game, or null if nothing valid is stored. */
export function loadState(): GameState | null {
  let raw: string | null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return null;
  }
  if (!raw) return null;

  try {
    const data = JSON.parse(raw) as Partial<GameState>;
    if (data.version !== 1) return null;
    if (data.phase !== 'title' && data.phase !== 'playing' && data.phase !== 'summary') {
      return null;
    }
    if (!Array.isArray(data.order) || data.order.length !== OFFICIALS.length) {
      return null;
    }
    if (!data.order.every((id) => typeof id === 'string' && OFFICIALS_BY_ID.has(id))) {
      return null;
    }
    if (new Set(data.order).size !== data.order.length) return null;

    if (typeof data.currentIndex !== 'number' || data.currentIndex < 0) return null;
    if (data.currentIndex > data.order.length) return null;

    if (!Array.isArray(data.placements)) return null;
    const placements: Placement[] = [];
    for (const pl of data.placements) {
      if (
        !pl ||
        typeof pl.id !== 'string' ||
        !OFFICIALS_BY_ID.has(pl.id) ||
        !isFiniteWeight(pl.n) ||
        !isFiniteWeight(pl.m) ||
        !isFiniteWeight(pl.p)
      ) {
        return null;
      }
      placements.push({ id: pl.id, n: pl.n, m: pl.m, p: pl.p });
    }

    return {
      version: 1,
      phase: data.phase,
      order: [...data.order],
      currentIndex: data.currentIndex,
      placements,
    };
  } catch {
    return null;
  }
}

export function saveState(state: GameState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage full or blocked — game still works in-session */
  }
}

export function clearState(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
