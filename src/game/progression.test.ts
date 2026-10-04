import { describe, expect, test } from 'bun:test';
import { act, advance, employeeRate, netIncome, type Action } from './engine';
import { GameSchema, initialState, type GameState } from './state';
import { projectReason } from './projects';
import { contracts, rivals } from './corporation';
import { demand, supplyCost } from './economy';
import { cohortRate, rivalRevenue } from './expansion';
import { initialNetwork, allocate, NetworkSchema, tickNetwork, WORLD_WORKFLOWS } from './network';
import { playthrough } from './testing/playthrough';
import { officeFixture, enterpriseFixture, conglomerateFixture } from './testing/fixtures';
import { loadGame, saveGame, SAVE_KEY } from './storage';

function perform(state: GameState, action: Action) {
  const result = act(state, action, () => 0.99);
  if (!result.ok) throw new Error(result.message);
  return result.state;
}
const enterprise = enterpriseFixture;
const conglomerate = conglomerateFixture;

describe('supplies, price and departments', () => {
  test('supply depletion stops actual output and employee counters, while payroll continues', () => {
    const s = officeFixture(), limited = { ...s, corporation: { ...s.corporation, blankForms: 1 } };
    const next = advance(limited, 10, () => 0.99);
    expect(next.paperwork).toBeCloseTo(1);
    expect(next.employees.reduce((sum, e) => sum + e.produced, 0)).toBeCloseTo(1);
    expect(next.corporation.blankForms).toBe(0);
    expect(next.wages).toBeCloseTo(2.7);
    expect(netIncome(next)).toBeLessThan(0);
    const resumed = advance(perform(next, { type: 'supplies', packs: 1 }), 1, () => 0.99);
    expect(resumed.paperwork).toBeGreaterThan(1);
  });
  test('retail demand constrains sales and changing prices has a real elasticity tradeoff', () => {
    const s = initialState(0), stock = { ...s, corporation: { ...s.corporation, inventory: 1000 } };
    const expensive = perform(stock, { type: 'price', value: 2.5 });
    expect(demand(expensive)).toBeLessThan(demand(stock));
    const sold = advance(expensive, 1, () => 0.99);
    expect(sold.corporation.soldRate).toBeCloseTo(demand(expensive));
    expect(sold.revenue).toBeCloseTo(demand(expensive) * 2.5);
    expect(sold.corporation.inventory).toBeGreaterThan(990);
    expect(act(stock, { type: 'price', value: NaN }).ok).toBe(false);
    expect(act(stock, { type: 'supplies', packs: -1 }).ok).toBe(false);
  });
  test('procurement consumes funds, logistics reduces its cost, and insolvency remains recoverable', () => {
    const s = enterprise(), empty = { ...s, corporation: { ...s.corporation, blankForms: 0 } };
    const next = advance(empty, 1, () => 0.99);
    expect(next.paperwork).toBeGreaterThan(s.paperwork);
    expect(next.corporation.supplySpent).toBeGreaterThan(s.corporation.supplySpent);
    const integrated = perform(s, { type: 'project', id: 'logistics' });
    expect(supplyCost(integrated)).toBe(supplyCost(s) / 2);
    const poor = { ...empty, cash: 0, employees: [], corporation: { ...empty.corporation, autoBuy: false } };
    let recovered: GameState = poor;
    for (let i = 0; i < 16; i++) recovered = advance(perform(recovered, { type: 'process' }), 0.5, () => 0.99);
    expect(perform(recovered, { type: 'supplies', packs: 1 }).corporation.blankForms).toBe(250);
  });
  test('research consumes a worker’s productive time without changing their inherited traits', () => {
    const s = enterprise(), employee = s.employees[0];
    if (!employee) throw new Error('Missing employee.');
    const assigned = perform(s, { type: 'assign', id: employee.id, role: 'research' });
    expect(assigned.employees[0]?.genes).toEqual(employee.genes);
    const next = advance(assigned, 1, () => 0.99);
    expect(next.corporation.insights).toBeCloseTo(assigned.corporation.insights + employeeRate(assigned, employee) * 0.12 * 1.2 + (0.03 + 8 / 30) * 1.2);
    expect(next.employees[0]?.produced).toBe(employee.produced);
    expect(next.paperwork).toBeLessThan(advance(s, 1, () => 0.99).paperwork);
    expect(act(initialState(0), { type: 'assign', id: 1, role: 'research' }).ok).toBe(false);
  });
  test('extraction and lean policies increase pressure; compliance and humane policy recover it', () => {
    const base = perform(enterprise(), { type: 'project', id: 'extraction' });
    const lean = advance(perform(base, { type: 'policy', policy: 'lean' }), 300, () => 0.99);
    expect(lean.corporation.pressure).toBeGreaterThan(base.corporation.pressure);
    expect(lean.corporation.morale).toBeLessThan(base.corporation.morale);
    let safe = perform(lean, { type: 'policy', policy: 'humane' });
    for (const e of safe.employees.slice(0, 3)) safe = perform(safe, { type: 'assign', id: e.id, role: 'compliance' });
    safe = advance(safe, 300, () => 0.99);
    expect(safe.corporation.pressure).toBeLessThan(lean.corporation.pressure);
    expect(safe.corporation.morale).toBeGreaterThan(lean.corporation.morale);
    expect(act(base, { type: 'project', id: 'stewardship' }).ok).toBe(false);
  });
});

