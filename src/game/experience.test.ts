import { describe, expect, test } from 'bun:test';
import { act, advance, hireQuote, upgradeQuote, upgradeCost, employeeRate, staffReplacementQuote, saleValue } from './engine';
import { GameSchema, initialState, parseGame, type GameState, type Employee } from './state';
import { discovery, facilityVisible, upgradeVisible } from './discovery';
import { visibleProjects } from './projects';
import { pendingLetter, commonsSettlement, endingEcho } from './story';
import { departmentYield, risks } from './workforce';
import { payroll, cohortQuote, cohortCost, branchExpansionQuote, cohortReplacementQuote } from './expansion';
import { operatingReserve } from './automation';
import { initialNetwork, assetCost, assetQuote, WORLD_WORKFLOWS } from './network';
import { tickInfrastructure } from './infrastructure';
import { geneEffects } from './genome';
import { marginalPurchase, expectedOutput } from './balance';
import { loadGame, SAVE_KEY } from './storage';
import { officeFixture, labFixture, enterpriseFixture, conglomerateFixture, networkFixture, perform } from './testing/fixtures';
import { playthrough } from './testing/playthrough';
import type { GeneId } from './catalog';

function earnedOpening() {
  let s = initialState(0);
  for (let i = 0; i < 28; i++) s = advance(perform(s, { type: 'process' }), 1, () => 0.99);
  return perform(s, { type: 'hire', cultivar: 'generalist' });
}
function v2Record(s: GameState) {
  const { genome: _genome, story: _story, manualCooldown: _cooldown, automation: _automation, ...old } = s;
  if (old.corporation.phase.id !== 'network') return { ...old, version: 2 };
  const { infrastructure: _building, ...network } = old.corporation.phase.network;
  return { ...old, version: 2, corporation: { ...old.corporation, phase: { id: 'network', network } } };
}

describe('earned discovery and manual production', () => {
  test('fresh company has no passive money or exposed future systems', () => {
    const s = initialState(0);
    expect(s.cash).toBe(0); expect(s.employees).toHaveLength(0); expect(s.nextId).toBe(1);
    expect(advance(s, 600, () => 0.99).revenue).toBe(0);
    expect(discovery(s)).toEqual({ hiring: false, business: false, development: false, workforce: false, departments: false, company: false, genetics: false, delegation: false });
    expect(visibleProjects(s)).toEqual([]);
    expect(upgradeVisible(s, 'equipment')).toBe(false); expect(facilityVisible(s, 'coffee')).toBe(false);
    expect(act({ ...s, cash: 1000 }, { type: 'hire', cultivar: 'generalist' }).ok).toBe(false);
    expect(act({ ...s, cash: 1000 }, { type: 'research-gene', id: 'focus' }).ok).toBe(false);
  });
  test('28 filed and sold forms earn a named first employee and automatic income', () => {
    const s = earnedOpening();
    expect(s.manualPapers).toBe(28); expect(s.cash).toBe(0); expect(s.elapsed).toBe(28);
    expect(s.corporation.blankForms).toBe(972);
    expect(s.employees).toHaveLength(1); expect(s.employees[0]?.name).toBe('Robin Park');
    const idle = advance(s, 30, () => 0.99);
    expect(idle.revenue).toBeGreaterThan(s.revenue); expect(idle.wages).toBeGreaterThan(0);
    expect(idle.manualPapers).toBe(28); expect(pendingLetter(s)).toBe('first-hire');
  });
  test('manual filing uses inventory and demand, is paced, and pauses with operations', () => {
    const s = initialState(0), filed = perform(s, { type: 'process' });
    expect(filed.cash).toBe(0); expect(filed.revenue).toBe(0); expect(filed.corporation.inventory).toBe(1);
    expect(filed.corporation.blankForms).toBe(999);
    expect(act(filed, { type: 'process' }).ok).toBe(false);
    expect(act({ ...s, paused: true }, { type: 'process' }).ok).toBe(false);
    const expensive = { ...s, corporation: { ...s.corporation, price: 5 } };
    const sold = advance(perform(expensive, { type: 'process' }), 1, () => 0.99);
    expect(sold.revenue).toBeGreaterThan(0); expect(sold.revenue).toBeLessThan(5);
    expect(sold.corporation.inventory).toBeGreaterThan(0);
  });
  test('explicit emergency service can recover zero stock and cash without unlimited rapid clicks', () => {
    const s = { ...initialState(0), corporation: { ...initialState(0).corporation, blankForms: 0 } };
    let recovered = s;
    for (let i = 0; i < 16; i++) recovered = advance(perform(recovered, { type: 'process' }), 1, () => 0.99);
    expect(recovered.cash).toBe(20); expect(recovered.corporation.inventory).toBe(0);
    expect(perform(recovered, { type: 'supplies', packs: 1 }).corporation.blankForms).toBe(250);
  });
  test('learned controls remain discoverable after firing staff or losing cash', () => {
    const s = { ...earnedOpening(), cash: 0, employees: [] };
    expect(discovery(s).hiring).toBe(true); expect(discovery(s).workforce).toBe(true);
  });
});

