import { useEffect, useState } from 'react';
import type { Action } from '../game/engine';
import type { GameState } from '../game/state';
import { allocationKeys, assetCost, coordinationEfficiency, coordinationRecoveryRate, infrastructureNeed, networkDiagnosis, networkPlan, replicationSupportRate, tickNetwork, powerCapacity, protocols, stabilityNeed, WORLD_WORKFLOWS, type AllocationKey, type ProtocolId } from '../game/network';
import { unseenDiscoveries, visibleProcedures } from '../game/discovery-feedback';
import { operatingReserve } from '../game/automation';
import { commonsSettlement, endingEcho } from '../game/story';
import { CashReserve } from './Delegation';
import { Hairline } from './Hairline';
import { NetworkInvestment } from './NetworkInvestment';
import { Tender } from './Tender';
import { clock, dollars, number, Pair, Purchase, Section } from './ui';

type Props = { state: GameState; dispatch: (action: Action) => void };
type NetworkProps = Props & { emphasizedProtocols?: readonly ProtocolId[]; finishProtocolEmphasis?: (id: ProtocolId) => void };
const descriptions = { discover: 'Locate remaining work.', replicate: 'Grow offices using power, compute, and replication credit. Every 250 cleared workflows fund one new office. Larger networks grow more slowly.', process: 'Clear discovered work for $0.06 per workflow, earning knowledge and replication credit.', stabilize: 'Preserve offices and repair coordination load. Too little causes office losses.' } as const;
export function Network({ state, dispatch, emphasizedProtocols = [], finishProtocolEmphasis }: NetworkProps) {
  const [batch, setBatch] = useState<'one' | 'needed'>('needed');
  const phase = state.corporation.phase;
  if (phase.id !== 'network') return null;
  const n = phase.network, finished = n.completed >= WORLD_WORKFLOWS;
  const forecast = tickNetwork(n, 1, state.corporation.pressure).network;
  const knowledgeNet = forecast.knowledge - n.knowledge;
  const poweredServers = Math.min(n.servers, Math.min(n.plants * 1200, n.energy + powerCapacity(n)) / 3);
  const computeGeneration = poweredServers * (n.protocols.includes('distributed') ? 160 : 40);
  const need = infrastructureNeed(n), reserve = operatingReserve(state), stability = stabilityNeed(n, state.corporation.pressure) * 100;
  const powerLimit = Math.max(0, (powerCapacity(n) - n.servers * 3) / (n.protocols.includes('efficient') ? 0.2 : 0.4));
  const remaining = WORLD_WORKFLOWS - n.completed;
  const estimate = n.processedRate > 0 ? remaining / n.processedRate : null;
  const diagnosis = networkDiagnosis(n, state.corporation.pressure);
  const availableProcedures = visibleProcedures(state);
  const unseenProcedures = unseenDiscoveries(state, state.discoveryRecord).protocols;
  const deployableProcedures = availableProcedures.filter(id => protocols[id].cost <= n.knowledge).length;
  return <>
    <div className="network-intro"><h2>A finite amount of work.</h2><p>The headquarters is in the archive. Here, growth, discovery, and clearance compete for the same offices. Build the institution that can finish the job.</p></div>
    {finished ? <Section title="The final board meeting"><p className="section-intro">No forms remain. There is no next target unless you invent one.</p><div className="ending-choices"><Purchase name="Keep the institution" description="Keep every office under one owner. Everyone has a place. The company decides what comes next." label="Retain the monopoly" disabled={false} onClick={() => dispatch({ type: 'ending', ending: 'monopoly' })} /><Purchase name="Open the doors" description={`Give ownership to the people who built the network.${commonsSettlement(state) ? ' Your retained worker patents must first be bought out for $250,000.' : ' Their designs are already their own.'}`} label={commonsSettlement(state) ? `Buy out patents and share, ${dollars(commonsSettlement(state))}` : 'Release the company'} disabled={state.cash < commonsSettlement(state)} onClick={() => dispatch({ type: 'ending', ending: 'commons' })} /></div></Section> : <>
      <div id="network-decisions" className="network-resources"><Pair label="Available funds">{dollars(state.cash, true)}</Pair><Pair label="Knowledge">{number(n.knowledge)}</Pair><Pair label="Knowledge net / s">{knowledgeNet >= 0 ? '+' : ''}{knowledgeNet.toFixed(1)}</Pair><p className="hint">Current work forecast, before investments. Procedures use knowledge; infrastructure uses funds.</p></div>
      <nav className="button-row" aria-label="Network decisions"><a href="#network-procedures">Inspect procedures{deployableProcedures > 0 ? ` (${deployableProcedures} ready)` : ''}{unseenProcedures.length > 0 && <span className="new-marker">New</span>}</a><a href="#network-infrastructure">Infrastructure</a><a href="#network-tenders">Visit competitive tenders</a></nav>
      <div className="network-bottleneck"><strong role="status">{diagnosis.message}</strong><span>{estimate === null ? 'No clearance yet.' : `At this rate: ${estimate < 86400 ? clock(estimate) : `${Math.ceil(estimate / 86400)} days`} remaining. Growth changes this estimate.`}</span></div>
      <div className="button-row allocation-plans">{(['grow', 'survey', 'clear'] as const).map(plan => <button key={plan} onClick={() => dispatch({ type: 'network-plan', plan })}>{plan === 'grow' ? 'Grow' : plan === 'survey' ? 'Survey' : 'Clear'}</button>)}</div>
      <p className="hint network-advice">{diagnosis.advice} {diagnosis.plan && <button className="text-button" onClick={() => dispatch({ type: 'network-plan', plan: diagnosis.plan === 'grow' ? 'grow' : diagnosis.plan === 'survey' ? 'survey' : 'clear' })}>Use {diagnosis.plan === 'grow' ? 'Grow' : diagnosis.plan === 'survey' ? 'Survey' : 'Clear'}</button>}</p>
      <details className="network-plan-preview"><summary>Compare plans at the current network size</summary>{(['grow', 'survey', 'clear'] as const).map(plan => { const preview = tickNetwork(networkPlan(n, state.corporation.pressure, plan), 1, state.corporation.pressure).network; return <p className="hint" key={plan}>{plan}: +{preview.growthRate.toFixed(2)} offices/s, {number(preview.discoveredRate)} located/s, {number(preview.processedRate)} cleared/s.</p>; })}<p className="hint">One-second forecasts. Growth and changing resources alter future rates.</p></details>
      <div id="network-procedures"><Section title="Procedures" aside={<span>{number(n.knowledge)} knowledge available</span>}><div className="project-grid">{availableProcedures.map(id => <Procedure key={id} id={id} knowledge={n.knowledge} isNew={unseenProcedures.includes(id)} emphasized={emphasizedProtocols.includes(id)} finishEmphasis={() => finishProtocolEmphasis?.(id)} dispatch={dispatch} />)}</div>{n.protocols.length > 0 && <details><summary>Deployed procedures ({n.protocols.length})</summary><p className="hint">{n.protocols.map(id => protocols[id].name).join(', ')}</p></details>}</Section></div>
      <NetworkInvestment state={state} dispatch={dispatch} />
      <div className="strategy-grid network-grid">
        <div><Section title="The remaining work"><Pair label="Undiscovered">{number(n.undiscovered)}</Pair><Pair label="Located backlog">{number(n.discovered)}</Pair><Pair label="Finished">{(n.completed / WORLD_WORKFLOWS * 100).toFixed(2)}%</Pair><progress max={WORLD_WORKFLOWS} value={n.completed} aria-label="Worldwide workflow completion" /><Pair label="Cleared / s">{number(n.processedRate)}</Pair><Pair label="Located / s">{number(n.discoveredRate)}</Pair></Section>
          <Section title="The institution"><Pair label="Autonomous offices">{number(n.nodes)}</Pair><Pair label="Growth / s">{n.growthRate.toFixed(2)}</Pair><Pair label="Power supports">{number(powerLimit)} offices</Pair><Pair label="Replication credit / capacity">{n.replicationCredit.toFixed(1)} / 1,000 offices</Pair><Pair label="Credit earned / s">{replicationSupportRate(forecast).toFixed(2)} offices</Pair><p className="hint">Every 250 cleared workflows fund one natural office launch. Commissioning uses cash and knowledge instead.</p><Pair label="Coordination load">{(n.coordinationLoad * 100).toFixed(1)}%</Pair><Pair label="Work efficiency">{(coordinationEfficiency(n) * 100).toFixed(1)}%</Pair><Pair label="Load net / s">{forecast.coordinationLoad >= n.coordinationLoad ? '+' : ''}{((forecast.coordinationLoad - n.coordinationLoad) * 100).toFixed(2)} percentage points</Pair><Pair label="Load recovery / s">{(coordinationRecoveryRate(n) * 100).toFixed(2)} percentage points</Pair><p className="hint">Expansion and intensive computing create coordination load. Stabilization repairs it. Standard computing avoids intensive load; all routes benefit from recovery.</p><Pair label="Lost offices">{number(n.lost)}</Pair><Pair label="Stabilization needed">{stability.toFixed(1)}%</Pair><Hairline name="campus" value={Math.min(9, 1 + Math.floor(Math.log(n.nodes) / Math.log(4)))} label="The autonomous institution grows as offices replicate. Roofs respond to actual discovery, clearance, and growth. Narrow window bands show coordination load; marked buildings show new or lost office batches." simulation={{ kind: 'network', running: !state.paused, time: state.elapsed, nodes: n.nodes, discovery: n.discoveredRate, clearance: n.processedRate, replication: n.growthRate, coordination: n.coordinationLoad, lost: n.lost, commissioned: n.commissioned }} /><p className="hint">Roofs respond to actual work. Narrow window bands show coordination load; marked buildings show batches of new or lost offices.</p></Section>
        </div>
        <Section title="Allocation"><p className="hint">Plans retain a stability margin. Fine-tune below; changing one share redistributes the others, including stabilization.</p>{allocationKeys.map(key => <div className="allocation-row" key={key}><label htmlFor={`allocation-${key}`}>{key[0]?.toUpperCase() + key.slice(1)}<span>{n.allocation[key].toFixed(1)}%</span></label><input id={`allocation-${key}`} type="range" min={0} max={100} step={1} value={n.allocation[key]} onChange={e => dispatch({ type: 'allocate', key, value: Number(e.target.value) })} /><AllocationAmount allocation={key} value={n.allocation[key]} dispatch={dispatch} /><p className="hint">{descriptions[key]}</p></div>)}</Section>
        <div id="network-infrastructure"><Section title="Infrastructure"><Pair label="Energy stored / capacity">{number(n.energy)} / {number(n.plants * 1200)}</Pair><Pair label="Power generated / s">{number(powerCapacity(n))}</Pair><Pair label="Power used / s">{number(forecast.powerUsed)}</Pair><Pair label="Compute stored / capacity">{number(n.compute)} / {number(n.servers * 400)}</Pair><Pair label="Compute generated / s">{number(computeGeneration)}</Pair><Pair label="Compute used / s">{number(forecast.computeSpentRate)}</Pair><Pair label="Knowledge">{number(n.knowledge)}</Pair><p className="hint">Usage forecasts the next second. Full buffers discard surplus generation.</p>
          {n.protocols.includes('distributed') && <><label className="routine-toggle"><input type="checkbox" disabled={n.completed < 10000 && n.infrastructure === 'manual'} checked={n.infrastructure === 'balanced'} onChange={e => dispatch({ type: 'network-building', policy: e.target.checked ? 'balanced' : 'manual' })} /> Build as the network grows</label>{n.completed < 10000 && n.infrastructure === 'manual' && <p className="hint">Clear 10,000 workflows to earn delegated infrastructure. Manual building remains available.</p>}<p className="hint">Forecasts one minute of growth. Keeps {dollars(reserve)} in reserve. Does not alter your allocation.</p><CashReserve state={state} dispatch={dispatch} /></>}
          <p className="hint">Infrastructure supports offices; excess capacity does not accelerate replication or locate work. Buy what the current plan needs.</p>
          <div className="button-row batch-options">{(['one', 'needed'] as const).map(value => <button key={value} aria-pressed={value === batch} onClick={() => setBatch(value)}>{value === 'one' ? '1' : 'Needed'}</button>)}</div>
          {(['plants', 'servers'] as const).map(asset => {
            const quantity = batch === 'one' ? 1 : need[asset];
            const cost = assetCost(n, asset, quantity);
            return <Purchase key={asset} name={asset === 'plants' ? 'Power plants' : 'Server farms'} description={asset === 'plants' ? '120 energy/s per plant. Needed includes 35% power headroom.' : `${n.protocols.includes('distributed') ? 160 : 40} compute/s, using 3 energy/s per server.`} detail={`${number(n[asset])} installed`} label={quantity === 0 ? 'Capacity sufficient' : `Build ${number(quantity)}, ${dollars(cost)}`} disabled={quantity === 0 || state.cash < cost || n[asset] + quantity > 1000000} onClick={() => dispatch({ type: 'network-asset', asset, count: quantity })} />;
          })}
          <a href="#network-decisions">Return to network decisions</a>
        </Section></div>
      </div>
      <div id="network-tenders"><Tender state={state} dispatch={dispatch} /><a href="#network-decisions">Return to network decisions</a></div>
    </>}
  </>;
}
function Procedure({ id, knowledge, isNew, emphasized, finishEmphasis, dispatch }: { id: ProtocolId; knowledge: number; isNew: boolean; emphasized: boolean; finishEmphasis: () => void; dispatch: Props['dispatch'] }) {
  const p = protocols[id];
  const inspect = () => { if (isNew) dispatch({ type: 'inspect-discoveries', workspaces: [], projects: [], protocols: [id] }); };
  return <div tabIndex={0} role="group" aria-label={`${p.name}${isNew ? ', new procedure' : ''}`} className={emphasized ? 'discovery-emphasis' : undefined} onAnimationEnd={finishEmphasis} onFocus={inspect} onPointerEnter={inspect} onPointerDown={inspect}>
    {isNew && <span className="new-marker">New</span>}
    <Purchase name={p.name} description={p.description} detail={`${number(p.cost)} knowledge`} label="Deploy procedure" disabled={knowledge < p.cost} onClick={() => dispatch({ type: 'protocol', id })} />
  </div>;
}
export function Ending({ state, dispatch }: Props) {
  const phase = state.corporation.phase;
  if (phase.id !== 'ending') return null;
  return <div className="ending-page"><p className="hint">No further business</p><h2>{phase.ending === 'monopoly' ? 'Everything is Cube Farm.' : 'The last day of work.'}</h2><Hairline name="cubicles" value={9} label={phase.ending === 'monopoly' ? 'The institution retains its occupied cubicles. All work has stopped.' : 'Empty cubicles, cleared desks, and open chairs. The workers are free to leave.'} simulation={{ kind: 'ending', ending: phase.ending }} /><p>{phase.ending === 'monopoly' ? 'One billion workflows. One owner. The institution has finished its work. Now it must find a reason to keep everyone inside.' : 'The network belongs to the people who built it. There are no outstanding forms and no attendance requirement. For the first time, an empty cubicle can mean a good day.'}</p><p>{endingEcho(state)}</p><Pair label="Final institution">{number(phase.nodes)} offices</Pair><Pair label="Operating time">{clock(phase.completedAt)}</Pair><Pair label="Gross revenue">{dollars(state.revenue)}</Pair><p className="hint">Some habits survive an ending. Reincorporate with five legacy credits and make a different promise.</p><button onClick={() => dispatch({ type: 'reincorporate' })}>Reincorporate, +5 legacy credits</button></div>;
}
function AllocationAmount({ allocation, value, dispatch }: { allocation: AllocationKey; value: number; dispatch: Props['dispatch'] }) {
  const [draft, setDraft] = useState(Math.round(value));
  const [editing, setEditing] = useState(false);
  useEffect(() => { if (!editing) setDraft(Math.round(value)); }, [value, editing]);
  return <form className="allocation-amount" onFocus={() => setEditing(true)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setEditing(false); }} onSubmit={event => { event.preventDefault(); dispatch({ type: 'allocate', key: allocation, value: draft }); event.currentTarget.querySelector('input')?.focus(); }}><label>{allocation} %<input type="number" min={0} max={100} step={1} required value={Number.isFinite(draft) ? draft : ''} onChange={event => { setEditing(true); setDraft(event.target.value === '' ? NaN : Number(event.target.value)); }} /></label><button disabled={!Number.isInteger(draft) || draft < 0 || draft > 100 || draft === value}>Set</button></form>;
}
export function Legacy({ state, dispatch }: Props) {
  const legacy = state.corporation.legacy;
  if (legacy.runs === 0) return null;
  return <Section title="Corporate inheritance" aside={<span className="muted">{legacy.credits} credits / {legacy.runs} runs</span>}><div className="project-grid">{(['founding', 'research', 'welfare'] as const).map(id => <Purchase key={id} name={id === 'founding' ? 'Founding capital' : id === 'research' ? 'Inherited knowledge' : 'Culture of care'} description={id === 'founding' ? '+$60 starting capital per level. Awarded immediately too.' : id === 'research' ? '+10% research output per level.' : '+2 target morale per level.'} detail={`Level ${legacy[id]} / 10`} label="Improve, 1 credit" disabled={legacy.credits === 0 || legacy[id] >= 10} onClick={() => dispatch({ type: 'legacy', id })} />)}</div></Section>;
}