describe('orders, crises and expansion', () => {
  test('contracts divert production, settle once, and keep escrow on cancellation and timeout', () => {
    const s = enterprise(), active = perform(perform(s, { type: 'contract', id: 'local' }), { type: 'contract-allocation', allocation: 'all' });
    const next = advance(active, 10, () => 0.99);
    expect(next.revenue).toBe(active.revenue);
    expect(next.corporation.contract.status).toBe('active');
    if (next.corporation.contract.status !== 'active') throw new Error('Missing order.');
    const escrow = next.corporation.contract.delivered;
    expect(escrow).toBeGreaterThan(0);
    const canceled = perform(next, { type: 'cancel-contract' });
    expect(canceled.corporation.inventory).toBeCloseTo(escrow);
    expect(canceled.corporation.contract.status).toBe('idle');
    const expiring = { ...next, employees: [], corporation: { ...next.corporation, contract: { ...next.corporation.contract, remaining: 0.5 } } };
    const expired = advance(expiring, 1, () => 0.99);
    expect(expired.corporation.contract.status).toBe('idle');
    expect(expired.corporation.inventory + expired.corporation.soldRate).toBeCloseTo(escrow);
    const finished = { ...active, corporation: { ...active.corporation, contract: { status: 'active', id: 'local', allocation: 'all', remaining: 60, delivered: contracts.local.forms - 1 } as const } };
    const paid = advance(finished, 1, () => 0.99);
    expect(paid.revenue - finished.revenue).toBeGreaterThan(contracts.local.reward);
    expect(paid.corporation.completedContracts).toBe(1);
    expect(advance(paid, 10, () => 0.99).corporation.completedContracts).toBe(1);
  });
  test('crises offer distinct recoverable consequences and wait fairly offline', () => {
    const s = enterprise(), pending: GameState = { ...s, corporation: { ...s.corporation, crisis: { status: 'pending', id: 'audit', remaining: 1 } } };
    const invested = perform(pending, { type: 'crisis', choice: 'invest' });
    const exploited = perform(pending, { type: 'crisis', choice: 'exploit' });
    expect(invested.corporation.morale).toBeGreaterThan(exploited.corporation.morale);
    expect(invested.corporation.pressure).toBeLessThan(exploited.corporation.pressure);
    expect(act({ ...pending, cash: 0 }, { type: 'crisis', choice: 'invest' }).ok).toBe(false);
    const offline = advance(pending, 1, () => 0.99);
    expect(offline.corporation.crisis).toEqual(pending.corporation.crisis);
    expect(GameSchema.safeParse(advance(offline, 7200)).success).toBe(true);
    const war = { ...pending, corporation: { ...pending.corporation, crisis: { status: 'pending', id: 'price-war', remaining: 60 } as const } };
    const branded = perform(war, { type: 'crisis', choice: 'invest' });
    const ignored = perform(war, { type: 'crisis', choice: 'wait' });
    expect(demand(branded)).toBeGreaterThan(demand(ignored) * 2);
    const invention = { ...pending, corporation: { ...pending.corporation, crisis: { status: 'pending', id: 'innovation', remaining: 60 } as const } };
    expect(perform(invention, { type: 'crisis', choice: 'invest' }).corporation.insights).toBe(invention.corporation.insights + 100);
  });
  test('acquisitions add legacy staff and eliminate independent rival growth', () => {
    const s = conglomerate();
    expect(s.corporation.legacyStaff.reduce((sum, group) => sum + group.count, 0)).toBe(rivals.forms.employees + rivals.desk.employees);
    expect(s.corporation.legacyStaff.every(group => group.genes.length === 0)).toBe(true);
    const later = { ...s, elapsed: 5000 };
    expect(rivalRevenue(later, 'forms')).toBe(rivalRevenue(s, 'forms'));
    expect(rivalRevenue(later, 'omni')).toBeGreaterThan(rivalRevenue(s, 'omni'));
  });
  test('cohorts retain genotypes, merge only matching traits, and respect branch capacity', () => {
    let s = perform(conglomerate(), { type: 'branch' });
    s = perform(s, { type: 'cohort', branch: 1, cultivar: 'generalist', count: 10 });
    const first = s.corporation.branches[0]?.cohorts[0];
    if (!first) throw new Error('Missing founding cohort.');
    s = perform(s, { type: 'research-gene', id: 'focus' });
    s = perform(s, { type: 'genome', genes: ['focus'] });
    s = perform(s, { type: 'cohort', branch: 1, cultivar: 'generalist', count: 10 });
    s = perform(s, { type: 'cohort', branch: 1, cultivar: 'generalist', count: 10 });
    const groups = s.corporation.branches[0]?.cohorts;
    expect(groups?.length).toBe(2);
    expect(groups?.[0]).toEqual(first);
    expect(groups?.[1]?.count).toBe(20);
    expect(groups?.[1]?.genes).toEqual(['focus']);
    expect(act(s, { type: 'cohort', branch: 1, cultivar: 'generalist', count: 100 }).ok).toBe(false);
    expect(cohortRate(s, first)).toBeGreaterThan(0);
    const optimized = groups?.[1];
    if (!optimized) throw new Error('Missing optimized cohort.');
    expect(cohortRate(s, optimized) / optimized.count).toBeGreaterThan(cohortRate(s, first) / first.count);
    expect(GameSchema.safeParse(s).success).toBe(true);
  });
  test('phase projects require their strategic gates', () => {
    const s = enterprise();
    expect(projectReason(s, 'regional')).not.toBeNull();
    expect(act(s, { type: 'project', id: 'sovereign' }).ok).toBe(false);
    expect(GameSchema.safeParse({ ...s, corporation: { ...s.corporation, phase: { id: 'network', network: initialNetwork() } } }).success).toBe(false);
  });
});