describe('genomes and meaningful roles', () => {
  test('research alone does not select a genome and changing profiles never rewrites people', () => {
    let s = labFixture(); const original = structuredClone(s.employees);
    s = perform(s, { type: 'research-gene', id: 'focus' });
    expect(s.genome).toEqual([]);
    s = perform(s, { type: 'hire', cultivar: 'generalist' });
    expect(s.employees.at(-1)?.genes).toEqual([]);
    s = perform(s, { type: 'genome', genes: ['focus'] });
    s = perform(s, { type: 'hire', cultivar: 'generalist' });
    const optimized = s.employees.at(-1);
    expect(optimized?.genes).toEqual(['focus']);
    s = perform(s, { type: 'genome', genes: [] });
    expect(s.employees.slice(0, original.length)).toEqual(original);
    expect(s.employees.at(-1)).toEqual(optimized);
    expect(act(s, { type: 'genome', genes: ['focus', 'endurance', 'precision'] }).ok).toBe(false);
    expect(act(s, { type: 'genome', genes: ['focus', 'focus'] }).ok).toBe(false);
    expect(act(s, { type: 'genome', genes: ['synthesis'] }).ok).toBe(false);
  });
  test('actual upgrades preserve production, research and compliance specialization', () => {
    const base = labFixture(), employee = base.employees[0];
    if (!employee) throw new Error('Expected a nonempty lab workforce.');
    const profiles: Record<string, GeneId[]> = { output: ['cognition', 'synthesis'], research: ['focus', 'precision'], compliance: ['endurance', 'focus'] };
    for (const quality of [0, 4, 8]) {
      const s: GameState = { ...base, upgrades: { ...base.upgrades, quality, training: 4 }, facilities: ['coffee', 'snacks', 'cafeteria', 'gym', 'benefits'] };
      const worker = (profile: GeneId[], role: Employee['role']): Employee => ({ ...employee, cultivar: 'specialist', aptitude: 1, genes: profile, role });
      const yieldOf = (profile: GeneId[], role: Employee['role']) => {
        const e = worker(profile, role), risk = risks(s, e);
        return departmentYield(s, e).value * 7.5 / (7.5 + (risk.bugs + risk.slack + risk.breaks) * 4.5);
      };
      expect(yieldOf(profiles.output ?? [], 'operations')).toBeGreaterThan(yieldOf(profiles.research ?? [], 'operations') * 1.8);
      expect(yieldOf(profiles.research ?? [], 'research')).toBeGreaterThan(yieldOf(profiles.output ?? [], 'research') * 2);
      expect(yieldOf(profiles.compliance ?? [], 'compliance')).toBeGreaterThan(yieldOf(profiles.output ?? [], 'compliance') * 1.5);
      const outputWage = payroll({ ...s, employees: [worker(profiles.output ?? [], 'operations')], corporation: { ...s.corporation, branches: [], legacyStaff: [] } });
      const researchWage = payroll({ ...s, employees: [worker(profiles.research ?? [], 'operations')], corporation: { ...s.corporation, branches: [], legacyStaff: [] } });
      expect(outputWage).toBeCloseTo(researchWage * 1.5);
    }
  });
  test('bulk staffing selects effective inherited specialists without changing traits', () => {
    const s = labFixture(), old = s.employees[0];
    if (!old) throw new Error('Expected an employee.');
    const workers: Employee[] = [{ ...old, id: 1, role: 'research', aptitude: 0.85, genes: [] }, { ...old, id: 2, role: 'operations', aptitude: 1.15, genes: ['focus', 'precision'] }];
    const staffed = perform({ ...s, employees: workers }, { type: 'staff', research: 1, sales: 0, compliance: 0 });
    expect(staffed.employees[1]?.role).toBe('research');
    expect(staffed.employees.map(e => e.genes)).toEqual(workers.map(e => e.genes));
    expect(act(s, { type: 'staff', research: s.employees.length + 1, sales: 0, compliance: 0 }).ok).toBe(false);
  });
});

