import { useState } from 'react';
import type { Action } from '../game/engine';
import type { GameState } from '../game/state';
import { approachIds, approaches, clients, tenderAvailable, tenderNextProcedure, tenderQuote, tenderResearchBudget, tenderStakeCap, tenderStakeLimit, TENDER_RESOLUTION_SECONDS, type ApproachId, type TenderBrief, type TenderQuote, type TenderReceipt, type TenderReward } from '../game/tender';
import { dollars, Pair, percent, Section } from './ui';

type Props = { state: GameState; dispatch: (action: Action) => void };

const amount = (value: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 5 }).format(value);

function rewardText(reward: TenderReward, cost: TenderQuote['researchCost'] = { kind: 'none' }) {
  return reward.kind === 'network'
    ? `${amount(reward.knowledge - (cost.kind === 'knowledge' ? cost.amount : 0))} knowledge`
    : `${amount(reward.insights - (cost.kind === 'insights' ? cost.amount : 0))} insights + ${amount(reward.influence)} influence`;
}

const researchText = (cost: TenderQuote['researchCost']) => cost.kind === 'none' ? 'None' : `${amount(cost.amount)} ${cost.kind}`;

export function Tender({ state, dispatch }: Props) {
  if (!tenderAvailable(state)) return null;
  const tender = state.corporation.tender, stage = tender.stage;
  const networkReward = stage.status === 'brief' || stage.status === 'resolving' ? stage.brief.tier === 'network' : state.corporation.phase.id === 'network';
  return <Section title="Competitive tenders" aside={<span className="muted">Optional</span>}>
    <p className="section-intro">Read a client’s priorities, choose an approach, and commit a bounded bid. Winning earns cash and {networkReward ? 'knowledge' : 'research and influence'}.</p>
    {stage.status === 'brief' ? <TenderBid key={stage.brief.sequence} state={state} brief={stage.brief} dispatch={dispatch} /> : stage.status === 'resolving' ? <>
      <h3>{clients[stage.brief.client].name}</h3>
      <Pair label="Submitted approach">{approaches[stage.approach].name}</Pair>
      <Pair label="Bid committed">{dollars(stage.stake, true)}</Pair>
      <Pair label="Acceptance chance">{percent(stage.quote.chance)}</Pair>
      <Pair label="Maximum cash loss">{dollars(stage.quote.maxLoss, true)}</Pair>
      <Pair label="Maximum research loss">{researchText(stage.quote.researchCost)}</Pair>
      <Pair label="Cash profit if accepted">{dollars(stage.quote.netIfWon, true)}</Pair>
      <Pair label="Net resources if accepted">{rewardText(stage.quote.reward, stage.quote.researchCost)}</Pair>
      <p className="tender-stages">{stage.remaining > 5 ? 'Reviewing the proposal' : stage.remaining > 2 ? 'Comparing competing bids' : 'Preparing the client’s decision'}</p>
      <progress max={TENDER_RESOLUTION_SECONDS} value={TENDER_RESOLUTION_SECONDS - stage.remaining} aria-label="Tender evaluation progress" />
      <p className="hint">{state.paused ? 'Evaluation is paused. Resume the game to continue.' : `Decision in ${Math.ceil(stage.remaining)} seconds.`} The submitted approach and odds are fixed.</p>
    </> : <>
      <button disabled={stage.cooldown > 0} onClick={() => dispatch({ type: 'tender-draw' })}>Read next client brief</button>
      {stage.cooldown > 0 && <p className="hint">Next brief in {Math.ceil(stage.cooldown)} seconds{state.paused ? ', paused' : ''}.</p>}
    </>}
    {tender.lastReceipt && <TenderResult receipt={tender.lastReceipt} />}
  </Section>;
}

