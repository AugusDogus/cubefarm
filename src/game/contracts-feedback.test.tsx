import { expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { tickAutomation } from './automation';
import { contractAutomationStatus, memoAutomationStatus } from './automation-status';
import { routeContract } from './contracts';
import { GameSchema, parseGame, type GameState } from './state';
import { labFixture, perform } from './testing/fixtures';
import { ContractDesk } from '../components/Strategy';
import { Delegation } from '../components/Delegation';

function renewalFixture(): GameState {
  const s = labFixture();
  return { ...s, upgrades: { ...s.upgrades, equipment: 12 }, automation: { ...s.automation, contracts: 'local', allocation: 'half' }, corporation: { ...s.corporation, blankForms: 250, autoBuy: false } };
}

test('standing orders use selected allocation for supply sufficiency and preserve it when saved', () => {
  const half = renewalFixture();
  expect(contractAutomationStatus(half)).toMatchObject({ status: 'blocked' });
  expect(tickAutomation(half).corporation.contract.status).toBe('idle');
  const all: GameState = { ...half, automation: { ...half.automation, allocation: 'all' } };
  expect(contractAutomationStatus(all)).toMatchObject({ status: 'ready' });
  expect(tickAutomation(all).corporation.contract).toMatchObject({ status: 'active', allocation: 'all' });
  const restored = parseGame(JSON.parse(JSON.stringify(all)));
  if (!restored.success) throw new Error('Valid standing instructions did not restore.');
  expect(restored.data.automation.allocation).toBe('all');
  const { allocation: _allocation, ...oldAutomation } = all.automation;
  const { lastContract: _lastContract, ...oldCorporation } = all.corporation;
  const old = parseGame({ ...all, automation: oldAutomation, corporation: oldCorporation });
  if (!old.success) throw new Error('Historical instructions did not migrate.');
  expect(old.data.automation.allocation).toBe('half');
  expect(old.data.corporation.lastContract).toBeNull();
});

test('shared order diagnostic predicts exact cash guard, including shorter all-output payroll and maintenance', () => {
  const base = renewalFixture();
  const half: GameState = { ...base, cash: 0, corporation: { ...base.corporation, blankForms: 0, autoBuy: true } };
  const all: GameState = { ...half, automation: { ...half.automation, allocation: 'all' } };
  const halfStatus = contractAutomationStatus(half), allStatus = contractAutomationStatus(all);
  if (halfStatus.status !== 'blocked' || allStatus.status !== 'blocked') throw new Error('Unfunded order must be blocked.');
  expect(halfStatus.cashShortfall).toBeGreaterThan(allStatus.cashShortfall);
  for (const s of [half, all]) {
    const status = contractAutomationStatus(s);
    if (status.status !== 'blocked') throw new Error('Missing funding diagnostic.');
    const funded = { ...s, cash: status.cashShortfall };
    expect(contractAutomationStatus(funded).status).toBe('ready');
    expect(tickAutomation(funded).corporation.contract.status).toBe('active');
    const poor = { ...funded, cash: funded.cash - 0.01 };
    expect(contractAutomationStatus(poor).status).toBe('blocked');
    expect(tickAutomation(poor)).toEqual(poor);
  }
});

test('an automatic memo cannot consume the supply and payroll budget reserved for a newly renewed order', () => {
  const base = renewalFixture();
  const s: GameState = { ...base, cash: 0, automation: { ...base.automation, memos: true, allocation: 'all' } };
  const status = contractAutomationStatus(s);
  if (status.status !== 'blocked') throw new Error('Missing order funding requirement.');
  const funded = { ...s, cash: status.cashShortfall };
  const next = tickAutomation(funded);
  expect(next.corporation.contract.status).toBe('active');
  expect(next.memo.status).toBe('ready');
  expect(next.cash).toBe(funded.cash);
  const memo = memoAutomationStatus(next);
  expect(memo.status).toBe('blocked');
  if (memo.status !== 'blocked') throw new Error('Memo spent protected contract funds.');
  expect(memo.cashShortfall).toBeCloseTo(20, 10);
});

test('enabled instructions describe their actual blockers and pause stops delegated actions', () => {
  const base = renewalFixture();
  const s: GameState = { ...base, automation: { ...base.automation, memos: true, allocation: 'all' }, paused: true };
  expect(contractAutomationStatus(s).status).toBe('blocked');
  expect(memoAutomationStatus(s).status).toBe('blocked');
  expect(tickAutomation(s)).toEqual(s);
  const markup = renderToStaticMarkup(<Delegation state={s} dispatch={() => {}} />);
  expect(markup).toContain('Paused. Resume the company');
  expect(markup).toContain('100% escrow until delivery');
  expect(markup).toContain('active order keeps its current allocation');
});

test('completed receipt records actual capped rewards, survives idle ticks, and explains its retail benchmark', () => {
  const s = renewalFixture();
  const active: GameState = { ...s, corporation: { ...s.corporation, reputation: 99.5, contract: { status: 'active', id: 'local', remaining: 10, delivered: 249.5, allocation: 'all' } } };
  const finished = routeContract(active, 0.5, 1).state;
  expect(finished.corporation.lastContract).toEqual({ id: 'local', status: 'completed', forms: 250, returned: 0, reward: 900 * (1 + 99.5 / 500), influence: 5, reputation: 0.5, retailValue: 250 * active.corporation.price, settledAt: active.elapsed });
  expect(finished.cash - active.cash).toBeCloseTo(finished.corporation.lastContract?.reward ?? -1);
  expect(routeContract(finished, 10, 1).state.corporation.lastContract).toEqual(finished.corporation.lastContract);
  expect(GameSchema.safeParse(finished).success).toBe(true);
  const markup = renderToStaticMarkup(<ContractDesk state={finished} dispatch={() => {}} />);
  expect(markup).toContain('Last order: Delivered');
  expect(markup).toContain('Cash received');
  expect(markup).toContain('Supplies, wages, and maintenance are not deducted');
});

test('failure and manual cancellation receipts retain all escrow and actual reputation deltas', () => {
  const s = renewalFixture();
  const active: GameState = { ...s, corporation: { ...s.corporation, reputation: 2, contract: { status: 'active', id: 'local', remaining: 0.5, delivered: 27.25, allocation: 'all' } } };
  const expired = routeContract(active, 1, 1).state;
  expect(expired.corporation.lastContract).toMatchObject({ status: 'expired', forms: 28.25, returned: 28.25, reward: 0, influence: 0, reputation: -2 });
  expect(expired.corporation.inventory - active.corporation.inventory).toBe(28.25);
  const canceled = perform(active, { type: 'cancel-contract' });
  expect(canceled.corporation.lastContract).toMatchObject({ status: 'canceled', forms: 27.25, returned: 27.25, reward: 0, reputation: -2 });
  expect(canceled.corporation.inventory - active.corporation.inventory).toBe(27.25);
});
