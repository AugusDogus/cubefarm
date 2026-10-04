import type { GameState } from './state';
import { contracts } from './corporation';
import { record } from './log';
import { contractAutomationStatus, memoAutomationStatus } from './automation-status';

export { operatingReserve } from './automation-status';

/** Routine actions use the same costs and escrow as manual actions, with a buffer. */
export function tickAutomation(state: GameState): GameState {
  let next = state;
  const id = state.automation.contracts;
  if (id !== 'off' && contractAutomationStatus(state).status === 'ready') {
    const terms = contracts[id];
    next = record({ ...next, corporation: { ...next.corporation, contract: { status: 'active', id, delivered: 0, remaining: terms.seconds, allocation: state.automation.allocation } } }, `${terms.name} renewed by the contract desk.`);
  }
  if (memoAutomationStatus(next).status === 'ready') {
    next = { ...next, cash: next.cash - 20, memo: { status: 'active', remaining: 90 } };
  }
  return next;
}
