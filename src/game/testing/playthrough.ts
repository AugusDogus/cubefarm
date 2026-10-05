import { act, advance, capacity, hireCost, production, upgradeCost, type Action } from '../engine';
import { cultivars, facilities, genes, type CultivarId, type FacilityId, type GeneId, type UpgradeId } from '../catalog';
import { acquisitionCost, branchCost, branchStaff, cohortQuote } from '../expansion';
import { demand, marketingCost } from '../economy';
import { contracts, contractIds, rivalIds } from '../corporation';
import { visibleProjects } from '../projects';
import { pendingLetter } from '../story';
import { expectedOutput, sustainableIncome } from '../balance';
import { discovery } from '../discovery';
import { protocolIds, WORLD_WORKFLOWS, initialNetwork } from '../network';
import { GameSchema, initialState, type GameState } from '../state';
import { networkFixture } from './fixtures';
import { recordIntroductions, type Introduction } from './introductions';

/** A reproducible legal player. Decision intervals perturb the informed policy; they do not model human play. */
export function playthrough(path: 'stewardship' | 'extraction', seed = 7, visit?: (state: GameState) => void, networkStyle: 'staged' | 'growth' | 'survey' = 'staged', clearAt = 5000, decisionIntervalSeconds = 0) {
  if (!Number.isFinite(decisionIntervalSeconds) || decisionIntervalSeconds < 0) throw new Error('Decision interval must be a finite, nonnegative number of seconds.');
  let state = initialState(0), clicks = 0, interactions = 0;
  const actions: { type: string; action: Action; phase: string; seconds: number }[] = [];
  const milestones: { id: string; seconds: number }[] = [];
  const introductions: Introduction[] = [], seenIntroductions = new Set<string>();
  let networkStarted = false, clearance = false;
  let nextPriceReview = 0;
  let openingComplete = false, nextDecisionAt = 0;
  const transitions = [{ phase: 'office', seconds: 0, revenue: 0 }];
  let workspace = 'Office';
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const attempt = (action: Action) => {
    if (openingComplete && state.elapsed < nextDecisionAt) return false;
    const result = act(state, action, random);
    if (result.ok) {
      if (openingComplete) nextDecisionAt = state.elapsed + decisionIntervalSeconds;
      const nextWorkspace = actionWorkspace(action, result.state);
      if (nextWorkspace !== null && nextWorkspace !== workspace) { interactions++; workspace = nextWorkspace; }
      interactions += action.type === 'read-letter' && result.state.corporation.phase.id === 'network' ? 2 : action.type === 'staff' ? 4 : action.type === 'price' ? 2 : action.type === 'genome' ? new Set([...state.genome, ...action.genes]).size - state.genome.filter(g => action.genes.includes(g)).length : action.type === 'cohort' ? 3 : action.type === 'hire' && action.cultivar !== 'generalist' ? 2 : action.type === 'automation' ? 2 : 1;
      const previous = state.corporation.phase.id;
      state = result.state; clicks++; actions.push({ type: action.type, action, phase: state.corporation.phase.id, seconds: state.elapsed });
      recordIntroductions(state, introductions, seenIntroductions, action.type);
      if (previous !== state.corporation.phase.id) { transitions.push({ phase: state.corporation.phase.id, seconds: state.elapsed, revenue: state.revenue }); visit?.(state); }
      return true;
    }
    return false;
  };
  for (let form = 0; form < 28; form++) {
    if (!attempt({ type: 'process' })) throw new Error('Manual opening failed.');
    state = advance(state, 0.5, random);
    recordIntroductions(state, introductions, seenIntroductions, 'advance');
  }
  if (!attempt({ type: 'hire', cultivar: 'generalist' })) throw new Error('First automation was not earned.');
  milestones.push({ id: 'first-hire', seconds: state.elapsed });
  openingComplete = true;
  for (let tick = 0; tick < 3600; tick++) {
    const c = state.corporation;
    if (c.phase.id === 'network' && c.phase.network.completed >= WORLD_WORKFLOWS) {
      return { state, transitions, clicks, interactions, actions, milestones, introductions };
    }
    const letter = pendingLetter(state);
    if (letter === 'promise') attempt({ type: 'reply', letter, choice: path === 'stewardship' ? 'voice' : 'quota' });
    else if (letter === 'cultivation') attempt({ type: 'reply', letter, choice: path === 'stewardship' ? 'consent' : 'patent' });
    else if (letter) attempt({ type: 'read-letter', id: letter });
    const seen = discovery(state);
    for (const [id, ready] of [['business', seen.business], ['development', seen.development], ['genes', seen.genetics]] as const) if (ready && !milestones.some(m => m.id === id)) milestones.push({ id, seconds: state.elapsed });
    if (state.corporation.phase.id !== 'network') {
    if (c.crisis.status === 'pending') attempt({ type: 'crisis', choice: state.cash > 1000 ? 'invest' : 'wait' });
    if (c.blankForms < production(state) * 30 + 100 && !c.autoBuy) attempt({ type: 'supplies', packs: 4 });
    for (const id of visibleProjects(state)) {
      if (id === (path === 'stewardship' ? 'extraction' : 'stewardship')) continue;
      if (!state.corporation.projects.includes(id)) attempt({ type: 'project', id });
    }
    if (isNetwork(state)) continue;
    const policy = path === 'stewardship' ? 'humane' : 'lean';
    if (state.corporation.projects.includes('charter') && state.corporation.policy !== policy) attempt({ type: 'policy', policy });
    if (state.corporation.projects.includes('analytics') && !state.automation.memos) attempt({ type: 'automation', ...state.automation, memos: true });
    for (const id of rivalIds) {
      const target = c.phase.id === 'enterprise' ? 2 : 4;
      if (state.corporation.acquired.length < target && !state.corporation.acquired.includes(id) && state.cash > acquisitionCost(state, id)) attempt({ type: 'acquire', id });
    }
    const cultivarIds: readonly CultivarId[] = ['processor', 'specialist', 'executive'];
    for (const id of cultivarIds) if (!state.unlockedCultivars.includes(id) && state.cash > cultivars[id].research * 2) attempt({ type: 'research-cultivar', id });
    const geneIds: readonly GeneId[] = ['focus', 'endurance', 'precision', 'cognition', 'synthesis'];
    for (const id of geneIds) if (!state.genes.includes(id) && state.cash > genes[id].cost * 3) attempt({ type: 'research-gene', id });
    const profile = path === 'stewardship' ? ['focus', 'precision'] as const : ['cognition', 'synthesis'] as const;
    if (profile.every(g => state.genes.includes(g)) && profile.some(g => !state.genome.includes(g))) attempt({ type: 'genome', genes: [...profile] });
    const facilityIds: readonly FacilityId[] = ['coffee', 'snacks', 'cafeteria', 'gym', 'benefits'];
    for (const id of facilityIds) if (!state.facilities.includes(id) && state.cash > facilities[id].cost * (c.phase.id === 'office' ? 1.4 : 3)) attempt({ type: 'facility', id });
    const upgradeIds: readonly UpgradeId[] = ['equipment', 'training', 'quality'];
    for (const id of upgradeIds) if (state.upgrades[id] < (c.phase.id === 'office' ? 3 : 7) && state.cash > upgradeCost(state, id) * (c.phase.id === 'office' ? 1.5 : 4)) attempt({ type: 'upgrade', id });
    if (state.memo.status === 'ready' && state.cash > 250) attempt({ type: 'memo' });
    const best = state.unlockedCultivars.at(-1) ?? 'generalist';
    const desired = c.phase.id === 'office' ? 9 : 36;
    if (state.employees.length < desired) {
      if (state.employees.length === capacity(state) && state.cash > upgradeCost(state, 'capacity') * 3) attempt({ type: 'upgrade', id: 'capacity' });
      if (state.cash >= hireCost(state, best) * (c.phase.id === 'office' ? 1 : 3)) attempt({ type: 'hire', cultivar: best });
    }
    if (state.corporation.projects.includes('time-study')) {
      const researchers = Math.min(c.phase.id === 'office' ? 2 : 8, Math.max(1, Math.floor(state.employees.length / 4)));
      const sales = c.phase.id === 'office' ? 0 : 2, compliance = c.phase.id === 'office' ? 0 : path === 'extraction' ? 3 : 1;
      const desiredCounts = { research: researchers, sales, compliance };
      if (Object.entries(desiredCounts).some(([role, count]) => state.employees.filter(e => e.role === role).length !== count)) attempt({ type: 'staff', ...desiredCounts });
    }
    if (seen.business && state.elapsed >= nextPriceReview) {
      nextPriceReview = state.elapsed + 120;
      let bestPrice = state.corporation.price, bestIncome = sustainableIncome(state);
      for (let price = 0.25; price <= 5; price += 0.25) {
        const income = sustainableIncome({ ...state, corporation: { ...state.corporation, price } });
        if (income > bestIncome + 0.02) { bestPrice = price; bestIncome = income; }
      }
      if (bestPrice !== state.corporation.price) attempt({ type: 'price', value: bestPrice });
    }
    if (expectedOutput(state) > demand(state) * 0.8 && state.cash > marketingCost(state) * 2) attempt({ type: 'marketing' });
    if (c.phase.id !== 'network' && c.contract.status === 'idle' && c.contract.cooldown === 0) {
      const id = [...contractIds].reverse().find(id => contracts[id].forms / contracts[id].seconds < production(state) * 0.6 && state.revenue >= contracts[id].revenue);
      if (id && state.corporation.projects.includes('analytics')) {
        if (state.automation.contracts !== id) attempt({ type: 'automation', ...state.automation, contracts: id });
      } else if (id) attempt({ type: 'contract', id });
    }
    if (state.corporation.projects.includes('regional')) {
      if (c.branches.length < 3 && state.cash > branchCost(state) * 2) attempt({ type: 'branch' });
      for (const branch of state.corporation.branches) {
        const quote = cohortQuote(branch, best, state.cash);
        if (branchStaff(branch) < 100 && quote.count > 0 && state.cash > quote.cost * 3) attempt({ type: 'cohort', branch: branch.id, cultivar: best, count: quote.count });
      }
    }
    }
    if (state.corporation.phase.id === 'network') {
      for (const id of protocolIds) if (!state.corporation.phase.network.protocols.includes(id)) attempt({ type: 'protocol', id });
      const n = state.corporation.phase.network;
      if (!networkStarted && attempt({ type: 'network-plan', plan: networkStyle === 'survey' ? 'survey' : 'grow' })) networkStarted = true;
      if (n.protocols.includes('distributed') && n.infrastructure !== 'balanced') attempt({ type: 'network-building', policy: 'balanced' });
      if (networkStyle === 'staged' && !clearance && (n.nodes >= clearAt || n.undiscovered === 0) && attempt({ type: 'network-plan', plan: 'clear' })) clearance = true;
      if (networkStyle === 'staged' && n.undiscovered === 0 && n.allocation.discover > 0) attempt({ type: 'network-plan', plan: 'clear' });
    }
    state = advance(state, 10, random);
    recordIntroductions(state, introductions, seenIntroductions, 'advance');
    if (tick % 30 === 0) {
      const valid = GameSchema.safeParse(state);
      if (!valid.success) throw new Error(`Invalid state at ${state.elapsed}s: ${valid.error.message}`);
    }
  }
  throw new Error(`Run stuck at ${state.elapsed}s in ${state.corporation.phase.id}: cash ${state.cash}, revenue ${state.revenue}, insights ${state.corporation.insights}, influence ${state.corporation.influence}, projects ${state.corporation.projects.join(',')}`);
}