describe('bulk actions, quotes and delegation', () => {
  test('bulk operations replacement is atomic, pays exact quotes and preserves department workers', () => {
    let s = perform(labFixture(), { type: 'research-gene', id: 'focus' });
    s = perform(s, { type: 'genome', genes: ['focus'] });
    s = perform(s, { type: 'staff', research: 1, sales: 1, compliance: 1 });
    const ids = s.employees.filter(e => e.role === 'operations').map(e => e.id);
    const retained = s.employees.filter(e => e.role !== 'operations'), snapshot = structuredClone(s);
    const quote = staffReplacementQuote(s, ids, 'generalist'); if (!quote) throw new Error('Missing valid replacement quote.');
    expect(act({ ...s, cash: 0 }, { type: 'staff-replace', ids, cultivar: 'generalist' }).ok).toBe(false);
    expect(act(s, { type: 'staff-replace', ids, cultivar: 'executive' }).ok).toBe(false);
    expect(act(s, { type: 'staff-transfer', ids: [ids[0] ?? 0, ids[0] ?? 0] }).ok).toBe(false);
    expect(act(s, { type: 'staff-transfer', ids: retained.map(e => e.id) }).ok).toBe(false);
    expect(act(s, { type: 'staff-replace', ids: [9999], cultivar: 'generalist' }).ok).toBe(false);
    const replaced = perform(s, { type: 'staff-replace', ids, cultivar: 'generalist' });
    expect(s.cash - replaced.cash).toBe(quote.net);
    expect(replaced.employees.filter(e => e.role !== 'operations')).toEqual(retained);
    expect(replaced.employees.filter(e => e.role === 'operations').every(e => e.genes.join(',') === 'focus' && e.id >= s.nextId)).toBe(true);
    expect(replaced.employees).toHaveLength(s.employees.length);
    expect(s).toEqual(snapshot); expect(GameSchema.safeParse(replaced).success).toBe(true);
    const transferred = perform(s, { type: 'staff-transfer', ids });
    expect(transferred.cash - s.cash).toBe(s.employees.filter(e => ids.includes(e.id)).reduce((sum, e) => sum + saleValue(e), 0));
    expect(transferred.employees).toEqual(retained);
  });
  test('headquarters bulk hires and upgrades pay exact sequential prices and fail atomically', () => {
    const s = { ...officeFixture(), cash: 10000, revenue: 10000 }, snapshot = structuredClone(s);
    const quote = hireQuote(s, 'generalist', 5), bought = perform(s, { type: 'hire', cultivar: 'generalist', count: 5 });
    let sequential = s;
    for (let i = 0; i < 5; i++) sequential = perform(sequential, { type: 'hire', cultivar: 'generalist' });
    expect(bought.cash).toBe(sequential.cash); expect(s.cash - bought.cash).toBe(quote.cost);
    expect(bought.employees).toHaveLength(8); expect(bought.nextId).toBe(s.nextId + 5);
    expect(act(s, { type: 'hire', cultivar: 'generalist', count: 7 }).ok).toBe(false);
    expect(act(s, { type: 'hire', cultivar: 'generalist', count: NaN }).ok).toBe(false);
    const improvements = perform(s, { type: 'upgrade', id: 'equipment', count: 3 });
    let levels = s;
    for (let i = 0; i < 3; i++) levels = perform(levels, { type: 'upgrade', id: 'equipment' });
    expect(improvements.cash).toBe(levels.cash); expect(upgradeQuote(s, 'equipment').count).toBeGreaterThanOrEqual(3);
    expect(s).toEqual(snapshot);
  });
  test('800-person branch fill, bulk expansion and atomic replacement are usable', () => {
    let s = { ...conglomerateFixture(), cash: 10000000 };
    s = perform(s, { type: 'branch' });
    const branch = s.corporation.branches[0]; if (!branch) throw new Error('Missing branch.');
    const capacity = branchExpansionQuote(branch, s.cash);
    expect(capacity.count).toBe(7);
    s = perform(s, { type: 'branch-upgrade', id: branch.id, count: capacity.count });
    const expanded = s.corporation.branches[0]; if (!expanded) throw new Error('Missing expanded branch.');
    const quote = cohortQuote(expanded, 'generalist', s.cash);
    expect(quote.count).toBe(800);
    const cash = s.cash;
    s = perform(s, { type: 'cohort', branch: branch.id, cultivar: 'generalist', count: quote.count });
    expect(cash - s.cash).toBe(quote.cost); expect(s.corporation.branches[0]?.cohorts[0]?.count).toBe(800);
    const filled = s.corporation.branches[0]; if (!filled) throw new Error('Missing filled branch.');
    const replacement = cohortReplacementQuote(filled, 0, 'processor'); if (!replacement) throw new Error('Missing replacement quote.');
    expect(act({ ...s, cash: 0 }, { type: 'cohort-replace', branch: branch.id, index: 0, cultivar: 'processor' }).ok).toBe(false);
    s = perform(s, { type: 'research-cultivar', id: 'processor' });
    const before = s.cash, old = structuredClone(filled.cohorts[0]);
    s = perform(s, { type: 'cohort-replace', branch: branch.id, index: 0, cultivar: 'processor' });
    expect(before - s.cash).toBe(replacement.net); expect(s.corporation.branches[0]?.cohorts[0]?.cultivar).toBe('processor');
    expect(filled.cohorts[0]).toEqual(old); expect(GameSchema.safeParse(s).success).toBe(true);
    expect(cohortCost(expanded, 'generalist', 800)).toBe(quote.cost);
  });
  test('recurring memos respect reserves and contracts renew only with safe capacity', () => {
    const s = labFixture(), reserve = operatingReserve(s);
    const instructed = perform({ ...s, cash: reserve + 19 }, { type: 'automation', ...s.automation, memos: true, contracts: 'local' });
    const safe = advance(instructed, 1, () => 0.99);
    expect(safe.memo.status).toBe('ready'); expect(safe.corporation.contract.status).toBe('idle');
    const funded = advance({ ...instructed, cash: reserve + 1000, upgrades: { ...s.upgrades, equipment: 12 } }, 1, () => 0.99);
    expect(funded.memo.status).toBe('active'); expect(funded.corporation.contract.status).toBe('active');
    const idle = advance({ ...funded, corporation: { ...funded.corporation, blankForms: 10000 } }, 400, () => 0.99);
    expect(idle.corporation.completedContracts).toBeGreaterThan(1); expect(idle.corporation.failedContracts).toBe(0);
  });
  test('procurement keeps its reserve, with a single-pack recovery exception', () => {
    const s = enterpriseFixture(), reserve = s.automation.reserve;
    const stocked = advance({ ...s, cash: reserve + 21, corporation: { ...s.corporation, blankForms: 200 } }, 1, () => 0.99);
    expect(stocked.corporation.supplySpent - s.corporation.supplySpent).toBe(20);
    expect(stocked.cash).toBeGreaterThanOrEqual(reserve);
    const stopped = { ...s, cash: 20, employees: [], corporation: { ...s.corporation, blankForms: 0 } };
    const resumed = advance(stopped, 1, () => 0.99);
    expect(resumed.corporation.blankForms).toBe(250); expect(resumed.cash).toBe(0);
  });
  test('network quotes are maximal within budget and delegated builds retain cash', () => {
    const n = initialNetwork(), quote = assetQuote(n, 'plants', 10000000);
    expect(quote.count).toBeGreaterThan(1000);
    expect(quote.cost).toBeLessThanOrEqual(10000000);
    expect(assetCost(n, 'plants', quote.count + 1)).toBeGreaterThan(10000000);
    let s = perform(networkFixture(), { type: 'protocol', id: 'distributed' });
    s = advance(s, 600, () => 0.99);
    if (s.corporation.phase.id !== 'network') throw new Error('Delegation fixture left the Network.');
    expect(s.corporation.phase.network.completed).toBeGreaterThanOrEqual(10000);
    s = perform(s, { type: 'network-building', policy: 'balanced' });
    const p = s.corporation.phase; if (p.id !== 'network') throw new Error('Missing network.');
    const constrained: GameState = { ...s, cash: 10000, automation: { ...s.automation, reserve: 8000 }, corporation: { ...s.corporation, phase: { id: 'network', network: { ...p.network, nodes: 100000 } } } };
    const built = tickInfrastructure(constrained);
    expect(built.cash).toBeGreaterThanOrEqual(8000); expect(built.cash).toBeLessThan(constrained.cash);
    expect(GameSchema.safeParse(built).success).toBe(true);
    expect(NetworkSchemaCheck()).toBe(false);
    function NetworkSchemaCheck() { return GameSchema.safeParse({ ...s, corporation: { ...s.corporation, phase: { id: 'network', network: { ...initialNetwork(), infrastructure: 'balanced' } } } }).success; }
  });
});

