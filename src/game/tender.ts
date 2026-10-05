import type { GameState } from './state';
import type { Outcome } from './engine';
import { operatingReserve } from './automation';
import { record } from './log';
import { learningRemaining } from './learning';
import { protocolIds, protocols } from './network';
import { TENDER_RESOLUTION_SECONDS, TENDER_COOLDOWN_SECONDS, approachIds, clientIds, clients, approaches, tenderStakeCap, tenderResearchCost, researchCost, researchReward, quoteFor, equalReward, zeroReward, type Tender, type TenderAction, type TenderBrief, type ApproachId, type TenderQuote, type TenderReward, type TenderReceipt } from './tender-state';
export * from './tender-state';

export function tenderAvailable(state: GameState): boolean {
  return state.corporation.projects.includes('charter') && state.corporation.phase.id !== 'office' && state.corporation.phase.id !== 'ending'
    && (state.corporation.tender.sequence > 0 || learningRemaining(state, 'charter', 90) === 0);
}
export function tenderBlocker(state: GameState): string | null {
  if (tenderAvailable(state)) return null;
  const remaining = learningRemaining(state, 'charter', 90);
  return state.corporation.phase.id === 'enterprise' && remaining !== null && remaining > 0
    ? `The contract desk is establishing operations. Competitive tenders open in ${remaining} operating seconds.`
    : 'Competitive tenders open after the Enterprise charter and close when the company story ends.';
}
export function tenderStakeLimit(state: GameState, brief: TenderBrief): number {
  const budget = tenderResearchBudget(state, brief);
  let low = 0, high = Math.max(0, Math.min(tenderStakeCap(brief), Math.floor(state.cash - operatingReserve(state))));
  // Compare the exact debit instead of dividing rounded resource balances.
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (researchCost(tenderResearchCost(brief, middle)) <= budget.available) low = middle;
    else high = middle - 1;
  }
  return low;
}
export function tenderResearchBudget(state: GameState, brief: TenderBrief): { kind: 'insights' | 'knowledge'; available: number; reserve: number } {
  if (brief.tier !== 'network') return { kind: 'insights', available: state.corporation.insights, reserve: 0 };
  const phase = state.corporation.phase;
  if (phase.id !== 'network') return { kind: 'knowledge', available: 0, reserve: 0 };
  const reserve = phase.network.knowledgeReserve;
  return { kind: 'knowledge', available: Math.max(0, phase.network.knowledge - reserve), reserve };
}
export function tenderNextProcedure(state: GameState): { name: string; cost: number } | null {
  const phase = state.corporation.phase;
  if (phase.id !== 'network') return null;
  const owned = phase.network.protocols;
  const next = protocolIds.filter(id => !owned.includes(id) && protocols[id].requires.every(required => owned.includes(required))).sort((a, b) => protocols[a].cost - protocols[b].cost)[0];
  return next ? { name: protocols[next].name, cost: protocols[next].cost } : null;
}

export function tenderQuote(state: GameState, brief: TenderBrief, approach: ApproachId, stake: number): TenderQuote | null {
  if (!approachIds.includes(approach) || !Number.isInteger(stake) || stake < 1 || stake > tenderStakeLimit(state, brief)) return null;
  return quoteFor(brief, approach, stake);
}
function randomSample(random: () => number): number | null {
  const value = random();
  return Number.isFinite(value) && value >= 0 && value < 1 ? value : null;
}
function nextBrief(state: GameState, sequence: number, random: () => number): TenderBrief | null {
  const clientRoll = randomSample(random), dominantRoll = randomSample(random), priorityRoll = randomSample(random), secondaryRoll = randomSample(random);
  if (clientRoll === null || dominantRoll === null || priorityRoll === null || secondaryRoll === null) return null;
  const index = Math.floor(clientRoll * 3), dominant = Math.floor(dominantRoll * 3), primary = 60 + Math.floor(priorityRoll * 21);
  const secondary = 10 + Math.floor(secondaryRoll * (81 - primary));
  const third = 100 - primary - secondary;
  const client = clientIds[index] ?? 'records';
  const weights = dominant === 0 ? { quality: primary, speed: secondary, scope: third } : dominant === 1 ? { quality: third, speed: primary, scope: secondary } : { quality: secondary, speed: third, scope: primary };
  const phase = state.corporation.phase.id;
  return { sequence, client, tier: phase === 'network' ? 'network' : phase === 'conglomerate' ? 'conglomerate' : 'enterprise', weights };
}
const fail = (message: string): Outcome => ({ ok: false, message });
function updateTender(state: GameState, tender: Tender): GameState { return { ...state, corporation: { ...state.corporation, tender } }; }
function rewardFits(state: GameState, quote: TenderQuote): boolean {
  const c = state.corporation, reward = quote.reward;
  return state.cash <= Number.MAX_SAFE_INTEGER - quote.gross && (reward.kind === 'enterprise' ? c.insights <= Number.MAX_SAFE_INTEGER - reward.insights && c.influence <= Number.MAX_SAFE_INTEGER - reward.influence : c.phase.id === 'network' && c.phase.network.knowledge <= Number.MAX_SAFE_INTEGER - reward.knowledge);
}
export function actTender(state: GameState, action: TenderAction, random: () => number = Math.random): Outcome {
  const blocker = tenderBlocker(state);
  if (blocker) return fail(blocker);
  const t = state.corporation.tender, s = t.stage;
  if (action.type === 'tender-draw') {
    if (s.status !== 'idle' && s.status !== 'settled') return fail('The current brief remains available. Submit or decline it before reading another.');
    if (s.cooldown > 0) return fail(`The next client brief arrives in ${Math.ceil(s.cooldown)} seconds.`);
    if (t.sequence >= Number.MAX_SAFE_INTEGER) return fail('The tender cycle limit has been reached. Other company systems remain available.');
    const brief = nextBrief(state, t.sequence + 1, random);
    if (!brief) return fail('The client brief could not be generated. No funds were spent; try again.');
    return { ok: true, state: updateTender(state, { ...t, sequence: brief.sequence, stage: { status: 'brief', brief } }) };
  }
  if (s.status !== 'brief') return fail('Read a client brief before submitting or declining a bid.');
  if (action.type === 'tender-decline') return { ok: true, state: updateTender(state, { ...t, stage: { status: 'idle', cooldown: TENDER_COOLDOWN_SECONDS } }) };
  const quote = tenderQuote(state, s.brief, action.approach, action.stake);
  if (!quote) return fail(`Choose whole-dollar exposure from $1 to $${tenderStakeLimit(state, s.brief)} within both cash and research budgets. Payroll, operating cash, and your explicit knowledge reserve remain protected.`);
  if (!rewardFits(state, quote)) return fail('This reward would exceed a resource storage limit. Reduce the exposure before submitting.');
  const roll = randomSample(random);
  if (roll === null) return fail('The tender could not be submitted. No funds were spent; try again.');
  const cost = quote.researchCost, c = state.corporation;
  const phase = cost.kind === 'knowledge' && c.phase.id === 'network' ? { ...c.phase, network: { ...c.phase.network, knowledge: c.phase.network.knowledge - cost.amount } } : c.phase;
  const funded = { ...state, cash: state.cash - action.stake, corporation: { ...c, phase, insights: cost.kind === 'insights' ? c.insights - cost.amount : c.insights } };
  return { ok: true, state: record(updateTender(funded, { ...t, stage: { status: 'resolving', brief: s.brief, approach: action.approach, stake: action.stake, quote, remaining: TENDER_RESOLUTION_SECONDS, roll } }), `${clients[s.brief.client].name}: ${approaches[action.approach].name} bid submitted. Maximum loss $${action.stake} plus ${researchCost(cost)} ${cost.kind === 'none' ? 'research' : cost.kind}.`) };
}

