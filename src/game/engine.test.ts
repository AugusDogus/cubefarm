import { describe, expect, test } from 'bun:test';
import { act, advance, capacity, climate, employeeRate, memoBoost, PAPER_VALUE, rank, risks, saleValue, upgradeCost, type Action } from './engine';
import { officeFixture, labFixture } from './testing/fixtures';
import { GameSchema, initialState, type GameState } from './state';

function perform(state: GameState, action: Action): GameState {
  const result = act(state, action, () => 0.5);
  if (!result.ok) throw new Error(result.message);
  return result.state;
}
const funded = (): GameState => ({ ...labFixture(), cash: 50000, revenue: 10000 });

describe('workforce and immutable traits', () => {
  test('gene research changes only employees hired after research', () => {
    const original = { ...funded(), employees: funded().employees.slice(0, 3), genome: [] };
    expect(original.employees).toHaveLength(3);
    const research = perform(original, { type: 'research-gene', id: 'focus' });
    const selected = perform(research, { type: 'genome', genes: ['focus'] });
    const hired = perform(selected, { type: 'hire', cultivar: 'generalist' });
    expect(hired.employees.slice(0, 3)).toEqual(original.employees);
    expect(hired.employees[3]?.genes).toEqual(['focus']);
    expect(original.genes).toEqual([]);
    const existing = hired.employees[0], newHire = hired.employees[3];
    if (!existing || !newHire) throw new Error('Expected four employees.');
    expect(risks(hired, newHire).slack).toBeCloseTo(risks(hired, existing).slack * 0.3);
    expect(GameSchema.safeParse(hired).success).toBe(true);
  });
  test('cultivar research leaves existing employee varieties unchanged', () => {
    const original = { ...funded(), employees: funded().employees.slice(0, 3) };
    expect(original.employees).toHaveLength(3);
    const research = perform(original, { type: 'research-cultivar', id: 'processor' });
    const hired = perform(research, { type: 'hire', cultivar: 'processor' });
    expect(hired.employees.slice(0, 3).every(e => e.cultivar === 'generalist')).toBe(true);
    expect(hired.employees[3]?.cultivar).toBe('processor');
  });
  test('rejects locked cultivars, missing prerequisites, and insufficient funds without mutation', () => {
    const original = initialState(0), snapshot = structuredClone(original);
    expect(act(original, { type: 'hire', cultivar: 'executive' }).ok).toBe(false);
    expect(act(funded(), { type: 'research-gene', id: 'cognition' }).ok).toBe(false);
    expect(act({ ...original, cash: 0 }, { type: 'upgrade', id: 'equipment' }).ok).toBe(false);
    expect(original).toEqual(snapshot);
  });
  test('capacity stops hiring and expands to its hard limit', () => {
    let state = funded();
    while (state.employees.length < capacity(state)) state = perform(state, { type: 'hire', cultivar: 'generalist' });
    expect(act(state, { type: 'hire', cultivar: 'generalist' }).ok).toBe(false);
    const expanded = perform(state, { type: 'upgrade', id: 'capacity' });
    expect(capacity(expanded)).toBe(capacity(state) * 2);
    expect(act(expanded, { type: 'hire', cultivar: 'generalist' }).ok).toBe(true);
    expect(capacity({ ...state, upgrades: { ...state.upgrades, capacity: 5 } })).toBe(256);
  });
  test('selling pays a placement fee, firing does not, and manual work recovers an empty company', () => {
    const original = officeFixture(), employee = original.employees[0];
    if (!employee) throw new Error('Expected a founding employee.');
    const sold = perform(original, { type: 'release', id: employee.id, method: 'sell' });
    expect(sold.cash).toBe(original.cash + saleValue(employee));
    expect(sold.revenue).toBe(original.revenue);
    const fired = perform(original, { type: 'release', id: employee.id, method: 'fire' });
    expect(fired.cash).toBe(original.cash);
    let empty: GameState = { ...original, cash: 0, employees: [] };
    for (let i = 0; i < 28; i++) empty = advance(perform(empty, { type: 'process' }), 0.5, () => 0.99);
    expect(perform(empty, { type: 'hire', cultivar: 'generalist' }).employees).toHaveLength(1);
  });
});

