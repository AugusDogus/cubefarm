import { expect, test } from 'bun:test';
import { operatingReserve } from './automation';
import { GameSchema, initialState, parseGame, type GameState } from './state';
import { enterpriseFixture, conglomerateFixture, networkFixture } from './testing/fixtures';
import { actTender, approachIds, initialTender, TenderSchema, tenderQuote, tenderStakeCap, tenderStakeLimit, tenderResearchBudget, researchCost, quoteFor, tickTender, settlePendingTender, TENDER_COOLDOWN_SECONDS, TENDER_RESOLUTION_SECONDS, type TenderAction, type TenderBrief } from './tender';

function perform(state: GameState, action: TenderAction, random: () => number = () => 0): GameState {
  const result = actTender(state, action, random);
  if (!result.ok) throw new Error(result.message);
  return result.state;
}
function ready(state = enterpriseFixture()): GameState { return perform(state, { type: 'tender-draw' }); }
function bid(state = ready(), roll = 0, stake = 100): GameState { return perform(state, { type: 'tender-bid', approach: 'responsive', stake }, () => roll); }

test('tenders are optional after Charter and reading preserves one disclosed brief', () => {
  expect(actTender(initialState(0), { type: 'tender-draw' }).ok).toBe(false);
  const before = enterpriseFixture(), snapshot = structuredClone(before);
  let draws = 0;
  const opened = perform(before, { type: 'tender-draw' }, () => { draws++; return 0.99999; });
  expect(draws).toBe(4);
  expect(opened.cash).toBe(before.cash);
  expect(opened.corporation.tender.sequence).toBe(1);
  const stage = opened.corporation.tender.stage;
  if (stage.status !== 'brief') throw new Error('Expected disclosed brief.');
  expect(stage.brief.weights).toEqual({ quality: 10, speed: 10, scope: 80 });
  expect(GameSchema.safeParse(opened).success).toBe(true);
  expect(actTender(opened, { type: 'tender-draw' }, () => { draws++; return 0; }).ok).toBe(false);
  expect(draws).toBe(4);
  expect(tickTender(opened, 7200)).toEqual(opened);
  expect(before).toEqual(snapshot);
});

test('different ordinary briefs change highest expected return while safety remains a tradeoff', () => {
  const state = enterpriseFixture();
  const profiles: { brief: TenderBrief; best: typeof approachIds[number] }[] = [
    { brief: { sequence: 1, client: 'records', tier: 'enterprise', weights: { quality: 80, speed: 10, scope: 10 } }, best: 'assurance' },
    { brief: { sequence: 1, client: 'dispatch', tier: 'enterprise', weights: { quality: 10, speed: 80, scope: 10 } }, best: 'responsive' },
    { brief: { sequence: 1, client: 'expansion', tier: 'enterprise', weights: { quality: 10, speed: 10, scope: 80 } }, best: 'ambitious' },
  ];
  for (const { brief, best } of profiles) {
    const quotes = approachIds.map(id => ({ id, quote: tenderQuote(state, brief, id, 100) }));
    let bestReturn = -Infinity, selected = '';
    let previousChance = 1, previousGross = 0;
    for (const { id, quote } of quotes) {
      if (!quote) throw new Error('Expected affordable quote.');
      expect(quote.chance).toBeLessThan(previousChance);
      expect(quote.gross).toBeGreaterThan(previousGross);
      expect(quote.chance).toBeGreaterThan(0);
      expect(quote.chance).toBeLessThan(1);
      expect(quote.maxLoss).toBe(100);
      const expected = quote.chance * quote.gross - 100;
      if (expected > bestReturn) { bestReturn = expected; selected = id; }
      previousChance = quote.chance; previousGross = quote.gross;
    }
    expect(selected).toBe(best);
  }
});

