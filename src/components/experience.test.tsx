import { expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { App } from '../App';
import { initialState, type GameState } from '../game/state';
import { SAVE_KEY } from '../game/storage';
import { officeFixture, labFixture, networkFixture, perform } from '../game/testing/fixtures';
import { Workforce } from './Workforce';
import { Departments } from './Departments';

function renderGame(state: GameState) {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const raw = JSON.stringify({ ...state, lastSeen: Date.now() });
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { localStorage: { getItem: (key: string) => key === SAVE_KEY ? raw : null } } });
  try { return renderToStaticMarkup(<App />); }
  finally {
    if (previous) Object.defineProperty(globalThis, 'window', previous);
    else Reflect.deleteProperty(globalThis, 'window');
  }
}

test('opening renders one filing action without navigation or future-system spoilers', () => {
  const markup = renderGame(initialState());
  expect(markup).toContain('data-testid="file"');
  expect(markup).not.toContain('aria-label="Workspaces"');
  for (const word of ['Cultivar', 'Genes', 'Development', 'Network', 'Standing instructions']) expect(markup).not.toContain(word);
});

test('employee inspection reveals genetics and departments only when learned', () => {
  const opening = renderToStaticMarkup(<Workforce state={officeFixture()} dispatch={() => {}} />);
  expect(opening).toContain('Profile');
  for (const word of ['Cultivar', 'Genes', 'Research earns', '>Department<']) expect(opening).not.toContain(word);
  const lab = renderToStaticMarkup(<Workforce state={labFixture()} dispatch={() => {}} />);
  expect(lab).toContain('Cultivar'); expect(lab).toContain('Genes'); expect(lab).toContain('Department');
});

test('unchanged headcounts still expose a one-action rebalance', () => {
  const markup = renderToStaticMarkup(<Departments state={labFixture()} dispatch={() => {}} />);
  expect(markup).toContain('<button>Rebalance roles</button>');
});

test('paused network exposes Resume, reserve editing, artwork and only two workspaces', () => {
  const state = perform(networkFixture(), { type: 'protocol', id: 'distributed' });
  const markup = renderGame({ ...state, paused: true });
  expect(markup).toContain('>Resume</button>');
  expect(markup).toContain('Minimum cash reserve');
  expect(markup).toContain('The autonomous institution grows');
  const navigation = markup.match(/<nav class="tabs" aria-label="Workspaces">([\s\S]*?)<\/nav>/)?.[1];
  if (!navigation) throw new Error('Expected the Network workspace navigation.');
  expect(navigation.match(/<button\b/g)).toHaveLength(2);
  expect(navigation).toMatch(/<button[^>]*aria-current="page"[^>]*>Network(?:<span[^>]*>New<\/span>)?<\/button>/);
  expect(navigation).toMatch(/<button[^>]*>Archive(?:<span[^>]*>New<\/span>)?<\/button>/);
  expect(markup).not.toContain('>Company</button>');
});
