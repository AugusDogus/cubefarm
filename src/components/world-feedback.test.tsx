import { expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { officeFixture } from '../game/testing/fixtures';
import { Hairline } from './Hairline';
import { World } from './World';

test('cubicle paperwork depicts current unsold work after lifetime production grows', () => {
  const state = officeFixture();
  const empty = renderToStaticMarkup(<World state={{ ...state, paperwork: 1_000_000_000, corporation: { ...state.corporation, inventory: 0 } }} />);
  const queued = renderToStaticMarkup(<World state={{ ...state, paperwork: 1_000_000_000, corporation: { ...state.corporation, inventory: 256 } }} />);
  expect(empty).toContain('data-queue="0"');
  expect(queued).toContain('data-queue="256"');
  expect(queued).toContain('Paper piles show the current unsold forms');
});

test('paused operations explicitly freeze figure work while inspection remains available', () => {
  const state = officeFixture();
  const html = renderToStaticMarkup(<World state={{ ...state, paused: true }} />);
  expect(html).toContain('data-running="false"');
  expect(html).toContain('role="img"');
  expect(html).toContain('data-simulation="office"');
});

test('ending artwork expresses ownership without rewriting historical employee activity', () => {
  const state = officeFixture(), original = JSON.stringify(state.employees);
  for (const ending of ['commons', 'monopoly'] as const) {
    const html = renderToStaticMarkup(<Hairline name="cubicles" value={9} label={ending === 'commons' ? 'Open chairs, free attendance.' : 'Every cubicle remains occupied.'} workers={state.employees.map(employee => employee.activity)} simulation={{ kind: 'ending', ending }} />);
    expect(html).toContain(`data-ending="${ending}"`);
    expect(html).toContain('data-running="false"');
  }
  expect(JSON.stringify(state.employees)).toBe(original);
});
