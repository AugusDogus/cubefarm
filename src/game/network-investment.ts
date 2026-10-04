import type { GameState } from './state';
import { protocolIds, protocols, WORLD_WORKFLOWS, type Network } from './network';
import { commissionNetwork, networkCommissionQuote } from './network-capital';
import { operatingReserve } from './automation';

/** Automatic investment protects the player's reserve; manual purchases use it too. */
export function investmentKnowledgeReserve(n: Network): number {
  if (n.capitalPolicy !== 'research-first') return n.knowledgeReserve;
  const available = protocolIds.filter(id => !n.protocols.includes(id) && protocols[id].requires.every(required => n.protocols.includes(required)));
  const nextCost = available.length > 0 ? Math.min(...available.map(id => protocols[id].cost)) : 0;
  return Math.max(n.knowledgeReserve, nextCost);
}

/** Standing instructions spend surplus resources, without recurring actions or logs. */
export function tickNetworkInvestment(state: GameState): GameState {
  const phase = state.corporation.phase;
  if (state.paused || phase.id !== 'network') return state;
  const n = phase.network;
  if (n.capitalPolicy === 'manual' || !n.protocols.includes('distributed') || n.completed >= WORLD_WORKFLOWS) return state;
  const cashBudget = Math.max(0, state.cash - operatingReserve(state));
  const knowledgeBudget = Math.max(0, n.knowledge - investmentKnowledgeReserve(n));
  const quote = networkCommissionQuote({ ...n, knowledge: knowledgeBudget }, cashBudget);
  if (quote.count === 0) return state;
  const result = commissionNetwork(n, quote.count, cashBudget);
  if (!result.ok) return state;
  return { ...state, cash: state.cash - result.cost.cash, corporation: { ...state.corporation, phase: { id: 'network', network: result.network } } };
}
