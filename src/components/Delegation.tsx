import { useEffect, useState } from 'react';
import type { GameState } from '../game/state';
import type { Action } from '../game/engine';
import { contracts, contractIds } from '../game/corporation';
import { operatingReserve } from '../game/automation';
import { contractAutomationStatus, memoAutomationStatus, type AutomationStatus } from '../game/automation-status';
import { dollars, Pair, Section } from './ui';

export function Delegation({ state, dispatch }: { state: GameState; dispatch: (action: Action) => void }) {
  const a = state.automation;
  return <Section title="Standing instructions"><p className="section-intro">Orders renew with a 20% delivery margin and funds for supplies, wages, and the operating reserve. Memos skip unprofitable retail boosts; they can still support orders or departments. These are forecasts, not guarantees.</p>
    <label className="routine-toggle"><input type="checkbox" checked={a.memos} onChange={e => dispatch({ type: 'automation', ...a, memos: e.target.checked })} /> Circulate memos automatically</label>
    {a.memos && <AutomationExplanation status={memoAutomationStatus(state)} />}
    <label className="field-label">Renew contract<select value={a.contracts} onChange={e => { const id = e.target.value === 'off' ? 'off' : contractIds.find(id => id === e.target.value); if (id) dispatch({ type: 'automation', ...a, contracts: id }); }}><option value="off">No automatic orders</option>{contractIds.filter(id => state.revenue >= contracts[id].revenue).map(id => <option key={id} value={id}>{contracts[id].name}</option>)}</select></label>
    {a.contracts !== 'off' && <><label className="field-label">Output for renewed orders<select value={a.allocation} onChange={e => { const allocation = e.target.value; if (allocation === 'half' || allocation === 'all') dispatch({ type: 'automation', ...a, allocation }); }}><option value="half">50% escrow, 50% retail</option><option value="all">100% escrow until delivery</option></select></label><p className="hint">Applies to the next renewed order. The active order keeps its current allocation.</p><AutomationExplanation status={contractAutomationStatus(state)} /></>}
    <CashReserve state={state} dispatch={dispatch} />
    <Pair label="Effective operating reserve">{dollars(operatingReserve(state))}</Pair><p className="hint">Process reviews run continuously. Procurement is controlled in the office. Standing instructions can be changed at any time.</p>
  </Section>;
}

function AutomationExplanation({ status }: { status: AutomationStatus }) {
  return <p className="automation-status hint">{status.message}{status.status === 'blocked' && status.cashShortfall > 0 ? ` Short by ${dollars(status.cashShortfall, true)}.` : ''}</p>;
}

export function CashReserve({ state, dispatch }: { state: GameState; dispatch: (action: Action) => void }) {
  const [reserve, setReserve] = useState(state.automation.reserve);
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    if (!editing) setReserve(state.automation.reserve);
  }, [state.automation.reserve, editing]);
  return <form className="reserve-control" onFocus={() => setEditing(true)} onBlur={event => {
    const destination = event.relatedTarget;
    if (!(destination instanceof Node) || !event.currentTarget.contains(destination)) setEditing(false);
  }} onSubmit={event => { event.preventDefault(); dispatch({ type: 'automation', ...state.automation, reserve }); }}><label className="field-label">Minimum cash reserve<input type="number" min={0} max={1_000_000_000} required value={Number.isFinite(reserve) ? reserve : ''} onChange={e => setReserve(e.target.value === '' ? NaN : Number(e.target.value))} /></label><button disabled={!Number.isFinite(reserve) || reserve < 0 || reserve > 1_000_000_000 || reserve === state.automation.reserve}>Set reserve</button></form>;
}