function isNetwork(state: GameState) { return state.corporation.phase.id === 'network'; }

/** Mechanical snapshot of a reported stalled run, without its personal workforce or save data. */
export function reportedStalledNetwork(): GameState {
  const state = networkFixture();
  return {
    ...state, cash: 1651417474.6735632,
    automation: { ...state.automation, reserve: 10000000 },
    corporation: { ...state.corporation, pressure: 0, phase: { id: 'network', network: {
      ...initialNetwork(),
      replicationCredit: 1000, nodes: 11.957416958625451, energy: 90513832.65168041, compute: 5635600, knowledge: 316.87642989701834,
      undiscovered: 999988629.6821127, discovered: 3728.0499808745594, completed: 7642.267906473269,
      plants: 75437, servers: 14089, allocation: { discover: 0, replicate: 0, process: 100, stabilize: 0 },
      protocols: ['efficient', 'distributed'], infrastructure: 'balanced', lost: 0.9986338442700377,
      powerUsed: 42269.393278350486, processedRate: 143.59670102927737, discoveredRate: 0, growthRate: -0.035899175257319345,
    } } },
  };
}

/** Legal recovery policy usable with a parsed save or the compact reported-run fixture. */
export function recoverNetwork(initial: GameState, seed = 7) {
  if (initial.corporation.phase.id !== 'network' || initial.paused) throw new Error('Network recovery requires an active Network state.');
  let state = initial, cleared = false;
  const actions: { action: Action; seconds: number }[] = [];
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const attempt = (action: Action) => {
    const result = act(state, action, random);
    if (!result.ok) return false;
    state = result.state;
    actions.push({ action, seconds: state.elapsed - initial.elapsed });
    return true;
  };
  if (!attempt({ type: 'network-plan', plan: 'grow' })) throw new Error('Network recovery could not apply the Grow plan.');
  for (let tick = 0; tick < 1440; tick++) {
    const phase = state.corporation.phase;
    if (phase.id !== 'network') throw new Error('Network recovery left its expected era.');
    if (phase.network.completed === WORLD_WORKFLOWS) return { state, actions, remainingSeconds: state.elapsed - initial.elapsed };
    for (const id of protocolIds) if (!phase.network.protocols.includes(id)) attempt({ type: 'protocol', id });
    if (phase.network.protocols.includes('distributed') && phase.network.infrastructure !== 'balanced') attempt({ type: 'network-building', policy: 'balanced' });
    if (!cleared && (phase.network.nodes >= 5000 || phase.network.undiscovered === 0) && attempt({ type: 'network-plan', plan: 'clear' })) cleared = true;
    if (phase.network.undiscovered === 0 && phase.network.allocation.discover > 0) attempt({ type: 'network-plan', plan: 'clear' });
    state = advance(state, 10, random);
  }
  throw new Error('Network recovery did not finish within four hours.');
}

function actionWorkspace(action: Action, state: GameState) {
  if (state.corporation.phase.id === 'network') return 'Network';
  if (['project', 'research-cultivar', 'research-gene', 'genome'].includes(action.type)) return 'Development';
  if (['automation', 'policy', 'acquire', 'crisis', 'branch', 'cohort'].includes(action.type)) return 'Company';
  if (['reply', 'read-letter'].includes(action.type)) return null;
  return 'Office';
}
