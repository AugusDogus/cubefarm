import { expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { act, advance } from './engine';
import { GameSchema, type GameState } from './state';
import { departmentYield, risks } from './workforce';
import { initialNetwork, tickNetwork, networkAdvice } from './network';
import { objectiveWorkspace } from './objectives';
import { tickAutomation } from './automation';
import { Operations, Memo } from '../components/Operations';
import { Network } from '../components/Network';
import { officeFixture, labFixture, conglomerateFixture, networkFixture, perform } from './testing/fixtures';
import { saveGame, SAVE_KEY } from './storage';

test('retail prices above five dollars and positive cent prices survive actions and saves', () => {
  const s = officeFixture();
  for (const price of [0.01, 0.1, 12.34, 100000]) {
    const changed = perform(s, { type: 'price', value: price });
    expect(changed.corporation.price).toBe(price);
    expect(GameSchema.safeParse(changed).success).toBe(true);
    expect(GameSchema.safeParse(advance(changed, 60, () => 0.99)).success).toBe(true);
  }
  expect(perform(s, { type: 'price', value: 8.126 }).corporation.price).toBe(8.13);
  for (const value of [0, -1, 0.001, Infinity, NaN, Number.MAX_VALUE]) {
    expect(act(s, { type: 'price', value }).ok).toBe(false);
    expect(GameSchema.safeParse({ ...s, corporation: { ...s.corporation, price: value } }).success).toBe(false);
  }
  const markup = renderToStaticMarkup(<Operations state={s} dispatch={() => {}} />);
  expect(markup).not.toContain('max="5"');
});

test('specialists retain a research niche after executives become available', () => {
  const s = labFixture(), e = s.employees[0];
  if (!e) throw new Error('Expected a nonempty workforce.');
  for (const quality of [0, 8]) {
    const state = { ...s, upgrades: { ...s.upgrades, quality } };
    const expected = (cultivar: 'specialist' | 'executive', role: 'research' | 'operations') => {
      const employee = { ...e, cultivar, role, aptitude: 1, genes: [] };
      const risk = risks(state, employee);
      return departmentYield(state, employee).value * 7.5 / (7.5 + Math.min(1, risk.slack + risk.breaks + risk.bugs) * 4.5);
    };
    expect(expected('specialist', 'research')).toBeGreaterThan(expected('executive', 'research'));
    expect(expected('executive', 'operations')).toBeGreaterThan(expected('specialist', 'operations'));
  }
});

test('automated memos avoid saturated retail waste but can support research and orders', () => {
  const base = labFixture();
  const saturated = { ...base, cash: 10000, automation: { ...base.automation, memos: true }, upgrades: { ...base.upgrades, equipment: 12 }, corporation: { ...base.corporation, price: 5, inventory: 10000, blankForms: 5000 } };
  expect(tickAutomation(saturated).memo.status).toBe('ready');
  const manual = perform(saturated, { type: 'memo' });
  expect(manual.memo.status).toBe('active');
  expect(renderToStaticMarkup(<Memo state={saturated} dispatch={() => {}} />)).toContain('Retail sales cannot cover this memo');
  const research = { ...saturated, employees: saturated.employees.map((e, i) => i === 0 ? { ...e, role: 'research' as const } : e) };
  expect(tickAutomation(research).memo.status).toBe('active');
  const order = { ...saturated, corporation: { ...saturated.corporation, contract: { status: 'active', id: 'local', remaining: 90, delivered: 0, allocation: 'half' } as const } };
  expect(tickAutomation(order).memo.status).toBe('active');
});

test('new networks grow safely even at maximum pressure, without a required first click', () => {
  const n = initialNetwork();
  const advanced = tickNetwork(n, 1, 100).network;
  expect(advanced.nodes).toBeGreaterThan(n.nodes);
  expect(advanced.lost).toBe(0);
  expect(advanced.completed).toBeGreaterThan(0);
});

test('stalled network guidance restores growth at small scale and clearance at sufficient scale', () => {
  const small = { ...initialNetwork(), nodes: 12, allocation: { discover: 0, replicate: 0, process: 100, stabilize: 0 } };
  expect(networkAdvice(small, 0).plan).toBe('grow');
  expect(networkAdvice(small, 0).message).toContain('Offices are being lost');
  expect(networkAdvice({ ...small, nodes: 5000 }, 0).plan).toBe('clear');
  const stable = { ...small, allocation: { discover: 0, replicate: 0, process: 86, stabilize: 14 } };
  expect(networkAdvice(stable, 0).plan).toBe('grow');
  expect(networkAdvice(stable, 0).message).toContain('Clearance will stop');
  const s = networkFixture();
  if (s.corporation.phase.id !== 'network') throw new Error('Expected Network fixture.');
  const markup = renderToStaticMarkup(<Network state={{ ...s, corporation: { ...s.corporation, phase: { ...s.corporation.phase, network: small } } }} dispatch={() => {}} />);
  expect(markup).toContain('Use Grow');
  expect(markup).not.toContain('Max affordable');
  expect(markup).toContain('excess capacity does not accelerate replication');
});

test('objective navigation leads to actual staffing, expansion, and correspondence blockers', () => {
  const base = labFixture();
  expect(objectiveWorkspace(base, 'regional')).toBe('Development');
  let regional = base;
  for (const id of ['legal', 'centralization', 'mergers', 'stewardship'] as const) regional = perform(regional, { type: 'project', id });
  expect(objectiveWorkspace(regional, 'regional')).toBe('Company');
  expect(objectiveWorkspace({ ...base, employees: [] }, 'charter')).toBe('Development');
  const office = officeFixture();
  const prepared = { ...office, corporation: { ...office.corporation, projects: ['time-study', 'procurement', 'standards'] as const } };
  expect(objectiveWorkspace(GameSchema.parse(prepared), 'charter')).toBe(null);
  expect(objectiveWorkspace({ ...GameSchema.parse(prepared), story: { ...office.story, promise: 'voice' } }, 'charter')).toBe('Office');
});

test('numeric counter limits reject increment actions without changing the company', () => {
  const s = { ...officeFixture(), nextId: Number.MAX_SAFE_INTEGER, manualPapers: Number.MAX_SAFE_INTEGER };
  expect(GameSchema.safeParse(s).success).toBe(true);
  expect(act(s, { type: 'hire', cultivar: 'generalist' }).ok).toBe(false);
  expect(act(s, { type: 'process' }).ok).toBe(false);
});

test('emergency supply funding survives acquired payroll after one-time relief is spent', () => {
  const base = perform(conglomerateFixture(), { type: 'acquire', id: 'memo' });
  let s: GameState = { ...base, cash: 0, employees: [], corporation: { ...base.corporation, blankForms: 0, inventory: 0, autoBuy: false, supplierReliefUsed: true } };
  expect(s.corporation.legacyStaff.reduce((sum, cohort) => sum + cohort.count, 0)).toBe(84);
  for (let i = 0; i < 16; i++) s = advance(perform(s, { type: 'process' }), 1, () => 0.99);
  expect(s.cash).toBe(20);
  expect(s.corporation.emergencyReserve).toBe(20);
  expect(GameSchema.safeParse(s).success).toBe(true);
  const restored = perform(s, { type: 'supplies', packs: 1 });
  expect(restored.corporation.blankForms).toBe(250);
  expect(restored.corporation.emergencyReserve).toBe(0);
  expect(advance(restored, 1, () => 0.99).corporation.outputRate).toBeGreaterThan(0);
});

test('memo instructions do not assume future blank stock when procurement is disabled', () => {
  const base = labFixture();
  const s = { ...base, cash: 1000, employees: base.employees.slice(0, 1), automation: { ...base.automation, memos: true }, corporation: { ...base.corporation, blankForms: 1, inventory: 0, autoBuy: false } };
  expect(tickAutomation(s).memo.status).toBe('ready');
});

test('delegated orders require funding to reach escrow payment, even with ample throughput', () => {
  let s = labFixture();
  s = perform(s, { type: 'upgrade', id: 'capacity', count: 5 });
  s = perform({ ...s, cash: 10000000 }, { type: 'hire', cultivar: 'generalist', count: 250 });
  const instructed = { ...s, cash: 733, revenue: 200000, upgrades: { ...s.upgrades, equipment: 12 }, automation: { ...s.automation, contracts: 'national' as const }, corporation: { ...s.corporation, autoBuy: true, blankForms: 0, inventory: 0, price: 5 } };
  expect(tickAutomation(instructed).corporation.contract.status).toBe('idle');
});

test('late letters remain readable after the ending without restarting the company', () => {
  const s = networkFixture();
  const ended = { ...s, corporation: { ...s.corporation, phase: { id: 'ending', ending: 'commons', nodes: 10000, completedAt: 4000 } as const } };
  const read = perform(ended, { type: 'read-letter', id: 'first-hire' });
  expect(read.story.read).toContain('first-hire');
  expect(read.cash).toBe(ended.cash);
  expect(read.corporation.phase).toEqual(ended.corporation.phase);
  expect(act(ended, { type: 'hire', cultivar: 'generalist' }).ok).toBe(false);
});

test('impossible numeric saves are rejected and never overwrite an existing save', () => {
  const s = networkFixture();
  if (s.corporation.phase.id !== 'network') throw new Error('Expected Network fixture.');
  const invalid = { ...s, corporation: { ...s.corporation, phase: { ...s.corporation.phase, network: { ...s.corporation.phase.network, nodes: Number.MAX_VALUE } } } };
  expect(GameSchema.safeParse(invalid).success).toBe(false);
  const records = new Map([[SAVE_KEY, 'original']]);
  const result = saveGame({ setItem: (key, value) => { records.set(key, value); } }, invalid);
  expect(result.ok).toBe(false);
  expect(records.get(SAVE_KEY)).toBe('original');
});

test('network ETA is outside the live status region', () => {
  const s = networkFixture();
  if (s.corporation.phase.id !== 'network') throw new Error('Expected Network fixture.');
  const markup = renderToStaticMarkup(<Network state={{ ...s, corporation: { ...s.corporation, phase: { ...s.corporation.phase, network: { ...s.corporation.phase.network, processedRate: 10 } } } }} dispatch={() => {}} />);
  expect(markup).toContain('role="status"');
  const regions = Array.from(markup.matchAll(/<(\w+)[^>]*role="status"[^>]*>(.*?)<\/\1>/gs));
  expect(regions.length).toBeGreaterThan(0);
  for (const region of regions) expect(region[2]).not.toContain('At this rate:');
});
