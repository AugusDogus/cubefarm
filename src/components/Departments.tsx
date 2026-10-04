import { useState } from 'react';
import type { GameState } from '../game/state';
import { act, type Action } from '../game/engine';
import { expectedOutput, sustainableIncome } from '../game/balance';
import { demand } from '../game/economy';
import { Section, Pair, dollars } from './ui';

type Counts = { research: number; sales: number; compliance: number };
function staffing(state: GameState): Counts {
  return { research: state.employees.filter(e => e.role === 'research').length, sales: state.employees.filter(e => e.role === 'sales').length, compliance: state.employees.filter(e => e.role === 'compliance').length };
}
export function Departments({ state, dispatch }: { state: GameState; dispatch: (action: Action) => void }) {
  const [draft, setDraft] = useState(() => staffing(state));
  const current = staffing(state), total = draft.research + draft.sales + draft.compliance;
  const valid = Object.values(draft).every(n => Number.isInteger(n) && n >= 0) && total <= state.employees.length;
  const changed = current.research !== draft.research || current.sales !== draft.sales || current.compliance !== draft.compliance;
  const allocation = valid ? act(state, { type: 'staff', ...draft }) : null;
  const preview = allocation?.ok ? allocation.state : null;
  return <Section title="Departments"><p className="section-intro">Set counts in one action. Assigns the strongest expected researchers first, then sales, then compliance, accounting for inherited traits and downtime. Everyone else files forms.</p>
    <div className="staffing-counts">{(['research', 'sales', 'compliance'] as const).map(role => <label key={role}>{role[0]?.toUpperCase()}{role.slice(1)}<input type="number" min={0} max={state.employees.length} step={1} value={Number.isFinite(draft[role]) ? draft[role] : ''} onChange={e => setDraft({ ...draft, [role]: e.target.value === '' ? NaN : Number(e.target.value) })} /><span className="hint">Currently {current[role]}</span></label>)}</div>
    <p className="hint">{valid ? `${state.employees.length - total} employees remain in operations.${total === state.employees.length ? ' No one will file forms at headquarters.' : ''}` : 'Choose whole numbers that fit within the headquarters workforce.'}</p>
    {preview && <div className="staffing-forecast"><Pair label="Expected forms / s">{expectedOutput(state).toFixed(1)} → {expectedOutput(preview).toFixed(1)}</Pair><Pair label="Customer demand / s">{demand(state).toFixed(1)} → {demand(preview).toFixed(1)}</Pair><Pair label="Retail net / s">{dollars(sustainableIncome(state), true)} → {dollars(sustainableIncome(preview), true)}</Pair><p className="hint">Steady retail estimate with supplies; excludes orders, backlog, research value, and future morale. Sales reach depends on cultivar and headcount; traits affect influence output.</p></div>}
    <div className="button-row"><button disabled={!valid} onClick={() => dispatch({ type: 'staff', ...draft })}>{changed ? 'Apply staffing' : 'Rebalance roles'}</button><button className="text-button" onClick={() => setDraft(staffing(state))}>Use current counts</button></div>
  </Section>;
}
