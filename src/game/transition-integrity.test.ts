import { expect, test } from 'bun:test';
import { act, advance } from './engine';
import { GameSchema, parseGame, type GameState } from './state';
import { networkFixture, enterpriseFixture, perform } from './testing/fixtures';
import { WORLD_WORKFLOWS } from './network';
import { projects } from './projects';
import { actTender, settlePendingTender } from './tender';
import { routeContract } from './contracts';

function committed(state: GameState, roll: number): GameState {
  const drawn = actTender(state, { type: 'tender-draw' }, () => 0);
  if (!drawn.ok) throw new Error(drawn.message);
  const bid = actTender(drawn.state, { type: 'tender-bid', approach: 'assurance', stake: 100 }, () => roll);
  if (!bid.ok) throw new Error(bid.message);
  return bid.state;
}

test('Sovereign action settles the frozen prior-era tender exactly once without advancing clocks', () => {
  const base = networkFixture();
  const company: GameState = { ...base, paused: true, corporation: { ...base.corporation, projects: base.corporation.projects.filter(id => id !== 'sovereign'), phase: { id: 'conglomerate' } } };
  expect(GameSchema.safeParse(company).success).toBe(true);
  for (const roll of [0, 0.99999]) {
    const before = committed(company, roll), settled = settlePendingTender(before);
    const after = perform(before, { type: 'project', id: 'sovereign' });
    expect(after.corporation.phase.id).toBe('network');
    expect(after.cash).toBe(settled.cash - projects.sovereign.cash);
    expect(after.corporation.insights).toBe(settled.corporation.insights - projects.sovereign.insights);
    expect(after.corporation.tender.lastReceipt?.won).toBe(roll === 0);
    expect(after.corporation.tender.lastReceipt?.reward.kind).toBe('enterprise');
    expect(after.elapsed).toBe(before.elapsed);
    expect(after.paused).toBe(true);
    expect(after.employees).toEqual(before.employees);
    expect(GameSchema.safeParse(after).success).toBe(true);
    expect(advance(after, 7200).cash).toBe(after.cash);
    expect(act(after, { type: 'project', id: 'sovereign' }).ok).toBe(false);
  }
});

test('ending action settles committed Network rewards atomically while paused and reload cannot pay twice', () => {
  const base = networkFixture(), phase = base.corporation.phase;
  if (phase.id !== 'network') throw new Error('Expected Network fixture.');
  const done: GameState = { ...base, paused: true, corporation: { ...base.corporation, phase: { id: 'network', network: { ...phase.network, knowledge: 50000, undiscovered: 0, discovered: 0, completed: WORLD_WORKFLOWS } } } };
  for (const ending of ['monopoly', 'commons'] as const) {
    const before = committed(done, 0), after = perform(before, { type: 'ending', ending });
    expect(after.corporation.phase.id).toBe('ending');
    expect(after.corporation.tender.lastReceipt?.won).toBe(true);
    expect(after.corporation.tender.stage.status).toBe('settled');
    expect(after.elapsed).toBe(before.elapsed);
    expect(after.paused).toBe(true);
    expect(after.employees).toEqual(before.employees);
    const parsed = parseGame(JSON.parse(JSON.stringify(after)));
    if (!parsed.success) throw new Error('Ended company must remain a valid save.');
    expect(advance(parsed.data, 7200)).toEqual(parsed.data);
    expect(act(after, { type: 'ending', ending }).ok).toBe(false);
  }
});

test('contract receipt validation preserves reputation bonuses and rejects inconsistent escrow and dates', () => {
  const accepted = perform(enterpriseFixture(), { type: 'contract', id: 'local' });
  const completed = routeContract(accepted, 500, 1).state;
  const receipt = completed.corporation.lastContract;
  if (!receipt) throw new Error('Expected contract receipt.');
  expect(receipt.reward).toBeGreaterThan(900);
  expect(GameSchema.safeParse(completed).success).toBe(true);
  for (const altered of [
    { ...receipt, forms: 249 }, { ...receipt, returned: 1 },
    { ...receipt, settledAt: completed.elapsed + 1 }, { ...receipt, reward: 1081 },
    { ...receipt, status: 'canceled', returned: receipt.forms },
  ]) expect(GameSchema.safeParse({ ...completed, corporation: { ...completed.corporation, lastContract: altered } }).success).toBe(false);
  const canceled = perform(accepted, { type: 'cancel-contract' });
  expect(GameSchema.safeParse(canceled).success).toBe(true);
  expect(GameSchema.safeParse({ ...canceled, corporation: { ...canceled.corporation, lastContract: { ...receipt, status: 'expired', reward: 0, influence: 0, returned: 0 } } }).success).toBe(false);
});