/** Committed outcomes are sampled once, before saving. Offline settlement never rerolls. */
export function tickTender(state: GameState, dt: number, _random: () => number = Math.random): GameState {
  if (state.paused || !Number.isFinite(dt) || dt <= 0) return state;
  const t = state.corporation.tender, s = t.stage;
  if (s.status === 'brief') return state;
  if (s.status === 'idle' || s.status === 'settled') return s.cooldown === 0 ? state : updateTender(state, { ...t, stage: { ...s, cooldown: Math.max(0, s.cooldown - dt) } });
  if (dt < s.remaining) return updateTender(state, { ...t, stage: { ...s, remaining: s.remaining - dt } });
  return settleTender(state, Math.max(0, dt - s.remaining));
}

/** Close a submitted bid before an era transition, without advancing simulation clocks. */
export function settlePendingTender(state: GameState): GameState {
  return state.corporation.tender.stage.status === 'resolving' ? settleTender(state, 0) : state;
}

function settleTender(state: GameState, cooldownElapsed: number): GameState {
  const t = state.corporation.tender, s = t.stage;
  if (s.status !== 'resolving') return state;
  const c = state.corporation;
  const won = s.roll < s.quote.chance, promisedGross = won ? s.quote.gross : 0, promisedReward = won ? s.quote.reward : zeroReward(s.quote.reward);
  const gross = Math.min(promisedGross, Number.MAX_SAFE_INTEGER - state.cash);
  const reward: TenderReward = promisedReward.kind === 'enterprise' ? { kind: 'enterprise', insights: Math.min(promisedReward.insights, Number.MAX_SAFE_INTEGER - c.insights), influence: Math.min(promisedReward.influence, Number.MAX_SAFE_INTEGER - c.influence) } : { kind: 'network', knowledge: c.phase.id === 'network' ? Math.min(promisedReward.knowledge, Number.MAX_SAFE_INTEGER - c.phase.network.knowledge) : 0 };
  const receipt: TenderReceipt = { brief: s.brief, approach: s.approach, stake: s.stake, quote: s.quote, roll: s.roll, won, gross, net: gross - s.stake, reward, researchCost: s.quote.researchCost, netResearch: researchReward(reward) - researchCost(s.quote.researchCost), limited: gross < promisedGross || !equalReward(reward, promisedReward) };
  const phase = reward.kind === 'network' && c.phase.id === 'network' ? { ...c.phase, network: { ...c.phase.network, knowledge: c.phase.network.knowledge + reward.knowledge } } : c.phase;
  const next = updateTender({ ...state, cash: state.cash + gross, corporation: { ...c, phase, insights: reward.kind === 'enterprise' ? c.insights + reward.insights : c.insights, influence: reward.kind === 'enterprise' ? c.influence + reward.influence : c.influence } }, { ...t, stage: { status: 'settled', cooldown: Math.max(0, TENDER_COOLDOWN_SECONDS - cooldownElapsed) }, lastReceipt: receipt });
  return record(next, `${clients[s.brief.client].name}: ${won ? 'bid awarded' : 'bid declined'}. $${gross.toFixed(2)} returned; net ${receipt.net < 0 ? '-' : '+'}$${Math.abs(receipt.net).toFixed(2)}. Receipt retained at the tender desk.`);
}
