import { expect, test } from 'bun:test';
import { coordinationEfficiency, initialNetwork, networkDiagnosis, networkPlan, NetworkSchema, stabilityNeed, tickNetwork, WORLD_WORKFLOWS, type ComputeRouting, type Network } from './network';
import { commissionNetwork } from './network-capital';

function network(): Network {
  return { ...initialNetwork(), nodes: 500, plants: 100, servers: 100, energy: 10000, compute: 40000, knowledge: 100000,
    protocols: ['efficient', 'distributed'], discovered: 100000, undiscovered: WORLD_WORKFLOWS - 100000,
    allocation: { discover: 30, replicate: 0, process: 55, stabilize: 15 } };
}
function run(n: Network, routing: ComputeRouting, seconds: number) {
  let current = { ...n, computeRouting: routing };
  for (let s = 0; s < seconds; s++) current = tickNetwork(current, 1, 0).network;
  return current;
}

test('routes trade different useful work even when both resource buffers are abundant', () => {
  const n = network();
  const standard = tickNetwork(n, 1, 0).network;
  const survey = tickNetwork({ ...n, computeRouting: 'survey' }, 1, 0).network;
  const parallel = tickNetwork({ ...n, computeRouting: 'parallel' }, 1, 0).network;
  expect(survey.discoveredRate).toBe(standard.discoveredRate * 2);
  expect(survey.processedRate).toBeCloseTo(standard.processedRate * 0.65);
  expect(parallel.processedRate).toBe(standard.processedRate * 2);
  expect(parallel.discoveredRate).toBeCloseTo(standard.discoveredRate * 0.65);
  expect(survey.compute).toBeLessThan(standard.compute);
  expect(parallel.knowledge).toBeLessThan(standard.knowledge);
});

test('standard clears an already located finite queue without unnecessary research spending', () => {
  const n = { ...network(), undiscovered: 0, discovered: 100, completed: WORLD_WORKFLOWS - 100 };
  const standard = tickNetwork(n, 1, 0).network;
  const survey = tickNetwork({ ...n, computeRouting: 'survey' }, 1, 0).network;
  const parallel = tickNetwork({ ...n, computeRouting: 'parallel' }, 1, 0).network;
  expect(standard.completed).toBe(WORLD_WORKFLOWS);
  expect(survey.completed).toBe(WORLD_WORKFLOWS);
  expect(parallel.completed).toBe(WORLD_WORKFLOWS);
  expect(standard.knowledgeSpentRate).toBe(0);
  expect(parallel.knowledgeSpentRate).toBe(0);
});

test('expansion creates bounded coordination pressure, recoverable with standard routing and stabilization', () => {
  const n = { ...network(), nodes: 8, allocation: { discover: 10, replicate: 55, process: 10, stabilize: 25 } };
  const launch = commissionNetwork(n, 1000, 1e10);
  expect(launch.ok).toBe(true);
  if (!launch.ok) throw new Error(launch.reason);
  expect(launch.network.coordinationLoad).toBe(0.4);
  expect(coordinationEfficiency(launch.network)).toBeLessThan(1);
  expect(stabilityNeed(launch.network, 0)).toBeGreaterThan(stabilityNeed(n, 0));
  const recovering = { ...launch.network, allocation: { discover: 20, replicate: 0, process: 40, stabilize: 40 } };
  const recovered = run(recovering, 'standard', 60);
  expect(recovered.coordinationLoad).toBe(0);
  expect(recovered.lost).toBe(0);
  expect(recovered.completed).toBeGreaterThan(n.completed);
});

test('cleared work supports replication and a depleted budget can recover without a purchase', () => {
  const n = { ...network(), replicationCredit: 0, allocation: { discover: 20, replicate: 40, process: 20, stabilize: 20 } };
  const blocked = tickNetwork(n, 1, 0).network;
  expect(blocked.growthRate).toBe(0);
  expect(blocked.replicationCredit).toBeGreaterThan(0);
  const supported = tickNetwork(blocked, 1, 0).network;
  expect(supported.growthRate).toBeGreaterThan(0);
  expect(supported.replicationCredit).toBeGreaterThanOrEqual(0);
  expect(supported.replicationCredit).toBeLessThanOrEqual(1000);
  expect(NetworkSchema.safeParse(supported).success).toBe(true);
});

