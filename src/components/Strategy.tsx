import { contracts, contractIds, eventNames, policies, rivalIds, rivals } from '../game/corporation';
import { acquisitionCost, rivalRevenue } from '../game/expansion';
import { crisisCost, eventDescriptions, eventResponses, responseDescription } from '../game/events';
import type { Action } from '../game/engine';
import type { GameState } from '../game/state';
import { dollars, number, Pair, Purchase, Section } from './ui';
import { expectedOutput } from '../game/balance';

type Props = { state: GameState; dispatch: (action: Action) => void };
const policyDescriptions = { balanced: 'Normal output and payroll. Pressure falls slowly.', lean: '+25% output, -20% payroll. Lower morale and rising regulatory pressure.', humane: '-10% output, +20% payroll. Higher morale and falling pressure.' } as const;
export function CompanyHealth({ state }: { state: GameState }) {
  const c = state.corporation;
  return <Section title="Company health"><Pair label="Morale">{c.morale.toFixed(1)} / 100</Pair><progress max={100} value={c.morale} aria-label="Employee morale" /><Pair label="Regulatory pressure">{c.pressure.toFixed(1)} / 100</Pair><progress max={100} value={c.pressure} aria-label="Regulatory pressure" /><Pair label="Reputation">{c.reputation.toFixed(1)} / 100</Pair><Pair label="Management path">{c.projects.includes('stewardship') ? 'Stewardship' : c.projects.includes('extraction') ? 'Extraction' : 'Undecided'}</Pair><p className="hint">Morale affects output and slacking. Pressure reduces output. Compliance staff reduce pressure; incentives and policy support morale.</p></Section>;
}
export function BoardDecision({ state, dispatch }: Props) {
  const crisis = state.corporation.crisis;
  return <Section title="Board decisions" aside={<span className="muted">{crisis.status === 'pending' ? 'Awaiting a decision' : crisis.status === 'effect' ? `${Math.ceil(crisis.remaining)}s effect` : `Next in ${Math.ceil(crisis.remaining)}s`}</span>}>
    {crisis.status === 'calm' ? <p className="section-intro">The board is enjoying a brief period without an urgent meeting.</p> : <><h3>{eventNames[crisis.id]}</h3><p className="section-intro">{eventDescriptions[crisis.id]}</p>{crisis.status === 'effect' ? <><Pair label="Temporary output">{Math.round(crisis.output * 100)}%</Pair><Pair label="Temporary demand">{Math.round(crisis.demand * 100)}%</Pair><Pair label="Temporary research">{Math.round(crisis.research * 100)}%</Pair></> : <>
      {(['invest', 'exploit', 'wait'] as const).map(choice => <Purchase key={choice} name={eventResponses[crisis.id][choice].label} description={`${responseDescription(eventResponses[crisis.id][choice])}`} label={choice === 'invest' ? `Authorize · ${dollars(crisisCost(state))}` : 'Authorize response'} disabled={choice === 'invest' && state.cash < crisisCost(state)} onClick={() => dispatch({ type: 'crisis', choice })} />)}
    </>}</>}
  </Section>;
}
export function ContractDesk({ state, dispatch }: Props) {
  const c = state.corporation, order = c.contract;
  return <Section title="Contract desk" aside={<span className="muted">{c.completedContracts} fulfilled</span>}><p className="section-intro">Orders earn a premium and influence. Escrow diverts new forms away from retail sales. Missed orders return forms to inventory but cost reputation.</p>
    {order.status === 'active' ? <><h3>{contracts[order.id].name}</h3><Pair label="Forms in escrow">{number(order.delivered)} / {number(contracts[order.id].forms)}</Pair><progress max={contracts[order.id].forms} value={order.delivered} aria-label="Contract completion" /><Pair label="Time remaining">{Math.ceil(order.remaining)}s</Pair><Pair label="Projected reward">{dollars(contracts[order.id].reward * (1 + c.reputation / 500))}</Pair><div className="button-row">{(['half', 'all'] as const).map(allocation => <button key={allocation} aria-pressed={order.allocation === allocation} onClick={() => dispatch({ type: 'contract-allocation', allocation })}>{allocation === 'half' ? '50%' : '100%'} of output</button>)}<button onClick={() => dispatch({ type: 'cancel-contract' })}>Cancel order</button></div></> : <>{order.cooldown > 0 && <p className="hint">Next order available in {Math.ceil(order.cooldown)} seconds.</p>}{contractIds.filter(id => state.revenue >= contracts[id].revenue).map(id => {
      const terms = contracts[id];
      const output = expectedOutput(state) * 0.5, seconds = output > 0 ? Math.ceil(terms.forms / output) : null;
      const forecast = seconds === null ? 'No operations output.' : `At 50% allocation: about ${seconds}s. ${seconds > terms.seconds ? 'Current output misses the deadline.' : 'Supplies and changing conditions can alter delivery.'}`;
      return <Purchase key={id} name={terms.name} description={`${number(terms.forms)} forms in ${terms.seconds}s. ${dollars(terms.reward)} base reward, ${terms.influence} influence. ${forecast} ${!c.autoBuy && c.blankForms < terms.forms * 2 ? 'Blank stock is insufficient for both retail and the order.' : ''}`} label="Accept order" disabled={order.cooldown > 0 || state.revenue < terms.revenue} onClick={() => dispatch({ type: 'contract', id })} />;
    })}</>}
    <ContractReceipt state={state} />
  </Section>;
}
function ContractReceipt({ state }: { state: GameState }) {
  const receipt = state.corporation.lastContract;
  if (!receipt) return null;
  const outcome = receipt.status === 'completed' ? 'Delivered' : receipt.status === 'expired' ? 'Deadline missed' : 'Canceled';
  return <details className="result-receipt"><summary>Last order: {outcome}. {dollars(receipt.reward, true)} received.</summary><h3>{contracts[receipt.id].name}</h3><p className="hint">{receipt.status === 'completed' ? 'The entire order reached escrow before its deadline.' : receipt.status === 'expired' ? 'The deadline arrived before enough forms reached escrow.' : 'You canceled the order before delivery.'}</p><Pair label="Forms escrowed">{receipt.forms.toLocaleString('en-US', { maximumFractionDigits: 3 })}</Pair><Pair label="Forms returned to retail">{receipt.returned.toLocaleString('en-US', { maximumFractionDigits: 3 })}</Pair><Pair label="Cash received">{dollars(receipt.reward, true)}</Pair><Pair label="Influence received">{receipt.influence}</Pair><Pair label="Reputation change">{receipt.reputation > 0 ? '+' : ''}{receipt.reputation.toFixed(1)}</Pair>{receipt.status === 'completed' && <><Pair label="Posted retail value">{dollars(receipt.retailValue, true)}</Pair><Pair label="Premium over that value">{dollars(receipt.reward - receipt.retailValue, true)}</Pair><p className="hint">This compares the payout with escrowed forms at the settlement price. Retail demand may prevent those sales. Supplies, wages, and maintenance are not deducted.</p></>}</details>;
}
export function Acquisitions({ state, dispatch }: Props) {
  const c = state.corporation;
  return <Section title="Mergers & markets" aside={<span className="muted">{c.acquired.length} / 6 acquired</span>}><p className="section-intro">Every acquired market expands retail reach. Their staff arrive as unmodified generalists, and remain unmodified after your research.</p>{!c.projects.includes('mergers') && <p className="hint">Research Merger approval to acquire competitors.</p>}{rivalIds.map(id => {
    const r = rivals[id], owned = c.acquired.includes(id), cost = acquisitionCost(state, id), influence = 10 + c.acquired.length * 5;
    return <Purchase key={id} name={r.name} description={`${r.employees} legacy employees. Reported revenue ${dollars(rivalRevenue(state, id))}.`} label={owned ? 'Integrated' : `Acquire · ${dollars(cost)} / ${influence} influence`} disabled={owned || !c.projects.includes('mergers') || state.cash < cost || c.influence < influence} onClick={() => dispatch({ type: 'acquire', id })} />;
  })}</Section>;
}
export function Strategy({ state, dispatch }: Props) {
  return <div className="strategy-grid"><div><CompanyHealth state={state} /><Section title="Operating policy"><p className="section-intro">Policies can change at any time. Management paths are permanent for this company.</p>{policies.map(policy => <Purchase key={policy} name={policy[0]?.toUpperCase() + policy.slice(1)} description={policyDescriptions[policy]} label={state.corporation.policy === policy ? 'Current policy' : 'Apply policy'} disabled={state.corporation.policy === policy} onClick={() => dispatch({ type: 'policy', policy })} />)}</Section><BoardDecision state={state} dispatch={dispatch} /></div><ContractDesk state={state} dispatch={dispatch} /><Acquisitions state={state} dispatch={dispatch} /></div>;
}
