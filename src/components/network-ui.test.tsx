import { expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { Ending, Network } from './Network';
import { NetworkInvestment } from './NetworkInvestment';
import { networkFixture, perform } from '../game/testing/fixtures';
import { reportedStalledNetwork } from '../game/testing/playthrough';
import { WORLD_WORKFLOWS } from '../game/network';
import { advance } from '../game/engine';

test('Network places resources beside decisions and distinguishes stocks from throughput', () => {
  const html = renderToStaticMarkup(<Network state={reportedStalledNetwork()} dispatch={() => undefined} />);
  const resources = html.indexOf('Available funds');
  expect(resources).toBeGreaterThan(0);
  expect(resources).toBeLessThan(html.indexOf('allocation-plans'));
  expect(html).toContain('Knowledge net / s');
  expect(html).toContain('Energy stored / capacity');
  expect(html).toContain('Compute stored / capacity');
  expect(html).toContain('Compute generated / s');
  expect(html).toContain('Compute used / s');
  expect(html).toContain('Full buffers discard surplus generation.');
  expect(html).toContain('knowledge available');
  expect(html.indexOf('id="network-procedures"')).toBeLessThan(html.indexOf('Capital &amp; computing'));
  expect(html).toContain('href="#network-tenders"');
  expect(html).toContain('href="#network-infrastructure"');
  expect(html).toContain('Return to network decisions');
});

test('routing costs remain visible before activating a different priority', () => {
  const html = renderToStaticMarkup(<NetworkInvestment state={reportedStalledNetwork()} dispatch={() => undefined} />);
  const disclosure = html.indexOf('<details>');
  expect(html.indexOf('Each extra located workflow uses 0.25 compute.')).toBeLessThan(disclosure);
  expect(html.indexOf('Each extra cleared workflow uses 0.5 compute and 0.1 knowledge')).toBeLessThan(disclosure);
  expect(html.indexOf('Selected: Standard.')).toBeLessThan(disclosure);
  expect(html.indexOf('vs Standard')).toBeLessThan(disclosure);
  expect(html).toContain('Compare priorities');
  expect(html).toContain('Capacity tradeoffs shrink with funded bonus work. Ordinary work continues when the boost is blocked.');
});

test('automatic research protection names the procedure and respects an explicit larger reserve', () => {
  const experienced = advance(perform(reportedStalledNetwork(), { type: 'network-plan', plan: 'clear' }), 240, () => 0.99);
  if (experienced.corporation.phase.id !== 'network') throw new Error('Expected a legally progressed Network.');
  expect(experienced.corporation.phase.network.completed).toBeGreaterThanOrEqual(10000);
  const s = perform(perform(experienced, { type: 'network-investment', policy: 'research-first' }), { type: 'network-knowledge-reserve', value: 3000 });
  const html = renderToStaticMarkup(<NetworkInvestment state={s} dispatch={() => undefined} />);
  expect(html).toContain('above 3,000 knowledge');
  expect(html).toContain('Protects Workflow cartography (2,500 knowledge).');
  expect(html).toContain('Procedure purchases are explicit and can use the reserve.');
});

test('capital and routing choices are absent before distributed computing', () => {
  expect(renderToStaticMarkup(<NetworkInvestment state={networkFixture()} dispatch={() => undefined} />)).toBe('');
});

test('procedures retain individual discovery markers until that procedure is inspected', () => {
  const s = reportedStalledNetwork();
  const visited = perform(s, { type: 'inspect-discoveries', workspaces: ['Network'], projects: [] });
  const before = renderToStaticMarkup(<Network state={visited} dispatch={() => undefined} />);
  expect(before).toContain('aria-label="Workflow cartography, new procedure"');
  expect(before).toContain('aria-label="Form compression, new procedure"');
  expect(before).toContain('aria-label="Institutional memory, new procedure"');
  const inspected = perform(visited, { type: 'inspect-discoveries', workspaces: [], projects: [], protocols: ['mapping'] });
  const after = renderToStaticMarkup(<Network state={inspected} dispatch={() => undefined} />);
  expect(after).toContain('tabindex="0" role="group" aria-label="Workflow cartography"');
  expect(after).not.toContain('aria-label="Workflow cartography, new procedure"');
  expect(after).toContain('aria-label="Form compression, new procedure"');
  expect(after).toContain('aria-label="Institutional memory, new procedure"');
});

test('early automation discloses its experience gate while preserving manual controls', () => {
  const freshInstructions = perform(reportedStalledNetwork(), { type: 'network-building', policy: 'manual' });
  const html = renderToStaticMarkup(<Network state={freshInstructions} dispatch={() => undefined} />);
  expect(html).toContain('Clear 10,000 workflows to earn standing investment.');
  expect(html).toContain('Clear 10,000 workflows to earn delegated infrastructure.');
  expect(html).toContain('value="research-first" disabled=""');
  expect(html).toContain('Launch 10,');
  expect(html).toContain('Survey computing');
});

test('coordination repair and growth funding remain visible beside the institution', () => {
  const s = reportedStalledNetwork();
  if (s.corporation.phase.id !== 'network') throw new Error('Expected the reported Network.');
  const state = { ...s, paused: true, corporation: { ...s.corporation, phase: { ...s.corporation.phase, network: { ...s.corporation.phase.network, coordinationLoad: 0.7, replicationCredit: 0 } } } };
  const html = renderToStaticMarkup(<Network state={state} dispatch={() => undefined} />);
  expect(html).toContain('Replication credit / capacity');
  expect(html).toContain('Every 250 cleared workflows fund one natural office launch.');
  expect(html).toContain('Coordination load');
  expect(html).toContain('Work efficiency');
  expect(html).toContain('Stabilization repairs it.');
  expect(html).toContain('35% less clearance capacity');
  expect(html).toContain('35% less discovery capacity');
  expect(html).toContain('data-simulation="network"');
  expect(html).toContain('data-running="false"');
});

test('each ending binds a distinct scene without ongoing production', () => {
  const s = reportedStalledNetwork();
  if (s.corporation.phase.id !== 'network') throw new Error('Expected the reported Network.');
  const finished = { ...s, corporation: { ...s.corporation, phase: { ...s.corporation.phase, network: { ...s.corporation.phase.network, completed: WORLD_WORKFLOWS, undiscovered: 0, discovered: 0 } } } };
  for (const ending of ['monopoly', 'commons'] as const) {
    const html = renderToStaticMarkup(<Ending state={perform(finished, { type: 'ending', ending })} dispatch={() => undefined} />);
    expect(html).toContain(`data-ending="${ending}"`);
    expect(html).toContain('data-simulation="ending"');
    expect(html).toContain(ending === 'monopoly' ? 'All work has stopped.' : 'The workers are free to leave.');
    expect(html).not.toContain('Competitive tenders');
  }
});