test('historical migration preserves known state and grants a bounded expansion buffer', () => {
  const n = network();
  const { coordinationLoad: _load, replicationCredit: _credit, ...historical } = n;
  const migrated = NetworkSchema.parse(historical);
  expect(migrated.coordinationLoad).toBe(0);
  expect(migrated.replicationCredit).toBe(1000);
  expect(migrated.nodes).toBe(n.nodes);
  expect(migrated.knowledge).toBe(n.knowledge);
  expect(migrated.completed).toBe(n.completed);
  expect(migrated.protocols).toEqual(n.protocols);
  expect(migrated.allocation).toEqual(n.allocation);
  for (const invalid of [-1, 1.1, Infinity, NaN]) expect(NetworkSchema.safeParse({ ...n, coordinationLoad: invalid }).success).toBe(false);
  for (const invalid of [-1, 1001, Infinity, NaN]) expect(NetworkSchema.safeParse({ ...n, replicationCredit: invalid }).success).toBe(false);
});

 test('valid upper-bound knowledge and losses stay saveable after work', () => {
  const n = { ...network(), nodes: 10000, plants: 1000, servers: 1000, energy: 1000000, knowledge: Number.MAX_SAFE_INTEGER, lost: Number.MAX_SAFE_INTEGER,
    discovered: 1000000, undiscovered: WORLD_WORKFLOWS - 1000000, allocation: { discover: 30, replicate: 20, process: 50, stabilize: 0 } };
  expect(NetworkSchema.safeParse(n).success).toBe(true);
  const result = tickNetwork(n, 1, 0).network;
  expect(result.knowledge).toBeLessThanOrEqual(Number.MAX_SAFE_INTEGER);
  expect(result.lost).toBeLessThanOrEqual(Number.MAX_SAFE_INTEGER);
  expect(NetworkSchema.safeParse(result).success).toBe(true);
});


test('unfunded intensive routes preserve ordinary work without a policy repair click', () => {
  const n = { ...network(), knowledgeReserve: 100000 };
  const standard = tickNetwork(n, 1, 0).network;
  const unfunded = tickNetwork({ ...n, computeRouting: 'parallel' }, 1, 0).network;
  expect(unfunded.discoveredRate).toBe(standard.discoveredRate);
  expect(unfunded.processedRate).toBe(standard.processedRate);
  expect(unfunded.knowledgeSpentRate).toBe(0);
  const exhaustedDiscovery = { ...n, undiscovered: 0, discovered: WORLD_WORKFLOWS };
  expect(tickNetwork({ ...exhaustedDiscovery, computeRouting: 'survey' }, 1, 0)).toEqual({
    ...tickNetwork(exhaustedDiscovery, 1, 0), network: { ...tickNetwork(exhaustedDiscovery, 1, 0).network, computeRouting: 'survey' },
  });
  const computeBlocked = { ...n, nodes: 100000, replicationCredit: 1000, compute: 0, plants: 1000, servers: 1, energy: 0, allocation: { discover: 10, replicate: 75, process: 3, stabilize: 12 } };
  const blockedStandard = tickNetwork(computeBlocked, 1, 0).network;
  const blockedSurvey = tickNetwork({ ...computeBlocked, computeRouting: 'survey' }, 1, 0).network;
  expect(blockedStandard.processedRate).toBeGreaterThan(0);
  expect(blockedSurvey.processedRate).toBe(blockedStandard.processedRate);
  expect(blockedSurvey.discoveredRate).toBe(blockedStandard.discoveredRate);
});

