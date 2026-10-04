import type { GameState } from './state';
import type { Role } from './corporation';

export function outputModifier(state: GameState) {
  const c = state.corporation;
  return Math.max(0.5, 1 + (c.morale - 60) / 200 - c.pressure / 250)
    * (c.policy === 'lean' ? 1.25 : c.policy === 'humane' ? 0.9 : 1)
    * (c.projects.includes('extraction') ? 1.4 : c.projects.includes('stewardship') ? 0.95 : 1)
    * (c.crisis.status === 'effect' ? c.crisis.output : 1)
    * (state.story.promise === 'quota' ? 1.12 : 1)
    * (state.story.cultivation === 'patent' ? 1.1 : 1);
}
export function departmentBonus(state: GameState, role: Role) {
  const c = state.corporation;
  if (role === 'research') return (c.projects.includes('analytics') ? 2 : 1) * (c.projects.includes('stewardship') ? 1.5 : 1) * (1 + c.legacy.research * 0.1) * (state.story.promise === 'voice' ? 1.2 : 1) * (state.story.cultivation === 'consent' ? 1.2 : 1);
  if (role === 'sales') return c.projects.includes('extraction') ? 1.4 : 1;
  if (role === 'compliance') return c.projects.includes('legal') ? 2 : 1;
  return 1;
}
export function wageMultiplier(state: GameState) { return state.corporation.policy === 'humane' ? 1.2 : state.corporation.policy === 'lean' ? 0.8 : 1; }
