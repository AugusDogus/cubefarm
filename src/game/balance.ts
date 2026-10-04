import type { GameState } from './state';
import { employeeRate, risks } from './workforce';
import { branchProduction, payroll, maintenance } from './expansion';
import { wageMultiplier } from './conditions';
import { demand, supplyCost } from './economy';

export function expectedOutput(state: GameState) {
  return state.employees.filter(e => e.role === 'operations').reduce((sum, e) => {
    const risk = risks(state, e);
    const uptime = 7.5 / (7.5 + Math.min(1, risk.slack + risk.breaks + risk.bugs) * 4.5);
    return sum + employeeRate(state, e) * uptime;
  }, 0) + branchProduction(state);
}
export function sustainableIncome(state: GameState) {
  const output = expectedOutput(state);
  return Math.min(output, demand(state)) * state.corporation.price - output / 250 * supplyCost(state) - payroll(state) * wageMultiplier(state) - maintenance(state);
}
/** A retail estimate, excluding contracts and the value of departmental work. */
export function memoRetailReturn(state: GameState) {
  const boosted: GameState = { ...state, memo: { status: 'active', remaining: 90 } };
  const output = expectedOutput(state), extra = expectedOutput(boosted) - output;
  const unmet = Math.max(0, demand(state) - output - state.corporation.inventory / 90);
  return (Math.min(extra, unmet) * state.corporation.price - extra / 250 * supplyCost(state)) * 90 - 20;
}
export function marginalPurchase(state: GameState, improved: GameState, cost: number) {
  const output = expectedOutput(improved) - expectedOutput(state);
  const income = sustainableIncome(improved) - sustainableIncome(state);
  return { output, income, payback: income > 0.00001 ? cost / income : null };
}
export function purchaseHint(state: GameState, improved: GameState, cost: number) {
  const gain = marginalPurchase(state, improved, cost);
  if (gain.income <= 0) return expectedOutput(state) >= demand(state) ? 'Sales limit this purchase’s return. Expand demand first. Morale recovery is excluded.' : 'No positive cash return at current prices and operating costs. Morale recovery is excluded.';
  const seconds = gain.payback;
  return `Est. +$${gain.income.toFixed(2)}/s; ${seconds === null ? '' : seconds < 60 ? `${Math.ceil(seconds)}s` : `${Math.ceil(seconds / 60)}min`} payback. Assumes supplies; excludes morale recovery.`;
}
