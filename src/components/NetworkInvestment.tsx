import { useEffect, useState } from 'react';
import type { Action } from '../game/engine';
import type { GameState } from '../game/state';
import { computeRoutingIds, capitalPolicyIds, coordinationEfficiency, protocolIds, protocols, tickNetwork, WORLD_WORKFLOWS, type Network, type ProtocolId } from '../game/network';
import { networkCommissionCost, networkCommissionQuote, COMMISSION_LIFETIME_LIMIT } from '../game/network-capital';
import { investmentKnowledgeReserve } from '../game/network-investment';
import { operatingReserve } from '../game/automation';
import { dollars, number, Pair, Section } from './ui';

type Props = { state: GameState; dispatch: (action: Action) => void };
const routingNames = { standard: 'Standard', survey: 'Survey computing', parallel: 'Parallel filing' } as const;
const policyNames = { manual: 'Manual investment', 'research-first': 'Research first' } as const;
const routingDescriptions = {
  standard: 'Keep computing and knowledge available for offices and procedures.',
  survey: 'Up to twice discovery. At full boost, 35% less clearance capacity. Each extra located workflow uses 0.25 compute. Intensive work increases coordination load.',
  parallel: 'Up to twice clearance. At full boost, 35% less discovery capacity. Each extra cleared workflow uses 0.5 compute and 0.1 knowledge. Slows automatically at your reserve. Intensive work increases coordination load.',
} as const;

