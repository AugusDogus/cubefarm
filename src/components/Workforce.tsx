import { useState } from 'react';
import { cultivars, genes } from '../game/catalog';
import { employeeRate, risks, saleValue, type Action } from '../game/engine';
import { departmentYield } from '../game/workforce';
import { roles } from '../game/corporation';
import { discovery } from '../game/discovery';
import { StaffRenewal } from './StaffRenewal';
import type { Employee, GameState } from '../game/state';
import { number, percent, dollars, Pair, Section } from './ui';

const activities: Record<Employee['activity'], string> = { working: 'Working', break: 'On a break', slacking: 'Slacking off', rework: 'Fixing bugs' };
export function Workforce({ state, dispatch, compact = false }: { state: GameState; dispatch: (action: Action) => void; compact?: boolean }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [sort, setSort] = useState<'id' | 'rate'>('id');
  const [confirm, setConfirm] = useState<'sell' | 'fire' | null>(null);
  const employee = state.employees.find(e => e.id === selected);
  const seen = discovery(state);
  const employees = [...state.employees].sort((a, b) => sort === 'rate' ? employeeRate(state, a) - employeeRate(state, b) : a.id - b.id);
  return <Section title="Workforce" aside={<span className="muted">{state.employees.length} employees</span>}>
    {!compact && state.corporation.projects.includes('charter') && <StaffRenewal state={state} dispatch={dispatch} />}
    {!compact && <div className="table-toolbar"><p>{seen.departments ? 'Operations make forms. Research earns insights, sales raises demand and influence, compliance lowers pressure. Keep some employees in operations to fund the company.' : 'People file at different rates. Equipment and incentives improve their working conditions.'}</p><label>Sort <select value={sort} onChange={e => setSort(e.target.value === 'rate' ? 'rate' : 'id')}><option value="id">Hire order</option><option value="rate">Lowest base yield</option></select></label></div>}
    {state.employees.length === 0 ? <p className="empty">No employees. Process paperwork and hire your first employee.</p> : <div className="table-scroll"><table><thead><tr><th>Employee</th><th>{seen.genetics ? 'Cultivar' : 'Profile'}</th><th>Status</th><th className="right">Yield / s</th>{!compact && <><th className="right">Forms processed</th>{seen.genetics && <th>Genes</th>}{seen.departments && <th>Department</th>}</>}</tr></thead><tbody>{(compact ? employees.slice(0, 5) : employees).map(e => <tr key={e.id} data-selected={selected === e.id}><td><button className="text-button employee-name" onClick={() => { setSelected(selected === e.id ? null : e.id); setConfirm(null); }}>{e.name}</button></td><td>{cultivars[e.cultivar].name}</td><td><span className={`activity ${e.activity}`}>{activities[e.activity]}</span></td><td className="numeric right">{departmentYield(state, e).value.toFixed(2)} <span className="muted">{departmentYield(state, e).unit}</span></td>{!compact && <><td className="numeric right">{number(e.produced)}</td>{seen.genetics && <td>{e.genes.length || 'None'}</td>}{seen.departments && <td><select aria-label={`Department for ${e.name}`} value={e.role} onChange={event => { const role = roles.find(role => role === event.target.value); if (role) dispatch({ type: 'assign', id: e.id, role }); }}>{roles.map(role => <option key={role} value={role}>{role}</option>)}</select></td>}</>}</tr>)}</tbody></table></div>}
    {employee && <div className="employee-inspector"><div className="section-heading"><h3>{employee.name}</h3><button className="text-button" onClick={() => setSelected(null)}>Close</button></div><p>{cultivars[employee.cultivar].name}. {seen.genetics ? 'Traits set at hire, unchanged by later research.' : 'Individual aptitude stays with this employee.'}</p><div className="inspector-metrics">{seen.departments && <Pair label="Department">{employee.role}</Pair>}<Pair label="Potential yield / s">{departmentYield(state, employee).value.toFixed(2)} {departmentYield(state, employee).unit}</Pair><Pair label="Aptitude">{percent(employee.aptitude)}</Pair><Pair label="Slack chance">{percent(risks(state, employee).slack)}</Pair><Pair label="Break chance">{percent(risks(state, employee).breaks)}</Pair><Pair label="Bug chance">{percent(risks(state, employee).bugs)}</Pair></div>{seen.genetics && <p>Genes: {employee.genes.length ? employee.genes.map(id => genes[id].name).join(', ') : 'Unmodified'}</p>}
      {confirm ? <div className="confirm-release"><p>{confirm === 'sell' ? `Transfer ${employee.name} for ${dollars(saleValue(employee))}?` : `Fire ${employee.name}? No placement fee will be received.`} {seen.genetics && 'Their traits will leave with them.'}</p><button onClick={() => { dispatch({ type: 'release', id: employee.id, method: confirm }); setSelected(null); setConfirm(null); }}>Confirm {confirm === 'sell' ? 'transfer' : 'firing'}</button><button onClick={() => setConfirm(null)}>Cancel</button></div> : <div className="button-row"><button onClick={() => setConfirm('sell')}>Sell employee · {dollars(saleValue(employee))}</button><button onClick={() => setConfirm('fire')}>{seen.genetics ? 'Cull / fire' : 'Fire employee'}</button></div>}
    </div>}
    {compact && state.employees.length > 5 && <p className="hint">Showing 5 of {state.employees.length}. See everyone in Workforce.</p>}
  </Section>;
}
