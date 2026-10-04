import { cultivars, type CultivarId } from './catalog';
import type { GameState } from './state';
import { rivals, type Cohort, type RivalId } from './corporation';
import { outputModifier } from './conditions';
import { risks, climate, memoBoost } from './workforce';
import { geneEffects } from './genome';

export function totalEmployees(state: GameState) { return state.employees.length + state.corporation.legacyStaff.reduce((sum, c) => sum + c.count, 0) + state.corporation.branches.reduce((sum, b) => sum + branchStaff(b), 0); }
export type Branch = GameState['corporation']['branches'][number];
export function branchStaff(branch: Branch) { return branch.cohorts.reduce((sum, c) => sum + c.count, 0); }
export function branchCost(state: GameState) { return Math.ceil(6000 * 1.65 ** state.corporation.branches.length); }
export function branchUpgradeCost(branch: Branch) { return Math.ceil(5000 * 1.7 ** branch.level); }
export function cohortCost(branch: Branch, cultivar: CultivarId, count: number) {
  const growth = 1.02 ** (1 / 20);
  return Math.ceil(cultivars[cultivar].price * 1.02 ** (branchStaff(branch) / 20) * (growth ** count - 1) / (growth - 1));
}
export function cohortQuote(branch: Branch, cultivar: CultivarId, cash: number) {
  let low = 0, high = branch.level * 100 - branchStaff(branch);
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (cohortCost(branch, cultivar, middle) <= cash) low = middle; else high = middle - 1;
  }
  return { count: low, cost: cohortCost(branch, cultivar, low) };
}
export function branchExpansionQuote(branch: Branch, cash: number) {
  let count = 0, cost = 0;
  while (branch.level + count < 8) {
    const next = branchUpgradeCost({ ...branch, level: branch.level + count });
    if (cost + next > cash) break;
    cost += next; count++;
  }
  return { count, cost };
}
export function cohortReplacementQuote(branch: Branch, index: number, cultivar: CultivarId) {
  const group = branch.cohorts[index];
  if (!group) return null;
  const emptied = { ...branch, cohorts: branch.cohorts.filter((_, i) => i !== index) };
  const refund = Math.floor(group.hiredCost * 0.4), cost = cohortCost(emptied, cultivar, group.count);
  return { count: group.count, refund, cost, net: cost - refund };
}
export function rivalRevenue(state: GameState, id: RivalId) { return rivals[id].revenue + (state.corporation.acquired.includes(id) ? 0 : state.elapsed * rivals[id].growth); }
export function acquisitionCost(state: GameState, id: RivalId) { return Math.ceil(rivals[id].cost + state.elapsed * rivals[id].growth * 0.15); }
export function cohortRate(state: GameState, cohort: Cohort) {
  const c = state.corporation;
  const risk = risks(state, cohort);
  const uptime = 7.5 / (7.5 + (risk.slack + risk.breaks + risk.bugs) * 4.5);
  return cohort.count * cultivars[cohort.cultivar].rate * uptime * climate(state).productivity * (1 + state.upgrades.equipment * (c.projects.includes('centralization') ? 0.3 : 0.2))
    * geneEffects(cohort.genes).output
    * (state.memo.status === 'active' ? 1 + memoBoost(state) : 1) * outputModifier(state);
}
export function branchProduction(state: GameState) {
  const c = state.corporation;
  const branchMultiplier = (c.projects.includes('franchise') ? 3 : 1) * (c.projects.includes('infrastructure') ? 2 : 1);
  return c.legacyStaff.reduce((sum, cohort) => sum + cohortRate(state, cohort), 0) + c.branches.reduce((sum, b) => sum + b.cohorts.reduce((n, cohort) => n + cohortRate(state, cohort) * branchMultiplier, 0), 0);
}
export function maintenance(state: GameState) { return state.corporation.branches.reduce((sum, b) => sum + b.level * 0.5, 0); }
export function payroll(state: GameState) {
  const c = state.corporation;
  return 0.09 * (state.employees.reduce((sum, e) => sum + geneEffects(e.genes).wages, 0)
    + c.legacyStaff.reduce((sum, g) => sum + g.count * geneEffects(g.genes).wages, 0)
    + c.branches.reduce((sum, b) => sum + b.cohorts.reduce((n, g) => n + g.count * geneEffects(g.genes).wages, 0), 0));
}