describe('correspondence, endings and preserved history', () => {
  test('permanent choices wait offline, apply once, and explain their ending cost', () => {
    let s = labFixture();
    s = { ...s, story: { ...s.story, promise: 'undecided', cultivation: 'undecided' } };
    const offline = advance(s, 7200, () => 0.99);
    expect(offline.story).toEqual(s.story);
    const chosen = perform(s, { type: 'reply', letter: 'cultivation', choice: 'patent' });
    expect(act(chosen, { type: 'reply', letter: 'cultivation', choice: 'consent' }).ok).toBe(false);
    expect(commonsSettlement(chosen)).toBe(250000);
    const consent = perform(s, { type: 'reply', letter: 'cultivation', choice: 'consent' });
    expect(commonsSettlement(consent)).toBe(0);
    const end = networkFixture(), phase = end.corporation.phase; if (phase.id !== 'network') throw new Error('Missing network.');
    const finished: GameState = { ...end, cash: 249999, story: chosen.story, corporation: { ...end.corporation, phase: { id: 'network', network: { ...phase.network, undiscovered: 0, discovered: 0, completed: WORLD_WORKFLOWS } } } };
    expect(act(finished, { type: 'ending', ending: 'commons' }).ok).toBe(false);
    const paid = perform({ ...finished, cash: 250000 }, { type: 'ending', ending: 'commons' });
    expect(paid.cash).toBe(0); expect(endingEcho(paid)).toContain('patents');
    expect(act(end, { type: 'ending', ending: 'monopoly' }).ok).toBe(false);
  });
  test('v2 migration preserves office, cohorts, old stacked genes and network progress', () => {
    const cohortState = perform(perform(conglomerateFixture(), { type: 'branch' }), { type: 'cohort', branch: 1, cultivar: 'generalist', count: 10 });
    const genes: GeneId[] = ['focus', 'endurance', 'precision', 'cognition', 'synthesis'];
    const allGenes: GameState = { ...cohortState, genes, employees: cohortState.employees.map(e => ({ ...e, genes, produced: 1234 })), corporation: { ...cohortState.corporation, branches: cohortState.corporation.branches.map(b => ({ ...b, cohorts: b.cohorts.map(g => ({ ...g, genes })) })) } };
    for (const old of [officeFixture(), allGenes, networkFixture()]) {
      const parsed = parseGame(v2Record(old)); expect(parsed.success).toBe(true);
      if (!parsed.success) throw new Error(parsed.error.message);
      expect(parsed.data.cash).toBe(old.cash); expect(parsed.data.employees).toEqual(old.employees);
      expect(parsed.data.corporation.branches).toEqual(old.corporation.branches);
      expect(parsed.data.corporation.projects).toEqual(old.corporation.projects);
      expect(parsed.data.corporation.legacy).toEqual(old.corporation.legacy);
      expect(parsed.data.genome).toEqual([]);
    }
  });
  test('retired v2 network crises cannot become permanent penalties', () => {
    for (const crisis of [{ status: 'pending', id: 'outage', remaining: 1 }, { status: 'effect', id: 'outage', remaining: 1, output: 0.6, demand: 1, research: 1 }] as const) {
      const old = networkFixture(), raw = v2Record({ ...old, corporation: { ...old.corporation, crisis } });
      const parsed = parseGame(raw); expect(parsed.success).toBe(true);
      if (!parsed.success) throw new Error(parsed.error.message);
      expect(parsed.data.corporation.crisis.status).toBe('calm');
      expect(advance(parsed.data, 7200).corporation.crisis.status).toBe('calm');
    }
  });
  test('missing current-version fields trigger recovery without overwriting the original', () => {
    const s = labFixture();
    for (const field of ['story', 'genome', 'automation', 'manualCooldown']) {
      const broken: Record<string, unknown> = { ...s }; delete broken[field];
      const raw = JSON.stringify(broken), storage = { getItem: (_key: string) => raw };
      expect(parseGame(broken).success).toBe(false); expect(loadGame(storage, 0).status).toBe('recovery'); expect(storage.getItem(SAVE_KEY)).toBe(raw);
    }
  });
  test('migration rejects damaged old crises before retiring them and current network crises', () => {
    const s = networkFixture();
    const damaged = { ...s, corporation: { ...s.corporation, crisis: { status: 'effect', id: 'outage', remaining: -999, output: -999 } } };
    const old = { ...v2Record(s), corporation: damaged.corporation };
    for (const broken of [old, { ...s, corporation: { ...s.corporation, crisis: { status: 'effect', id: 'outage', remaining: 30, output: 0.6, demand: 1, research: 1 } } }]) {
      const raw = JSON.stringify(broken), storage = { getItem: (_key: string) => raw };
      expect(parseGame(broken).success).toBe(false);
      expect(loadGame(storage, 0).status).toBe('recovery');
      expect(storage.getItem(SAVE_KEY)).toBe(raw);
    }
  });
  test('paused network progress is preserved and can resume through the normal action', () => {
    const s = { ...networkFixture(), paused: true };
    const parsed = parseGame(s); expect(parsed.success).toBe(true);
    expect(advance(s, 60)).toEqual(s);
    const resumed = perform(s, { type: 'pause' });
    expect(advance(resumed, 60).elapsed).toBe(s.elapsed + 60);
    const lowered = perform(s, { type: 'automation', ...s.automation, reserve: 0 });
    expect(lowered.automation.reserve).toBe(0);
  });
});