test('the same client generates briefs favoring each approach, independently of its name', () => {
  const state = enterpriseFixture(), selections: string[] = [];
  for (const dominant of [0, 0.4, 0.8]) {
    const samples = [0, dominant, 0.99999, 0];
    const generated = perform(state, { type: 'tender-draw' }, () => samples.shift() ?? 0);
    const stage = generated.corporation.tender.stage;
    if (stage.status !== 'brief') throw new Error('Expected client brief.');
    expect(stage.brief.client).toBe('records');
    const ranked = approachIds.map(approach => ({ approach, quote: tenderQuote(generated, stage.brief, approach, 100) })).sort((a, b) => (b.quote ? b.quote.chance * b.quote.gross : 0) - (a.quote ? a.quote.chance * a.quote.gross : 0));
    const winner = ranked[0];
    if (!winner) throw new Error('Expected a bid comparison.');
    selections.push(winner.approach);
  }
  expect(selections).toEqual(['assurance', 'responsive', 'ambitious']);
});

test('new exposure spends scarce research upfront on either outcome and receipts retain net research', () => {
  const opened = ready(), stage = opened.corporation.tender.stage;
  if (stage.status !== 'brief') throw new Error('Expected brief.');
  const quote = tenderQuote(opened, stage.brief, 'responsive', 2000);
  if (!quote || quote.researchCost.kind !== 'insights' || quote.reward.kind !== 'enterprise') throw new Error('Expected paid research quote.');
  expect(quote.termsVersion).toBe(2);
  expect(quote.researchCost.amount).toBe(6);
  for (const roll of [0, 0.99999]) {
    const committed = bid(opened, roll, 2000);
    expect(committed.corporation.insights).toBe(opened.corporation.insights - 6);
    expect(committed.corporation.influence).toBe(opened.corporation.influence);
    const settled = tickTender(committed, 8), receipt = settled.corporation.tender.lastReceipt;
    if (!receipt || receipt.reward.kind !== 'enterprise') throw new Error('Expected research receipt.');
    expect(receipt.researchCost).toEqual(quote.researchCost);
    expect(receipt.netResearch).toBe(receipt.reward.insights - 6);
    expect(settled.corporation.insights).toBe(opened.corporation.insights + receipt.netResearch);
    expect(receipt.reward.insights).toBe(roll === 0 ? quote.reward.insights : 0);
    if (roll !== 0) expect(receipt.netResearch).toBe(-6);
    expect(tickTender(settled, 1000).corporation.insights).toBe(settled.corporation.insights);
    expect(GameSchema.safeParse(settled).success).toBe(true);
  }
  const unfunded = { ...opened, corporation: { ...opened.corporation, insights: 0 } };
  expect(tenderStakeLimit(unfunded, stage.brief)).toBe(0);
  expect(actTender(unfunded, { type: 'tender-bid', approach: 'assurance', stake: 1 }).ok).toBe(false);
  const fractional = { ...opened, corporation: { ...opened.corporation, insights: 0.0059 } };
  expect(tenderStakeLimit(fractional, stage.brief)).toBe(1);
  expect(bid(fractional, 0, 1).corporation.insights).toBeCloseTo(0.0029);
});