describe('finite network', () => {
  test('allocation stays normalized, compute and energy constrain replication, and instability causes losses', () => {
    const n = initialNetwork(), allReplication = allocate(n, 'replicate', 100);
    expect(allReplication.allocation.replicate).toBe(100);
    const allProcess = allocate(allReplication, 'process', 100);
    expect(allProcess.allocation.process).toBe(100);
    expect(NetworkSchema.safeParse(allProcess).success).toBe(true);
    const exhausted = tickNetwork({ ...allReplication, nodes: 1000, energy: 0, compute: 0 }, 1, 100).network;
    expect(exhausted.nodes).toBeLessThan(1000);
    expect(exhausted.energy).toBeGreaterThanOrEqual(0);
    expect(exhausted.compute).toBeGreaterThanOrEqual(0);
    const stable = tickNetwork({ ...n, nodes: 1000, allocation: { discover: 20, replicate: 20, process: 20, stabilize: 40 } }, 1, 100).network;
    expect(stable.lost).toBe(0);
  });
  test('processing conserves the finite pool and snaps the final form to a complete world', () => {
    const n = { ...initialNetwork(), undiscovered: 0, discovered: 1, completed: WORLD_WORKFLOWS - 1, allocation: { discover: 0, replicate: 0, process: 100, stabilize: 0 } };
    const result = tickNetwork(n, 1, 0);
    expect(result.revenue).toBeCloseTo(0.06);
    expect(result.network.completed).toBe(WORLD_WORKFLOWS);
    expect(result.network.discovered).toBe(0);
    expect(NetworkSchema.safeParse(result.network).success).toBe(true);
  });
  test.each(['stewardship', 'extraction'] as const)('%s can reach both endings from a fresh company with legal actions', path => {
    const run = playthrough(path, path === 'stewardship' ? 7 : 42);
    expect(run.transitions.map(t => t.phase)).toEqual(['office', 'enterprise', 'conglomerate', 'network']);
    expect(run.state.elapsed).toBeLessThan(4 * 3600);
    expect(run.state.manualPapers).toBe(28);
    expect(run.state.corporation.projects).toContain(path);
    expect(GameSchema.safeParse(run.state).success).toBe(true);
    for (const ending of ['monopoly', 'commons'] as const) {
      const complete = perform(run.state, { type: 'ending', ending });
      expect(complete.corporation.phase.id).toBe('ending');
      expect(advance(complete, 7200)).toBe(complete);
      const reincorporated = perform(complete, { type: 'reincorporate' });
      expect(reincorporated.corporation.legacy.credits).toBe(5);
      expect(reincorporated.corporation.legacy.endings).toEqual([ending]);
      const invested = perform(reincorporated, { type: 'legacy', id: 'founding' });
      expect(invested.cash).toBe(60);
      expect(invested.employees).toHaveLength(0);
      expect(invested.corporation.legacy.credits).toBe(4);
      expect(invested.employees.every(e => e.genes.length === 0)).toBe(true);
      expect(GameSchema.safeParse(invested).success).toBe(true);
    }
    const storage = { value: '', getItem: () => storage.value, setItem: (_key: string, value: string) => { storage.value = value; } };
    saveGame(storage, run.state, 0);
    const restored = loadGame(storage, 7200000);
    expect(restored.status).toBe('ready');
    expect(GameSchema.safeParse(restored.state).success).toBe(true);
    expect(restored.state.corporation.phase.id).toBe('network');
    expect(storage.getItem()).toContain('"version":3');
    expect(SAVE_KEY).toBe('cube-farm:save:v1');
  });
});
