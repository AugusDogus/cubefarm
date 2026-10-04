import { expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { act, advance } from './engine';
import { demand, supplyCost } from './economy';
import { GameSchema, parseGame } from './state';
import { officeFixture, perform } from './testing/fixtures';
import { Operations } from '../components/Operations';
import { objective } from './objectives';

function strandedOffice() {
  const s = officeFixture();
  return { ...s, cash: 0, revenue: 5315, corporation: { ...s.corporation, blankForms: 0 } };
}

test('one free supplier pack restarts a stranded staffed company and cannot be repeated', () => {
  const s = strandedOffice(), snapshot = structuredClone(s);
  const rescued = perform(s, { type: 'supplier-relief' });
  expect(rescued.corporation.blankForms).toBe(250);
  expect(rescued.cash).toBe(0); expect(rescued.revenue).toBe(s.revenue);
  expect(rescued.corporation.supplierReliefUsed).toBe(true);
  const earned = advance(rescued, 60, () => 0.99);
  expect(earned.cash).toBeGreaterThan(supplyCost(earned));
  expect(perform(earned, { type: 'supplies', packs: 1 }).corporation.blankForms).toBe(earned.corporation.blankForms + 250);
  expect(act({ ...rescued, corporation: { ...rescued.corporation, blankForms: 0 } }, { type: 'supplier-relief' }).ok).toBe(false);
  expect(act({ ...s, employees: [] }, { type: 'supplier-relief' }).ok).toBe(false);
  expect(act({ ...s, cash: 20 }, { type: 'supplier-relief' }).ok).toBe(false);
  expect(act({ ...s, corporation: { ...s.corporation, blankForms: 1 } }, { type: 'supplier-relief' }).ok).toBe(false);
  expect(s).toEqual(snapshot); expect(GameSchema.safeParse(rescued).success).toBe(true);
});

test('old saves acquire the relief entitlement and used or malformed values cannot reset it', () => {
  const s = strandedOffice();
  const { supplierReliefUsed: _used, ...old } = s.corporation;
  const parsed = parseGame({ ...s, corporation: old });
  expect(parsed.success).toBe(true);
  if (!parsed.success) throw new Error(parsed.error.message);
  expect(parsed.data.corporation.supplierReliefUsed).toBe(false);
  const rescued = perform(parsed.data, { type: 'supplier-relief' });
  const reloaded = parseGame(JSON.parse(JSON.stringify(rescued)));
  expect(reloaded.success).toBe(true);
  if (!reloaded.success) throw new Error(reloaded.error.message);
  expect(reloaded.data.corporation.supplierReliefUsed).toBe(true);
  expect(parseGame({ ...s, corporation: { ...old, supplierReliefUsed: 'false' } }).success).toBe(false);
});

test('Office exposes supply automation prerequisites, recovery, demand growth and precise retail prices', () => {
  const s = strandedOffice();
  const markup = renderToStaticMarkup(<Operations state={s} dispatch={() => {}} />);
  expect(markup).toContain('Claim 250 free blank forms');
  expect(markup).toContain('once per company');
  expect(markup).toContain('Time study');
  expect(markup).toContain('Automatic procurement');
  expect(markup).toContain('Brand book');
  expect(markup).toContain('sales');
  expect(markup).toContain('step="0.01"');
});

test('marketing and sales increase demand at an unchanged price and procurement replenishes stock', () => {
  let s = { ...officeFixture(), revenue: 600, cash: 1000 };
  s = perform(s, { type: 'project', id: 'time-study' });
  s = { ...s, corporation: { ...s.corporation, insights: 30 } };
  s = perform(s, { type: 'project', id: 'brand' });
  const marketed = perform(s, { type: 'marketing' });
  expect(demand(marketed)).toBeCloseTo(demand(s) * 1.6);
  expect(marketed.corporation.price).toBe(s.corporation.price);
  const sales = perform(s, { type: 'staff', research: 0, sales: 1, compliance: 0 });
  expect(demand(sales)).toBeGreaterThan(demand(s) * 2);
  const auto = perform(s, { type: 'project', id: 'procurement' });
  expect(auto.corporation.autoBuy).toBe(true);
  const replenished = advance({ ...auto, corporation: { ...auto.corporation, blankForms: 0 } }, 1, () => 0.99);
  expect(replenished.corporation.blankForms).toBeGreaterThan(0);
  expect(replenished.corporation.supplySpent).toBeGreaterThan(auto.corporation.supplySpent);
});

test('a supplied but demand-limited Office points toward Brand before further expansion', () => {
  let s = { ...officeFixture(), revenue: 600, cash: 1000 };
  s = perform(s, { type: 'project', id: 'time-study' });
  s = { ...s, corporation: { ...s.corporation, insights: 30, inventory: 1000 } };
  s = perform(s, { type: 'project', id: 'procurement' });
  expect(objective(s).target).toBe('brand');
  const branded = perform(s, { type: 'project', id: 'brand' });
  expect(objective(branded).target).toBe('standards');
});
