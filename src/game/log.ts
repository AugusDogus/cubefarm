import type { GameState } from './state';
export function record(state: GameState, message: string): GameState {
  return { ...state, log: [{ id: (state.log[0]?.id ?? 0) + 1, time: state.elapsed, message }, ...state.log].slice(0, 30) };
}
