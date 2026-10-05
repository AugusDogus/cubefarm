import type { GameState } from './state';
import { contracts } from './corporation';
import { supplyCost } from './economy';
import { branchProduction, payroll, maintenance } from './expansion';
import { employeeRate } from './workforce';
import { wageMultiplier } from './conditions';
import { expectedOutput, memoRetailReturn } from './balance';
import { memoVisible } from './discovery';

export type AutomationStatus =
  | { status: 'off'; message: string }
  | { status: 'blocked'; message: string; cashShortfall: number }
  | { status: 'ready'; message: string };

export function operatingReserve(state: GameState) {
  return Math.max(state.automation.reserve, payroll(state) * wageMultiplier(state) * 30 + supplyCost(state) * 2);
}

function blocked(message: string, cashShortfall = 0): AutomationStatus {
  return { status: 'blocked', message, cashShortfall };
}

function availability(state: GameState): AutomationStatus | null {
  if (state.paused) return blocked('Paused. Resume the company to run standing instructions.');
  if (!state.corporation.projects.includes('analytics')) return blocked('Research Analytics to delegate routine work.');
  if (state.corporation.phase.id === 'network' || state.corporation.phase.id === 'ending') return blocked('Archived with headquarters. Standing instructions no longer run.');
  return null;
}

function contractFunding(state: GameState, forms: number, share: number) {
  const output = state.employees.filter(e => e.role === 'operations').reduce((sum, e) => sum + employeeRate(state, e) * 0.75, 0) + branchProduction(state);
  const neededForms = forms / share;
  const supplyBudget = Math.ceil(Math.max(0, neededForms - state.corporation.blankForms) / 250) * supplyCost(state);
  const deliverySeconds = output > 0 ? forms / (output * share) : Infinity;
  const payrollBudget = (payroll(state) * wageMultiplier(state) + maintenance(state)) * deliverySeconds;
  return { output, neededForms, budget: supplyBudget + payrollBudget };
}

/** Shares the actual renewal guard with its explanation in the standing desk. */
export function contractAutomationStatus(state: GameState): AutomationStatus {
  const id = state.automation.contracts, c = state.corporation;
  if (id === 'off') return { status: 'off', message: 'Automatic orders are off.' };
  const unavailable = availability(state);
  if (unavailable) return unavailable;
  if (c.contract.status === 'active') return blocked('Waiting for the active order to settle.');
  if (c.contract.cooldown > 0) return blocked(`Waiting for the ${Math.ceil(c.contract.cooldown)}s order cooldown.`);
  const terms = contracts[id], share = state.automation.allocation === 'all' ? 1 : 0.5;
  if (state.revenue < terms.revenue) return blocked('Earn the required lifetime revenue before renewing this order.');
  const funding = contractFunding(state, terms.forms, share);
  if (funding.output * share * terms.seconds < terms.forms * 1.2) return blocked(share === 0.5 ? 'Output is below the 20% delivery margin. Increase operations output or allocate 100%.' : 'Output is below the 20% delivery margin at 100% allocation. Increase operations output.');
  if (!c.autoBuy && c.blankForms < funding.neededForms) return blocked('Not enough blank forms. Buy supplies or enable automatic procurement.');
  const cashShortfall = Math.max(0, operatingReserve(state) + funding.budget - state.cash);
  // Escrow cannot finance its own production before the final payment.
  if (cashShortfall > 0) return blocked('Waiting for cash to fund supplies, payroll, maintenance, and reserves.', cashShortfall);
  return { status: 'ready', message: `Ready to renew at ${share * 100}% output on the next simulation step.` };
}

export function memoAutomationStatus(state: GameState): AutomationStatus {
  if (!state.automation.memos) return { status: 'off', message: 'Automatic memos are off.' };
  const unavailable = availability(state);
  if (unavailable) return unavailable;
  if (!memoVisible(state)) return blocked('The office is observing the workflow before introducing memos.');
  if (state.memo.status !== 'ready') return blocked(state.memo.status === 'active' ? 'The current memo is still in effect.' : 'Waiting for the memo cooldown.');
  const c = state.corporation, contract = c.contract;
  const supportsOrder = contract.status === 'active' && contracts[contract.id].forms - contract.delivered > expectedOutput(state) * (contract.allocation === 'all' ? 1 : 0.5);
  const supportsDepartment = state.employees.some(e => e.role === 'research' || e.role === 'sales' || e.role === 'compliance' && c.pressure > 0);
  if (contract.status === 'active') {
    const funding = contractFunding(state, contracts[contract.id].forms - contract.delivered, contract.allocation === 'all' ? 1 : 0.5);
    if (funding.output === 0) return blocked('The active order has no operations output. Assign operations before funding another memo.');
    if (!c.autoBuy && c.blankForms < funding.neededForms) return blocked('Preserving funds for the active order. Replenish its blank forms first.');
    const missing = Math.max(0, operatingReserve(state) + funding.budget + 20 - state.cash);
    if (missing > 0) return blocked('Preserving the active order supply and payroll budget before buying a memo.', missing);
  }
  const cashShortfall = Math.max(0, operatingReserve(state) + 20 - state.cash);
  if (cashShortfall > 0) return blocked('Waiting for the memo fee above the operating reserve.', cashShortfall);
  if (supportsOrder || supportsDepartment) return { status: 'ready', message: supportsOrder ? 'Ready to support the active order.' : 'Ready to support research, sales, or compliance.' };
  if (memoRetailReturn(state) <= 0) return blocked('Retail sales would not repay this memo. Expand demand or assign departments.');
  const memoForms = expectedOutput({ ...state, memo: { status: 'active', remaining: 90 } }) * 90;
  const supplyBudget = Math.ceil(Math.max(0, memoForms - c.blankForms) / 250) * supplyCost(state);
  if (c.blankForms < memoForms) {
    if (!c.autoBuy) return blocked('The retail boost needs more blank forms. Buy supplies or enable automatic procurement.');
    const missing = Math.max(0, operatingReserve(state) + 20 + supplyBudget - state.cash);
    if (missing > 0) return blocked('Waiting for supplies and the memo fee above the operating reserve.', missing);
  }
  return { status: 'ready', message: 'Ready. Forecast retail receipts cover the memo and extra supplies.' };
}
