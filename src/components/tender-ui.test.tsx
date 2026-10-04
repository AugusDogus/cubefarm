import { expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { act, advance } from '../game/engine';
import { initialState, type GameState } from '../game/state';
import { approachIds, quoteFor, tenderQuote, TENDER_RESOLUTION_SECONDS } from '../game/tender';
import { enterpriseFixture, networkFixture } from '../game/testing/fixtures';
import { Tender } from './Tender';
import { dollars, percent } from './ui';

const render = (state: GameState) => renderToStaticMarkup(<Tender state={state} dispatch={() => undefined} />);

function brief(state: GameState) {
  const result = act(state, { type: 'tender-draw' }, () => 0.3);
  if (!result.ok) throw new Error(result.message);
  return result.state;
}

function submitted(state: GameState, roll: number) {
  const result = act(brief(state), { type: 'tender-bid', approach: 'responsive', stake: 100 }, () => roll);
  if (!result.ok) throw new Error(result.message);
  return result.state;
}

test('tenders hide before the charter without revealing later resource systems', () => {
  expect(render(initialState())).toBe('');
  const markup = render(enterpriseFixture());
  expect(markup).toContain('Competitive tenders');
  expect(markup).toContain('Read next client brief');
  expect(markup).not.toContain('knowledge');
  expect(markup).not.toContain('type="radio"');
});

test('a brief discloses client priorities and all three bounded bid outcomes before commitment', () => {
  const state = brief(enterpriseFixture());
  const stage = state.corporation.tender.stage;
  if (stage.status !== 'brief') throw new Error('Expected a drawn client brief.');
  const markup = render(state);
  expect(markup.match(/type="radio"/g)?.length).toBe(3);
  expect(markup).not.toContain('checked=""');
  expect(markup).toContain('Quality priority');
  expect(markup).toContain('Speed priority');
  expect(markup).toContain('Scope priority');
  expect(markup).toContain('operating reserve');
  expect(markup).toContain('whole dollars');
  expect(markup).toContain('Maximum cash loss');
  expect(markup).toContain('Maximum research loss');
  expect(markup).toContain('Net resources if accepted');
  expect(markup).toContain('Cash and research are paid on submission');
  expect(markup).toContain('Cash profit if accepted');
  expect(markup).toContain('insights');
  expect(markup).toContain('influence');
  for (const approach of approachIds) {
    const quote = tenderQuote(state, stage.brief, approach, 200);
    if (!quote) throw new Error('Expected affordable default bid quote.');
    expect(markup).toContain(percent(quote.chance));
    expect(markup).toContain(dollars(quote.netIfWon, true));
    expect(markup).toContain(dollars(quote.maxLoss, true));
    expect(quote.researchCost.kind).toBe('insights');
    if (quote.researchCost.kind !== 'insights' || quote.reward.kind !== 'enterprise') throw new Error('Expected enterprise resource terms.');
    expect(markup).toContain(`${quote.researchCost.amount} insights`);
    expect(markup).toContain(`${new Intl.NumberFormat('en-US', { maximumFractionDigits: 5 }).format(quote.reward.insights - quote.researchCost.amount)} insights`);
  }
  expect(markup).toContain('<button disabled="">Submit bid</button>');
});

test('unfunded briefs explain the reserve blocker and keep decline available', () => {
  const drawn = brief(enterpriseFixture());
  const markup = render({ ...drawn, cash: 0 });
  expect(markup).toContain('No affordable bid is available above the operating reserve and protected research');
  expect(markup).toContain('<button disabled="">Submit bid</button>');
  expect(markup).toContain('<button type="button">Decline brief</button>');
});

test('evaluation reveals actual progress and paused state without the committed outcome', () => {
  const state = submitted(enterpriseFixture(), 0.123456);
  const markup = render({ ...state, paused: true });
  expect(markup).toContain('Tender evaluation progress');
  expect(markup).toContain('Evaluation is paused');
  expect(markup).toContain('The submitted approach and odds are fixed');
  expect(markup).not.toContain('decision draw');
  expect(markup).not.toContain('123456');
  expect(markup).not.toContain('Submit bid');
  expect(markup).not.toContain('Read next client brief');
});

test('both outcomes retain exact receipts and describe the actual acceptance decision', () => {
  for (const roll of [0, 0.999999]) {
    const state = advance(submitted(enterpriseFixture(), roll), TENDER_RESOLUTION_SECONDS, () => 0.5);
    const receipt = state.corporation.tender.lastReceipt;
    if (!receipt) throw new Error('Expected settled tender receipt.');
    const markup = render(state);
    expect(markup).toContain(receipt.won ? 'Latest result: Bid accepted' : 'Latest result: Bid declined');
    expect(markup).toContain(dollars(receipt.net, true));
    expect(markup).toContain(dollars(receipt.gross, true));
    expect(markup).toContain(`Client priorities: quality ${receipt.brief.weights.quality}%`);
    expect(markup).toContain('Resources earned');
    expect(markup).toContain('Research paid');
    expect(markup).toContain('Net resources result');
    if (!receipt.won) {
      expect(receipt.netResearch).toBeLessThan(0);
      expect(markup).toContain(`${receipt.netResearch} insights`);
    }
    expect(markup).toContain(receipt.won ? 'so the bid won' : 'so a competitor won');
    expect(markup).toContain('Read next client brief');
  }
});

test('Network tenders expose their current knowledge reward without reverting to enterprise rewards', () => {
  const markup = render(brief(networkFixture()));
  expect(markup).toContain('knowledge');
  expect(markup).not.toContain('insights');
  expect(markup).not.toContain('influence');
  expect(markup).toContain('can delay Low-power cubicles, which costs 500 knowledge');
});

test('an earlier brief keeps its disclosed reward after the company enters Network', () => {
  const earlier = brief(enterpriseFixture());
  const network = networkFixture();
  const markup = render({ ...network, corporation: { ...network.corporation, tender: earlier.corporation.tender } });
  expect(markup).toContain('Winning earns cash and research and influence');
  expect(markup).toContain('insights');
  expect(markup).not.toContain('knowledge');
});

test('knowledge reserves prevent bids even when cash is abundant', () => {
  const state = brief(networkFixture());
  const phase = state.corporation.phase;
  if (phase.id !== 'network') throw new Error('Expected Network fixture.');
  const reserved = { ...state, corporation: { ...state.corporation, phase: { ...phase, network: { ...phase.network, knowledgeReserve: phase.network.knowledge } } } };
  const markup = render(reserved);
  expect(markup).toContain('Protected knowledge reserve');
  expect(markup).toContain('No affordable bid is available');
  expect(markup).toContain('<button disabled="">Submit bid</button>');
});

test('legacy submitted bids retain zero research cost and zero-cost receipts', () => {
  const state = submitted(enterpriseFixture(), 0.999999);
  const stage = state.corporation.tender.stage;
  if (stage.status !== 'resolving') throw new Error('Expected submitted tender.');
  const quote = quoteFor(stage.brief, stage.approach, stage.stake, 1);
  const legacy = { ...state, corporation: { ...state.corporation, tender: { ...state.corporation.tender, stage: { ...stage, quote } } } };
  expect(render(legacy)).toContain('Maximum research loss</span><span class="numeric">None');
  const settled = advance(legacy, TENDER_RESOLUTION_SECONDS, () => 0.5);
  expect(settled.corporation.tender.lastReceipt?.researchCost.kind).toBe('none');
  expect(render(settled)).toContain('Research paid</span><span class="numeric">None');
});

test('small Network research losses retain their exact fractional amount in receipts', () => {
  const drawn = brief(networkFixture());
  const result = act(drawn, { type: 'tender-bid', approach: 'assurance', stake: 1 }, () => 0.999999);
  if (!result.ok) throw new Error(result.message);
  const settled = advance(result.state, TENDER_RESOLUTION_SECONDS, () => 0.5);
  const markup = render(settled);
  expect(markup).toContain('0.00035 knowledge');
  expect(markup).toContain('-0.00035 knowledge');
});
