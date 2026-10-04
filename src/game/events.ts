import { eventIds, eventNames, type EventId } from './corporation';
import type { GameState } from './state';
import { record } from './log';
import { phaseOrder } from './projects';

export type CrisisChoice = 'invest' | 'exploit' | 'wait';
type Response = { label: string; morale: number; reputation: number; pressure: number; output: number; demand: number; research: number; insights: number; influence: number };
const invest: Response = { label: 'Invest responsibly', morale: 12, reputation: 5, pressure: -15, output: 1.15, demand: 1, research: 1, insights: 0, influence: 0 };
const exploit: Response = { label: 'Prioritize the quarter', morale: -15, reputation: -4, pressure: 18, output: 1.5, demand: 1, research: 1, insights: 0, influence: 0 };
const wait: Response = { label: 'Continue as usual', morale: -2, reputation: -1, pressure: 2, output: 0.9, demand: 1, research: 1, insights: 0, influence: 0 };
export const eventResponses: Record<EventId, Record<CrisisChoice, Response>> = {
  audit: { invest: { ...invest, label: 'Commission an independent audit', pressure: -30, output: 1.05 }, exploit: { ...exploit, label: 'Reclassify the evidence', output: 1.2, pressure: 30, influence: 5 }, wait: { ...wait, label: 'Comply without legal support', pressure: 8 } },
  outage: { invest: { ...invest, label: 'Replace the filing system', output: 1.3, research: 1.2 }, exploit: { ...exploit, label: 'Work through the outage', output: 1.6, morale: -20 }, wait: { ...wait, label: 'Wait for the system to recover', output: 0.6 } },
  petition: { invest: { ...invest, label: 'Grant paid leave', morale: 22, reputation: 8, output: 0.95 }, exploit: { ...exploit, label: 'Make attendance mandatory', morale: -25, output: 1.4 }, wait: { ...wait, label: 'Postpone the meeting', morale: -8, output: 0.85 } },
  'price-war': { invest: { ...invest, label: 'Defend the brand', output: 1, demand: 1.8, influence: 8 }, exploit: { ...exploit, label: 'Promise impossible turnaround', output: 1.35, demand: 2.2, pressure: 25 }, wait: { ...wait, label: 'Keep current prices', output: 1, demand: 0.6 } },
  recruiter: { invest: { ...invest, label: 'Offer retention benefits', morale: 20, output: 1.1, pressure: -5 }, exploit: { ...exploit, label: 'Enforce non-compete agreements', influence: 10, output: 1.2, reputation: -8 }, wait: { ...wait, label: 'Let the offer circulate', morale: -10, output: 0.8 } },
  innovation: { invest: { ...invest, label: 'Share ownership of the invention', insights: 100, research: 2, output: 1.2 }, exploit: { ...exploit, label: 'Claim the invention for management', output: 1.6, research: 0.6, morale: -25, insights: 30 }, wait: { ...wait, label: 'File it for later', output: 1, research: 0.75 } },
};
export const eventDescriptions: Record<EventId, string> = {
  audit: 'The regulator wants evidence that your productivity targets are achievable.',
  outage: 'The filing system has stopped responding. Every department has a different explanation.',
  petition: 'Employees have requested paid time away from their cubicles.',
  'price-war': 'A rival is undercutting your prices. Customers are reconsidering their paperwork supplier.',
  recruiter: 'A rival recruiter is offering your employees something called work-life balance.',
  innovation: 'An employee has invented a more efficient workflow and wants a share of the savings.',
};
export function responseDescription(r: Response) {
  const signed = (n: number) => `${n > 0 ? '+' : ''}${n}`;
  const effects = [`${signed(r.morale)} morale`, `${signed(r.reputation)} reputation`, `${signed(r.pressure)} pressure`];
  if (r.output !== 1) effects.push(`${signed(Math.round((r.output - 1) * 100))}% output for 90s`);
  if (r.demand !== 1) effects.push(`${signed(Math.round((r.demand - 1) * 100))}% demand for 90s`);
  if (r.research !== 1) effects.push(`${signed(Math.round((r.research - 1) * 100))}% research for 90s`);
  if (r.insights) effects.push(`+${r.insights} insights`);
  if (r.influence) effects.push(`+${r.influence} influence`);
  return `${effects.join(', ')}.`;
}
export function crisisCost(state: GameState) { return Math.ceil(100 * (1 + phaseOrder[state.corporation.phase.id]) + state.employees.length * 8); }
export function resolveCrisis(state: GameState, choice: CrisisChoice): GameState {
  const c = state.corporation, crisis = c.crisis;
  if (crisis.status !== 'pending') return state;
  const response = eventResponses[crisis.id][choice];
  const bounded = (n: number) => Math.max(0, Math.min(100, n));
  return record({ ...state, cash: state.cash - (choice === 'invest' ? crisisCost(state) : 0), corporation: {
    ...c, morale: bounded(c.morale + response.morale), reputation: bounded(c.reputation + response.reputation), pressure: bounded(c.pressure + response.pressure),
    insights: c.insights + response.insights, influence: c.influence + response.influence,
    crisis: { status: 'effect', id: crisis.id, remaining: 90, output: response.output, demand: response.demand, research: response.research },
  } }, `${eventNames[crisis.id]}: ${response.label.toLowerCase()}. Temporary effects last 90 seconds.`);
}
export function tickCrisis(state: GameState, dt: number): GameState {
  const c = state.corporation;
  if (c.phase.id === 'office' || c.phase.id === 'ending' || c.phase.id === 'network') return state;
  const crisis = c.crisis;
  if (crisis.status === 'pending') return state;
  if (crisis.remaining > dt) return { ...state, corporation: { ...c, crisis: { ...crisis, remaining: crisis.remaining - dt } } };
  if (crisis.status === 'effect') return { ...state, corporation: { ...c, crisis: { status: 'calm', remaining: 240 } } };
  const id = eventIds[Math.floor(state.elapsed / 300) % eventIds.length] ?? 'audit';
  return record({ ...state, corporation: { ...c, crisis: { status: 'pending', id, remaining: 60 } } }, `${eventNames[id]}. The decision will wait for you at the company desk.`);
}