export function NetworkInvestment({ state, dispatch }: Props) {
  const [batch, setBatch] = useState<'ten' | 'hundred' | 'affordable'>('ten');
  const phase = state.corporation.phase;
  if (phase.id !== 'network' || !phase.network.protocols.includes('distributed')) return null;
  const n = phase.network, cashBudget = Math.max(0, state.cash - operatingReserve(state));
  const knowledgeBudget = Math.max(0, n.knowledge - n.knowledgeReserve);
  const requested = batch === 'ten' ? 10 : batch === 'hundred' ? 100 : 1000;
  const quote = networkCommissionQuote({ ...n, knowledge: knowledgeBudget }, cashBudget, requested);
  const nextCost = networkCommissionCost(n, 1);
  const blocked = n.completed >= WORLD_WORKFLOWS ? 'All worldwide work is complete.' : n.commissioned >= COMMISSION_LIFETIME_LIMIT ? 'Lifetime commissioning limit reached.' : n.nodes + 1 > Number.MAX_SAFE_INTEGER ? 'Office count limit reached.' : quote.count === 0 ? `Next office needs ${dollars(nextCost.cash, true)} and ${nextCost.knowledge.toFixed(3)} knowledge above reserves. ${cashBudget < nextCost.cash ? 'Cash is insufficient. ' : ''}${knowledgeBudget < nextCost.knowledge ? 'Knowledge is insufficient.' : ''}` : null;
  const preview = tickNetwork(n, 1, state.corporation.pressure).network;
  const standard = tickNetwork({ ...n, computeRouting: 'standard' }, 1, state.corporation.pressure).network;
  const protectedResearch = protocolIds.reduce<ProtocolId | null>((cheapest, id) => n.protocols.includes(id) || !protocols[id].requires.every(required => n.protocols.includes(required)) ? cheapest : cheapest === null || protocols[id].cost < protocols[cheapest].cost ? id : cheapest, null);
  return <Section title="Capital & computing"><div className="network-investment-grid">
    <div><h3>Commission offices</h3><p className="hint">Launch offices now with cash and knowledge, or retain knowledge for procedures. Costs rise with lifetime launches. Your allocations stay unchanged. Expansion increases coordination load; stabilization repairs it.</p>
      <div className="button-row batch-options">{(['ten', 'hundred', 'affordable'] as const).map(value => <button key={value} aria-pressed={batch === value} onClick={() => setBatch(value)}>{value === 'ten' ? 'Up to 10' : value === 'hundred' ? 'Up to 100' : 'Up to 1,000'}</button>)}</div>
      <Pair label="Cash above reserve">{dollars(cashBudget, true)}</Pair><Pair label="Knowledge above reserve">{knowledgeBudget.toFixed(3)}</Pair>
      {quote.count > 0 && <Pair label="Coordination load after launch">{(Math.min(1, n.coordinationLoad + quote.count / 1000 * 0.4) * 100).toFixed(2)}%</Pair>}
      <button className="full" disabled={blocked !== null} onClick={() => dispatch({ type: 'network-commission', count: quote.count })}>{blocked !== null ? 'Launch unavailable' : `Launch ${number(quote.count)}, ${dollars(quote.cash, true)} + ${quote.knowledge.toFixed(3)} knowledge`}</button>
      {blocked && <p className="hint">{blocked}</p>}
      <Pair label="Offices commissioned">{number(n.commissioned)}</Pair>
      <label className="field-label">Standing investment<select value={n.capitalPolicy} onChange={event => { const policy = capitalPolicyIds.find(id => id === event.target.value); if (policy) dispatch({ type: 'network-investment', policy }); }}>{capitalPolicyIds.map(id => <option key={id} value={id} disabled={id !== 'manual' && n.completed < 10000 && n.capitalPolicy !== id}>{policyNames[id]}</option>)}</select></label>
      {n.completed < 10000 && n.capitalPolicy === 'manual' && <p className="hint">Clear 10,000 workflows to earn standing investment. {number(n.completed)} cleared so far; manual launches remain available.</p>}
      <p className="hint">{n.capitalPolicy === 'manual' ? 'Automatic commissioning is off.' : `Automatically invest surplus above ${number(investmentKnowledgeReserve(n))} knowledge.${protectedResearch === null ? ' All procedures are deployed.' : ` Protects ${protocols[protectedResearch].name} (${number(protocols[protectedResearch].cost)} knowledge).`}`} Cash and knowledge reserves are retained. Extra offices still need power.</p>
      <p className="hint">Research first governs automatic launches. Manual launches and parallel filing use your minimum knowledge reserve.</p>
    </div>
    <div><h3>Computing priority</h3><div className="button-row">{computeRoutingIds.map(routing => <button key={routing} aria-pressed={routing === n.computeRouting} onClick={() => dispatch({ type: 'network-routing', routing })}>{routingNames[routing]}</button>)}</div>
      <p className="hint">Selected: {routingNames[n.computeRouting]}. {routingDescriptions[n.computeRouting]}</p>
      {computeRoutingIds.filter(routing => routing !== n.computeRouting).map(routing => <p className="hint" key={routing}>{routingNames[routing]}: {routingDescriptions[routing]}</p>)}
      <p className="hint">Computing needed for natural replication is retained first. Capacity tradeoffs shrink with funded bonus work. Ordinary work continues when the boost is blocked.</p>
      <Pair label="Coordination load">{(n.coordinationLoad * 100).toFixed(1)}% ({(coordinationEfficiency(n) * 100).toFixed(1)}% work efficiency)</Pair><Pair label="Load net / s">{signed((preview.coordinationLoad - n.coordinationLoad) * 100)} percentage points</Pair><p className="hint">Stabilization repairs load. Standard computing avoids intensive load.</p>
      <p className="hint">Rates below forecast one second of active operation.</p>
      <Pair label="Compute spent / s">{number(preview.computeSpentRate)}</Pair><Pair label="Knowledge spent / s">{preview.knowledgeSpentRate.toFixed(1)}</Pair>
      <Pair label="Located / s">{number(preview.discoveredRate)} ({signed(preview.discoveredRate - standard.discoveredRate)} vs Standard)</Pair><Pair label="Cleared / s">{number(preview.processedRate)} ({signed(preview.processedRate - standard.processedRate)} vs Standard)</Pair><Pair label="Knowledge net / s">{signed(preview.knowledge - n.knowledge)}</Pair>
      <details><summary>Compare priorities</summary>{computeRoutingIds.map(routing => { const forecast = tickNetwork({ ...n, computeRouting: routing }, 1, state.corporation.pressure).network; return <p className="hint" key={routing}>{routingNames[routing]}: {number(forecast.discoveredRate)} located/s, {number(forecast.processedRate)} cleared/s; spends {number(forecast.computeSpentRate)} compute/s and {forecast.knowledgeSpentRate.toFixed(1)} knowledge/s.</p>; })}<p className="hint">One-second forecasts. Available work, resources, and later investment alter these rates.</p></details>
      <KnowledgeReserve network={n} dispatch={dispatch} />
    </div>
  </div></Section>;
}

function signed(value: number) { return `${value >= 0 ? '+' : ''}${value.toFixed(1)}`; }

function KnowledgeReserve({ network, dispatch }: { network: Network; dispatch: Props['dispatch'] }) {
  const [value, setValue] = useState(network.knowledgeReserve);
  const [editing, setEditing] = useState(false);
  useEffect(() => { if (!editing) setValue(network.knowledgeReserve); }, [network.knowledgeReserve, editing]);
  return <form className="reserve-control" onFocus={() => setEditing(true)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setEditing(false); }} onSubmit={event => { event.preventDefault(); dispatch({ type: 'network-knowledge-reserve', value }); event.currentTarget.querySelector('input')?.focus(); }}><label className="field-label">Minimum knowledge reserve<input type="number" min={0} step="any" required value={Number.isFinite(value) ? value : ''} onChange={event => { setEditing(true); setValue(event.target.value === '' ? NaN : Number(event.target.value)); }} /></label><button disabled={!Number.isFinite(value) || value < 0 || value > Number.MAX_SAFE_INTEGER || value === network.knowledgeReserve}>Set knowledge reserve</button><p className="hint">Protects knowledge from parallel filing and all commissioning. Procedure purchases are explicit and can use the reserve.</p></form>;
}