test('Network exposure preserves explicit reserves while manual bids may compete with procedure research', () => {
  const opened = ready(networkFixture()), phase = opened.corporation.phase, stage = opened.corporation.tender.stage;
  if (phase.id !== 'network' || stage.status !== 'brief') throw new Error('Expected Network brief.');
  const limited = { ...opened, corporation: { ...opened.corporation, phase: { ...phase, network: { ...phase.network, knowledge: 570, knowledgeReserve: 500, capitalPolicy: 'manual' as const } } } };
  expect(tenderResearchBudget(limited, stage.brief)).toEqual({ kind: 'knowledge', available: 70, reserve: 500 });
  expect(tenderStakeLimit(limited, stage.brief)).toBe(200000);
  const snapshot = structuredClone(limited);
  expect(actTender(limited, { type: 'tender-bid', approach: 'ambitious', stake: 200001 }).ok).toBe(false);
  expect(limited).toEqual(snapshot);
  const committed = bid(limited, 0.99999, 200000);
  if (committed.corporation.phase.id !== 'network') throw new Error('Expected Network.');
  expect(committed.corporation.phase.network.knowledge).toBe(500);
  const lost = tickTender(committed, 8);
  expect(lost.corporation.tender.lastReceipt?.netResearch).toBe(-70);
  const protectedState = { ...limited, corporation: { ...limited.corporation, phase: { ...phase, network: { ...phase.network, knowledge: 570, knowledgeReserve: 560 } } } };
  expect(tenderResearchBudget(protectedState, stage.brief).reserve).toBe(560);
  expect(tenderStakeLimit(protectedState, stage.brief)).toBe(28571);
  const reserved = { ...limited, corporation: { ...limited.corporation, phase: { ...phase, network: { ...phase.network, knowledge: 500, knowledgeReserve: 500 } } } };
  expect(tenderStakeLimit(reserved, stage.brief)).toBe(0);
  const researchCompetition = { ...limited, corporation: { ...limited.corporation, phase: { ...phase, network: { ...phase.network, knowledge: 500, knowledgeReserve: 0, capitalPolicy: 'research-first' as const } } } };
  expect(tenderResearchBudget(researchCompetition, stage.brief).reserve).toBe(0);
  const chosen = bid(researchCompetition, 0.99999, 500000);
  if (chosen.corporation.phase.id !== 'network') throw new Error('Expected Network.');
  expect(chosen.corporation.phase.network.knowledge).toBe(325);
  expect(chosen.corporation.phase.network.capitalPolicy).toBe('research-first');
});

test('full exposure debits the stated scarce currency in each later era', () => {
  for (const state of [conglomerateFixture(), networkFixture()]) {
    const opened = ready(state), stage = opened.corporation.tender.stage;
    if (stage.status !== 'brief') throw new Error('Expected brief.');
    const amount = stage.brief.tier === 'network' ? 175 : 40;
    const committed = bid(opened, 0.99999, tenderStakeCap(stage.brief));
    const submitted = committed.corporation.tender.stage;
    if (submitted.status !== 'resolving') throw new Error('Expected submitted bid.');
    expect(researchCost(submitted.quote.researchCost)).toBe(amount);
    const before = opened.corporation.phase, after = committed.corporation.phase;
    if (before.id === 'network' && after.id === 'network') expect(after.network.knowledge).toBe(before.network.knowledge - 175);
    else expect(committed.corporation.insights).toBe(opened.corporation.insights - 40);
    expect(tickTender(committed, 8).corporation.tender.lastReceipt?.netResearch).toBe(-amount);
  }
});

test('old cash-only submissions and receipts keep their original rewards without retroactive research charges', () => {
  const opened = ready(), stage = opened.corporation.tender.stage;
  if (stage.status !== 'brief') throw new Error('Expected brief.');
  const quote = quoteFor(stage.brief, 'responsive', 100, 1);
  const { termsVersion: _version, researchCost: _cost, ...oldQuote } = quote;
  const oldSubmitted = { ...opened, cash: opened.cash - 100, corporation: { ...opened.corporation, tender: { ...opened.corporation.tender, stage: { status: 'resolving', brief: stage.brief, approach: 'responsive', stake: 100, quote: oldQuote, remaining: 8, roll: 0 } } } };
  const parsed = parseGame(oldSubmitted);
  if (!parsed.success) throw new Error('Legacy submitted tender did not migrate.');
  const resolved = tickTender(parsed.data, 8), receipt = resolved.corporation.tender.lastReceipt;
  if (!receipt || receipt.reward.kind !== 'enterprise') throw new Error('Expected legacy receipt.');
  expect(receipt.quote.termsVersion).toBe(1);
  expect(receipt.researchCost).toEqual({ kind: 'none' });
  expect(receipt.netResearch).toBe(receipt.reward.insights);
  expect(resolved.corporation.insights).toBe(opened.corporation.insights + receipt.reward.insights);
  const { termsVersion: _receiptVersion, researchCost: _receiptQuoteCost, ...oldReceiptQuote } = receipt.quote;
  const { researchCost: _paid, netResearch: _net, ...oldReceipt } = receipt;
  const oldSettled = { ...resolved, corporation: { ...resolved.corporation, tender: { ...resolved.corporation.tender, lastReceipt: { ...oldReceipt, sequence: stage.brief.sequence, client: stage.brief.client, quote: oldReceiptQuote } } } };
  const restored = parseGame(oldSettled);
  if (!restored.success) throw new Error('Legacy receipt did not migrate.');
  expect(restored.data.corporation.tender.lastReceipt?.researchCost).toEqual({ kind: 'none' });
  expect(restored.data.corporation.tender.lastReceipt?.netResearch).toBe(receipt.reward.insights);
  expect(tickTender(restored.data, 1000).corporation.insights).toBe(restored.data.corporation.insights);
  expect(researchCost(quote.researchCost)).toBe(0);
});

