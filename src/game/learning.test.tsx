import { expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { Projects } from '../components/Projects';
import { Research } from '../components/Research';
import { Strategy } from '../components/Strategy';
import { Tender } from '../components/Tender';
import { act, advance, type Action } from './engine';
import { GameSchema, initialState, parseGame } from './state';
import { projectReason, visibleProjects } from './projects';
import { objective } from './objectives';
import { cultivarVisible, facilityVisible, geneVisible, memoVisible, upgradeVisible } from './discovery';
import { memoAutomationStatus } from './automation-status';
import { tickAutomation } from './automation';
import { tenderAvailable } from './tender';
import { perform } from './testing/fixtures';
import { playthrough } from './testing/playthrough';

const dispatch = (_action: Action) => {};
// Funded fresh snapshots isolate handoffs, not claims about earned progression.
function studiedOffice() {
  let state = perform({ ...initialState(0), cash: 100000, revenue: 100000 }, { type: 'hire', cultivar: 'generalist', count: 6 });
  state = perform(state, { type: 'project', id: 'time-study' });
  return { ...state, corporation: { ...state.corporation, insights: 10000, influence: 10000 } };
}
function charteredOffice() {
  let state = advance(studiedOffice(), 240, () => 0.99);
  for (const id of ['procurement', 'standards'] as const) state = perform(state, { type: 'project', id });
  state = perform(state, { type: 'reply', letter: 'promise', choice: 'voice' });
  return perform(state, { type: 'project', id: 'charter' });
}

test('Time study introduces departments before the procurement, marketing and quality project cards', () => {
  const state = studiedOffice();
  expect(visibleProjects(state)).toEqual([]);
  const markup = renderToStaticMarkup(<Projects state={state} dispatch={dispatch} />);
  expect(markup).toContain('Next opportunity: Automatic procurement in 45 operating seconds');
  expect(markup).not.toContain('aria-label="Brand book');
  expect(markup).not.toContain('aria-label="Quality standards');
  const snapshot = structuredClone(state);
  for (const id of ['procurement', 'brand', 'standards'] as const) expect(act(state, { type: 'project', id }).ok).toBe(false);
  expect(state).toEqual(snapshot);
  const procurement = advance(state, 45, () => 0.99);
  expect(visibleProjects(procurement)).toEqual(['procurement']);
  expect(projectReason(procurement, 'procurement')).toBeNull();
  expect(visibleProjects(advance(procurement, 45, () => 0.99))).toEqual(['procurement', 'brand']);
});

test('Charter shows policies and contracts before tenders, delegated work and rival purchasing', () => {
  const state = charteredOffice();
  const core = renderToStaticMarkup(<Strategy state={state} dispatch={dispatch} />);
  expect(core).toContain('Operating policy'); expect(core).toContain('Contract desk');
  expect(core).not.toContain('Mergers &amp; markets'); expect(core).not.toContain('Acquire');
  const tender = renderToStaticMarkup(<Tender state={state} dispatch={dispatch} />);
  expect(tender).toContain('open in 90 operating seconds');
  expect(tender).not.toContain('Read next client brief');
  expect(act(state, { type: 'tender-draw' }).ok).toBe(false);
  expect(act(state, { type: 'project', id: 'analytics' }).ok).toBe(false);
  expect(visibleProjects(state)).toEqual(['brand']);
  const observing = advance(state, 60, () => 0.99);
  expect(visibleProjects(observing)).toContain('logistics');
  expect(tenderAvailable(observing)).toBe(false);
  expect(objective(observing).title).toBe('Brand book');
  const ready = advance(observing, 30, () => 0.99);
  expect(tenderAvailable(ready)).toBe(true);
  expect(renderToStaticMarkup(<Tender state={ready} dispatch={dispatch} />)).toContain('Read next client brief');
  expect(act(ready, { type: 'tender-draw' }).ok).toBe(true);
  const paths = perform(advance(ready, 30, () => 0.99), { type: 'project', id: 'brand' });
  const pathsWithoutLogistics = perform(paths, { type: 'project', id: 'logistics' });
  expect(objective(pathsWithoutLogistics).title).toBe('Choose a management path');
  expect(objective(pathsWithoutLogistics).detail).toContain('Either choice is permanent');
});

test('first-hire introductions persist through later hires, bankruptcy and pause without hiding recovery', () => {
  let state = studiedOffice();
  expect(facilityVisible(state, 'coffee')).toBe(false);
  expect(cultivarVisible(state, 'processor')).toBe(false);
  expect(upgradeVisible(state, 'training')).toBe(false);
  expect(upgradeVisible(state, 'capacity')).toBe(true);
  expect(act(state, { type: 'facility', id: 'coffee' }).ok).toBe(false);
  expect(act(state, { type: 'research-cultivar', id: 'processor' }).ok).toBe(false);
  expect(act(state, { type: 'upgrade', id: 'training' }).ok).toBe(false);
  state = advance(state, 150, () => 0.99);
  state = perform(state, { type: 'hire', cultivar: 'generalist' });
  expect(facilityVisible(state, 'coffee')).toBe(true);
  const bankrupt = { ...state, cash: 0, corporation: { ...state.corporation, blankForms: 0 } };
  expect(facilityVisible(bankrupt, 'coffee')).toBe(true);
  expect(act(bankrupt, { type: 'supplier-relief' }).ok).toBe(true);
  expect(act(bankrupt, { type: 'process' }).ok).toBe(true);
  expect(act(bankrupt, { type: 'price', value: 3 }).ok).toBe(true);
  const paused = perform(state, { type: 'pause' });
  expect(advance(paused, 7200)).toEqual(paused);
  expect(cultivarVisible(paused, 'processor')).toBe(false);
  expect(cultivarVisible(advance(state, 60, () => 0.99), 'processor')).toBe(true);
});

test('advanced genes allow a real hiring-profile choice without rewriting historical workers', () => {
  let state = perform(advance(charteredOffice(), 180, () => 0.99), { type: 'project', id: 'analytics' });
  state = advance(state, 90, () => 0.99);
  state = perform(state, { type: 'reply', letter: 'cultivation', choice: 'consent' });
  state = perform(state, { type: 'project', id: 'cultivation' });
  const original = structuredClone(state.employees);
  for (const id of ['focus', 'endurance', 'precision'] as const) state = perform(state, { type: 'research-gene', id });
  state = perform(state, { type: 'genome', genes: ['focus', 'precision'] });
  expect(geneVisible(state, 'cognition')).toBe(false);
  expect(act(state, { type: 'research-gene', id: 'cognition' }).ok).toBe(false);
  expect(renderToStaticMarkup(<Research state={state} dispatch={dispatch} />)).not.toContain('Accelerated cognition');
  state = perform(state, { type: 'hire', cultivar: 'generalist' });
  expect(state.employees.at(-1)?.genes).toEqual(['focus', 'precision']);
  state = perform(advance(state, 120, () => 0.99), { type: 'research-gene', id: 'cognition' });
  expect(geneVisible(state, 'synthesis')).toBe(false);
  state = perform(advance(state, 120, () => 0.99), { type: 'research-gene', id: 'synthesis' });
  state = perform(state, { type: 'genome', genes: ['cognition', 'synthesis'] });
  state = perform(state, { type: 'hire', cultivar: 'generalist' });
  expect(state.employees.at(-1)?.genes).toEqual(['cognition', 'synthesis']);
  expect(state.employees.slice(0, original.length).map(e => e.genes)).toEqual(original.map(e => e.genes));
  expect(GameSchema.safeParse(state).success).toBe(true);
});

test('delegation cannot circulate a memo before its first introduction', () => {
  const state = perform(advance(charteredOffice(), 180, () => 0.99), { type: 'project', id: 'analytics' });
  const delegated = perform(state, { type: 'automation', ...state.automation, memos: true });
  const staffed = perform(delegated, { type: 'staff', research: 1, sales: 0, compliance: 0 });
  expect(staffed.elapsed).toBe(420);
  expect(memoVisible(staffed)).toBe(false);
  expect(act(staffed, { type: 'memo' }).ok).toBe(false);
  expect(memoAutomationStatus(staffed).status).toBe('blocked');
  expect(tickAutomation(staffed).memo.status).toBe('ready');
  const learned = advance(staffed, 30, () => 0.99);
  expect(memoVisible(learned)).toBe(true);
  expect(memoAutomationStatus(learned).status).toBe('ready');
  expect(tickAutomation(learned).memo.status).toBe('active');
});

test('old saves retain their original access and new introduction records survive imports and offline progress', () => {
  const state = studiedOffice();
  const saved = parseGame(JSON.parse(JSON.stringify(state)));
  if (!saved.success) throw new Error(saved.error.message);
  expect(saved.data.learning).toEqual(state.learning);
  const legacy = parseGame({ ...state, learning: undefined });
  if (!legacy.success) throw new Error(legacy.error.message);
  expect(legacy.data.learning.mode).toBe('legacy');
  expect(visibleProjects(legacy.data)).toEqual(['procurement', 'brand', 'standards']);
  expect(facilityVisible(legacy.data, 'coffee')).toBe(true);
  expect(parseGame({ ...state, learning: { mode: 'staged', anchors: [] } }).success).toBe(false);
  expect(parseGame({ ...state, learning: { mode: 'staged', anchors: [{ id: 'first-hire', at: 1000 }, { id: 'time-study', at: 0 }] } }).success).toBe(false);
  const offline = advance(saved.data, 240, () => 0.99);
  expect(visibleProjects(offline)).toEqual(['procurement', 'brand', 'standards']);
  expect(GameSchema.safeParse(offline).success).toBe(true);
});

test.each([7, 42, 101])('legal fresh runs measure first-visible cards, not just spaced purchases, seed %s', seed => {
  for (const path of ['stewardship', 'extraction'] as const) {
    const run = playthrough(path, seed);
    const at = (id: string) => {
      const found = run.introductions.find(item => item.id === id);
      if (!found) throw new Error(`Missing introduction: ${id}`);
      return found.seconds;
    };
    expect(at('profile:processor') - at('facility:coffee')).toBeGreaterThanOrEqual(60);
    expect(at('project:procurement') - at('departments')).toBeGreaterThanOrEqual(45);
    expect(at('project:brand') - at('departments')).toBeGreaterThanOrEqual(90);
    expect(at('project:standards') - at('departments')).toBeGreaterThanOrEqual(150);
    expect(at('tenders') - at('contracts')).toBeGreaterThanOrEqual(90);
    expect(at('project:analytics') - at('contracts')).toBeGreaterThanOrEqual(180);
    expect(at('project:legal') - at('project:analytics')).toBeGreaterThanOrEqual(60);
    expect(at('project:cultivation') - at('delegation')).toBeGreaterThanOrEqual(90);
    expect(at('gene:cognition') - at('genetics')).toBeGreaterThanOrEqual(120);
    expect(at('gene:synthesis') - at('gene:cognition')).toBeGreaterThanOrEqual(120);
    expect(at('project:franchise') - at('branches')).toBeGreaterThanOrEqual(120);
    const license = run.actions.find(action => action.action.type === 'project' && action.action.id === 'franchise');
    if (!license) throw new Error('Missing Franchise license purchase.');
    expect(at('project:coordination') - license.seconds).toBeGreaterThanOrEqual(60);
    expect(at('project:continental') - license.seconds).toBeGreaterThanOrEqual(120);
    expect(run.introductions.filter(item => item.seconds === license.seconds && item.source === 'project')).toEqual([]);
    // The charter deliberately introduces governing health, policy and contract controls.
    expect(run.introductions.filter(item => item.seconds === at('contracts') && item.source === 'project').map(item => item.id)).toEqual(['health', 'policy', 'contracts']);
    // A timer may expire on the same tick. Measure what the purchase itself introduces.
    expect(run.introductions.filter(item => item.seconds === at('departments') && item.source === 'project').map(item => item.id)).toEqual(['departments']);
  }
});
