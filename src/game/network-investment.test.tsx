import { expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { NetworkInvestment } from '../components/NetworkInvestment';
import { act, advance } from './engine';
import { GameSchema, parseGame, type GameState } from './state';
import { tickNetworkInvestment, investmentKnowledgeReserve } from './network-investment';
import { networkCommissionCost } from './network-capital';
import { operatingReserve } from './automation';
import { networkFixture, officeFixture, perform } from './testing/fixtures';
import { reportedStalledNetwork } from './testing/playthrough';

function ready(): GameState {
  let s = networkFixture();
  s = perform(s, { type: 'protocol', id: 'efficient' });
  const researched = perform(s, { type: 'protocol', id: 'distributed' });
  // Earn delegation through conserved simulation rather than bypassing its new gate.
  const experienced = advance(researched, 600, () => 0.99);
  if (experienced.corporation.phase.id !== 'network' || experienced.corporation.phase.network.completed < 10000) throw new Error('Network fixture did not earn standing instructions.');
  return experienced;
}

test('the reported run can commission offices immediately while paying cash and knowledge', () => {
  const s = reportedStalledNetwork();
  if (s.corporation.phase.id !== 'network') throw new Error('Expected a reported Network.');
  const n = s.corporation.phase.network, snapshot = structuredClone(s), cost = networkCommissionCost(n, 10);
  const result = act(s, { type: 'network-commission', count: 10 });
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.message);
  const phase = result.state.corporation.phase;
  if (phase.id !== 'network') throw new Error('Commissioning changed the era.');
  expect(result.state.cash).toBe(s.cash - cost.cash);
  expect(phase.network.nodes).toBe(n.nodes + 10);
  expect(phase.network.knowledge).toBe(n.knowledge - cost.knowledge);
  expect(phase.network.allocation).toEqual(n.allocation);
  expect(phase.network.undiscovered + phase.network.discovered + phase.network.completed).toBeCloseTo(1e9);
  expect(GameSchema.safeParse(result.state).success).toBe(true);
  expect(s).toEqual(snapshot);
});

test('manual commissioning preserves reserves and invalid or unaffordable actions are atomic', () => {
  const s = reportedStalledNetwork();
  const protectedState = perform(s, { type: 'network-knowledge-reserve', value: 300 });
  expect(act(protectedState, { type: 'network-commission', count: 10 }).ok).toBe(false);
  for (const count of [0, -1, 1.5, 1001, Infinity, NaN]) expect(act(s, { type: 'network-commission', count }).ok).toBe(false);
  expect(act({ ...s, cash: operatingReserve(s) }, { type: 'network-commission', count: 1 }).ok).toBe(false);
  expect(act(officeFixture(), { type: 'network-commission', count: 1 }).ok).toBe(false);
  expect(act(networkFixture(), { type: 'network-routing', routing: 'parallel' }).ok).toBe(false);
});

test('standing investment preserves research and operating reserves without recurring clicks', () => {
  const s = ready();
  if (s.corporation.phase.id !== 'network') throw new Error('Expected Network.');
  const funded = { ...s, corporation: { ...s.corporation, phase: { ...s.corporation.phase, network: { ...s.corporation.phase.network, knowledge: 3000, knowledgeReserve: 100 } } } };
  const research = perform(funded, { type: 'network-investment', policy: 'research-first' });
  const careful = tickNetworkInvestment(research);
  if (careful.corporation.phase.id !== 'network') throw new Error('Investment changed era.');
  expect(investmentKnowledgeReserve(careful.corporation.phase.network)).toBe(2500);
  expect(careful.corporation.phase.network.knowledge).toBeGreaterThanOrEqual(2500);
  expect(careful.corporation.phase.network.nodes).toBeGreaterThan(funded.corporation.phase.network.nodes);
  expect(careful.cash).toBeGreaterThanOrEqual(operatingReserve(research));
  expect(tickNetworkInvestment(funded)).toEqual(funded);
  expect(tickNetworkInvestment({ ...research, paused: true })).toEqual({ ...research, paused: true });
  const protectedState = perform(research, { type: 'network-knowledge-reserve', value: 2900 });
  const protectedTick = tickNetworkInvestment(protectedState);
  if (protectedTick.corporation.phase.id !== 'network') throw new Error('Investment changed era.');
  expect(protectedTick.corporation.phase.network.knowledge).toBeGreaterThanOrEqual(2900);
});

test('old saves default new mechanics off and new preferences survive a valid round trip', () => {
  const original = ready();
  if (original.corporation.phase.id !== 'network') throw new Error('Expected Network.');
  const { commissioned: _commissioned, computeRouting: _routing, computeSpentRate: _compute, knowledgeReserve: _reserve, knowledgeSpentRate: _spent, capitalPolicy: _policy, ...oldNetwork } = original.corporation.phase.network;
  const parsed = parseGame({ ...original, corporation: { ...original.corporation, phase: { id: 'network', network: oldNetwork } } });
  expect(parsed.success).toBe(true);
  if (!parsed.success || parsed.data.corporation.phase.id !== 'network') throw new Error('Historical save did not parse.');
  expect(parsed.data.corporation.phase.network.capitalPolicy).toBe('manual');
  expect(parsed.data.corporation.phase.network.computeRouting).toBe('standard');
  expect(parsed.data.corporation.phase.network.knowledgeReserve).toBe(0);
  const configured = perform(perform(perform(original, { type: 'network-routing', routing: 'parallel' }), { type: 'network-investment', policy: 'research-first' }), { type: 'network-knowledge-reserve', value: 2500 });
  expect(GameSchema.parse(JSON.parse(JSON.stringify(configured)))).toEqual(configured);
  for (const value of [NaN, Infinity, -1, Number.MAX_VALUE]) expect(act(original, { type: 'network-knowledge-reserve', value }).ok).toBe(false);
  expect(GameSchema.safeParse(advance(configured, 60, () => 0.99)).success).toBe(true);
});

test('capital controls reveal costs before selection and explain blocked launches', () => {
  const render = (state: GameState) => renderToStaticMarkup(<NetworkInvestment state={state} dispatch={() => undefined} />);
  expect(render(networkFixture())).toBe('');
  const funded = reportedStalledNetwork();
  const html = render(funded);
  expect(html).toContain('Launch 10, $255,625.00 + 255.625 knowledge');
  expect(html).toContain('Cash above reserve');
  expect(html).toContain('Knowledge above reserve');
  expect(html).toContain('Each extra cleared workflow uses 0.5 compute and 0.1 knowledge');
  expect(html).toContain('Compute spent / s');
  expect(html).not.toContain('Extra compute / s');
  expect(html).not.toContain('Expansion first');
  const protectedState = perform(funded, { type: 'network-knowledge-reserve', value: 300 });
  expect(render(protectedState)).toContain('Knowledge is insufficient.');
  expect(render(protectedState)).toContain('Next office needs $25,000.00 and 25.000 knowledge above reserves.');
  expect(render({ ...funded, cash: 0 })).toContain('Cash is insufficient.');
});
