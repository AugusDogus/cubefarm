import { contracts } from './corporation';
import type { GameState } from './state';
import { record } from './log';

/** Retail is a benchmark, not an assumed sale or a payroll-adjusted profit. */
export function settleContractReceipt(state: GameState, status: 'completed' | 'expired' | 'canceled', forms: number, reward = 0, influence = 0, reputation = 0): GameState {
  const contract = state.corporation.contract;
  if (contract.status !== 'active') return state;
  return { ...state, corporation: { ...state.corporation, lastContract: { id: contract.id, status, forms, returned: status === 'completed' ? 0 : forms, reward, influence, reputation, retailValue: forms * state.corporation.price, settledAt: state.elapsed } } };
}

/** Forms enter escrow from real output; unused escrow is always returned on failure. */
export function routeContract(state: GameState, papers: number, dt: number): { state: GameState; retail: number } {
  const c = state.corporation, order = c.contract;
  if (order.status === 'idle') return { state: { ...state, corporation: { ...c, contract: { ...order, cooldown: Math.max(0, order.cooldown - dt) } } }, retail: papers };
  const terms = contracts[order.id];
  const delivered = Math.min(terms.forms - order.delivered, papers * (order.allocation === 'all' ? 1 : 0.5));
  const total = order.delivered + delivered;
  if (total >= terms.forms - 0.000001) {
    const reward = terms.reward * (1 + c.reputation / 500);
    const receipt = settleContractReceipt(state, 'completed', total, reward, terms.influence, Math.min(100, c.reputation + 3) - c.reputation);
    return { retail: papers - delivered, state: record({ ...receipt, cash: state.cash + reward, revenue: state.revenue + reward, corporation: { ...receipt.corporation, contract: { status: 'idle', cooldown: 60 }, influence: c.influence + terms.influence, reputation: Math.min(100, c.reputation + 3), completedContracts: c.completedContracts + 1 } }, `${terms.name} delivered. $${Math.round(reward)} and ${terms.influence} influence received.`) };
  }
  if (order.remaining <= dt) {
    const receipt = settleContractReceipt(state, 'expired', total, 0, 0, Math.max(0, c.reputation - 5) - c.reputation);
    return { retail: papers - delivered, state: record({ ...receipt, corporation: { ...receipt.corporation, inventory: c.inventory + total, contract: { status: 'idle', cooldown: 120 }, reputation: Math.max(0, c.reputation - 5), failedContracts: c.failedContracts + 1 } }, `${terms.name} expired. Escrowed forms returned to inventory. Reputation -5.`) };
  }
  return { retail: papers - delivered, state: { ...state, corporation: { ...c, contract: { ...order, delivered: total, remaining: order.remaining - dt } } } };
}
