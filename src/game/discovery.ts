import type { GameState } from './state';
import { cultivars, genes, type CultivarId, type GeneId, type FacilityId, type UpgradeId } from './catalog';
import { learningRemaining } from './learning';

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
export function memoVisible(state: GameState) {
  return state.memo.status !== 'ready' || state.upgrades.memo > 0 || state.revenue >= 400 && learningRemaining(state, 'first-hire', 450) === 0;
}
export function upgradeVisible(state: GameState, id: UpgradeId) {
  if (state.upgrades[id] > 0) return true;
  const gates: Record<UpgradeId, number> = { equipment: 60, training: 250, memo: 600, quality: 400, capacity: 500 };
  const windows: Record<UpgradeId, number> = { equipment: 0, training: 270, memo: 450, quality: 390, capacity: 0 };
  return state.revenue >= gates[id] && (windows[id] === 0 || learningRemaining(state, 'first-hire', windows[id]) === 0);
}
export function facilityVisible(state: GameState, id: FacilityId) {
  const gates: Record<FacilityId, number> = { coffee: 150, snacks: 250, cafeteria: 1200, gym: 3000, benefits: 6000 };
  const windows: Record<FacilityId, number> = { coffee: 150, snacks: 330, cafeteria: 600, gym: 780, benefits: 960 };
  return state.facilities.includes(id) || state.revenue >= gates[id] && learningRemaining(state, 'first-hire', windows[id]) === 0;
}
export function cultivarVisible(state: GameState, id: CultivarId) {
  const windows: Record<CultivarId, number> = { generalist: 0, processor: 210, specialist: 510, executive: 840 };
  return state.unlockedCultivars.includes(id) || state.revenue >= cultivars[id].unlock && learningRemaining(state, 'first-hire', windows[id]) === 0;
}
export function geneVisible(state: GameState, id: GeneId) {
  const window = id === 'cognition' ? 120 : id === 'synthesis' ? 240 : 0;
  return state.genes.includes(id) || discovery(state).genetics && state.revenue >= genes[id].unlock && genes[id].requires.every(gene => state.genes.includes(gene)) && learningRemaining(state, 'cultivation', window) === 0;
}
