import { tickTender } from './tender';
import type { GameState } from './state';
import { departmentBonus, wageMultiplier } from './conditions';
import { branchProduction, maintenance, totalEmployees, payroll } from './expansion';
import { routeContract } from './contracts';
import { tickCrisis } from './events';
import { tickNetwork } from './network';
import { tickInfrastructure } from './infrastructure';

export type DepartmentOutput = { operations: number; research: number; sales: number; compliance: number };
export function supplyCost(state: GameState, packs = 1) { return packs * (state.corporation.projects.includes('logistics') ? 10 : 20); }
export function marketingCost(state: GameState) { return Math.ceil(150 * 1.7 ** state.corporation.marketing); }
export function demand(state: GameState) {
  const c = state.corporation;
  const sales = state.employees.filter(e => e.role === 'sales').reduce((sum, e) => sum + (e.cultivar === 'executive' ? 8 : e.cultivar === 'specialist' ? 3 : 1.5), 0);
  return (6 + sales * 5) * 1.6 ** c.marketing * (1.25 / c.price) ** 1.8 * (0.5 + c.reputation / 100)
    * (1 + c.acquired.length * 1.5 + c.branches.length) * (c.projects.includes('centralization') ? 2 : 1) * (c.projects.includes('continental') ? 4 : 1) * (c.crisis.status === 'effect' ? c.crisis.demand : 1);
}
export function estimatedIncome(state: GameState, output: number) {
  const c = state.corporation;
  const supplied = Math.min(output, c.blankForms + (c.autoBuy && state.cash >= supplyCost(state) ? Math.floor(state.cash / supplyCost(state)) * 250 : 0));
  const retail = c.contract.status === 'active' ? supplied * (c.contract.allocation === 'all' ? 0 : 0.5) : supplied;
  return Math.min(demand(state), retail + c.inventory) * c.price - payroll(state) * wageMultiplier(state) - maintenance(state) - supplied / 250 * supplyCost(state);
}
export function tickEconomy(state: GameState, dt: number, output: DepartmentOutput): GameState {
  let next = state;
  let c = next.corporation;
  const potential = output.operations + branchProduction(state) * dt;
  if (c.autoBuy && c.blankForms < potential + 250 && state.cash >= supplyCost(state)) {
    const buffer = Math.max(state.automation.reserve, payroll(state) * wageMultiplier(state) * 30);
    // One recovery pack can be bought below the reserve only when production is stopped.
    const budget = c.blankForms < potential || c.blankForms < 1 ? Math.max(supplyCost(state), next.cash - buffer) : Math.max(0, next.cash - buffer);
    const packs = Math.min(Math.ceil((potential + 500 - c.blankForms) / 250), Math.floor(budget / supplyCost(state)), Math.floor(next.cash / supplyCost(state)));
    const cost = supplyCost(state, packs);
    next = { ...next, cash: next.cash - cost, corporation: { ...c, blankForms: c.blankForms + packs * 250, supplySpent: c.supplySpent + cost } };
    c = next.corporation;
  }
  const papers = Math.min(c.blankForms, potential);
  next = { ...next, paperwork: next.paperwork + papers, corporation: { ...c, blankForms: c.blankForms - papers } };
  const routed = routeContract(next, papers, dt);
  next = routed.state; c = next.corporation;
  const inventory = c.inventory + routed.retail;
  const sold = Math.min(inventory, demand(next) * dt);
  const salesRevenue = sold * c.price;
  const emergencyReserve = c.blankForms < 1 && papers === 0 ? Math.min(next.cash, c.emergencyReserve) : 0;
  const due = payroll(state) * wageMultiplier(state) * dt;
  const wage = Math.min(Math.max(0, next.cash + salesRevenue - emergencyReserve), due);
  const upkeep = Math.min(Math.max(0, next.cash + salesRevenue - wage - emergencyReserve), maintenance(state) * dt);
  const researched = c.projects.includes('time-study');
  const research = (output.research * 0.12 + (researched ? (0.03 + 8 / 30) * dt : 0)) * departmentBonus(state, 'research') * (c.crisis.status === 'effect' ? c.crisis.research : 1);
  const compliance = output.compliance * 0.04 * departmentBonus(state, 'compliance');
  const branchInsights = c.projects.includes('coordination') ? totalEmployees(state) * 0.005 * dt : 0;
  const pressure = Math.max(0, Math.min(100, c.pressure + ((c.policy === 'lean' ? 0.035 : c.policy === 'humane' ? -0.02 : -0.005) + (c.projects.includes('extraction') ? 0.025 : c.projects.includes('stewardship') ? -0.02 : 0) + (state.story.promise === 'quota' ? 0.012 : 0) + (state.story.cultivation === 'patent' ? 0.015 : 0)) * dt - compliance));
  const incentives = state.facilities.reduce((sum, id) => sum + ({ coffee: 2, snacks: 3, cafeteria: 8, gym: 5, benefits: 12 })[id], 0);
  const moraleTarget = Math.min(100, 60 + incentives + c.legacy.welfare * 2 + (state.story.promise === 'voice' ? 8 : 0) + (c.projects.includes('stewardship') ? 15 : c.projects.includes('extraction') ? -12 : 0) + (c.policy === 'humane' ? 12 : c.policy === 'lean' ? -18 : 0) - pressure / 5 - (wage < due - 0.000001 ? 30 : 0));
  const morale = Math.max(0, Math.min(100, c.morale + (moraleTarget - c.morale) * (c.projects.includes('coordination') ? 0.01 : 0.005) * dt));
  next = { ...next, cash: next.cash + salesRevenue - wage - upkeep, revenue: next.revenue + salesRevenue, wages: next.wages + wage, corporation: {
    ...c, emergencyReserve, inventory: inventory - sold, insights: c.insights + research + branchInsights,
    influence: c.influence + (output.sales * 0.02 * departmentBonus(state, 'sales') + (c.phase.id !== 'office' ? (0.015 + c.acquired.length * 0.005) * dt : 0)) * (c.projects.includes('continental') ? 1.5 : 1),
    pressure, morale, reputation: Math.min(100, c.reputation + (c.projects.includes('standards') ? 0.005 : 0) * dt), reviewCooldown: Math.max(0, c.reviewCooldown - dt),
    soldRate: sold / dt, outputRate: papers / dt, payrollRate: wage / dt, maintenanceSpent: c.maintenanceSpent + upkeep,
  } };
  if (next.corporation.phase.id === 'network') {
    next = tickInfrastructure(next);
    if (next.corporation.phase.id !== 'network') return next;
    const result = tickNetwork(next.corporation.phase.network, dt, pressure);
    next = { ...next, cash: next.cash + result.revenue, revenue: next.revenue + result.revenue, corporation: { ...next.corporation, phase: { id: 'network', network: result.network } } };
  }
  return tickTender(tickCrisis(next, dt), dt);
}