test('exposure protects reserves and invalid submissions are atomic', () => {
  const state = ready(), snapshot = structuredClone(state);
  const stage = state.corporation.tender.stage;
  if (stage.status !== 'brief') throw new Error('Expected brief.');
  const limit = tenderStakeLimit(state, stage.brief);
  expect(limit).toBe(tenderStakeCap(stage.brief));
  for (const stake of [0, -1, 1.5, 2001, Infinity, NaN, Number.MAX_SAFE_INTEGER]) {
    expect(actTender(state, { type: 'tender-bid', approach: 'assurance', stake }).ok).toBe(false);
  }
  const cashLimited = { ...state, cash: operatingReserve(state) + 24.8 };
  expect(tenderStakeLimit(cashLimited, stage.brief)).toBe(24);
  expect(actTender(cashLimited, { type: 'tender-bid', approach: 'assurance', stake: 25 }).ok).toBe(false);
  const committed = bid(cashLimited, 0, 24);
  expect(committed.cash).toBeGreaterThanOrEqual(operatingReserve(cashLimited));
  expect(actTender(committed, { type: 'tender-bid', approach: 'assurance', stake: 1 }).ok).toBe(false);
  expect(state).toEqual(snapshot);
  for (const value of [NaN, Infinity, -0.01, 1]) {
    expect(actTender(state, { type: 'tender-bid', approach: 'assurance', stake: 1 }, () => value).ok).toBe(false);
    expect(actTender(enterpriseFixture(), { type: 'tender-draw' }, () => value).ok).toBe(false);
  }
});

test('a submitted outcome is sampled once and reloading cannot reroll or double-pay it', () => {
  const state = ready();
  let samples = 0;
  const committed = perform(state, { type: 'tender-bid', approach: 'responsive', stake: 100 }, () => { samples++; return 0; });
  expect(samples).toBe(1);
  expect(committed.cash).toBe(state.cash - 100);
  const parsed = parseGame(JSON.parse(JSON.stringify(committed)));
  if (!parsed.success) throw new Error('Submitted tender did not round-trip.');
  const settlement = tickTender(parsed.data, TENDER_RESOLUTION_SECONDS, () => { samples++; return 0.999; });
  expect(samples).toBe(1);
  const receipt = settlement.corporation.tender.lastReceipt;
  if (!receipt || receipt.reward.kind !== 'enterprise') throw new Error('Expected enterprise receipt.');
  expect(receipt.won).toBe(true);
  expect(receipt.roll).toBe(0);
  expect(receipt.gross).toBe(receipt.quote.gross);
  expect(receipt.net).toBe(receipt.gross - 100);
  expect(settlement.cash).toBe(committed.cash + receipt.gross);
  expect(settlement.corporation.insights).toBe(committed.corporation.insights + receipt.reward.insights);
  expect(settlement.corporation.influence).toBe(committed.corporation.influence + receipt.reward.influence);
  const repeated = tickTender(settlement, 10000);
  expect(repeated.cash).toBe(settlement.cash);
  expect(repeated.corporation.tender.lastReceipt).toEqual(receipt);
  expect(repeated.corporation.tender.stage.status).toBe('settled');
  expect(repeated.corporation.tender.sequence).toBe(1);
  expect(GameSchema.safeParse(settlement).success).toBe(true);
});

