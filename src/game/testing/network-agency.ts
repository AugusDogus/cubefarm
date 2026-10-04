import { advance, type Action } from '../engine';
import { protocolIds, protocols, WORLD_WORKFLOWS, tickNetwork, computeRoutingIds, type ComputeRouting, type Network, type CapitalPolicy } from '../network';
import { networkCommissionCost } from '../network-capital';
import type { GameState } from '../state';
import { perform } from './fixtures';
import { playthrough } from './playthrough';

export type AgencyPolicy = { capital: CapitalPolicy; routing: 'standard' | 'adaptive' };
export const agencyPolicies: readonly AgencyPolicy[] = [
  { capital: 'manual', routing: 'standard' },
  { capital: 'research-first', routing: 'standard' },
  { capital: 'research-first', routing: 'adaptive' },
];

/** Captures a legal fresh run, rather than injecting resources or projects. */
export function legalNetworkEntry(seed = 7, path: 'stewardship' | 'extraction' = 'stewardship'): GameState {
  let entry: GameState | undefined;
  playthrough(path, seed, state => {
    if (state.corporation.phase.id === 'network') entry = state;
  });
  if (entry === undefined) throw new Error('Legal player did not record a Network transition.');
  return entry;
}

/** Formula-informed comparison, with procedures and phase changes but no maintenance. */
export function compareNetworkAgency(initial: GameState, policy: AgencyPolicy, visit?: (state: GameState) => void, decisionIntervalSeconds = 0) {
  if (!Number.isFinite(decisionIntervalSeconds) || decisionIntervalSeconds < 0) throw new Error('Decision interval must be finite and nonnegative.');
  const initialPhase = initial.corporation.phase;
  if (initialPhase.id !== 'network' || initial.paused) throw new Error('Agency comparison requires an active Network state.');
  let state = initial, clearing = false, firstProcedure: number | null = null, knowledgeSpent = 0, nextRoutingReview = 0, nextDecisionAt = initial.elapsed;
  const actions: { action: Action; seconds: number }[] = [];
  const authorize = (action: Action) => {
    if (state.elapsed < nextDecisionAt) return false;
    state = perform(state, action);
    actions.push({ action, seconds: state.elapsed - initial.elapsed });
    nextDecisionAt = state.elapsed + decisionIntervalSeconds;
    return true;
  };
  authorize({ type: 'network-plan', plan: 'grow' });
  for (let second = 0; second <= 4 * 3600; second++) {
    visit?.(state);
    const phase = state.corporation.phase;
    if (phase.id !== 'network') throw new Error('Agency comparison unexpectedly left Network.');
    if (phase.network.completed >= WORLD_WORKFLOWS) {
      const commissioned = phase.network.commissioned - initialPhase.network.commissioned;
      const cost = networkCommissionCost(initialPhase.network, commissioned);
      return {
        state, actions, interactions: actions.reduce((count, { action }) => count + (action.type === 'network-investment' || action.type === 'network-building' ? 2 : 1), 0), seconds: state.elapsed - initial.elapsed, firstProcedure,
        commissioned, commissionCash: cost.cash, commissionKnowledge: cost.knowledge, knowledgeSpent,
        switches: actions.filter(({ action }) => action.type === 'network-plan' || action.type === 'network-routing').length,
        setup: actions.filter(({ action }) => action.type === 'network-investment' || action.type === 'network-building').length,
        maintenance: actions.filter(({ action }) => ['network-commission', 'network-asset', 'supplies', 'memo', 'review', 'staff'].includes(action.type)).length,
      };
    }
    for (const id of protocolIds) {
      const current = state.corporation.phase;
      if (current.id !== 'network') throw new Error('Procedure authorization changed the era.');
      const procedure = protocols[id];
      if (current.network.protocols.includes(id) || current.network.knowledge < procedure.cost || !procedure.requires.every(required => current.network.protocols.includes(required))) continue;
      const authorized = authorize({ type: 'protocol', id });
      if (authorized && !['efficient', 'distributed'].includes(id) && firstProcedure === null) firstProcedure = state.elapsed - initial.elapsed;
    }
    const configured = state.corporation.phase;
    if (configured.id !== 'network') throw new Error('Agency configuration requires Network.');
    if (configured.network.protocols.includes('distributed')) {
      if (configured.network.completed >= 10000 && configured.network.infrastructure !== 'balanced') authorize({ type: 'network-building', policy: 'balanced' });
      if ((configured.network.completed >= 10000 || policy.capital === 'manual') && configured.network.capitalPolicy !== policy.capital) authorize({ type: 'network-investment', policy: policy.capital });
      if (policy.routing === 'standard' && configured.network.computeRouting !== 'standard') authorize({ type: 'network-routing', routing: 'standard' });
      if (policy.routing === 'adaptive' && state.elapsed >= nextRoutingReview) {
        nextRoutingReview = state.elapsed + 60;
        const routing = informedAgencyRouting(state);
        if (configured.network.computeRouting !== routing) authorize({ type: 'network-routing', routing });
      }
    }
    const current = state.corporation.phase;
    if (current.id !== 'network') throw new Error('Allocation comparison requires Network.');
    if (!clearing && (current.network.nodes >= 5000 || current.network.undiscovered === 0)) {
      clearing = authorize({ type: 'network-plan', plan: 'clear' });
    } else if (current.network.undiscovered === 0 && current.network.allocation.discover > 0) {
      if (authorize({ type: 'network-plan', plan: 'clear' })) nextRoutingReview = state.elapsed;
    }
    if (second === 4 * 3600) break;
    state = advance(state, 1, () => 0.99);
    const advanced = state.corporation.phase;
    if (advanced.id === 'network') knowledgeSpent += advanced.network.knowledgeSpentRate;
  }
  throw new Error('Agency comparison did not finish within the original four-hour ceiling.');
}