describe('reward pacing and strategy benchmarks', () => {
  test('investment priorities change with equipment saturation and workforce scale', () => {
    const early = { ...officeFixture(), cash: 50000, revenue: 10000, corporation: { ...officeFixture().corporation, marketing: 5 } };
    const equipment = marginalPurchase(early, { ...early, upgrades: { ...early.upgrades, equipment: 1 } }, upgradeCost(early, 'equipment'));
    const coffee = marginalPurchase(early, { ...early, facilities: ['coffee'] }, 25);
    expect(equipment.payback).not.toBeNull(); expect(coffee.payback).not.toBeNull();
    expect(equipment.payback ?? Infinity).toBeLessThan(coffee.payback ?? 0);
    let large = perform(early, { type: 'upgrade', id: 'capacity', count: 2 });
    large = perform(large, { type: 'hire', cultivar: 'generalist', count: 33 });
    large = { ...large, upgrades: { ...large.upgrades, equipment: 4 } };
    const lateEquipment = marginalPurchase(large, { ...large, upgrades: { ...large.upgrades, equipment: 5 } }, upgradeCost(large, 'equipment'));
    const lateCoffee = marginalPurchase(large, { ...large, facilities: ['coffee'] }, 25);
    expect(lateCoffee.payback).not.toBeNull();
    expect(lateCoffee.payback ?? Infinity).toBeLessThan(lateEquipment.payback ?? 0);
    expect(expectedOutput(large)).toBeGreaterThan(expectedOutput(early));
    const e = large.employees[0]; if (!e) throw new Error('Missing worker.');
    expect(employeeRate(large, e)).toBeGreaterThan(employeeRate(early, e));
    expect(geneEffects(['synthesis']).wages).toBe(1.5);
  });
  test.each([7, 42, 101])('both paths earn discovery and finish without recurring maintenance, seed %s', seed => {
    for (const path of ['stewardship', 'extraction'] as const) {
      const run = playthrough(path, seed);
      expect(run.state.manualPapers).toBe(28);
      expect(run.milestones.filter(m => m.seconds <= 300).length).toBeGreaterThanOrEqual(3);
      expect(run.actions.find(a => a.type === 'project')?.seconds ?? Infinity).toBeLessThanOrEqual(300);
      expect(run.transitions.find(t => t.phase === 'enterprise')?.seconds ?? Infinity).toBeLessThanOrEqual(900);
      expect(run.transitions.find(t => t.phase === 'conglomerate')?.seconds ?? Infinity).toBeLessThanOrEqual(2100);
      expect(run.state.elapsed).toBeLessThanOrEqual(90 * 60);
      expect(run.state.corporation.policy).toBe(path === 'stewardship' ? 'humane' : 'lean');
      expect(run.state.genome).toEqual(path === 'stewardship' ? ['focus', 'precision'] : ['cognition', 'synthesis']);
      expect(run.clicks).toBeLessThan(350);
      expect(run.interactions).toBeLessThan(350);
      const networkStart = run.transitions.find(t => t.phase === 'network')?.seconds;
      if (networkStart === undefined) throw new Error('Network transition missing.');
      const rewards = run.actions.filter(a => a.phase === 'network' && ['protocol', 'read-letter'].includes(a.type) && a.seconds > networkStart);
      expect((rewards[0]?.seconds ?? Infinity) - networkStart).toBeLessThanOrEqual(300);
      const cadence = [networkStart, ...rewards.map(a => a.seconds), run.state.elapsed];
      expect(Math.max(...cadence.slice(1).map((time, i) => time - (cadence[i] ?? 0)))).toBeLessThanOrEqual(360);
      const maintenance = run.actions.filter(a => a.phase === 'network' && ['review', 'supplies', 'memo', 'network-asset', 'staff', 'assign', 'cohort'].includes(a.type));
      expect(maintenance).toEqual([]);
      expect(GameSchema.safeParse(run.state).success).toBe(true);
    }
  });
  test('staged allocation materially beats static plans without constant management', () => {
    const staged = playthrough('stewardship', 7, undefined, 'staged');
    const growth = playthrough('stewardship', 7, undefined, 'growth');
    const survey = playthrough('stewardship', 7, undefined, 'survey');
    const entry = staged.transitions.find(t => t.phase === 'network')?.seconds;
    if (entry === undefined) throw new Error('Network entry was not recorded.');
    expect(staged.state.elapsed - entry).toBeLessThan((growth.state.elapsed - entry) * 0.8);
    expect(survey.state.elapsed).toBeLessThan(4 * 3600);
    expect(survey.state.elapsed).toBeGreaterThan(growth.state.elapsed);
    expect(staged.actions.filter(a => a.type === 'network-plan').length).toBeLessThanOrEqual(3);
    for (const run of [staged, growth, survey]) {
      const phase = run.state.corporation.phase; if (phase.id !== 'network') throw new Error('Missing completed network.');
      expect(phase.network.completed).toBe(WORLD_WORKFLOWS);
      expect(phase.network.lost).toBe(0);
    }
  });
});