test('partially funded parallel work diverts discovery in proportion to actual bonus', () => {
  const n = network(), capacity = tickNetwork(n, 1, 0).network.processedRate;
  const quarter = { ...n, knowledge: capacity * 0.25 * 0.1, knowledgeReserve: 0 };
  const standard = tickNetwork(quarter, 1, 0).network;
  const partial = tickNetwork({ ...quarter, computeRouting: 'parallel' }, 1, 0).network;
  expect(partial.processedRate).toBeCloseTo(standard.processedRate * 1.25);
  expect(partial.discoveredRate).toBeCloseTo(standard.discoveredRate * (1 - 0.35 * 0.25));
  expect(partial.knowledgeSpentRate).toBeCloseTo(capacity * 0.025);
  expect(partial.undiscovered + partial.discovered + partial.completed).toBeCloseTo(WORLD_WORKFLOWS);
});

test('partially funded survey work diverts processing in proportion to actual bonus', () => {
  const n = { ...network(), nodes: 100, servers: 1, compute: 0, allocation: { discover: 80, replicate: 0, process: 10, stabilize: 10 } };
  const standard = tickNetwork(n, 1, 0).network;
  const survey = tickNetwork({ ...n, computeRouting: 'survey' }, 1, 0).network;
  const bonusFraction = (survey.discoveredRate - standard.discoveredRate) / standard.discoveredRate;
  expect(bonusFraction).toBeGreaterThan(0);
  expect(bonusFraction).toBeLessThan(1);
  expect(survey.processedRate).toBeCloseTo(standard.processedRate * (1 - 0.35 * bonusFraction));
});

test('standing presets retain stabilization through maximum future coordination pressure', () => {
  for (const plan of ['grow', 'survey'] as const) {
    const n = networkPlan(network(), 100, plan);
    expect(n.allocation.stabilize / 100).toBeGreaterThan(stabilityNeed({ ...n, coordinationLoad: 1 }, 100));
    let current = { ...n, coordinationLoad: 1 };
    for (let second = 0; second < 120; second++) current = tickNetwork(current, 1, 100).network;
    expect(current.lost).toBe(0);
    expect(NetworkSchema.safeParse(current).success).toBe(true);
  }
});


test('diagnosis uses generated resources rather than empty compute stock', () => {
  const healthy = { ...network(), compute: 0, servers: 1, allocation: { discover: 30, replicate: 20, process: 35, stabilize: 15 } };
  expect(networkDiagnosis(healthy, 0).id).not.toBe('compute');
  const constrained = { ...healthy, nodes: 100000, plants: 1000, energy: 0, replicationCredit: 1000, allocation: { discover: 0, replicate: 85, process: 3, stabilize: 12 } };
  expect(networkDiagnosis(constrained, 0).id).toBe('compute');
  expect(networkDiagnosis({ ...healthy, replicationCredit: 0 }, 0).id).toBe('replication-credit');
  const losing = { ...constrained, allocation: { ...constrained.allocation, replicate: 97, stabilize: 0 } };
  expect(networkDiagnosis(losing, 0).id).toBe('stability');
});


test('Clear protects expanding policies and frees repair capacity only when load cannot grow', () => {
  const n = { ...network(), coordinationLoad: 0.4 };
  const conservative = networkPlan({ ...n, capitalPolicy: 'research-first' }, 100, 'clear');
  const intensive = networkPlan({ ...n, computeRouting: 'parallel' }, 100, 'clear');
  const ordinary = networkPlan(n, 100, 'clear');
  expect(conservative.allocation.stabilize / 100).toBeGreaterThan(stabilityNeed({ ...n, coordinationLoad: 1 }, 100));
  expect(intensive.allocation.stabilize).toBe(conservative.allocation.stabilize);
  expect(ordinary.allocation.stabilize).toBeLessThan(conservative.allocation.stabilize);
  let current = ordinary;
  for (let second = 0; second < 120; second++) current = tickNetwork(current, 1, 100).network;
  expect(current.coordinationLoad).toBeLessThan(n.coordinationLoad);
  expect(current.lost).toBe(0);
  expect(current.nodes).toBe(n.nodes);
});


