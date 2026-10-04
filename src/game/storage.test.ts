import { expect, test } from 'bun:test';
import { officeFixture } from './testing/fixtures';
import { GameSchema, initialState } from './state';
import { loadGame, readSaveSnapshot, saveGame, saveGameIfUnchanged, SAVE_KEY } from './storage';

function memoryStorage() {
  const records = new Map<string, string>();
  return { getItem: (key: string) => records.get(key) ?? null, setItem: (key: string, value: string) => { records.set(key, value); } };
}
test('save round trip preserves employee genes, research and funds', () => {
  const storage = memoryStorage(), base = officeFixture();
  const state = { ...base, lastSeen: 1000, genes: ['focus', 'precision'] as const, genome: ['precision'] as const, employees: base.employees.map(e => ({ ...e, genes: ['focus'] as const })) };
  const parsed = GameSchema.parse(state);
  expect(parsed.employees).toHaveLength(3);
  expect(saveGame(storage, parsed, 1000).ok).toBe(true);
  expect(loadGame(storage, 1000).state).toEqual(parsed);
});
test('offline earnings are capped at two hours and pause earns nothing', () => {
  const storage = memoryStorage();
  saveGame(storage, officeFixture(), 0);
  const loaded = loadGame(storage, 10 * 3600 * 1000);
  expect(loaded.state.elapsed).toBe(7200);
  expect(loaded.state.revenue).toBeGreaterThan(0);
  expect(GameSchema.safeParse(loaded.state).success).toBe(true);
  const paused = { ...officeFixture(), paused: true };
  saveGame(storage, paused, 0);
  expect(loadGame(storage, 100000).state).toEqual({ ...paused, lastSeen: 100000 });
});
test('malformed saves enter recovery without overwriting the original', () => {
  const storage = memoryStorage(); storage.setItem(SAVE_KEY, '{broken');
  expect(loadGame(storage).status).toBe('recovery');
  expect(storage.getItem(SAVE_KEY)).toBe('{broken');
  storage.setItem(SAVE_KEY, JSON.stringify({ ...initialState(0), cash: -1 }));
  expect(loadGame(storage).status).toBe('recovery');
});
test('storage failures are surfaced as recoverable errors', () => {
  const storage = { getItem: () => { throw new Error('Disabled'); }, setItem: () => { throw new Error('Full'); } };
  expect(loadGame(storage).notice).toContain('unavailable');
  expect(saveGame(storage, initialState()).ok).toBe(false);
});
test('a stale tab cannot overwrite another tab replacement and keeps its local company', () => {
  const storage = memoryStorage();
  saveGame(storage, officeFixture(), 0);
  const firstTab = loadGame(storage, 0), staleTab = loadGame(storage, 0);
  const replacement = initialState(0);
  const saved = saveGameIfUnchanged(storage, replacement, firstTab.snapshot, 0);
  expect(saved.ok).toBe(true);
  const raw = storage.getItem(SAVE_KEY);
  const blocked = saveGameIfUnchanged(storage, staleTab.state, staleTab.snapshot, 1000);
  expect(blocked.ok).toBe(false);
  if (!blocked.ok) expect(blocked.message).toContain('Export');
  expect(storage.getItem(SAVE_KEY)).toBe(raw);
  expect(loadGame(storage, 0).state).toEqual(replacement);
  expect(staleTab.state.employees).toHaveLength(3);
  expect(staleTab.state.cash).toBe(officeFixture().cash);
});
test('successive own saves advance the expected snapshot and deliberate replacement can refresh it', () => {
  const storage = memoryStorage(), initial = loadGame(storage, 0);
  const first = saveGameIfUnchanged(storage, officeFixture(), initial.snapshot, 1000);
  expect(first.ok).toBe(true);
  if (!first.ok) throw new Error(first.message);
  const ownSnapshot = { status: 'known', raw: first.raw } as const;
  const secondState = { ...officeFixture(), cash: 2000 };
  const second = saveGameIfUnchanged(storage, secondState, ownSnapshot, 2000);
  expect(second.ok).toBe(true);
  expect(loadGame(storage, 2000).state.cash).toBe(2000);
  saveGame(storage, { ...secondState, cash: 3000 }, 3000);
  const replacement = initialState(4000);
  expect(saveGameIfUnchanged(storage, replacement, readSaveSnapshot(storage), 4000).ok).toBe(true);
  expect(loadGame(storage, 4000).state).toEqual(replacement);
});
test('unreadable storage is an unknown snapshot and cannot overwrite an existing company', () => {
  const storage = memoryStorage();
  saveGame(storage, officeFixture(), 0);
  const original = storage.getItem(SAVE_KEY);
  const unreadable = { ...storage, getItem: () => { throw new Error('Read failed'); } };
  const loaded = loadGame(unreadable, 0);
  expect(loaded.snapshot.status).toBe('unavailable');
  expect(saveGameIfUnchanged(storage, loaded.state, loaded.snapshot, 1000).ok).toBe(false);
  expect(storage.getItem(SAVE_KEY)).toBe(original);
});
test('save validation rejects duplicate employees and out-of-capacity hires', () => {
  const state = officeFixture(), employee = state.employees[0];
  if (!employee) throw new Error('Expected an employee.');
  expect(GameSchema.safeParse({ ...state, employees: [employee, employee] }).success).toBe(false);
  expect(GameSchema.safeParse({ ...state, employees: Array.from({ length: 13 }, (_, i) => ({ ...employee, id: i + 1 })), nextId: 14 }).success).toBe(false);
  expect(GameSchema.safeParse({ ...state, genes: ['synthesis'] }).success).toBe(false);
});

test('version one saves migrate without changing cash, hires, genes, or their historical output', () => {
  const storage = memoryStorage(), state = { ...officeFixture(), lastSeen: 1000 };
  expect(state.employees).toHaveLength(3);
  const { genome: _genome, story: _story, manualCooldown: _cooldown, automation: _automation, corporation: _corporation, ...base } = state;
  const legacy = { ...base, version: 1, cash: 5432, revenue: 12345, genes: ['focus'], employees: base.employees.map(({ role: _role, ...employee }) => ({ ...employee, produced: 125, genes: ['focus'] })) };
  const raw = JSON.stringify(legacy);
  storage.setItem(SAVE_KEY, raw);
  const loaded = loadGame(storage, 1000);
  expect(loaded.status).toBe('ready');
  expect(loaded.state.version).toBe(3);
  expect(loaded.state.employees).toHaveLength(3);
  expect(loaded.state.cash).toBe(5432);
  expect(loaded.state.genes).toEqual(['focus']);
  expect(loaded.state.employees.every(e => e.produced === 125 && e.genes.length === 1 && e.genes[0] === 'focus' && e.role === 'operations')).toBe(true);
  expect(storage.getItem(SAVE_KEY)).toBe(raw);
  expect(GameSchema.safeParse(loaded.state).success).toBe(true);
});
