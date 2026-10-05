import { expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { Projects } from '../components/Projects';
import { discoveryAnnouncement, inspectDiscoveries, projectEffects, revealedWorkspaces, tenderAnnouncement, unseenDiscoveries, type DiscoveryRecord } from './discovery-feedback';
import { initialState, parseGame } from './state';
import { act } from './engine';
import { networkFixture, perform } from './testing/fixtures';
import { quoteFor, researchCost, researchReward, type TenderReceipt } from './tender-state';

const fresh: DiscoveryRecord = { workspaces: ['Office'], projects: [], protocols: [] };

test('the opening exposes one workspace and no future research announcement', () => {
  for (const revenue of [0, 59, 60, 99]) {
    const state = { ...initialState(0), revenue };
    expect(revealedWorkspaces(state)).toEqual(['Office']);
    expect(unseenDiscoveries(state, fresh)).toEqual({ workspaces: [], projects: [], protocols: [] });
    expect(discoveryAnnouncement(state, fresh)).toBeNull();
  }
});

test('new research remains unread through waiting and clears only on valid inspection', () => {
  const state = { ...initialState(0), revenue: 100 };
  expect(unseenDiscoveries(state, fresh)).toEqual({ workspaces: ['Development'], projects: ['time-study'], protocols: [] });
  expect(discoveryAnnouncement(state, fresh)).toEqual({ text: 'Development is now open.', destination: 'Development' });
  const waiting = { ...state, elapsed: 10000 };
  expect(unseenDiscoveries(waiting, fresh)).toEqual(unseenDiscoveries(state, fresh));
  const inspected = inspectDiscoveries(state, fresh, { workspaces: ['Development'], projects: ['time-study'] });
  expect(unseenDiscoveries(state, inspected)).toEqual({ workspaces: [], projects: [], protocols: [] });
  expect(inspectDiscoveries(state, inspected, { workspaces: ['Development'], projects: ['time-study'] })).toEqual(inspected);
});

test('inspecting a workspace alone preserves individual unread projects and future controls cannot be pre-read', () => {
  const state = { ...initialState(0), revenue: 100 };
  const inspected = inspectDiscoveries(state, fresh, { workspaces: ['Development', 'Network'], projects: ['sovereign'] });
  expect(inspected).toEqual({ workspaces: ['Office', 'Development'], projects: [], protocols: [] });
  expect(unseenDiscoveries(state, inspected).projects).toEqual(['time-study']);
  expect(discoveryAnnouncement(state, inspected)).toEqual({ text: 'Time study is ready to inspect.', destination: 'Development' });
});

test('old saves baseline existing capabilities once and still announce later discoveries', () => {
  const state = { ...initialState(0), revenue: 100 };
  expect(unseenDiscoveries(state, null)).toEqual({ workspaces: [], projects: [], protocols: [] });
  const baselined = inspectDiscoveries(state, null, { workspaces: [], projects: [] });
  expect(baselined).toEqual({ workspaces: ['Office', 'Development'], projects: ['time-study'], protocols: [] });
  const reviewed = { ...state, learning: undefined, revenue: 300, corporation: { ...state.corporation, projects: ['time-study'] as const } };
  const parsed = parseGame(reviewed);
  if (!parsed.success) throw new Error('Expected a valid time-study fixture.');
  expect(unseenDiscoveries(parsed.data, baselined).projects).toEqual(['procurement', 'brand', 'standards']);
});

test('inspection persists through save round trips without charging or logging gameplay actions', () => {
  const olderSave = parseGame({ ...initialState(0), revenue: 100, discoveryRecord: undefined });
  if (!olderSave.success) throw new Error('Expected an older save without discovery records to migrate.');
  expect(olderSave.data.discoveryRecord).toBeNull();
  const baseline = act(olderSave.data, { type: 'inspect-discoveries', workspaces: [], projects: [] });
  if (!baseline.ok) throw new Error(baseline.message);
  expect(baseline.state.discoveryRecord).toEqual({ workspaces: ['Office', 'Development'], projects: ['time-study'], protocols: [] });
  expect(baseline.state.cash).toBe(olderSave.data.cash);
  expect(baseline.state.log).toEqual(olderSave.data.log);
  const reloaded = parseGame(JSON.parse(JSON.stringify(baseline.state)));
  if (!reloaded.success) throw new Error('Expected acknowledged discoveries to survive save reload.');
  expect(reloaded.data.discoveryRecord).toEqual(baseline.state.discoveryRecord);
  expect(unseenDiscoveries(reloaded.data, reloaded.data.discoveryRecord).projects).toEqual([]);
});

test('project cards show unread state without changing affordability and completed descriptions stay inspectable', () => {
  const state = { ...initialState(0), revenue: 100 };
  const markup = renderToStaticMarkup(<Projects state={state} dispatch={() => {}} unseen={['time-study']} />);
  expect(markup).toContain('class="new-marker">New');
  expect(markup).toContain('Requires $80');
  expect(markup).toContain('disabled=""');
  expect(markup).toContain('tabindex="0" role="group" aria-label="Time study, new project"');
  expect(markup).not.toContain('Sovereign workflow');
  const parsed = parseGame({ ...state, learning: undefined, corporation: { ...state.corporation, projects: ['time-study'] } });
  if (!parsed.success) throw new Error('Expected a valid completed project fixture.');
  const completed = renderToStaticMarkup(<Projects state={parsed.data} dispatch={() => {}} />);
  expect(completed).toContain('Completed projects');
  expect(completed).toContain('Unlock departments and continuous process reviews.');
  expect(projectEffects['time-study'].text).toContain('Departments');
  expect(projectEffects['time-study'].destination).toBe('Office');
});

test('new procedures survive waiting and workspace inspection but cannot be marked before their prerequisites', () => {
  const state = networkFixture();
  const record: DiscoveryRecord = { workspaces: ['Office', 'Development', 'Company', 'Network', 'Archive'], projects: [...state.corporation.projects], protocols: [] };
  expect(unseenDiscoveries(state, record).protocols).toEqual(['efficient', 'distributed']);
  const workspaceOnly = inspectDiscoveries(state, record, { workspaces: ['Network'], projects: [], protocols: ['singularity'] });
  expect(unseenDiscoveries(state, workspaceOnly).protocols).toEqual(['efficient', 'distributed']);
  const inspected = perform(state, { type: 'inspect-discoveries', workspaces: [], projects: [], protocols: ['efficient'] });
  expect(inspected.discoveryRecord?.protocols).toEqual(['efficient']);
  const deployed = perform(inspected, { type: 'protocol', id: 'efficient' });
  expect(unseenDiscoveries(deployed, deployed.discoveryRecord).protocols).toEqual(['distributed', 'compression']);
  const saved = parseGame(JSON.parse(JSON.stringify(deployed)));
  if (!saved.success) throw new Error('Expected protocol discovery records to persist.');
  expect(unseenDiscoveries(saved.data, saved.data.discoveryRecord).protocols).toEqual(['distributed', 'compression']);
});

test('historical discovery records acquire a valid empty protocol list at the import boundary', () => {
  const parsed = parseGame({ ...initialState(0), discoveryRecord: { workspaces: ['Office'], projects: [] } });
  if (!parsed.success) throw new Error('Expected an older discovery record to migrate.');
  expect(parsed.data.discoveryRecord?.protocols).toEqual([]);
});

test('tender announcements distinguish net loss from prize return and name the result destination', () => {
  const brief = { sequence: 1, client: 'records', tier: 'enterprise', weights: { quality: 60, speed: 20, scope: 20 } } as const;
  const quote = quoteFor(brief, 'assurance', 100);
  const lost: TenderReceipt = { brief, approach: 'assurance', stake: 100, quote, roll: 0.99, won: false, gross: 0, net: -100, reward: { kind: 'enterprise', insights: 0, influence: 0 }, researchCost: quote.researchCost, netResearch: -researchCost(quote.researchCost), limited: false };
  expect(tenderAnnouncement(lost)).toEqual({ text: 'Public Records Bureau: bid declined. Net cash lost $100.00.', destination: 'Company' });
  const networkBrief = { ...brief, tier: 'network' } as const;
  const networkQuote = quoteFor(networkBrief, 'assurance', 100);
  const won: TenderReceipt = { ...lost, brief: networkBrief, quote: networkQuote, roll: 0, won: true, gross: networkQuote.gross, net: networkQuote.netIfWon, reward: networkQuote.reward, researchCost: networkQuote.researchCost, netResearch: researchReward(networkQuote.reward) - researchCost(networkQuote.researchCost) };
  expect(tenderAnnouncement(won)).toEqual({ text: 'Public Records Bureau: bid accepted. Net cash gained $43.50.', destination: 'Network' });
});
