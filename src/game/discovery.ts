import type { GameState } from './state';
import type { FacilityId, UpgradeId } from './catalog';

/** Revenue and hire history keep learned controls visible after bankruptcy. */
export function discovery(state: GameState) {
  const c = state.corporation;
  return {
    hiring: state.revenue >= 10 || state.nextId > 1,
    business: state.revenue >= 60 || c.projects.length > 0,
    development: state.revenue >= 100 || c.projects.length > 0,
    workforce: state.nextId > 1,
    departments: c.projects.includes('time-study'),
    company: c.projects.includes('charter'),
    genetics: c.projects.includes('cultivation') || state.genes.length > 0,
    delegation: c.projects.includes('analytics'),
  };
}
export function upgradeVisible(state: GameState, id: UpgradeId) {
  if (state.upgrades[id] > 0) return true;
  const gates: Record<UpgradeId, number> = { equipment: 60, training: 250, memo: 600, quality: 400, capacity: 500 };
  return state.revenue >= gates[id];
}
export function facilityVisible(state: GameState, id: FacilityId) {
  const gates: Record<FacilityId, number> = { coffee: 150, snacks: 250, cafeteria: 1200, gym: 3000, benefits: 6000 };
  return state.facilities.includes(id) || state.revenue >= gates[id];
}
