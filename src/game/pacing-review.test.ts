import { expect, test } from 'bun:test';
import { GameSchema } from './state';
import { WORLD_WORKFLOWS, protocols } from './network';
import { advance } from './engine';
import { perform } from './testing/fixtures';
import { playthrough, recoverNetwork, reportedStalledNetwork } from './testing/playthrough';

test('default pacing policy preserves the unthrottled benchmark', () => {
  const baseline = playthrough('stewardship', 7);
  const explicit = playthrough('stewardship', 7, undefined, 'staged', 5000, 0);
  expect(explicit.actions).toEqual(baseline.actions);
  expect(explicit.state).toEqual(baseline.state);
});

test('the reported process-only allocation exhausts its backlog; Grow restores discovery and replication', () => {
  const original = reportedStalledNetwork();
  expect(GameSchema.safeParse(original).success).toBe(true);
  const waiting = advance(original, 200, () => 0.99);
  const growing = advance(perform(original, { type: 'network-plan', plan: 'grow' }), 200, () => 0.99);
  const before = original.corporation.phase, stopped = waiting.corporation.phase, restored = growing.corporation.phase;
  if (before.id !== 'network' || stopped.id !== 'network' || restored.id !== 'network') throw new Error('Reported allocation fixture left the Network.');
  expect(stopped.network.discovered).toBe(0);
  expect(stopped.network.processedRate).toBe(0);
  expect(stopped.network.discoveredRate).toBe(0);
  expect(stopped.network.undiscovered).toBe(before.network.undiscovered);
  expect(stopped.network.nodes).toBeLessThan(before.network.nodes);
  expect(stopped.network.knowledge).toBeLessThan(protocols.mapping.cost);
  expect(restored.network.nodes).toBeGreaterThan(before.network.nodes);
  expect(restored.network.discoveredRate).toBeGreaterThan(0);
  expect(restored.network.knowledge).toBeGreaterThan(stopped.network.knowledge);
  expect(restored.network.lost).toBe(before.network.lost);
});

test('the reported stalled Network can recover and finish with legal allocation and protocol actions', () => {
  const original = reportedStalledNetwork(), run = recoverNetwork(original);
  expect(run.remainingSeconds).toBeLessThan(4 * 3600);
  expect(run.remainingSeconds).toBeLessThanOrEqual(20 * 60);
  expect(run.actions.find(action => action.action.type === 'protocol')?.seconds ?? Infinity).toBeLessThanOrEqual(5 * 60);
  expect(GameSchema.safeParse(run.state).success).toBe(true);
  const phase = run.state.corporation.phase, before = original.corporation.phase;
  if (phase.id !== 'network' || before.id !== 'network') throw new Error('Reported recovery did not finish in the Network.');
  expect(phase.network.completed).toBe(WORLD_WORKFLOWS);
  expect(phase.network.lost).toBe(before.network.lost);
  expect(run.actions.flatMap(action => action.action.type === 'protocol' ? [action.action.id] : [])).toEqual(['mapping', 'compression', 'resilience', 'singularity']);
  expect(run.actions.some(action => action.action.type === 'network-asset')).toBe(false);
  expect(original.corporation.phase.id === 'network' && original.corporation.phase.network.allocation.process).toBe(100);
});

test('mechanical Network cadence is measured separately from letters on both paths', () => {
  for (const path of ['stewardship', 'extraction'] as const) for (const seed of [7, 42, 101]) {
    const run = playthrough(path, seed);
    const entry = run.transitions.find(transition => transition.phase === 'network')?.seconds;
    if (entry === undefined) throw new Error('Network entry missing.');
    const protocolTimes = run.actions.filter(action => action.phase === 'network' && action.action.type === 'protocol' && !['efficient', 'distributed'].includes(action.action.id) && action.seconds > entry).map(action => action.seconds);
    expect((protocolTimes[0] ?? Infinity) - entry).toBeLessThanOrEqual(300);
    const cadence = [entry, ...protocolTimes, run.state.elapsed];
    expect(Math.max(...cadence.slice(1).map((time, index) => time - (cadence[index] ?? 0)))).toBeLessThanOrEqual(600);
  }
});

test('a slower informed player finishes within the original four-hour ceiling', () => {
  const run = playthrough('stewardship', 7, undefined, 'staged', 5000, 60);
  expect(run.state.elapsed).toBeLessThan(4 * 3600);
  expect(run.state.manualPapers).toBe(28);
  expect(run.transitions.map(t => t.phase)).toEqual(['office', 'enterprise', 'conglomerate', 'network']);
  expect(GameSchema.safeParse(run.state).success).toBe(true);
  const phase = run.state.corporation.phase;
  expect(phase.id).toBe('network');
  if (phase.id !== 'network') throw new Error('Slower policy did not reach the Network.');
  expect(phase.network.completed).toBe(WORLD_WORKFLOWS);
  const firstHire = run.actions.findIndex(action => action.type === 'hire');
  expect(firstHire).toBeGreaterThanOrEqual(0);
  const decisions = run.actions.slice(firstHire + 1);
  for (let index = 1; index < decisions.length; index++) {
    const previous = decisions[index - 1], current = decisions[index];
    if (!previous || !current) throw new Error('Missing recorded decision.');
    expect(current.seconds - previous.seconds).toBeGreaterThanOrEqual(60);
  }
  expect(run.actions.some(action => action.action.type === 'network-plan' && action.action.plan === 'grow')).toBe(true);
  expect(run.actions.some(action => action.action.type === 'network-plan' && action.action.plan === 'clear')).toBe(true);
});
