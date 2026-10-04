import { useState } from 'react';
import { cultivars, genes, type CultivarId } from '../game/catalog';
import { employeeRate, staffTransferQuote, staffReplacementQuote, type Action } from '../game/engine';
import type { GameState } from '../game/state';
import { discovery } from '../game/discovery';
import { dollars } from './ui';

export function StaffRenewal({ state, dispatch }: { state: GameState; dispatch: (action: Action) => void }) {
  const [count, setCount] = useState(1);
  const [cultivar, setCultivar] = useState<CultivarId>('generalist');
  const [confirmation, setConfirmation] = useState<{ type: 'staff-transfer' | 'staff-replace'; ids: number[]; cultivar: CultivarId } | null>(null);
  const operations = state.employees.filter(e => e.role === 'operations').sort((a, b) => employeeRate(state, a) - employeeRate(state, b) || a.id - b.id);
  const ids = Number.isInteger(count) && count > 0 && count <= operations.length ? operations.slice(0, count).map(e => e.id) : [];
  const transfer = staffTransferQuote(state, confirmation?.ids ?? ids);
  const replacement = staffReplacementQuote(state, confirmation?.ids ?? ids, confirmation?.cultivar ?? cultivar);
  const seen = discovery(state);
  return <details className="staff-renewal"><summary>Transfer or replace operations staff in bulk</summary><p className="hint">Starts with the lowest base output. Research, sales, and compliance staff are protected. New hires enter operations.</p>
    {confirmation ? <><p>{confirmation.type === 'staff-transfer' ? `Transfer ${confirmation.ids.length} employees for ${dollars(transfer?.refund ?? 0)}?` : `Transfer ${confirmation.ids.length} employees and hire ${cultivars[confirmation.cultivar].name.toLowerCase()}s. Net cost ${dollars(replacement?.net ?? 0)}.`} Existing people leave with their traits.</p><div className="button-row"><button disabled={transfer === null || confirmation.type === 'staff-replace' && (replacement === null || state.cash < replacement.net)} onClick={() => { dispatch(confirmation.type === 'staff-transfer' ? { type: 'staff-transfer', ids: confirmation.ids } : { type: 'staff-replace', ids: confirmation.ids, cultivar: confirmation.cultivar }); setConfirmation(null); }}>Confirm {confirmation.type === 'staff-transfer' ? 'transfer' : 'replacement'}</button><button onClick={() => setConfirmation(null)}>Keep staff</button></div></> : <><label className="field-label">Employees to transfer<input type="number" min={1} max={operations.length} step={1} value={Number.isFinite(count) ? count : ''} onChange={e => setCount(e.target.value === '' ? NaN : Number(e.target.value))} /></label><label className="field-label">Replacement profile<select value={cultivar} onChange={e => { const id = state.unlockedCultivars.find(id => id === e.target.value); if (id) setCultivar(id); }}>{state.unlockedCultivars.map(id => <option key={id} value={id}>{cultivars[id].name}</option>)}</select></label><p className="hint">{seen.genetics ? `New hires inherit ${state.genome.length ? state.genome.map(id => genes[id].name).join(' + ') : 'the unmodified profile'}.` : 'New hires use the selected recruitment profile.'} {operations.length} operations employees available.</p><div className="button-row"><button disabled={transfer === null} onClick={() => setConfirmation({ type: 'staff-transfer', ids, cultivar })}>Transfer, {dollars(transfer?.refund ?? 0)}</button><button disabled={replacement === null || state.cash < replacement.net} onClick={() => setConfirmation({ type: 'staff-replace', ids, cultivar })}>Replace, {dollars(replacement?.net ?? 0)} net</button></div></>}
  </details>;
}