test('losses pay no reward and both resolved and declined briefs wait before explicit redraw', () => {
  const opened = ready(), committed = bid(opened, 0.99999);
  const lost = tickTender(committed, TENDER_RESOLUTION_SECONDS);
  const receipt = lost.corporation.tender.lastReceipt;
  if (!receipt || receipt.reward.kind !== 'enterprise') throw new Error('Expected loss receipt.');
  expect(receipt.won).toBe(false);
  expect(receipt.gross).toBe(0);
  expect(receipt.net).toBe(-100);
  expect(receipt.reward).toEqual({ kind: 'enterprise', insights: 0, influence: 0 });
  expect(lost.cash).toBe(committed.cash);
  expect(actTender(lost, { type: 'tender-draw' }).ok).toBe(false);
  const declined = perform(opened, { type: 'tender-decline' });
  expect(declined.cash).toBe(opened.cash);
  expect(actTender(declined, { type: 'tender-draw' }).ok).toBe(false);
  const next = perform(tickTender(declined, TENDER_COOLDOWN_SECONDS), { type: 'tender-draw' });
  expect(next.corporation.tender.sequence).toBe(2);
});

test('pause freezes resolution and offline time settles once without autoplay', () => {
  const committed = bid();
  const paused = { ...committed, paused: true };
  expect(tickTender(paused, 7200)).toEqual(paused);
  for (const dt of [0, -1, NaN, Infinity]) expect(tickTender(committed, dt)).toEqual(committed);
  const partial = tickTender(committed, 3);
  const stage = partial.corporation.tender.stage;
  if (stage.status !== 'resolving') throw new Error('Expected visible resolution.');
  expect(stage.remaining).toBe(5);
  const single = tickTender(committed, 7200), split = tickTender(partial, 7197);
  expect(single.cash).toBe(split.cash);
  expect(single.corporation.tender).toEqual(split.corporation.tender);
  expect(single.corporation.tender.stage).toEqual({ status: 'settled', cooldown: 0 });
});

test('Network bids award knowledge and earlier committed prizes survive era transitions', () => {
  const network = ready(networkFixture()), committed = bid(network, 0, 100000);
  const resolved = tickTender(committed, 8);
  const receipt = resolved.corporation.tender.lastReceipt;
  if (!receipt || receipt.reward.kind !== 'network' || committed.corporation.phase.id !== 'network' || resolved.corporation.phase.id !== 'network') throw new Error('Expected network receipt.');
  expect(receipt.reward.knowledge).toBeGreaterThan(0);
  expect(resolved.corporation.phase.network.knowledge).toBe(committed.corporation.phase.network.knowledge + receipt.reward.knowledge);
  expect(resolved.corporation.insights).toBe(committed.corporation.insights);
  const enterpriseBid = bid();
  const transferred = { ...committed, corporation: { ...committed.corporation, tender: enterpriseBid.corporation.tender } };
  const paid = tickTender(transferred, 8);
  expect(paid.corporation.tender.lastReceipt?.reward.kind).toBe('enterprise');
  expect(paid.corporation.insights).toBeGreaterThan(transferred.corporation.insights);
  expect(GameSchema.safeParse(paid).success).toBe(true);
});