function TenderBid({ state, brief, dispatch }: Props & { brief: TenderBrief }) {
  const limit = tenderStakeLimit(state, brief), cap = tenderStakeCap(brief);
  const research = tenderResearchBudget(state, brief);
  const nextProcedure = brief.tier === 'network' ? tenderNextProcedure(state) : null;
  const [stake, setStake] = useState(Math.min(limit, Math.max(1, Math.floor(cap / 10))));
  const [approach, setApproach] = useState<ApproachId | null>(null);
  const validStake = Number.isSafeInteger(stake) && stake >= 1 && stake <= limit;
  const selectedQuote = approach && validStake ? tenderQuote(state, brief, approach, stake) : null;
  return <form onSubmit={event => { event.preventDefault(); if (approach && selectedQuote) dispatch({ type: 'tender-bid', approach, stake }); }}>
    <h3>{clients[brief.client].name}</h3><p className="hint">{clients[brief.client].description}</p>
    <Pair label="Quality priority">{brief.weights.quality}%</Pair><Pair label="Speed priority">{brief.weights.speed}%</Pair><Pair label="Scope priority">{brief.weights.scope}%</Pair>
    <Pair label={`Available ${research.kind}`}>{amount(research.available)}</Pair>
    {research.kind === 'knowledge' && <Pair label="Protected knowledge reserve">{amount(research.reserve)}</Pair>}
    {nextProcedure && <p className="hint">Research lost on a declined bid can delay {nextProcedure.name}, which costs {amount(nextProcedure.cost)} knowledge.</p>}
    <label className="field-label">Bid exposure, USD<input aria-describedby="tender-exposure-help" type="number" min={1} max={limit} step={1} required value={Number.isFinite(stake) ? stake : ''} onChange={event => setStake(event.target.value === '' ? NaN : Number(event.target.value))} /></label>
    <p className="hint" id="tender-exposure-help">Cash and research are paid on submission and lost if declined. Cash exposure is capped at {dollars(limit, true)} by funds above the operating reserve and available {research.kind}; this brief permits {dollars(cap, true)}. Bids use whole dollars.</p>
    <div className="button-row"><button type="button" disabled={limit < 1} onClick={() => setStake(Math.min(limit, Math.max(1, Math.floor(cap / 10))))}>Small bid</button><button type="button" disabled={limit < 1} onClick={() => setStake(Math.max(1, Math.floor(limit / 2)))}>Half available</button><button type="button" disabled={limit < 1} onClick={() => setStake(limit)}>Maximum exposure</button></div>
    <fieldset className="tender-choices"><legend>Choose an approach</legend><div className="tender-approaches">{approachIds.map(id => {
      const quote = validStake ? tenderQuote(state, brief, id, stake) : null;
      return <div className={`tender-approach${approach === id ? ' selected' : ''}`} key={id}>
        <label><input type="radio" name="tender-approach" value={id} checked={approach === id} onChange={() => setApproach(id)} required /> {approaches[id].name}</label>
        <p className="hint">{approaches[id].description}</p>
        {quote ? <><Pair label="Priority match">{percent(quote.match)}</Pair><Pair label="Acceptance chance">{percent(quote.chance)}</Pair><Pair label="Cash profit if accepted">{dollars(quote.netIfWon, true)}</Pair><Pair label="Maximum cash loss">{dollars(quote.maxLoss, true)}</Pair><Pair label="Maximum research loss">{researchText(quote.researchCost)}</Pair><p className="hint">Net resources if accepted: {rewardText(quote.reward, quote.researchCost)}.</p></> : <p className="hint">Enter an affordable whole-dollar bid to compare outcomes.</p>}
      </div>;
    })}</div></fieldset>
    {limit < 1 ? <p className="hint">No affordable bid is available above the operating reserve and protected research. Retain this brief until you have funds and {research.kind}, or decline it.</p> : !validStake && <p className="hint">Enter a whole-dollar bid from $1.00 to {dollars(limit, true)}.</p>}
    <div className="button-row"><button disabled={!selectedQuote}>Submit bid{selectedQuote ? `, risk ${dollars(selectedQuote.maxLoss, true)}${selectedQuote.researchCost.kind === 'none' ? '' : ` + ${researchText(selectedQuote.researchCost)}`}` : ''}</button><button type="button" onClick={() => dispatch({ type: 'tender-decline' })}>Decline brief</button></div>
    <p className="hint">Evaluation takes {TENDER_RESOLUTION_SECONDS} seconds of active play. You can leave this desk while it runs.</p>
  </form>;
}

function TenderResult({ receipt }: { receipt: TenderReceipt }) {
  return <div className="subsection tender-receipt"><h3>Latest result: {receipt.won ? 'Bid accepted' : 'Bid declined'}</h3>
    <p className="hint">{clients[receipt.brief.client].name} · {approaches[receipt.approach].name}</p>
    <p className="hint">Client priorities: quality {receipt.brief.weights.quality}%, speed {receipt.brief.weights.speed}%, scope {receipt.brief.weights.scope}%.</p>
    <Pair label="Bid paid">{dollars(receipt.stake, true)}</Pair><Pair label="Research paid">{researchText(receipt.researchCost)}</Pair><Pair label="Cash returned">{dollars(receipt.gross, true)}</Pair><Pair label="Net cash result">{dollars(receipt.net, true)}</Pair><Pair label="Resources earned">{rewardText(receipt.reward)}</Pair><Pair label="Net resources result">{rewardText(receipt.reward, receipt.researchCost)}</Pair>
    {receipt.limited && <p className="hint">The account limit reduced this payout. The receipt shows credited amounts.</p>}
    <p className="hint">Your approach matched {percent(receipt.quote.match)} of the client’s priorities, giving {percent(receipt.quote.chance)} acceptance odds. {receipt.won ? 'The client’s decision draw fell below your acceptance threshold, so the bid won.' : 'The client’s decision draw reached or exceeded your acceptance threshold, so a competitor won.'}</p>
  </div>;
}
