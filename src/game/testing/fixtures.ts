import { act, type Action } from '../engine';
import { initialState, type GameState } from '../state';

export function perform(state: GameState, action: Action): GameState {
  const result = act(state, action, () => 0.99);
  if (!result.ok) throw new Error(result.message);
  return result.state;
}
/** Nonempty fixtures for accounting and migration tests, not progression tests. */
export function officeFixture(): GameState {
  return perform({ ...initialState(0), cash: 1000, revenue: 150 }, { type: 'hire', cultivar: 'generalist', count: 3 });
}
export function enterpriseFixture(): GameState {
  let s = { ...officeFixture(), cash: 100000, revenue: 100000 };
  s = perform(s, { type: 'hire', cultivar: 'generalist', count: 3 });
  s = perform(s, { type: 'project', id: 'time-study' });
  s = { ...s, corporation: { ...s.corporation, insights: 20000, influence: 10000 } };
  for (const id of ['procurement', 'standards'] as const) s = perform(s, { type: 'project', id });
  s = perform(s, { type: 'reply', letter: 'promise', choice: 'voice' });
  s = perform(s, { type: 'project', id: 'charter' });
  return { ...s, corporation: { ...s.corporation, morale: 68 } };
}
export function labFixture(): GameState {
  let s = perform(enterpriseFixture(), { type: 'project', id: 'analytics' });
  s = perform(s, { type: 'reply', letter: 'cultivation', choice: 'consent' });
  return perform(s, { type: 'project', id: 'cultivation' });
}
export function conglomerateFixture(): GameState {
  let s = labFixture();
  for (const id of ['legal', 'stewardship', 'centralization', 'mergers'] as const) s = perform(s, { type: 'project', id });
  for (const id of ['forms', 'desk'] as const) s = perform(s, { type: 'acquire', id });
  return perform(s, { type: 'project', id: 'regional' });
}
export function networkFixture(): GameState {
  let s = { ...conglomerateFixture(), cash: 10000000, revenue: 10000000 };
  for (const id of ['franchise', 'continental', 'coordination', 'infrastructure'] as const) s = perform(s, { type: 'project', id });
  for (const id of ['memo', 'synergy'] as const) s = perform(s, { type: 'acquire', id });
  for (let i = 0; i < 3; i++) s = perform(s, { type: 'branch' });
  return perform(s, { type: 'project', id: 'sovereign' });
}