/** A player-facing sixty-second pipeline comparison, with 20% hysteresis.
 * Uses current resource buffers and actual routing losses, not hidden future income.
 * It is a test player, never a production autoplay policy.
 */
export function routingForecast(n: Network, pressure: number, routing: ComputeRouting) {
  let forecast = { ...n, computeRouting: routing };
  let horizon = 0;
  while (horizon < 60 && forecast.completed < WORLD_WORKFLOWS) {
    forecast = tickNetwork(forecast, 1, pressure).network;
    horizon++;
  }
  const discovery = (n.undiscovered - forecast.undiscovered) / Math.max(1, horizon);
  const processing = (forecast.completed - n.completed) / Math.max(1, horizon);
  const discoveryTime = n.undiscovered === 0 ? 0 : discovery > 0 ? n.undiscovered / discovery : Infinity;
  const processTime = WORLD_WORKFLOWS - n.completed === 0 ? 0 : processing > 0 ? (WORLD_WORKFLOWS - n.completed) / processing : Infinity;
  return { routing, discovery, processing, knowledge: forecast.knowledge - n.knowledge, duration: Math.max(discoveryTime, processTime) };
}

type RouteForecast = { routing: ComputeRouting; duration: number; knowledge: number };

function chooseRouting(n: Network, forecasts: readonly RouteForecast[]): ComputeRouting {
  const standard = forecasts.find(forecast => forecast.routing === 'standard');
  const current = forecasts.find(forecast => forecast.routing === n.computeRouting);
  if (standard === undefined || current === undefined) throw new Error('Routing catalog is incomplete.');
  const candidates = forecasts.filter(forecast => (forecast.routing !== 'parallel' || n.discovered > n.undiscovered * 2) && (n.protocols.includes('singularity') || forecast.knowledge >= standard.knowledge * 0.9));
  const best = candidates.reduce((winner, forecast) => forecast.duration < winner.duration ? forecast : winner, standard);
  // Reject a now-unsafe research or backlog policy even when its throughput remains high.
  if (!candidates.includes(current)) return best.routing;
  return best.duration < current.duration * 0.8 ? best.routing : n.computeRouting;
}

export function informedRouting(n: Network, pressure: number): ComputeRouting {
  return chooseRouting(n, computeRoutingIds.map(routing => routingForecast(n, pressure, routing)));
}

/** Includes existing funded delegation, since spare server capacity changes after routing. */
function informedAgencyRouting(state: GameState): ComputeRouting {
  const phase = state.corporation.phase;
  if (phase.id !== 'network') throw new Error('Routing comparison requires Network.');
  const n = phase.network;
  const forecasts = computeRoutingIds.map(routing => {
    let future = perform(state, { type: 'network-routing', routing }), horizon = 0;
    while (horizon < 60 && future.corporation.phase.id === 'network' && future.corporation.phase.network.completed < WORLD_WORKFLOWS) {
      future = advance(future, 1, () => 0.99);
      horizon++;
    }
    if (future.corporation.phase.id !== 'network') throw new Error('Routing forecast unexpectedly changed era.');
    const result = future.corporation.phase.network;
    const discover = (n.undiscovered - result.undiscovered) / Math.max(1, horizon);
    const process = (result.completed - n.completed) / Math.max(1, horizon);
    const duration = Math.max(n.undiscovered === 0 ? 0 : discover > 0 ? n.undiscovered / discover : Infinity, process > 0 ? (WORLD_WORKFLOWS - n.completed) / process : Infinity);
    return { routing, duration, knowledge: result.knowledge - n.knowledge };
  });
  return chooseRouting(n, forecasts);
}
