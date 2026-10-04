import { expect, test } from 'bun:test';
import { advance } from './engine';
import { computeRoutingIds, type Network } from './network';
import { GameSchema, type GameState } from './state';
import { perform } from './testing/fixtures';
import { compareNetworkAgency, informedRouting, routingForecast, legalNetworkEntry } from './testing/network-agency';
import { reportedStalledNetwork } from './testing/playthrough';

function network(state: GameState): Network {
  if (state.corporation.phase.id !== 'network') throw new Error('Expected Network strategy snapshot.');
  return state.corporation.phase.network;
}

/** Earned snapshots: the test never invents offices, knowledge, compute or workflows. */
function strategySnapshots() {
  let researched: GameState | undefined, backlog: GameState | undefined;
  compareNetworkAgency(reportedStalledNetwork(), { capital: 'research-first', routing: 'standard' }, state => {
    const n = network(state);
    if (researched === undefined && n.protocols.includes('singularity')) researched = state;
    if (backlog === undefined && n.undiscovered === 0 && n.discovered > 0) backlog = state;
  });
  if (researched === undefined) throw new Error('Legal recovery did not earn the final procedure.');
  // A player can deliberately Survey ahead of processing, creating a real queue for Parallel.
  // Balanced Clear now finishes both pools together, so it should not be forced to manufacture one.
  let surveying = perform(perform(researched, { type: 'network-investment', policy: 'manual' }), { type: 'network-plan', plan: 'survey' });
  for (let second = 0; second < 4 * 3600 && backlog === undefined; second++) {
    surveying = advance(surveying, 1, () => 0.99);
    const n = network(surveying);
    if (n.undiscovered === 0 && n.discovered > 0) backlog = surveying;
  }
  if (backlog === undefined) throw new Error('Legal Survey did not create a located backlog.');
  return { researched, backlog };
}

test('Survey wins a discovery bottleneck, while Parallel wins a located backlog', () => {
  const snapshots = strategySnapshots();
  const clearing = perform(snapshots.researched, { type: 'network-plan', plan: 'clear' });
  const stable = perform(clearing, { type: 'allocate', key: 'stabilize', value: 30 });
  const discoveryLimited = perform(stable, { type: 'allocate', key: 'discover', value: 5 });
  const n = network(discoveryLimited);
  const standard = routingForecast(n, 0, 'standard'), survey = routingForecast(n, 0, 'survey');
  expect(survey.discovery).toBeGreaterThan(standard.discovery);
  expect(survey.processing).toBeGreaterThan(standard.processing);
  expect(survey.duration).toBeLessThan(standard.duration * 0.8);
  expect(informedRouting(n, 0)).toBe('survey');
  const clear = perform(snapshots.backlog, { type: 'network-plan', plan: 'clear' });
  const backlog = network(clear);
  const ordinary = routingForecast(backlog, 0, 'standard'), parallel = routingForecast(backlog, 0, 'parallel');
  const located = network(snapshots.researched);
  expect(routingForecast(located, 0, 'survey').processing).toBeLessThan(routingForecast(located, 0, 'standard').processing);
  expect(parallel.processing).toBeGreaterThan(ordinary.processing);
  expect(parallel.knowledge).toBeLessThan(ordinary.knowledge);
  expect(parallel.duration).toBeLessThan(ordinary.duration * 0.8);
  expect(informedRouting(backlog, 0)).toBe('parallel');
});

test('the informed player retains research and makes bounded, optional route decisions', () => {
  const initial = reportedStalledNetwork();
  const original = structuredClone(initial);
  const run = compareNetworkAgency(initial, { capital: 'research-first', routing: 'adaptive' });
  expect(initial).toEqual(original);
  expect(run.actions.length).toBeLessThanOrEqual(13);
  expect(run.switches).toBeLessThanOrEqual(5);
  expect(run.maintenance).toBe(0);
  const routing = run.actions.filter(action => action.action.type === 'network-routing');
  for (let index = 1; index < routing.length; index++) {
    const current = routing[index], previous = routing[index - 1];
    if (current === undefined || previous === undefined) throw new Error('Missing recorded routing control.');
    expect(current.seconds - previous.seconds).toBeGreaterThanOrEqual(60);
  }
  expect(run.actions.every(action => !action.action.type.startsWith('tender'))).toBe(true);
  const early = network(perform(initial, { type: 'network-plan', plan: 'grow' }));
  const forecast = computeRoutingIds.map(route => routingForecast(early, 0, route));
  expect(forecast.find(route => route.routing === 'parallel')?.knowledge ?? Infinity).toBeLessThan(forecast.find(route => route.routing === 'standard')?.knowledge ?? 0);
  expect(informedRouting(early, 0)).toBe('standard');
});

test.each([7, 42, 101])('both fresh paths retain optional agency without tenders, seed %s', seed => {
  for (const path of ['stewardship', 'extraction'] as const) {
    const entry = legalNetworkEntry(seed, path);
    const standard = compareNetworkAgency(entry, { capital: 'manual', routing: 'standard' });
    const funded = compareNetworkAgency(entry, { capital: 'research-first', routing: 'standard' });
    const adaptive = compareNetworkAgency(entry, { capital: 'research-first', routing: 'adaptive' });
    expect(funded.seconds).toBeLessThan(standard.seconds);
    expect(adaptive.seconds).toBeLessThanOrEqual(funded.seconds);
    for (const run of [standard, funded, adaptive]) {
      expect(run.seconds).toBeLessThan(4 * 3600);
      expect(run.actions.length).toBeLessThanOrEqual(13);
      expect(run.interactions).toBeLessThanOrEqual(16);
      expect(run.switches).toBeLessThanOrEqual(5);
      expect(run.maintenance).toBe(0);
      expect(run.actions.every(action => !action.action.type.startsWith('tender'))).toBe(true);
      expect(GameSchema.safeParse(run.state).success).toBe(true);
    }
  }
});

test('slower Network agency decisions keep the four-hour ceiling without automatic tender play', () => {
  const run = compareNetworkAgency(reportedStalledNetwork(), { capital: 'research-first', routing: 'adaptive' }, undefined, 60);
  expect(run.seconds).toBeLessThan(4 * 3600);
  expect(run.maintenance).toBe(0);
  expect(run.actions.every(action => !action.action.type.startsWith('tender'))).toBe(true);
  for (let index = 1; index < run.actions.length; index++) {
    const current = run.actions[index], previous = run.actions[index - 1];
    if (current === undefined || previous === undefined) throw new Error('Missing recorded Network decision.');
    expect(current.seconds - previous.seconds).toBeGreaterThanOrEqual(60);
  }
});
