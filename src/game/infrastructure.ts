import type { GameState } from './state';
import { assetCost, assetQuote, infrastructureNeed, NODE_GROWTH, COORDINATION_SCALE } from './network';
import { operatingReserve } from './automation';
import { tickNetworkInvestment } from './network-investment';

/** Delegated building buys only forecast needs, never spends the operating buffer. */
export function tickInfrastructure(state: GameState): GameState {
  state = tickNetworkInvestment(state);
  const phase = state.corporation.phase;
  if (phase.id !== 'network' || phase.network.infrastructure !== 'balanced') return state;
  let n = phase.network, cash = state.cash;
  const potentialGrowth = n.nodes * n.allocation.replicate / 100 * NODE_GROWTH / (1 + n.nodes / COORDINATION_SCALE) * 60;
  const supportedGrowth = n.replicationCredit + n.processedRate / 250 * 60;
  const projected = n.nodes + Math.min(potentialGrowth, supportedGrowth);
  const needs = infrastructureNeed({ ...n, nodes: projected });
  for (const asset of ['servers', 'plants'] as const) {
    const quote = assetQuote(n, asset, Math.max(0, cash - operatingReserve(state)), needs[asset]);
    if (quote.count === 0) continue;
    cash -= assetCost(n, asset, quote.count);
    n = { ...n, [asset]: n[asset] + quote.count };
  }
  return { ...state, cash, corporation: { ...state.corporation, phase: { id: 'network', network: n } } };
}
