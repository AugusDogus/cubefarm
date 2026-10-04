import type { Network } from './network';

export const COMMISSION_BATCH_LIMIT = 1000;
export const COMMISSION_LIFETIME_LIMIT = 1000000;
export type CommissionCost = { cash: number; knowledge: number };
export type CommissionQuote = CommissionCost & { count: number };
export type CommissionResult =
  | { ok: true; network: Network; cost: CommissionCost }
  | { ok: false; reason: 'invalid-count' | 'launch-limit' | 'node-limit' | 'cash' | 'knowledge' };

// Launches buy offices immediately rather than improving natural replication.
// Lifetime installations set the price, so losing offices cannot reset it.
// Summing the linear per-office curve makes one batch cost exactly the same
// as the same sequence of smaller batches.
export function networkCommissionCost(n: Network, count: number): CommissionCost {
  const installationUnits = count * 200 + count * n.commissioned + count * (count - 1) / 2;
  return { cash: installationUnits * 125, knowledge: installationUnits / 8 };
}

export function networkCommissionQuote(n: Network, cashBudget: number, limit = COMMISSION_BATCH_LIMIT): CommissionQuote {
  if (!Number.isFinite(cashBudget) || cashBudget < 0 || !Number.isFinite(limit) || limit < 1) return { count: 0, cash: 0, knowledge: 0 };
  let low = 0;
  let high = Math.min(Math.floor(limit), COMMISSION_BATCH_LIMIT, COMMISSION_LIFETIME_LIMIT - n.commissioned, Math.floor(Number.MAX_SAFE_INTEGER - n.nodes));
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    const cost = networkCommissionCost(n, middle);
    if (cost.cash <= cashBudget && cost.knowledge <= n.knowledge) low = middle;
    else high = middle - 1;
  }
  return { count: low, ...networkCommissionCost(n, low) };
}

// cashBudget is already net of the company's operating reserve. The caller
// subtracts cost.cash from its treasury only after this atomic result succeeds.
export function commissionNetwork(n: Network, count: number, cashBudget: number): CommissionResult {
  if (!Number.isInteger(count) || count < 1 || count > COMMISSION_BATCH_LIMIT) return { ok: false, reason: 'invalid-count' };
  if (n.commissioned + count > COMMISSION_LIFETIME_LIMIT) return { ok: false, reason: 'launch-limit' };
  if (n.nodes + count > Number.MAX_SAFE_INTEGER) return { ok: false, reason: 'node-limit' };
  const cost = networkCommissionCost(n, count);
  if (!Number.isFinite(cashBudget) || cashBudget < cost.cash) return { ok: false, reason: 'cash' };
  if (n.knowledge < cost.knowledge) return { ok: false, reason: 'knowledge' };
  return {
    ok: true,
    cost,
    network: { ...n, coordinationLoad: Math.min(1, n.coordinationLoad + count / 1000 * 0.4), nodes: n.nodes + count, commissioned: n.commissioned + count, knowledge: n.knowledge - cost.knowledge },
  };
}