test('save validation rejects forged payouts, duplicate cycles, bad receipts and cap violations', () => {
  const committed = bid(), tender = committed.corporation.tender;
  const stage = tender.stage;
  if (stage.status !== 'resolving') throw new Error('Expected submitted tender.');
  for (const altered of [
    { ...tender, sequence: tender.sequence + 1 },
    { ...tender, stage: { ...stage, quote: { ...stage.quote, gross: Number.MAX_SAFE_INTEGER } } },
    { ...tender, stage: { ...stage, quote: { ...stage.quote, chance: 1 } } },
    { ...tender, stage: { ...stage, quote: { ...stage.quote, reward: { kind: 'network', knowledge: Number.MAX_SAFE_INTEGER } } } },
    { ...tender, stage: { ...stage, quote: { ...stage.quote, researchCost: { kind: 'none' } } } },
    { ...tender, stage: { ...stage, quote: { ...stage.quote, researchCost: { kind: 'insights', amount: 0 } } } },
    { ...tender, stage: { ...stage, stake: 2001 } },
    { ...tender, stage: { ...stage, roll: 1 } },
  ]) expect(TenderSchema.safeParse(altered).success).toBe(false);
  const resolved = tickTender(committed, 8).corporation.tender, receipt = resolved.lastReceipt;
  if (!receipt) throw new Error('Expected receipt.');
  expect(TenderSchema.safeParse({ ...resolved, lastReceipt: { ...receipt, won: false } }).success).toBe(false);
  expect(TenderSchema.safeParse({ ...resolved, lastReceipt: { ...receipt, net: 999 } }).success).toBe(false);
  expect(TenderSchema.safeParse({ ...resolved, lastReceipt: { ...receipt, gross: receipt.gross + 1 } }).success).toBe(false);
  expect(TenderSchema.safeParse({ ...resolved, lastReceipt: { ...receipt, researchCost: { kind: 'none' } } }).success).toBe(false);
  expect(TenderSchema.safeParse({ ...resolved, lastReceipt: { ...receipt, netResearch: receipt.netResearch + 1 } }).success).toBe(false);
  expect(TenderSchema.safeParse({ ...tender, lastReceipt: receipt }).success).toBe(false);
  const old = enterpriseFixture(), { tender: _removed, ...corporation } = old.corporation;
  const parsed = parseGame({ ...old, corporation });
  if (!parsed.success) throw new Error('Historical save did not parse.');
  expect(parsed.data.corporation.tender).toEqual(initialTender());
});

test('receipts report actual credited rewards if storage fills during resolution', () => {
  const committed = bid();
  const full = { ...committed, cash: Number.MAX_SAFE_INTEGER, corporation: { ...committed.corporation, insights: Number.MAX_SAFE_INTEGER, influence: Number.MAX_SAFE_INTEGER } };
  const resolved = tickTender(full, 8), receipt = resolved.corporation.tender.lastReceipt;
  if (!receipt) throw new Error('Expected capped receipt.');
  expect(receipt.won).toBe(true);
  expect(receipt.limited).toBe(true);
  expect(receipt.gross).toBe(0);
  expect(receipt.net).toBe(-100);
  expect(receipt.reward).toEqual({ kind: 'enterprise', insights: 0, influence: 0 });
  expect(GameSchema.safeParse(resolved).success).toBe(true);
});

test('era-transition settlement respects the committed outcome while preserving pause and every other clock', () => {
  const committed = { ...bid(), paused: true };
  const settled = settlePendingTender(committed);
  expect(settled.paused).toBe(true);
  expect(settled.elapsed).toBe(committed.elapsed);
  expect(settled.corporation.contract).toEqual(committed.corporation.contract);
  expect(settled.corporation.crisis).toEqual(committed.corporation.crisis);
  expect(settled.employees).toEqual(committed.employees);
  expect(settled.memo).toEqual(committed.memo);
  expect(settled.corporation.tender.lastReceipt?.won).toBe(true);
  expect(settled.corporation.tender.stage).toEqual({ status: 'settled', cooldown: 40 });
  expect(settlePendingTender(settled)).toEqual(settled);
});