describe('production and progression', () => {
  test('corporate seasons alter workflow and leave a company record', () => {
    const state = { ...officeFixture(), elapsed: 179 };
    const next = advance(state, 1, () => 0.99);
    expect(climate(next).name).toBe('Quarter-end rush');
    const employee = state.employees[0];
    if (!employee) throw new Error('Expected an employee.');
    expect(employeeRate(next, employee)).toBeCloseTo(employeeRate(state, employee) * 1.2);
    expect(next.log[0]?.message).toContain('Quarter-end rush');
  });
  test('production settles revenue and wages, and state remains valid', () => {
    const original = officeFixture();
    const next = advance(original, 3, () => 0.99);
    const expectedPapers = original.employees.reduce((sum, e) => sum + employeeRate(original, e) * 3, 0);
    expect(next.paperwork).toBeCloseTo(expectedPapers);
    expect(next.cash).toBeCloseTo(original.cash + expectedPapers * PAPER_VALUE - 3 * 0.09 * 3);
    expect(next.wages).toBeCloseTo(0.81);
    expect(GameSchema.safeParse(next).success).toBe(true);
  });
  test('slacking, breaks, and bug rework interrupt output before returning to work', () => {
    for (const [chance, activity] of [[0.01, 'rework'], [0.1, 'slacking'], [0.3, 'break']] as const) {
      const initial = officeFixture(), employee = initial.employees[0];
      if (!employee) throw new Error('Expected an employee.');
      const state = { ...initial, employees: [{ ...employee, remaining: 0 }] };
      const stopped = advance(state, 1, () => chance);
      expect(stopped.employees[0]?.activity).toBe(activity);
      expect(stopped.paperwork).toBe(0);
      expect(advance(stopped, 7, () => 0.99).paperwork).toBeGreaterThan(0);
    }
  });
  test('equipment helps existing employees, facilities and assurance reduce risk', () => {
    const state = { ...officeFixture(), cash: 50000, revenue: 10000 }, employee = state.employees[0];
    if (!employee) throw new Error('Expected an employee.');
    const upgraded = perform(state, { type: 'upgrade', id: 'equipment' });
    expect(employeeRate(upgraded, employee)).toBeCloseTo(employeeRate(state, employee) * 1.2);
    expect(upgraded.cash).toBe(state.cash - upgradeCost(state, 'equipment'));
    const coffee = perform(state, { type: 'facility', id: 'coffee' });
    expect(risks(coffee, employee).breaks).toBeCloseTo(risks(state, employee).breaks * 0.4);
    const quality = perform(state, { type: 'upgrade', id: 'quality' });
    expect(risks(quality, employee).bugs).toBeCloseTo(risks(state, employee).bugs * 0.8);
    expect(act(coffee, { type: 'facility', id: 'coffee' }).ok).toBe(false);
  });
  test('memo applies for 90 seconds, cools down, then becomes available', () => {
    const original = funded(), employee = original.employees[0];
    if (!employee) throw new Error('Expected an employee.');
    const state = perform(original, { type: 'memo' });
    expect(employeeRate(state, employee)).toBeCloseTo(employeeRate(original, employee) * (1 + memoBoost(original)));
    expect(act(state, { type: 'memo' }).ok).toBe(false);
    const cooldown = advance(state, 90, () => 0.99);
    expect(cooldown.memo).toEqual({ status: 'cooldown', remaining: 90 });
    expect(advance(cooldown, 90, () => 0.99).memo).toEqual({ status: 'ready' });
  });
  test('pause stops all simulation, including memo timers', () => {
    const state = perform(perform(funded(), { type: 'memo' }), { type: 'pause' });
    expect(advance(state, 7200)).toBe(state);
  });
  test('revenue improves standing and wins the highest-grossing corporation', () => {
    const state = { ...officeFixture(), revenue: 99999 };
    expect(rank(state)).toBe(2);
    const won = advance(state, 3, () => 0.99);
    expect(rank(won)).toBe(1);
    expect(won.won).toBe(true);
    expect(won.log.some(entry => entry.message.includes('highest-grossing'))).toBe(true);
  });
  test('long-running simulation does not create invalid or negative balances', () => {
    const state = advance({ ...officeFixture(), cash: 0 }, 7200);
    expect(GameSchema.safeParse(state).success).toBe(true);
    expect(state.cash).toBeGreaterThanOrEqual(0);
    expect(advance(initialState(0), NaN)).toEqual(initialState(0));
  });
});