test('Clear balances remaining pipeline time as procedures change and conserves work', () => {
  for (const protocols of [[], ['distributed', 'mapping'], ['efficient', 'distributed', 'mapping', 'compression', 'resilience', 'singularity']] satisfies Network['protocols'][]) {
    const n = networkPlan({ ...network(), protocols, discovered: 100000000, undiscovered: WORLD_WORKFLOWS - 100000000 }, 0, 'clear');
    const next = tickNetwork(n, 1, 0).network;
    expect(n.allocation.replicate).toBe(0);
    expect(n.undiscovered / next.discoveredRate).toBeCloseTo((n.undiscovered + n.discovered) / next.processedRate);
    expect(next.undiscovered + next.discovered + next.completed).toBeCloseTo(WORLD_WORKFLOWS);
    expect(next.nodes).toBe(n.nodes);
    expect(NetworkSchema.safeParse(next).success).toBe(true);
  }
  const mapped = networkPlan({ ...network(), undiscovered: 0, discovered: WORLD_WORKFLOWS }, 0, 'clear');
  expect(mapped.allocation.discover).toBe(0);
  expect(mapped.allocation.process + mapped.allocation.stabilize).toBe(100);
  const next = tickNetwork(mapped, 1, 0).network;
  expect(next.processedRate).toBeGreaterThan(0);
  expect(next.discoveredRate).toBe(0);
  expect(next.discovered + next.completed).toBeCloseTo(WORLD_WORKFLOWS);
});


test('repaired coordination offers one visible Clear refresh without changing allocation automatically', () => {
  const n = { ...networkPlan({ ...network(), coordinationLoad: 0.8 }, 0, 'clear'), coordinationLoad: 0 };
  const snapshot = structuredClone(n);
  const diagnosis = networkDiagnosis(n, 0);
  expect(diagnosis.id).toBe('coordination-repaired');
  expect(diagnosis.plan).toBe('clear');
  expect(diagnosis.advice).toContain('Refresh Clear');
  expect(n).toEqual(snapshot);
  const refreshed = networkPlan(n, 0, 'clear');
  expect(refreshed.allocation.stabilize).toBeLessThan(n.allocation.stabilize);
  expect(networkDiagnosis(refreshed, 0).id).not.toBe('coordination-repaired');
  expect(networkDiagnosis({ ...n, computeRouting: 'parallel' }, 0).id).not.toBe('coordination-repaired');
  expect(networkDiagnosis({ ...n, capitalPolicy: 'research-first' }, 0).id).not.toBe('coordination-repaired');
  expect(networkDiagnosis({ ...n, coordinationLoad: 0.1 }, 0).id).not.toBe('coordination-repaired');
  expect(tickNetwork(refreshed, 1, 0).network.lost).toBe(0);
});


test('Institutional memory visibly releases staffing while refreshed plans remain future-safe', () => {
  for (const plan of ['grow', 'survey'] as const) {
    const original = networkPlan(network(), 0, plan);
    const researched = { ...original, protocols: [...original.protocols, 'resilience'] satisfies Network['protocols'] };
    expect(NetworkSchema.safeParse(researched).success).toBe(true);
    const diagnosis = networkDiagnosis(researched, 0);
    expect(diagnosis.id).toBe('stability-surplus');
    expect(diagnosis.plan).toBe(plan);
    expect(diagnosis.advice).toContain('Institutional memory');
    expect(diagnosis.advice).toContain('repair coordination more slowly');
    const refreshed = networkPlan(researched, 0, plan);
    expect(refreshed.allocation.stabilize).toBeLessThan(researched.allocation.stabilize);
    expect(refreshed.allocation.stabilize / 100).toBeGreaterThan(stabilityNeed({ ...refreshed, coordinationLoad: 1 }, 0));
    expect(networkDiagnosis(refreshed, 0).id).not.toBe('stability-surplus');
    const repairedOriginal = tickNetwork({ ...researched, coordinationLoad: 0.8 }, 1, 0).network;
    const repairedRefresh = tickNetwork({ ...refreshed, coordinationLoad: 0.8 }, 1, 0).network;
    expect(repairedRefresh.coordinationLoad).toBeGreaterThan(repairedOriginal.coordinationLoad);
    const worstLoad = tickNetwork({ ...refreshed, coordinationLoad: 1 }, 1, 0).network;
    expect(worstLoad.lost).toBe(0);
  }
  const unearned = networkPlan(network(), 0, 'grow');
  expect(networkDiagnosis(unearned, 0).id).not.toBe('stability-surplus');
});
